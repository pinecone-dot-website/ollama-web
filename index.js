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
  
  // message = breakLines(message);
  message = wrapInParagraphs(message);

  return {
    id: row.dataValues.id,
    role: row.dataValues.role,
    message,
  };
}

// replace new line with <br>
function breakLines(str ){
  return str.replace(/(?:\r\n|\r|\n)/g, "<br>");
}

//
function wrapInParagraphs(text) {
  return text
    .split('\n')            // Split the text on new lines
    .filter(line => line.trim() !== '')  // Remove empty lines
    .map(line => `<p>${line.trim()}</p>`)  // Wrap each line in <p> tags
    .join('');               // Join the array of paragraphs back into a single string
}

//
function htmlspecialchars(str) {
  const regex = /[&<>"']/g;
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;", // ' -> &apos; for XML only
  };
  return str.replace(regex, function (m) {
    return map[m];
  });
}

function replacecode(str) {
  const regex = /([\s\S]*?)```(\w+)\n([\s\S]*?)```/g;
  const matches = [...str.matchAll(regex)];
  console.log("matches", matches);

  if (matches.length) {
    let result = "";

    matches.forEach((match, index) => {
      const beforeText = match[1];  // Text before the code block
      const language = match[2];    // The language (e.g., "html")
      const codeContent = match[3]; // The code block content
      const afterText = str.slice(match.index + match[0].length); // Text after the code block

      result += `${beforeText}<pre><code class="${language}">${codeContent}</code></pre>${afterText}`;

      // lastIndex = match.index + match[0].length;
    });

    return result;
  }

  return str;
}
