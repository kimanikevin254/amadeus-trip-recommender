const express = require("express");
const path = require("path");

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files
app.use("/", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});