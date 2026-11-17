const express = require("express");
const path = require("path");

const app = express();
const buildDirectory = path.resolve(__dirname, "../build");

app.use(express.static(buildDirectory));
app.get("*", (_req, res) => {
	res.sendFile(path.join(buildDirectory, "index.html"));
});

const port = Number(process.env.FRONTEND_PORT) || 3000;
app.listen(port, "127.0.0.1", () => {
	console.log(`Frontend listening on http://127.0.0.1:${port}`);
});
