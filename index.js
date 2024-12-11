const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require('dotenv').config();
const User = require("./models/User");
const Post = require("./models/BlogPost");
const Career = require("./models/Career")
const House = require("./models/House")
const bcrypt = require("bcryptjs");
const cloudinary = require('cloudinary').v2;
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const blogRoutes = require("./routes/blogRoutes");
const careerRoutes = require("./routes/careerRoutes");
const housingRoutes = require("./routes/housingRoutes");
const userRoutes = require("./routes/userRoutes")
const applicationRoutes = require("./routes/jobApplicationRoutes")
const contactRoutes = require('./routes/contactRoutes')
const callBackRoutes = require('./routes/callBackRoutes')
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();

const port = 4000

const uploadMiddleware = multer({ dest: "/tmp" });
const fs = require("fs");
// const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3")

const salt = bcrypt.genSaltSync(10);

const secret = process.env.SECRET_KEY;

// app.use(cors());
app.use(cors({ origin: ["http://localhost:5173", "https://steady-care.vercel.app"] }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));

// mongodb connection
// mongoose.connect(process.env.MONGOOSE_API_ID);

const bucket = "chatter-blog-app";

// const uploadToS3Bucket = async (path, originalFilename, mimeType) => {
//   const client = new S3Client({
//     region: "eu-north-1",
//     credentials: {
//       accessKeyId: process.env.S3_ACCESS_KEY,
//       secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
//     }
//   });
//   const parts = originalFilename.split('.');
//   const ext = parts[parts.length - 1];
//   const newFilename = Date.now() + "." + ext;
//   await client.send(new PutObjectCommand({
//     Bucket: bucket,
//     Body: fs.readFileSync(path),
//     Key: newFilename,
//     ContentType: mimeType,
//     ACL: "public-read",
//   }))
//   // console.log({ data })
//   return `https://${bucket}.s3.amazonaws.com/${newFilename}`
// }

cloudinary.config({
    secure: true,
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});


app.get("/profile", async (req, res) => {
    // ... (Mongoose connection)
    mongoose.connect(process.env.MONGOOSE_API_ID);

    const { token } = req.cookies;

    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const info = jwt.verify(token, secret, {});
        res.json(info);
    } catch (error) {
        console.error("JWT verification error:", error);
        return res.status(401).json({ error: "Invalid token" });
    }
});

// logout route

app.post("/logout", (req, res) => {
    res.header('Authorization', "");
    res.json("ok logout successful");
});


// Route Handlers
app.use("/", userRoutes);
app.use('/', blogRoutes);
app.use('/', housingRoutes);
app.use('/', careerRoutes);
app.use('/', applicationRoutes);
app.use('/', contactRoutes);
app.use('/', callBackRoutes);
app.use('/', reviewRoutes);

// app.listen(4000);
app.listen(port, () => console.log(`listening on port ${port}`));
