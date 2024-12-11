const mongoose = require("mongoose");
const express = require("express");
const cloudinary = require('cloudinary').v2;
const Career = require("../models/Career")
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
router.post("/career", uploadMiddleware.single("file"), async (req, res) => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGOOSE_API_ID);

        // Extract file information
        // const { originalname, path, mimetype } = req.file;
        // const parts = originalname.split(".");
        // const ext = parts[parts.length - 1];
        // const newFilePath = path + "." + ext;

        // const result = await cloudinary.uploader.upload(path, {
        //     folder: "mizrach"
        // });

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
        const career = await Career.create({
            jobTitle: req.body.jobTitle,
            jobType: req.body.jobType,
            location: req.body.location,
            salary: req.body.salary,
            jobDescription: req.body.jobDescription,
            status: req.body.status,
            // file: result.secure_url,
            author: authorId,
        });

        res.json({ message: "job creates successfully", newCareer: career }); // Send created post data
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
router.get("/career", async (req, res) => {
    mongoose.connect(process.env.MONGOOSE_API_ID);
    const jobs = await Career.find()
        .populate("author", ["lastName"])
        .sort({ createdAt: -1 })
        .limit(6);
    res.json({ allJobs: jobs });
});

// get single job by ID
router.get("/career/:id", async (req, res) => {
    mongoose.connect(process.env.MONGOOSE_API_ID);
    const { id } = req.params;
    const jobInfor = await Career.findById(id).populate("author", ["lastName"]);
    res.json(jobInfor);
});

// Updating job
router.put("/career", async (req, res) => {
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
        const job = await Career.findById(req.body.id);
        if (!job) {
            return res.status(404).json({ message: 'job not found' });
        }

        // Authorize update
        // if (job.author.toString() !== authorId) {
        //     return res.status(403).json({ message: 'Unauthorized to update job' });
        // }

        // Update job data
        job.jobTitle = req.body.jobTitle;
        job.salary = req.body.salary;
        job.jobType = req.body.jobType;
        job.location = req.body.location;
        job.jobDescription = req.body.jobDescription;
        job.status = req.body.status;
        await job.save();

        res.json({ message: "job updated successfully", updateJob: job });
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
router.delete("/career/:id", async (req, res) => {
    mongoose.connect(process.env.MONGOOSE_API_ID);
    const { id } = req.params;
    const deleteInfor = await Career.findByIdAndDelete(id);

    if (deleteInfor) {
        res.status(200).json({
            success: true,
            message: "job deleted successfully.",
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