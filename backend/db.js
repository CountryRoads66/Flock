const mysql = require("mysql");

// Single shared database connection used by all API routes.
// Keeping one connection object avoids reconnecting on every request.
const connection = mysql.createConnection({
	host: "127.0.0.1",
	user: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
});

connection.connect((err) => {
	if (err) throw err;
	console.log("Connected!");
});

module.exports = connection;
