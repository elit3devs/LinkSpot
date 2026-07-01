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

const bareServer = createBareServer("/bare/");

const PORT = process.env.PORT || 80;

if (config.challenge !== false) {
  console.log(chalk.green("🔒 Password protection is enabled!"));
  app.use(basicAuth({ users: config.users, challenge: true }));
}

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(
  express.static(path.join(__dirname, "static"), {
    extensions: ["html", "htm"],
    index: "index.html",
  }),
);

app.get('/scramjet/*', (req, res) => {
  const encodedUrl = req.params[0];
  try {
    const url = Buffer.from(encodedUrl, 'base64').toString('utf-8');
    res.redirect('/bare/v2/' + url);
  } catch (e) {
    res.status(400).send('Invalid URL');
  }
});

app.get('/uv/*', (req, res) => {
  const encodedUrl = req.params[0];
  try {
    const url = Buffer.from(encodedUrl, 'base64').toString('utf-8');
    res.redirect('/bare/v2/' + url);
  } catch (e) {
    res.status(400).send('Invalid URL');
  }
});

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