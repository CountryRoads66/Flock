const assert = require("node:assert/strict");
const http = require("node:http");
const { afterEach, describe, it } = require("node:test");
const express = require("express");
const jwt = require("jsonwebtoken");
const activityRoutes = require("../routes/activity");
const {
	authenticateToken,
	getVerifiedUserData,
	validateData,
} = require("../middleware/auth");

const accessTokenSecret = "backend-tests-secret";
process.env.ACCESS_TOKEN = accessTokenSecret;

const startServer = async (query, emitNotificationsChanged = () => {}) => {
	const app = express();
	app.use(express.json());
	activityRoutes({
		app,
		DB_CONNECTION: { query },
		authenticateToken,
		emitNotificationsChanged,
	});

	const server = http.createServer(app);
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	const { port } = server.address();

	return {
		server,
		url: `http://127.0.0.1:${port}`,
	};
};

const closeServer = (server) =>
	new Promise((resolve, reject) => {
		server.close((error) => (error ? reject(error) : resolve()));
	});

const post = (url, path, body, token) =>
	fetch(`${url}${path}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify(body),
	});

const createToken = (userData) =>
	jwt.sign(JSON.stringify(userData), accessTokenSecret);

describe("authentication helpers", () => {
	it("accept only string credentials", () => {
		assert.equal(validateData("alice", "password"), 0);
		assert.equal(validateData("alice", null), 1);
		assert.equal(validateData(undefined, "password"), 1);
	});

	it("normalizes token data and rejects payloads without a user id", () => {
		assert.deepEqual(getVerifiedUserData('{"id":7,"username":"alice"}'), {
			id: 7,
			username: "alice",
		});
		assert.throws(() => getVerifiedUserData({ username: "alice" }), {
			message: "Invalid access token payload",
		});
	});

	it("rejects missing and invalid tokens and accepts a verified token", async () => {
		const app = express();
		app.get("/private", authenticateToken, (req, res) =>
			res.json(req.userData)
		);
		const server = http.createServer(app);
		await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
		const url = `http://127.0.0.1:${server.address().port}/private`;

		try {
			const missingTokenResponse = await fetch(url);
			assert.equal(missingTokenResponse.status, 401);

			const invalidTokenResponse = await fetch(url, {
				headers: { Authorization: "Bearer invalid-token" },
			});
			assert.equal(invalidTokenResponse.status, 403);

			const token = createToken({ id: 7, username: "alice" });
			const validTokenResponse = await fetch(url, {
				headers: { Authorization: `Bearer ${token}` },
			});
			assert.equal(validTokenResponse.status, 200);
			assert.deepEqual(await validTokenResponse.json(), {
				id: 7,
				username: "alice",
			});
		} finally {
			await closeServer(server);
		}
	});
});

describe("comment routes", () => {
	let server;
	let url;

	afterEach(async () => {
		if (server) await closeServer(server);
		server = undefined;
		url = undefined;
	});

	it("rejects invalid comments before querying the database", async () => {
		let queryCount = 0;
		({ server, url } = await startServer(() => {
			queryCount += 1;
		}));
		const token = createToken({ id: 7, username: "alice" });

		for (const body of [
			{ postId: 0, text: "hello" },
			{ postId: "not-a-number", text: "hello" },
			{ postId: 12, text: "  " },
			{ postId: 12, text: 42 },
		]) {
			const response = await post(url, "/api/createComment", body, token);
			assert.equal(response.status, 400);
			assert.deepEqual(await response.json(), {
				message: "Invalid parameters",
			});
		}

		assert.equal(queryCount, 0);
	});

	it("creates a comment and notifies the post owner", async () => {
		const queries = [];
		const notifications = [];
		({ server, url } = await startServer(
			(sql, params, callback) => {
				queries.push({ sql, params });
				if (sql.startsWith("SELECT userId FROM posts")) {
					callback(null, [{ userId: 18 }]);
				} else {
					callback(null, {});
				}
			},
			(userId) => notifications.push(userId)
		));
		const token = createToken({ id: 7, username: "alice" });

		const response = await post(
			url,
			"/api/createComment",
			{ postId: "12", text: "Nice post" },
			token
		);

		assert.equal(response.status, 201);
		assert.deepEqual(await response.json(), { message: "Comment created" });
		assert.deepEqual(queries[0].params, [12, 7, "Nice post"]);
		assert.deepEqual(queries[1].params, [12]);
		assert.deepEqual(queries[2].params, [
			18,
			7,
			"comment",
			12,
			"alice commented on your post",
		]);
		assert.deepEqual(notifications, [18]);
	});

	it("does not notify the author when they comment on their own post", async () => {
		const queries = [];
		const notifications = [];
		({ server, url } = await startServer(
			(sql, params, callback) => {
				queries.push(sql);
				if (sql.startsWith("SELECT userId FROM posts")) {
					callback(null, [{ userId: 7 }]);
				} else {
					callback(null, {});
				}
			},
			(userId) => notifications.push(userId)
		));

		const response = await post(
			url,
			"/api/createComment",
			{ postId: 12, text: "My post" },
			createToken({ id: 7, username: "alice" })
		);

		assert.equal(response.status, 201);
		assert.equal(queries.length, 2);
		assert.deepEqual(notifications, []);
	});

	it("scopes comment deletion to the authenticated user", async () => {
		let deleteQuery;
		({ server, url } = await startServer((sql, params, callback) => {
			deleteQuery = { sql, params };
			callback(null, {});
		}));

		const response = await post(
			url,
			"/api/deleteComment",
			{ commentId: 31 },
			createToken({ id: 7, username: "alice" })
		);

		assert.equal(response.status, 200);
		assert.deepEqual(await response.json(), { message: "Comment deleted" });
		assert.equal(
			deleteQuery.sql,
			"DELETE FROM comments WHERE id = ? AND userId = ?"
		);
		assert.deepEqual(deleteQuery.params, [31, 7]);
	});
});
