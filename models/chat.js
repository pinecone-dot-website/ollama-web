import { Sequelize, DataTypes } from "sequelize";

const sequelize = new Sequelize(
  "mysql://root:root@127.0.0.1:3306/ollama-web",
  {}
);

const Chat = sequelize.define("Chat", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  role: DataTypes.STRING,
  message: DataTypes.TEXT,
});

sequelize.sync({
  alter: true,
  // force: true
});

export default Chat;
