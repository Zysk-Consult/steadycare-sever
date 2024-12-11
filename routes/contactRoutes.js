const mongoose = require("mongoose");
const express = require("express");
const cloudinary = require('cloudinary').v2;
const Contact = require("../models/Contact")
const jwt = require("jsonwebtoken");
const multer = require("multer");
const nodemailer = require('nodemailer');

const router = express.Router();
const uploadMiddleware = multer({ dest: "/tmp" });

const secret = process.env.SECRET_KEY;

cloudinary.config({
    secure: true,
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});


const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
        user: process.env.MAIL,
        pass: process.env.PASS,
    },
});

router.post("/contact", uploadMiddleware.single("file"), async (req, res) => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGOOSE_API_ID);
        
        // Create post
        const contact = await Contact.create({
            fullName: req.body.fullName,
            email: req.body.email,
            message: req.body.message,
        });

        async function main() {
            // send mail with defined transport object
            const info = await transporter.sendMail({
                from: {
                    name: "Mizrach Solutions",
                    address: process.env.MAIL
                }, // sender address
                to: ['george.gyang@myzysk.com', 'mizrachsolutionsltd@gmail.com'], // list of receivers
                subject: "Mizrach Notification", // Subject line
                // text: req.body.message, // plain text body
                html:
                    `<!DOCTYPE html>
                <html>
                <head>
                  <style>
                    body { font-family: Arial, sans-serif; }
                    h3 { color: #a51b55; text-decoration: underline; }
                    p { margin-bottom: 15px; }
                    .primary_color {color: #a51b55;}
                  </style>
                </head>
                <body>
                  <h3>New Contact Form Submission</h3>
                  <p><strong>Name:</strong> ${req.body.fullName}</p>
                  <p><strong>Email:</strong> ${req.body.email}</p>
                  <p><strong>Message:</strong> <br> ${req.body.message}</p>
                </body>
                </html>`
            });

            // console.log("Message sent: %s", info.messageId);
            // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
        }

        main().catch(console.error);

        res.json({ message: "Message sent successful", newMessage: contact }); // Send created post data
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

// Get All Applicant
router.get("/contact", async (req, res) => {
    mongoose.connect(process.env.MONGOOSE_API_ID);
    const contact = await Contact.find()
        .sort({ createdAt: -1 })
        .limit(20);
    res.json({ allContact: contact });
});

// Delete Job
router.delete("/contact/:id", async (req, res) => {
    mongoose.connect(process.env.MONGOOSE_API_ID);
    const { id } = req.params;
    const deleteContact = await Contact.findByIdAndDelete(id);

    if (deleteContact) {
        res.status(200).json({
            success: true,
            message: "Message deleted successfully.",
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