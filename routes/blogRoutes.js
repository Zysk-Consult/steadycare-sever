const mongoose = require("mongoose");
const express = require("express");
const cloudinary = require('cloudinary').v2;
const Post = require("../models/BlogPost")
const jwt = require("jsonwebtoken");
const multer = require("multer");

const router = express.Router();
const uploadMiddleware = multer({ dest: "/tmp" });

const secret = process.env.SECRET_KEY;

cloudinary.config({
    secure: true,
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});
// create post
router.post("/post", uploadMiddleware.single("file"), async (req, res) => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGOOSE_API_ID);

        // Extract file information
        const { originalname, path, mimetype } = req.file;
        // const parts = originalname.split(".");
        // const ext = parts[parts.length - 1];
        // const newFilePath = path + "." + ext;

        const result = await cloudinary.uploader.upload(path, {
            folder: "mizrach/blog"
        });
        // console.log(`Successfully uploaded ${path}`);
        // console.log(`> Result: ${result.secure_url}`);

        // Rename uploaded file with extension
        // await fs.promises.rename(path, newFilePath);

        // Extract authorization token and user ID
        const { authorization } = req.headers;
        const token = authorization.split(' ')[1];
        const decoded = jwt.verify(token, secret);
        const authorId = decoded.id;

        // Create post
        const post = await Post.create({
            title: req.body.title,
            summary: req.body.summary,
            comment: req.body.comment,
            file: result.secure_url,
            author: authorId,
        });

        res.json({ message: "post creates successfully", newPost: post }); // Send created post data
    } catch (error) {
        console.error(error); // Log the error for debugging

        // Handle different error types appropriately
        if (error.name === 'ValidationError') { // Mongoose validation error
            res.status(400).json({ message: error.message }); // Send bad request error with details
        } else if (error.name === 'JsonWebTokenError') { // JWT error
            res.status(401).json({ message: 'Invalid authorization token' }); // Send unauthorized error
        } else if (error.name === 'MongoError') { // MongoDB connection or operation error
            res.status(500).json({ message: 'Internal server error' }); // Send generic error for server-side issues
        } else { // Unknown error
            res.status(500).json({ message: 'Internal server error' }); // Send generic error for unexpected issues
        }
    }
});

// get All Post
router.get("/post", async (req, res) => {
    mongoose.connect(process.env.MONGOOSE_API_ID);
    const posts = await Post.find()
        .populate("author", ["lastName"])
        .sort({ createdAt: -1 })
        .limit(6);
    res.json({ allPost: posts });
});

// fetch single post
router.get("/post/:id", async (req, res) => {
    mongoose.connect(process.env.MONGOOSE_API_ID);
    const { id } = req.params;
    const postInfor = await Post.findById(id).populate("author", ["lastName"]);
    res.json(postInfor);
});

// Updating post
router.put("/post", uploadMiddleware.single("file"), async (req, res) => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGOOSE_API_ID);

        let newFilePath = null;

        // Handle file upload (if applicable)
        if (req.file) {
            try {
                const { originalname, path, mimetype } = req.file;
                // const parts = originalname.split(".");
                // const ext = parts[parts.length - 1];
                // newFilePath = path + "." + ext;
                // await fs.promises.rename(path, newFilePath);
                const result = await cloudinary.uploader.upload(path, {
                    folder: "mizrach/blog"
                });
                newFilePath = result.secure_url
            } catch (error) {
                console.error('Error uploading file:', error);
                return res.status(500).json({ message: 'Internal server error' });
            }
        }

        // Extract authorization token and user ID
        const { authorization } = req.headers;
        const token = authorization.split(' ')[1];
        const decoded = jwt.verify(token, secret);
        const authorId = decoded.id;

        // Find the post by ID
        const post = await Post.findById(req.body.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Authorize update
        // if (post.author.toString() !== authorId) {
        //     return res.status(403).json({ message: 'Unauthorized to update post' });
        // }

        // Update post data
        post.title = req.body.title;
        post.summary = req.body.summary;
        post.comment = req.body.comment;
        post.file = newFilePath ? newFilePath : post.file;
        await post.save();

        res.json({ message: "post updated successfully", updatePost: post });
    } catch (error) {
        console.error(error);

        // Handle different error types appropriately
        if (error.name === 'ValidationError') { // Mongoose validation error
            res.status(400).json({ message: error.message });
        } else if (error.name === 'JsonWebTokenError') { // JWT error
            res.status(401).json({ message: 'Invalid authorization token' });
        } else if (error.name === 'MongoError') { // MongoDB connection or operation error
            res.status(500).json({ message: 'Internal server error' });
        } else { // Unknown error
            res.status(500).json({ message: 'Internal server error' });
        }
    }
});

// Delete Post
router.delete("/post/:id", async (req, res) => {
    mongoose.connect(process.env.MONGOOSE_API_ID);
    const { id } = req.params;
    const deleteInfor = await Post.findByIdAndDelete(id);

    if (deleteInfor) {
        res.status(200).json({
            success: true,
            message: "Post deleted successfully.",
        });
    } else if (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    } else {
        res.status(500).json({
            success: false,
            message: "An unknown error occurred.",
        });
    }
});
module.exports = router