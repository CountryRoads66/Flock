// Social routes manage follows, friend requests, and notification events related to user connections.
module.exports = ({ app, DB_CONNECTION, authenticateToken, emitNotificationsChanged }) => {
app.post("/api/follow", authenticateToken, (req, res) => {
	// Follow action can create a notification for the target user when the relationship is created.
	const followingId = req.body.followingId;
	console.log("Follow request - Current user ID:", req.userData.id, "Following ID:", followingId);
	
	if (!followingId || followingId <= 0) return res.status(400).json({ message: "Invalid parameters" }).end();
	if (req.userData.id == followingId) return res.status(400).json({ message: "Cannot follow yourself" }).end();
	
	DB_CONNECTION.query(
		"INSERT INTO followers(followerId, followingId) VALUES(?,?)",
		[req.userData.id, followingId],
		(err) => {
			if (err) {
				console.error("Follow error:", err);
				if (err.code === "ER_DUP_ENTRY") {
					return res.status(409).json({ message: "Already following" }).end();
				}
				return res.status(500).json({ message: "Error following user", error: err.message }).end();
			}
			
			// Create notification for the followed user
			const username = req.userData.username || "A user";
			DB_CONNECTION.query(
				"INSERT INTO notifications(userId, fromUserId, type, message) VALUES(?,?,?,?)",
				[followingId, req.userData.id, "follow", `${username} started following you`],
				(notErr) => {
					if (notErr) console.error("Notification error:", notErr);
					else emitNotificationsChanged(followingId);
				}
			);
			
			console.log("Successfully followed user:", followingId);
			res.status(201).json({ message: "User followed" }).end();
		}
	);
});

app.post("/api/unfollow", authenticateToken, (req, res) => {
	const followingId = req.body.followingId;
	console.log("Unfollow request - Current user ID:", req.userData.id, "Following ID:", followingId);
	
	if (!followingId || followingId <= 0) return res.status(400).json({ message: "Invalid parameters" }).end();
	
	DB_CONNECTION.query(
		"DELETE FROM followers WHERE followerId = ? AND followingId = ?",
		[req.userData.id, followingId],
		(err, result) => {
			if (err) {
				console.error("Unfollow error:", err);
				return res.status(500).json({ message: "Error unfollowing user", error: err.message }).end();
			}
			console.log("Unfollow successful");
			res.status(200).json({ message: "User unfollowed" }).end();
		}
	);
});

// Get followers
app.post("/api/getFollowers", (req, res) => {
	const userId = req.body.userId;
	if (!userId) return res.status(400).json({ message: "Invalid parameters" }).end();
	
	DB_CONNECTION.query(
		"SELECT u.id, u.username, u.displayName, u.profilePicture, u.profileId FROM followers f INNER JOIN users u ON f.followerId = u.id WHERE f.followingId = ?",
		userId,
		(err, result) => {
			if (err) throw err;
			res.status(200).json(result).end();
		}
	);
});

app.post("/api/getFollowing", (req, res) => {
	const userId = req.body.userId;
	if (!userId) return res.status(400).json({ message: "Invalid parameters" }).end();
	
	DB_CONNECTION.query(
		"SELECT u.id, u.username, u.displayName, u.profilePicture, u.profileId FROM followers f INNER JOIN users u ON f.followingId = u.id WHERE f.followerId = ?",
		userId,
		(err, result) => {
			if (err) throw err;
			res.status(200).json(result).end();
		}
	);
});

app.post("/api/isFollowing", authenticateToken, (req, res) => {
	const followingId = req.body.followingId;
	console.log("isFollowing check - Current user:", req.userData.id, "Following ID:", followingId);
	
	if (!followingId || followingId <= 0) return res.status(400).json({ message: "Invalid parameters" }).end();
	
	DB_CONNECTION.query(
		"SELECT * FROM followers WHERE followerId = ? AND followingId = ?",
		[req.userData.id, followingId],
		(err, result) => {
			if (err) {
				console.error("isFollowing error:", err);
				return res.status(500).json({ message: "Error checking follow status", error: err.message }).end();
			}
			console.log("isFollowing result:", result.length > 0);
			res.status(200).json({ isFollowing: result.length > 0 }).end();
		}
	);
});

// Send friend request
app.post("/api/sendFriendRequest", authenticateToken, (req, res) => {
	const recipientId = req.body.recipientId;
	console.log("Friend request - Sender:", req.userData.id, "Recipient:", recipientId);
	
	if (!recipientId || recipientId <= 0) return res.status(400).json({ message: "Invalid parameters" }).end();
	if (req.userData.id == recipientId) return res.status(400).json({ message: "Cannot send friend request to yourself" }).end();
	
	DB_CONNECTION.query(
		"SELECT id FROM friend_requests WHERE status = 'pending' AND ((senderId = ? AND recipientId = ?) OR (senderId = ? AND recipientId = ?)) LIMIT 1",
		[req.userData.id, recipientId, recipientId, req.userData.id],
		(checkErr, existingRequests) => {
			if (checkErr) {
				console.error("Friend request check error:", checkErr);
				return res.status(500).json({ message: "Error checking friend request" }).end();
			}
			if (existingRequests.length > 0) {
				return res.status(409).json({ message: "A pending friend request already exists" }).end();
			}

			DB_CONNECTION.query(
				"INSERT INTO friend_requests(senderId, recipientId) VALUES(?,?)",
				[req.userData.id, recipientId],
				(err) => {
					if (err) {
						console.error("Friend request error:", err);
						if (err.code === "ER_DUP_ENTRY") {
							return res.status(409).json({
								message: "A pending friend request already exists",
							}).end();
						}
						return res.status(500).json({
							message: "Error sending friend request",
							error: err.message,
						}).end();
					}

					const username = req.userData.username || "A user";
					DB_CONNECTION.query(
						"INSERT INTO notifications(userId, fromUserId, type, message) VALUES(?,?,?,?)",
						[recipientId, req.userData.id, "friend_request", `${username} sent you a friend request`],
						(notErr) => {
							if (notErr) console.error("Notification error:", notErr);
							else emitNotificationsChanged(recipientId);
						}
					);

					console.log("Friend request sent successfully");
					res.status(201).json({ message: "Friend request sent" }).end();
				}
			);
		}
	);
});

// Get friend requests
app.post("/api/getFriendRequests", authenticateToken, (req, res) => {
	DB_CONNECTION.query(
		"SELECT f.id, f.senderId, u.username, u.displayName, u.profilePicture, u.profileId FROM friend_requests f INNER JOIN users u ON f.senderId = u.id WHERE f.recipientId = ? AND f.status = 'pending'",
		req.userData.id,
		(err, result) => {
			if (err) throw err;
			res.status(200).json(result).end();
		}
	);
});

// Accept friend request
app.post("/api/acceptFriendRequest", authenticateToken, (req, res) => {
	const requestId = req.body.requestId;
	if (!requestId) return res.status(400).json({ message: "Invalid parameters" }).end();
	
	DB_CONNECTION.query(
		"UPDATE friend_requests SET status = 'accepted' WHERE id = ? AND recipientId = ?",
		[requestId, req.userData.id],
		(err, result) => {
			if (err) {
				console.error("Accept error:", err);
				throw err;
			}
			
			// Get sender ID to send notification
			DB_CONNECTION.query(
				"SELECT senderId FROM friend_requests WHERE id = ?",
				[requestId],
				(getErr, getResult) => {
					if (getErr) {
						console.error("Error fetching sender:", getErr);
						return res.status(200).json({ message: "Friend request accepted" }).end();
					}
					
					if (getResult.length > 0) {
						const senderId = getResult[0].senderId;
						const username = req.userData.username || "A user";
						DB_CONNECTION.query(
							"INSERT INTO notifications(userId, fromUserId, type, message) VALUES(?,?,?,?)",
							[senderId, req.userData.id, "friend_accept", `${username} accepted your friend request`],
							(notErr) => {
								if (notErr) console.error("Notification error:", notErr);
								else emitNotificationsChanged(senderId);
							}
						);
					}
					
			res.status(200).json({ message: "Friend request accepted" }).end();
		}
	);
	});
});

// Reject friend request
app.post("/api/rejectFriendRequest", authenticateToken, (req, res) => {
	const requestId = req.body.requestId;
	if (!requestId) return res.status(400).json({ message: "Invalid parameters" }).end();
	
	DB_CONNECTION.query(
		"UPDATE friend_requests SET status = 'rejected' WHERE id = ? AND recipientId = ?",
		[requestId, req.userData.id],
		(err) => {
			if (err) throw err;
			res.status(200).json({ message: "Friend request rejected" }).end();
		}
	);
});

// Create comment
};
