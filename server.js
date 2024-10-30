require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const rateLimit = require("express-rate-limit");

const app = express();
const JWT_SECRET = process.env.JWT_SECRET;
const authenticate = require("./middleware/auth");
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("uploads"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const originalName = file.originalname;
    const uploadPath = path.join(__dirname, "uploads");

    const generateFilename = (name, count) => {
      const ext = path.extname(name);
      const base = path.basename(name, ext);
      return `${base}(${count})${ext}`;
    };

    let filename = originalName;
    let counter = 1;

    while (fs.existsSync(path.join(uploadPath, filename))) {
      filename = generateFilename(originalName, counter);
      counter++;
    }

    cb(null, filename);
  },
});

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
});
app.use(limiter);
const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 3,
  },
});

function generateToken() {
  return jwt.sign({ username: process.env.ADMIN_USERNAME }, JWT_SECRET, {
    expiresIn: process.env.SESSION_TIMEOUT,
  });
}

app.get("/", (req, res) => {
  fs.readdir("uploads", (err, files) => {
    if (err) return res.status(500).send("Error reading uploads");
    res.render("home", { files });
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = generateToken();
    return res.json({ token });
  } else {
    res.status(401).json({ message: "Invalid username or password" });
  }
});

app.get("/upload", (req, res) => {
  res.render("upload");
});

app.post("/upload", authenticate, upload.single("file"), (req, res) => {
  console.log("File uploaded:", req.file);

  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  res.json({
    message: "File uploaded successfully",
    file: req.file,
  });
});

app.delete("/delete/:filename", authenticate, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "uploads", filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Error deleting file:", err);
      return res.status(500).json({ message: "Failed to delete file" });
    }
    res.json({ message: "File deleted successfully" });
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});
