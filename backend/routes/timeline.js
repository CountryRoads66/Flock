// Timeline routes handle public feeds, user-specific post queries and message-related data loading.
module.exports = ({ app, DB_CONNECTION, authenticateToken, io }) => {
app.post("/api/posts", (req, res) => {
	if (req.body.id === null || req.body.id === undefined) req.body.id = "%";
	DB_CONNECTION.query(
		"SELECT p.id, p.text, DATE_FORMAT(p.creationTime, '%H:%i:%s') AS creationTime, p.postId, u.profilePicture, u.displayName, u.profileId FROM posts p INNER JOIN users u ON p.userID = u.id WHERE u.profileId LIKE ? ORDER BY id DESC",
		req.body.id,
		(err, result) => {
			if (err) throw err;
			res.status(200).json(result).end();
		}
	);
});

app.post("/api/sendMessage", authenticateToken, (req, res) => {
	const { senderId, recipentId, text } = req.body;
	if (
		typeof senderId !== "string" ||
		typeof recipentId !== "string" ||
		typeof text !== "string" ||
		!text.trim()
	) {
		return res.status(400).json({ message: "Invalid parameters" }).end();
	}
	// Id nadawcy z żądania musi zgadzać się z profilem odczytanym z tokenu.
	if (senderId !== req.userData.profileId) {
		return res.status(403).json({ message: "Invalid sender" }).end();
	}

	DB_CONNECTION.query(
		"SELECT id FROM users WHERE profileId = ?",
		recipentId,
		(userErr, userResult) => {
			if (userErr) throw userErr;
			if (userResult.length === 0) {
				return res.status(404).json({ message: "Recipient not found" }).end();
			}

			DB_CONNECTION.query(
				"INSERT INTO messages(senderId, recipentId, text) VALUES(?,?,?)",
				[senderId, recipentId, text],
				(err, result) => {
					if (err) throw err;
					const message = {
						id: result.insertId,
						senderId,
						recipentId,
						text,
					};
					// Wiadomość trafia do pokoi obu uczestników, aby mogli odebrać ją na żywo.
					io.to(`user:${req.userData.id}`)
						.to(`user:${userResult[0].id}`)
						.emit("message:new", message);
					res.status(201).json({ message: "message sent" }).end();
				}
			);
		}
	);
});

app.post("/api/postsByUser", authenticateToken, (req, res) => {
	DB_CONNECTION.query(
		"SELECT GREATEST(0, TIMESTAMPDIFF(SECOND, p.creationTime, NOW())) AS secondsSinceLastPost FROM posts p WHERE p.userID = ? ORDER BY p.id DESC LIMIT 1",
		req.userData.id,
		(err, result) => {
			if (err) throw err;
			if (result.length === 0) return res.status(200).json(null).end();
			res.status(200).json(result[0].secondsSinceLastPost).end();
		}
	);
});
app.post("/api/getPost", (req, res) => {
	DB_CONNECTION.query(
		"SELECT posts.id, posts.text, posts.userID, posts.postId, DATE_FORMAT(posts.creationTime, '%H:%i:%s') AS creationTime, users.profilePicture, users.username, users.profileId FROM posts INNER JOIN users ON posts.userID = users.id WHERE postId = ?",
		req.body.id,
		(err, result) => {
			if (err) res.status(400).json(err).end();
			res.status(200).json(result[0]).end();
		}
	);
});
app.post("/api/userList", (req, res) => {
	if (req.body.id === null || req.body.id === undefined) {
		console.log("userList - No ID provided");
		return res.status(400).json({ message: "Missing user id" }).end();
	}
	console.log("userList - Looking for profile ID:", req.body.id);
	DB_CONNECTION.query(
		"SELECT id, username, profilePicture, displayName, description FROM users WHERE profileId = ?",
		req.body.id,
		(err, result) => {
			if (err) {
				console.error("userList error:", err);
				return res.status(500).json({ message: "Database error", error: err.message }).end();
			}
			if (result.length === 0) {
				console.log("userList - User not found for profileId:", req.body.id);
				return res.status(404).json({ message: "user not found", found: 404 }).end();
			}
			console.log("userList - Found user:", result[0]);
			res.status(200).json(result[0]).end();
		}
	);
});

app.post("/api/recipents", authenticateToken, (req, res) => {
	DB_CONNECTION.query(
		`SELECT DISTINCT(IF('${req.body.senderId}'=m.recipentId, m.senderId, m.recipentId)) as recipentId FROM messages m WHERE senderId = ? OR recipentId = ?`,
		[req.body.senderId, req.body.senderId],
		(err, result) => {
			if (err) throw err;
			if (result.length === 0) return res.status(200).json([]).end();
			res.status(200).json(result).end();
		}
	);
});

app.post("/api/getRecipentsData", authenticateToken, (req, res) => {
	DB_CONNECTION.query(
		"SELECT username, profilePicture, profileId FROM users WHERE profileId IN (?)",
		[req.body.data],
		(err, result) => {
			if (err) throw err;
			if (result.length === 0)
				return res.status(200).json({ message: "No Recipents Found" }).end();
			res.status(200).json(result).end();
		}
	);
});
app.post("/api/getLikesOfPost", (req, res) => {
	DB_CONNECTION.query(
		"SELECT *,  COUNT(*) as likesCount FROM likes WHERE postId = ?",
		req.body.id,
		(err, result) => {
			if (err) res.status(400).json(err).end();
			res.status(200).json(result).end();
		}
	);
});
app.post("/api/createRecipent", authenticateToken, (req, res) => {
	DB_CONNECTION.query(
		"SELECT DISTINCT(recipentId) FROM messages WHERE senderId = ? AND recipentId = ?",
		[req.body.senderId, req.body.recipentId],
		(err, result) => {
			if (err) throw err;
			if (result.length !== 0) return;
			DB_CONNECTION.query(
				"INSERT INTO messages(senderId, recipentId) VALUES(?, ?)",
				[req.body.senderId, req.body.recipentId],
				(err, result) => {
					if (err) throw err;
					return;
				}
			);
		}
	);
});

app.post("/api/getMessages", authenticateToken, (req, res) => {
	DB_CONNECTION.query(
		"SELECT id, senderId, recipentId, text FROM messages WHERE recipentId IN ? AND senderId IN ? ORDER BY id DESC",
		[req.body, req.body],
		(err, result) => {
			if (err) throw err;
			return res.status(200).json(result).end();
		}
	);
});

app.post("/api/getLikes", authenticateToken, (req, res) => {
	console.log(req.body);
	DB_CONNECTION.query(
		"SELECT * FROM likes WHERE postId = ? AND userId = ?",
		[req.body.postId, req.userData.id],
		(err, result) => {
			if (err) throw err;
			if (result.length > 0) {
				DB_CONNECTION.query(`DELETE FROM likes WHERE id = ${result[0].id}`);
				res.status(200).json({ message: "Unlike" }).end();
			} else {
				DB_CONNECTION.query("INSERT INTO likes(postId, userId) VALUES(?,?)", [
					req.body.postId,
					req.userData.id,
				]);
				res.status(201).json({ message: "Liked" }).end();
			}
		}
	);
});

app.post("/api/getLikesOfUser", authenticateToken, (req, res) => {
	DB_CONNECTION.query(
		"SELECT postId FROM likes WHERE userId = ?",
		req.userData.id,
		(err, result) => {
			if (err) throw err;
			if (result.length === 0)
				return res
					.status(200)
					.json([{ message: "No Likes" }])
					.end();
			const arrayOfNames = result.map((obj) => obj.postId);
			return res.status(200).send(Object.values(arrayOfNames)).end();
		}
	);
});

app.post("/api/getAllLikes", (req, res) => {
	DB_CONNECTION.query(
		"SELECT postId, COUNT(*) as likesCount FROM likes GROUP BY postId",
		(err, result) => {
			if (err) throw err;
			res.status(200).json(result).end();
		}
	);
});
};
