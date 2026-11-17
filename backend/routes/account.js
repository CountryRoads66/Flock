const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// Account-related routes: login, registration, profile updates and current-user data.
module.exports = ({ app, DB_CONNECTION, authenticateToken, validateData }) => {
app.put("/api/UserDataUpdate", (req, res) => {
	// Updates the authenticated user's public profile details in the database.
	DB_CONNECTION.query(
		"UPDATE users SET description = ?, profilePicture = ?, displayName = ?, username = ? WHERE id = ?",
		[
			req.body.data.description,
			req.body.data.profilePicture,
			req.body.data.displayName,
			req.body.data.username,
			req.body.data.id,
		],
		(err, result) => {
			if (err) throw err;
			res.status(200).json({ message: "data updated" }).end();
		}
	);
});

app.post("/api/getProfilePicture", authenticateToken, (req, res) => {
	res.json(req.userData.profilePicture);
});

app.post("/api/login", async (req, res) => {
	const username = req.body.username;
	const password = req.body.password;
	if (validateData(username, password))
		return res.status(401).json({ message: "Invalid parameters!" }).end();
	DB_CONNECTION.query(
		"SELECT * FROM users WHERE username = ?",
		username,
		async (err, result) => {
			if (err) throw err;
			if (result.length !== 1) {
				return res
					.status(401)
					.json({ message: "Please input correct credentials" })
					.end();
			}
			if (await bcrypt.compare(password, result[0].password)) {
				delete result[0].password;
				let userData = JSON.stringify(result[0]);
				const accessToken = jwt.sign(userData, process.env.ACCESS_TOKEN);
				return res
					.status(200)
					.json({
						accessToken: accessToken,
						authenticated: 1,
						profileId: result[0].profileId,
						username: result[0].username,
						profilePicture: result[0].profilePicture,
					})
					.end();
			} else {
				return res
					.status(401)
					.json({ message: "Please input correct credentials" })
					.end();
			}
		}
	);
});

app.post("/api/me", authenticateToken, (req, res) => {
	res.status(200).json(req.userData).end();
});

app.post("/api/register", async (req, res) => {
	const username = req.body.username;
	const password = req.body.password;
	if (validateData(username, password))
		return res.status(401).json({ message: "Invalid parameters!" }).end();

	// W bazie przechowujemy skrót hasła, a nie hasło podane przez użytkownika.
	const hashedPassword = await bcrypt.hash(password, 10);
	DB_CONNECTION.query(
		"SELECT * FROM users WHERE username = ?",
		username,
		(err, result) => {
			if (err) {
				console.error("Registration lookup error:", err);
				return res.status(500).json({ message: "Unable to create user" }).end();
			}
			if (result.length > 0) {
				return res
					.status(409)
					.json({ message: "User with this username already exists" })
					.end();
			} else {
				DB_CONNECTION.query(
					"INSERT INTO users(username,displayName,password,profileId, description) VALUES(?,?,?,?,?)",
					[
						username,
						username,
						hashedPassword,
						crypto.randomBytes(16).toString("hex"),
						'',
					],
					(insertError, insertResult) => {
						if (insertError) {
							console.error("Registration error:", insertError);
							return res.status(500).json({ message: "Unable to create user" }).end();
						}

						DB_CONNECTION.query(
							"SELECT id, username, displayName, profileId, profilePicture, description FROM users WHERE id = ?",
							[insertResult.insertId],
							(userError, users) => {
								if (userError) {
									console.error("Unable to load registered user:", userError);
									return res.status(500).json({ message: "Unable to sign in" }).end();
								}
								if (users.length !== 1) {
									console.error("Unable to load registered user: inserted user not found");
									return res.status(500).json({ message: "Unable to sign in" }).end();
								}

								const userData = users[0];
								const accessToken = jwt.sign(
									JSON.stringify(userData),
									process.env.ACCESS_TOKEN
								);
								return res.status(201).json({
									message: "User Created",
									created: true,
									accessToken,
									authenticated: 1,
									profileId: userData.profileId,
									username: userData.username,
									profilePicture: userData.profilePicture,
								}).end();
							}
						);
					}
				);
			}
		}
	);
});
};
