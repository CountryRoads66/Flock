module.exports = ({ app, DB_CONNECTION, authenticateToken, emitNotificationsChanged }) => {
	// This module groups activity-related endpoints: comments, notifications and user metadata.
	// The goal is to keep social interaction logic isolated from account/content routes.

	// Create a new comment and notify the post author in the same flow.
	app.post("/api/createComment", authenticateToken, (req, res) => {
		const { postId, text } = req.body;
		const numericPostId = Number(postId);
		if (!Number.isInteger(numericPostId) || numericPostId <= 0 || typeof text !== "string" || !text.trim()) {
			return res.status(400).json({ message: "Invalid parameters" }).end();
		}

		DB_CONNECTION.query(
			"INSERT INTO comments(postId, userId, text) VALUES(?,?,?)",
			[numericPostId, req.userData.id, text],
			(err) => {
				if (err) {
					console.error("Comment error:", err);
					return res.status(500).json({ message: "Error creating comment" }).end();
				}

				// Fetch the post owner so that the author receives a notification without a second API call.
				DB_CONNECTION.query(
					"SELECT userId FROM posts WHERE id = ?",
					[numericPostId],
					(postErr, postResult) => {
						if (postErr) {
							console.error("Error fetching post:", postErr);
							return res.status(201).json({ message: "Comment created" }).end();
						}

						if (postResult.length > 0 && postResult[0].userId !== req.userData.id) {
							const username = req.userData.username || "A user";
							DB_CONNECTION.query(
								"INSERT INTO notifications(userId, fromUserId, type, postId, message) VALUES(?,?,?,?,?)",
								[postResult[0].userId, req.userData.id, "comment", numericPostId, `${username} commented on your post`],
								(notErr) => {
									if (notErr) console.error("Notification error:", notErr);
									else emitNotificationsChanged(postResult[0].userId);
								}
							);
						}

						res.status(201).json({ message: "Comment created" }).end();
					}
				);
			}
		);
	});

	// Read the thread for a post, newest comments first so the feed stays chronological by activity.
	app.post("/api/getComments", (req, res) => {
		const postId = Number(req.body.postId);
		if (!Number.isInteger(postId) || postId <= 0) {
			return res.status(400).json({ message: "Invalid parameters" }).end();
		}

		DB_CONNECTION.query(
			"SELECT c.id, c.text, c.createdAt, u.username, u.profilePicture, u.profileId FROM comments c INNER JOIN users u ON c.userId = u.id WHERE c.postId = ? ORDER BY c.createdAt DESC",
			postId,
			(err, result) => {
				if (err) throw err;
				res.status(200).json(result).end();
			}
		);
	});

	// Users can remove only their own comments to avoid unauthorized deletion of other authors' content.
	app.post("/api/deleteComment", authenticateToken, (req, res) => {
		const commentId = req.body.commentId;
		if (!commentId) return res.status(400).json({ message: "Invalid parameters" }).end();

		DB_CONNECTION.query(
			"DELETE FROM comments WHERE id = ? AND userId = ?",
			[commentId, req.userData.id],
			(err) => {
				if (err) throw err;
				res.status(200).json({ message: "Comment deleted" }).end();
			}
		);
	});

	// User search is used for mentions and quick profile lookup, so a wildcard match keeps discovery simple.
	app.post("/api/searchUsers", (req, res) => {
		const searchTerm = req.body.searchTerm;
		if (!searchTerm) return res.status(400).json({ message: "Invalid parameters" }).end();

		DB_CONNECTION.query(
			"SELECT id, username, displayName, profilePicture, profileId FROM users WHERE username LIKE ? OR displayName LIKE ? LIMIT 20",
			[`%${searchTerm}%`, `%${searchTerm}%`],
			(err, result) => {
				if (err) throw err;
				res.status(200).json(result).end();
			}
		);
	});

	// Aggregated statistics power profile cards and counters without exposing full user records.
	app.post("/api/getUserStats", (req, res) => {
		const userId = req.body.userId;
		if (!userId) return res.status(400).json({ message: "Invalid parameters" }).end();

		DB_CONNECTION.query(
			`SELECT 
				(SELECT COUNT(*) FROM followers WHERE followingId = ?) as followerCount,
				(SELECT COUNT(*) FROM followers WHERE followerId = ?) as followingCount,
				(SELECT COUNT(*) FROM posts WHERE userID = ?) as postCount`,
			[userId, userId, userId],
			(err, result) => {
				if (err) throw err;
				res.status(200).json(result[0]).end();
			}
		);
	});

	// Notification list is intentionally limited and unread-only to reduce payload size on the client.
	app.post("/api/getUnreadNotifications", authenticateToken, (req, res) => {
		DB_CONNECTION.query(
			`SELECT n.*, u.username, u.displayName, u.profilePicture 
			 FROM notifications n 
			 LEFT JOIN users u ON n.fromUserId = u.id 
			 WHERE n.userId = ? AND n.isRead = 0 
			 ORDER BY n.createdAt DESC LIMIT 50`,
			req.userData.id,
			(err, result) => {
				if (err) {
					console.error("getUnreadNotifications error:", err);
					return res.status(500).json({ message: "Error fetching notifications", error: err.message }).end();
				}
				console.log("Unread notifications for user", req.userData.id, ":", result.length);
				res.status(200).json(result || []).end();
			}
		);
	});

	// Marking a notification as read both updates the database and notifies the client via Socket.IO.
	app.post("/api/markNotificationAsRead", authenticateToken, (req, res) => {
		const notificationId = req.body.notificationId;
		if (!notificationId) return res.status(400).json({ message: "Invalid parameters" }).end();

		DB_CONNECTION.query(
			"UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?",
			[notificationId, req.userData.id],
			(err) => {
				if (err) {
					console.error("markNotificationAsRead error:", err);
					return res.status(500).json({ message: "Error marking notification", error: err.message }).end();
				}
				emitNotificationsChanged(req.userData.id);
				res.status(200).json({ message: "Notification marked as read" }).end();
			}
		);
	});
};
