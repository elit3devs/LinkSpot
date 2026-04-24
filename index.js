// Credit Interstellar
import http from "node:http";
import path from "node:path";
import { createBareServer } from "@tomphttp/bare-server-node";
import chalk from "chalk";
import express from "express";
import basicAuth from "express-basic-auth";
import config from "./config.js";

console.log(chalk.yellow("🚀 Starting server..."));

const __dirname = process.cwd();
const server = http.createServer();
const app = express();
const bareServer = createBareServer("/edu/");
const PORT = 80;

// Authentication Logic
if (config.challenge !== false) {
  console.log(chalk.green("🔒 Password protection is enabled!"));
  app.use(basicAuth({ users: config.users, challenge: true }));
}

// Serve static assets automatically
app.use(
  express.static(path.join(__dirname, "static"), {
    extensions: ["html", "htm"],
    index: "index.html",
  }),
);

// 404 Handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "static", "404.html"));
});

server.on("request", (req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

server.on("upgrade", (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

server.on("listening", () => {
  console.log(chalk.green(`🌍 Server is running on http://localhost:${PORT}`));
});

server.listen(PORT);