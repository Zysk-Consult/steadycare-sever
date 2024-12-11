const mongoose = require("mongoose");
const express = require("express");
const cloudinary = require('cloudinary').v2;
const House = require("../models/House")
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


// Housing Section
router.post("/house", uploadMiddleware.array("files", 10), async (req, res) => {
    const imageArray = []
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGOOSE_API_ID);
        // console.log(req.files)

        for (image of req.files) {
            const path = image.path
            const result = await cloudinary.uploader.upload(path, {
                folder: "steadycare/housing"
            });
            imageArray.push(result.secure_url)
        }

        // Extract authorization token and user ID
        const { authorization } = req.headers;
        const token = authorization.split(' ')[1];
        const decoded = jwt.verify(token, secret);
        const authorId = decoded.id;
        // Create post
        const house = await House.create({
            houseTitle: req.body.houseTitle,
            address: req.body.address,
            description: req.body.description,
            file: imageArray,
            // jobDescription: req.body.jobDescription,
            // file: result.secure_url,
            author: authorId,
        });

        res.json({
            message: "house created successfully", newHouse: house
        }); // Send created post data
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

// Get All Houses
router.get("/houses", async (req, res) => {
    mongoose.connect(process.env.MONGOOSE_API_ID);
    const houses = await House.find()
        .populate("author", ["lastName"])
        .sort({ createdAt: -1 })
        .limit(6);
    res.json({ allHouses: houses });
});

// get single House by ID
router.get("/house/:id", async (req, res) => {
    mongoose.connect(process.env.MONGOOSE_API_ID);
    const { id } = req.params;
    const jobInfor = await House.findById(id).populate("author", ["lastName"]);
    res.json(jobInfor);
});

// Updating house
router.put("/house", uploadMiddleware.array("files", 10), async (req, res) => {
    try {
        const imageArray = []
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGOOSE_API_ID);

        for (image of req.files) {
            const path = image.path
            const result = await cloudinary.uploader.upload(path, {
                folder: "steadycare/housing"
            });
            imageArray.push(result.secure_url)
        }

        // Extract authorization token and user ID
        const { authorization } = req.headers;
        const token = authorization.split(' ')[1];
        const decoded = jwt.verify(token, secret);
        const authorId = decoded.id;
        const { id, houseTitle, address, description } = req.body;

        // Find the post by ID
        const house = await House.findById(id);
        if (!house) {
            return res.status(404).json({ message: 'house not found' });
        }

        // Authorize update
        // if (house.author.toString() !== authorId) {
        //     return res.status(403).json({ message: 'Unauthorized to update house' });
        // }
        console.log(imageArray.length)
        house.houseTitle = req.body.houseTitle;
        house.address = req.body.address;
        house.description = req.body.description;
        house.file = imageArray.length < 1 ? house.file : imageArray;
        await house.save();

        res.json({ message: "house updated successfully", updateHouse: house });
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

// Delete House
router.delete("/house/:id", async (req, res) => {
    mongoose.connect(process.env.MONGOOSE_API_ID);
    const { id } = req.params;
    const deleteInfor = await House.findByIdAndDelete(id);

    if (deleteInfor) {
        res.status(200).json({
            success: true,
            message: "house deleted successfully.",
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