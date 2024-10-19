import ollama from "ollama";    // 127.0.0.1:11434
import express from "express";

const app = express();
const port = 3000;

// Middleware for POST requests
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("it works");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
