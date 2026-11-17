const crypto = require("crypto");

// Content routes cover publishing posts and broadcasting updates to connected clients.
module.exports = ({ app, DB_CONNECTION, authenticateToken, io }) => {
app.post("/api/postCreation", authenticateToken, (req, res) => {
	// Every post gets a generated id so it can be retrieved and linked to comments/likes reliably.
	const TEXT = req.body.text;
	if (typeof TEXT !== "string") {
		return res.status(401).json({ message: "Invalid parameters!" }).end();
	}
	const postId = crypto.randomBytes(16).toString("hex");
	DB_CONNECTION.query(
		"INSERT INTO posts(text, userID, postId) VALUES (?,?,?)",
		[TEXT, req.userData.id, postId],
		(err, result) => {
			if (err) throw err;
			// Notify connected clients that the feed has changed and should refresh.
			io.emit("posts:changed");
			return res.status(201).json("Post created").end();
		}
	);
});
};
