import http from "node:http";
import path from "node:path";
import chalk from "chalk";
import express from "express";
import basicAuth from "express-basic-auth";
import config from "./config.js";
import fetch from "node-fetch";

console.log(chalk.yellow("🚀 Starting server..."));

const __dirname = process.cwd();
const app = express();

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

app.get('/proxy/*', async (req, res) => {
  const url = req.params[0];
  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type') || 'text/html';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    
    const body = await response.text();
    // Modify HTML to handle relative URLs
    if (contentType.includes('text/html')) {
      let modifiedBody = body
        .replace(/href=["']([^"']+)["']/g, (match, href) => {
          if (href.startsWith('http') || href.startsWith('//')) return match;
          if (href.startsWith('/')) return `href="${url}${href}"`;
          return `href="${url}/${href}"`;
        })
        .replace(/src=["']([^"']+)["']/g, (match, src) => {
          if (src.startsWith('http') || src.startsWith('//') || src.startsWith('data:')) return match;
          if (src.startsWith('/')) return `src="${url}${src}"`;
          return `src="${url}/${src}"`;
        });
      res.send(modifiedBody);
    } else {
      res.send(body);
    }
  } catch (e) {
    console.error('Proxy error:', e);
    res.status(500).send('Proxy error: ' + e.message);
  }
});

app.get('/scramjet/*', (req, res) => {
  const encodedUrl = req.params[0];
  try {
    const url = Buffer.from(encodedUrl, 'base64').toString('utf-8');
    res.redirect('/proxy/' + url);
  } catch (e) {
    res.status(400).send('Invalid URL');
  }
});

app.get('/uv/*', (req, res) => {
  const encodedUrl = req.params[0];
  try {
    const url = Buffer.from(encodedUrl, 'base64').toString('utf-8');
    res.redirect('/proxy/' + url);
  } catch (e) {
    res.status(400).send('Invalid URL');
  }
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "static", "404.html"));
});

app.listen(PORT, () => {
  console.log(chalk.green(`🌍 Server is running on http://localhost:${PORT}`));
});