const jwt = require("jsonwebtoken");

// Basic validation used before authentication to avoid processing empty or malformed input.
const validateData = (username, password) => {
	if (typeof username !== "string" || typeof password !== "string") {
		return 1;
	}
	return 0;
};

const getVerifiedUserData = (decoded) => {
	// The app stores user data in a JSON string inside the token, so we normalize it here
	// before using it in route handlers and verifying that it contains the required user id.
	const userData = typeof decoded === "string" ? JSON.parse(decoded) : decoded;
	if (!userData || typeof userData !== "object" || !userData.id) {
		throw new Error("Invalid access token payload");
	}
	return userData;
};

function authenticateToken(req, res, next) {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];
	if (token == null) return res.status(401).json({ message: "auth error" });

	// Only a verified token payload should be passed to the next API handler.
	jwt.verify(token, process.env.ACCESS_TOKEN, (err, userData) => {
		if (err) return res.sendStatus(403);
		try {
			req.userData = getVerifiedUserData(userData);
		} catch (payloadError) {
			return res.sendStatus(403);
		}
		console.log("token authorized");
		next();
	});
}

module.exports = { authenticateToken, getVerifiedUserData, validateData };
