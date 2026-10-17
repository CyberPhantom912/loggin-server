const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_FILE = path.join(__dirname, "data", "users.json");

function readUsers() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeUsers(users) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg"
};

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/api/auth/users") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(readUsers()));
    return;
  }

  if (req.method === "POST" && req.url === "/api/auth/register") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      try {
        const { identifier, password } = JSON.parse(body);
        if (!identifier || !password) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Faltan datos" }));
          return;
        }

        const users = readUsers();
        const newUser = {
          id: Date.now().toString(),
          identifier,
          passwordHash: password, // Guarda la contraseña tal cual para verla
          createdAt: new Date().toISOString(),
          lastLogin: null
        };

        users.push(newUser);
        writeUsers(users);

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, user: newUser }));
      } catch (e) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Error en el servidor" }));
      }
    });
    return;
  }

  let filePath = path.join(PUBLIC_DIR, req.url === "/" ? "login.html" : req.url);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || "text/plain";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor de Loggin corriendo en http://localhost:${PORT}/login.html`);
});