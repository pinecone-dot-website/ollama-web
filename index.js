import ollama from "ollama"; // 127.0.0.1:11434
import express from "express";
import { engine } from "express-handlebars";

import Chat from "./models/chat.js";

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

// new chat
app.get("/", async (req, res) => {
  // load entire chat
  const convo = await Chat.findAll({
    order: [["createdAt", "ASC"]],
  });

  res.render("home", {
    convo,
  });
});

//
app.post("/", async (req, res) => {
  // post data
  const data = req.body;

  // insert user chat
  const user = await Chat.create({
    role: "user",
    message: data.q,
  });

  // load entire chat
  const convo = await Chat.findAll({
    order: [["createdAt", "ASC"]],
  });

  // format to ollama
  const messages = convo.map((c) => {
    return {
      role: c.dataValues.role,
      content: c.dataValues.message,
    };
  });
  // console.log("messages", messages);
  // console.log("convo", convo);

  // generate response
  await ollama
    .chat({
      model: "llama3.2",
      messages: messages,
    })
    .then(async (response) => {
      // console.log("response", response);

      // insert ai response to db
      const row = await Chat.create({
        role: "assistant",
        message: response.message.content,
      });
      console.log("row", row);
      convo.push(row);
    })
    .catch((e) => {
      console.log("ollama chat error", e);
    });

  // res.render("home", {
  //   convo,
  // });
  res.redirect(`#${user.dataValues.id}`);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
