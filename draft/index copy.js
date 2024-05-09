const express = require("express");
const cors = require("cors");
const { createServer } = require("node:http");
const { Server } = require("socket.io");

const { v4: uuidv4 } = require("uuid");
const _ = require("underscore");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();
app.use(cors());
const server = createServer(app);
const io = new Server(server);

const port = 3000 || process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const users = [
  {
    id: uuidv4(),
    name: "John",
    email: "jone@funday.ma",
    password: bcrypt.hashSync("123456", 10),
    role: "admin",
  },
  {
    id: uuidv4(),
    name: "Jane",
    email: "jane@funday.ma",
    password: bcrypt.hashSync("123456", 10),
    role: "user",
  },
];
/**
 * @route GET /about
 */
app.get("/about", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  var about = {
    app_name: process.env.APP_NAME ?? "NodeJS API",
    app_version: process.env.APP_VERSION ?? "1.0.0",
  };
  res.send(JSON.stringify(about));
});
/**
 * @route GET /
 */
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(
    JSON.stringify({
      data: users,
    })
  );
});
/**
 * @route GET /:id
 */
app.post("/", (req, res) => {
  const user = req.body;
  user.id = uuidv4();
  user.password = bcrypt.hashSync(user.password, 10);
  users.push(user);
  res.setHeader("Content-Type", "application/json");
  res.send(
    JSON.stringify({
      data: user,
    })
  );
});

io.on("connection", (socket) => {
  console.log("a user connected");
});
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
