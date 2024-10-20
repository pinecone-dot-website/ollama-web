import { Sequelize, DataTypes } from "sequelize";
import Conversation from "./conversation.js";

const sequelize = new Sequelize(
  "mysql://root:root@127.0.0.1:3306/ollama-web",
  {}
);

const Chat = sequelize.define("Chat", {
  id: {
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    type: DataTypes.UUID,
  },
  convo_id: {
    type: DataTypes.UUID,
    references: {
      model: Conversation,
    },
  },
  role: DataTypes.STRING,
  message: DataTypes.TEXT,
});

sequelize.sync({
  alter: true,
  // force: true
});

export default Chat;
