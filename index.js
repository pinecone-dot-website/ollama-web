import ollama from "ollama";    // 127.0.0.1:11434
import express from "express";
import { engine } from "express-handlebars";

const app = express();
const port = 3000;

// Middleware for POST requests
app.use(express.urlencoded({ extended: true }));

// handlebars
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

// static files
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("home", {});
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
