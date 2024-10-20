import ollama from "ollama"; // 127.0.0.1:11434
import express from "express";
import { engine } from "express-handlebars";

import Chat from "./models/chat.js";
import Conversation from "./models/conversation.js";

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
  // Create new conversation
  const convo = await Conversation.create({
    title: "New Conversation",
  });
  // console.log("convo", convo);

  res.render("home", {
    convo,
  });
});

// show specific conversation
app.get("/:convoId", async (req, res) => {
  // load conversation
  const convo = await Conversation.findOne({
    where: {
      id: req.params.convoId,
    },
  });

  // load entire chat
  const messages = await Chat.findAll({
    order: [["createdAt", "ASC"]],
    where: {
      convo_id: req.params.convoId,
    },
  }).then((rows) => {
    return rows.map(format);
  });

  res.render("home", {
    convo,
    messages,
  });
});

// user message
app.post("/:convoId", async (req, res) => {
  // post data
  const data = req.body;

  // insert user chat
  const user = await Chat.create({
    role: "user",
    message: data.q,
    convo_id: req.params.convoId,
  });

  // load entire chat
  const convo = await Chat.findAll({
    order: [["createdAt", "ASC"]],
    where: {
      convo_id: req.params.convoId,
    },
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
        convo_id: req.params.convoId,
      });
      // console.log("row", row);
      convo.push(row);
    })
    .catch((e) => {
      console.log("ollama chat error", e);
    });

  res.redirect(`/${req.params.convoId}/#${user.dataValues.id}`);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// array map callback
function format(row) {
  // console.log("row", row);

  // encode all html
  let message = htmlspecialchars(row.dataValues.message);
  // replace triple backticks
  message = replacecode(message);
  // replace new line with <br>
  message = message.replace(/(?:\r\n|\r|\n)/g, "<br>");

  return {
    id: row.dataValues.id,
    role: row.dataValues.role,
    message,
  };
}

//
function htmlspecialchars(str) {
  var map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;", // ' -> &apos; for XML only
  };
  return str.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}

function replacecode(str) {
  const regex = /([\s\S]*?)```(\w+)\n([\s\S]*?)```([\s\S]*)/;
  const match = str.match(regex);
  console.log("match", match);

  if (match) {
    return `${match[1]}<pre><code class="${match[2]}">${match[3]}</code></pre>${match[4]}`;
  }

  return str;
}
