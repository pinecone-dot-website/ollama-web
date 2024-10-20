import { Sequelize, DataTypes } from "sequelize";

const sequelize = new Sequelize(
  "mysql://root:root@127.0.0.1:3306/ollama-web",
  {}
);

const Conversation = sequelize.define("Conversation", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: DataTypes.STRING,
});

sequelize.sync({
  alter: true,
  // force: true
});

export default Conversation;
