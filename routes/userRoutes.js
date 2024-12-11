const mongoose = require("mongoose");
const express = require("express");
const cloudinary = require('cloudinary').v2;
const User = require("../models/User")
const jwt = require("jsonwebtoken");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
const { TOTP, Secret } = require('otpauth');
const APP_LOCATION = require("../helpers")

const router = express.Router();
const uploadMiddleware = multer({ dest: "/tmp" });

const salt = bcrypt.genSaltSync(10);
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

const totp = new TOTP(
    {
        // Provider or service the account is associated with.
        issuer: "ACME",
        // Account identifier.
        label: "AzureDiamond",
        // Algorithm used for the HMAC function.
        algorithm: "SHA1",
        // Length of the generated tokens.
        digits: 4,
        // Interval of time for which a token is valid, in seconds.
        period: 300,
        // Arbitrary key encoded in base32 or OTPAuth.Secret instance
        // (if omitted, a cryptographically secure random secret is generated).
        secret: "NB2W45DFOIZA", // or `OTPAuth.Secret.fromBase32("NB2W45DFOIZA")` or `new OTPAuth.Secret()`
    }
);

// A cryptographically secure random secret can also be generated with:
let otpSecret = new Secret({ size: 20 })

// registration
router.post("/register", async (req, res) => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGOOSE_API_ID);

        // Extract user data from request body
        const { email, firstName, lastName, username, password, confirmPassword } = req.body;

        // Validate user data (optional)
        if (!email || !firstName || !lastName || !username || !password || !confirmPassword) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check password confirmation
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // Hash password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10); // Adjust salt rounds as needed

        // Create user
        const user = await User.create({
            email,
            firstName,
            lastName,
            username,
            password: hashedPassword,
        });

        // Send response (without password)
        res.json({ message: 'Registration successful', user: user.toObject({ virtuals: true }) }); // Exclude password using toObject with virtuals option
    } catch (error) {
        console.error(error);
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation error', errors: validationErrors });
        } else if (error.name === 'MongoError' && error.code === 11000) { // Duplicate key error (e.g., email already exists)
            return res.status(400).json({ message: 'Duplicate field value' });
        } else if (error.code === 11000) { // Duplicate key error (e.g., email already exists)
            return res.status(500).json({ message: 'email already exists' });
        } else { // Unknown error
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
});

router.post("/login", async (req, res) => {
    mongoose.connect(process.env.MONGOOSE_API_ID);
    const { email, password } = req.body;
    const userInfor = await User.findOne({ email });
    if (!userInfor) {
        return res.status(400).json({ message: 'User Not found' });
    }
    const details = {
        "email": userInfor.email,
        "id": userInfor._id,
        "username": userInfor.username,
        "firstName": userInfor.firstName,
        "lastName": userInfor.lastName,
    }
    // compare password with email
    const correct = bcrypt.compareSync(password, userInfor.password);
    if (correct) {
        // login
        jwt.sign({
            email,
            id: userInfor._id,
            username: userInfor.username,
            firstName: userInfor.firstName,
            lastName: userInfor.lastName,
        }, secret, {}, (err, token) => {
            if (err) throw err;
            res.header('Authorization', `Bearer ${token}`);
            res.status(200).json({
                message: 'Login successful',
                "token": token, details
            });
        });
    } else {
        res.status(400).json({ message: "wrong credentials" });
    }
});

// fetch Users
router.get("/users", async (req, res) => {
    try {
        await mongoose.connect(process.env.MONGOOSE_API_ID);

        const users = await User.find()
            .select('-password')
            .populate()
            .sort({ createdAt: -1 })
        // .limit(10);

        res.json({ allUsers: users });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            error: "Internal Server Error"
        });
    }
});

// OTP verification route
router.post('/forgot-password', async (req, res) => {
    const { email, } = req.body;

    // Retrieve user information from the database
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    let OtpToken = totp.generate();


    // Save token to the user
    user.token = OtpToken;
    await user.save();

    async function main() {
        // send mail with defined transport object
        const info = await transporter.sendMail({
            from: {
                name: "Steadycare Solutions",
                address: process.env.MAIL
            }, // sender address
            to: [email], // list of receivers
            subject: "STEADYCARE Notification", // Subject line
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
              <h3>Password Reset Request</h3>
              <p>
            <a href="${APP_LOCATION}/admin/${OtpToken}/${user.id}">Click to reset password</a>
            </p>
              <p style="margin-top: 2rem;">Please ignore if you did not initiate request</p>
            </body>
            </html>`
        });

        // console.log("Message sent: %s", info.messageId);
        // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
    }

    main().catch(console.error);

    // Generate a JWT token
    // const token = jwt.sign({ userId: user._id }, 'your-secret-key', { expiresIn: '1h' });

    res.json({ message: 'verification sent to your email', });
});

// reset password
router.post("/update-password", async (req, res) => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGOOSE_API_ID);

        // Extract user data from request query
        const { token, id } = req.query;

        // Extract user data from request body
        const { password, confirm } = req.body;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.token !== token) {
            return res.status(404).json({ message: 'Credentials unmatch' });
        }

        // Validate user data (optional)
        if (!password || !confirm) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check password confirmation
        // if (password !== confirm) {
        //     return res.status(400).json({ message: 'Passwords do not match' });
        // }

        // Hash password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10); // Adjust salt rounds as needed

        // Update the user's password
        user.password = hashedPassword;
        user.token = null;
        await user.save();
        // Create user
        // const user = await User.create({
        //     email,
        //     firstName,
        //     lastName,
        //     username,
        //     password: hashedPassword,
        // });

        // Send response (without password)
        res.json({ message: 'Password changed successfully', user: user.toObject({ virtuals: true }) }); // Exclude password using toObject with virtuals option
    } catch (error) {
        console.error(error);
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation error', errors: validationErrors });
        } else if (error.name === 'MongoError' && error.code === 11000) { // Duplicate key error (e.g., email already exists)
            return res.status(400).json({ message: 'Duplicate field value' });
        } else if (error.code === 11000) { // Duplicate key error (e.g., email already exists)
            return res.status(500).json({ message: 'email already exists' });
        } else { // Unknown error
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
});

// Delete User
router.delete("/user/:id", async (req, res) => {
    mongoose.connect(process.env.MONGOOSE_API_ID);
    const { id } = req.params;
    const deleteInfor = await User.findByIdAndDelete(id);

    if (deleteInfor) {
        res.status(200).json({
            success: true,
            message: "User deleted successfully.",
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