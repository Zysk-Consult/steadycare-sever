const mongoose = require("mongoose");
const express = require("express");
const cloudinary = require('cloudinary').v2;
const Review = require("../models/Review")
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


// Career Section
router.post("/review", uploadMiddleware.single("file"), async (req, res) => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGOOSE_API_ID);

        // Extract authorization token and user ID
        const { authorization } = req.headers;
        const token = authorization.split(' ')[1];
        const decoded = jwt.verify(token, secret);
        const authorId = decoded.id;

        // Create post
        const review = await Review.create({
            title: req.body.title,
            comment: req.body.comment,
            sender: req.body.sender,
        });

        res.json({ message: "Review created successfully", newReview: review }); // Send created post data
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

// Get All Careers
router.get("/reviews", async (req, res) => {
    mongoose.connect(process.env.MONGOOSE_API_ID);
    const jobs = await Review.find()
        .sort({ createdAt: -1 })
        .limit(10);
    res.json({ allReviews: jobs });
});

// get single job by ID
router.get("/review/:id", async (req, res) => {
    mongoose.connect(process.env.MONGOOSE_API_ID);
    const { id } = req.params;
    const reviewInfor = await Review.findById(id);
    res.json(reviewInfor);
});

// Updating job
router.put("/review", async (req, res) => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGOOSE_API_ID);

        // Extract authorization token and user ID
        const { authorization } = req.headers;
        const token = authorization.split(' ')[1];
        const decoded = jwt.verify(token, secret);
        const authorId = decoded.id;
        // console.log(req)
        // Find the post by ID
        const review = await Review.findById(req.body.id);
        if (!review) {
            return res.status(404).json({ message: 'review not found' });
        }

        // Authorize update
        // if (job.author.toString() !== authorId) {
        //     return res.status(403).json({ message: 'Unauthorized to update job' });
        // }

        // Update job review
        review.title = req.body.title;
        review.comment = req.body.comment;
        review.sender = req.body.sender;
        await review.save();

        res.json({ message: "review updated successfully", updatedReview: review });
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

// Delete Job
router.delete("/review/:id", async (req, res) => {
    mongoose.connect(process.env.MONGOOSE_API_ID);
    const { id } = req.params;
    const deleteInfor = await Review.findByIdAndDelete(id);

    if (deleteInfor) {
        res.status(200).json({
            success: true,
            message: "Review deleted successfully.",
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