const express = require("express");
const cors = require("cors");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
require("dotenv").config();

// Shared database connection and authentication helpers used by the route modules.
const DB_CONNECTION = require("./db");
const {
	authenticateToken,
	getVerifiedUserData,
	validateData,
} = require("./middleware/auth");
const accountRoutes = require("./routes/account");
const contentRoutes = require("./routes/content");
const timelineRoutes = require("./routes/timeline");
const socialRoutes = require("./routes/social");
const activityRoutes = require("./routes/activity");

// Express app and HTTP server are initialized separately so the same app can also serve Socket.IO.
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

app.use(express.json());
app.use(cors());

// Every WebSocket connection can optionally carry a JWT token for user authentication.
io.use((socket, next) => {
	const token = socket.handshake.auth && socket.handshake.auth.token;
	if (!token) return next();

	try {
		socket.data.userData = getVerifiedUserData(
			jwt.verify(token, process.env.ACCESS_TOKEN)
		);
		next();
	} catch (error) {
		next(new Error("Authentication failed"));
	}
});

// After a valid login, the user is joined to their private room for real-time notifications.
io.on("connection", (socket) => {
	if (socket.data.userData) {
		socket.join(`user:${socket.data.userData.id}`);
	}
});

// Helper used by route handlers to notify a single user about updates such as new notifications.
const emitNotificationsChanged = (userId) => {
	io.to(`user:${userId}`).emit("notifications:changed");
};

const routeDependencies = {
	app,
	DB_CONNECTION,
	authenticateToken,
	validateData,
	io,
	emitNotificationsChanged,
};

// Register all API route groups against the same application instance and shared dependencies.
accountRoutes(routeDependencies);
contentRoutes(routeDependencies);
timelineRoutes(routeDependencies);
socialRoutes(routeDependencies);
activityRoutes(routeDependencies);

server.listen(5000);
