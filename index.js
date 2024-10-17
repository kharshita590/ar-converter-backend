const axios = require("axios");
const multer = require("multer");
const mongoose = require("mongoose");
const path = require("path");
const express = require("express");
const cors = require("cors");
const mongodb = require("mongodb");
const app = express();

app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3003");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(204);
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3003");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use(cors());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

mongoose.connect("mongodb://localhost:27017/", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const fileSchema = new mongoose.Schema({
  filename: String,
  filepath: String,
  filetype: String,
  filesize: Number,
  binary: Buffer,
  uploadedAt: { type: Date, default: Date.now },
});

const File = mongoose.model("File", fileSchema);


const storage = multer.memoryStorage();

const upload = multer({ storage });

app.post("/api", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    // const Ide=req.params.id;
    // console.log(Ide);
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileBinary = new mongodb.Binary(file.buffer);
    const newFile = new File({
      filename: file.originalname,
      filepath: `/uploads/${file.filename}`,
      filetype: file.mimetype,
      filesize: file.size,
      binary: fileBinary,
    });

    await newFile.save();
    const fileId=newFile._id.toString();
    const base64Data = file.buffer.toString("base64");
    const imageUrl = `data:${file.mimetype};base64,${base64Data}`;

    res.status(200).json({
      message: "File uploaded successfully",
      file: file,
      imgUrl: imageUrl,
      idd:fileId
      
    });
  } catch (error) {
    res.status(500).json({ message: "File upload failed", error });
    console.error(error);
  }
});
app.get("/model/:id", async (req, res) => {
    try {
      const file = await File.findById(req.params.id);
  
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
  
      const base64Data = file.binary.toString("base64");
      const imageUrl = `data:${file.filetype};base64,${base64Data}`;
  
      res.status(200).json({
        message: "File retrieved successfully",
        imgUrl: imageUrl,
      });
    } catch (error) {
      res.status(500).json({ message: "Error retrieving file", error });
      console.error(error);
    }
  });
  


const PORT = 3002;
app.listen(PORT, () => {
  console.log("Server running");
});
