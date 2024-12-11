const mongoose = require("mongoose");
const express = require("express");
const cloudinary = require('cloudinary').v2;
const JobApplication = require("../models/JobApplication")
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
router.post("/jobApply", uploadMiddleware.single("file"), async (req, res) => {
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
        // const { authorization } = req.headers;
        // const token = authorization.split(' ')[1];
        // const decoded = jwt.verify(token, secret);
        // const authorId = decoded.id;

        // Create post
        const jobApplication = await JobApplication.create({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            middleName: req.body.middleName,
            dateOfBirth: req.body.dateOfBirth,
            streetAddress: req.body.streetAddress,
            city: req.body.city,
            country: req.body.country,
            postCode: req.body.postCode,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
            applyPosition: req.body.applyPosition,
            startDate: req.body.startDate,
            insuranceNumber: req.body.insuranceNumber,
            ukCitizen: req.body.ukCitizen,
            workAuthority: req.body.workAuthority,
            workPermit: req.body.workPermit,
            contactAddress: req.body.contactAddress,
            driverLicense: req.body.driverLicense,
            companyOne: req.body.companyOne,
            supervisorOne: req.body.supervisorOne,
            companyPhoneOne: req.body.companyPhoneOne,
            companyEmailOne: req.body.companyEmailOne,
            companyAddressOne: req.body.companyAddressOne,
            companyTitleOne: req.body.companyTitleOne,
            companyCityOne: req.body.companyCityOne,
            companyCountryOne: req.body.companyCountryOne,
            companyPostCodeOne: req.body.companyPostCodeOne,
            responsibilityOne: req.body.responsibilityOne,
            reasonForLeavingOne: req.body.reasonForLeavingOne,
            companyTwo: req.body.companyTwo,
            supervisorTwo: req.body.supervisorTwo,
            companyPhoneTwo: req.body.companyPhoneTwo,
            companyEmailTwo: req.body.companyEmailTwo,
            companyAddressTwo: req.body.companyAddressTwo,
            companyTitleTwo: req.body.companyTitleTwo,
            companyCityTwo: req.body.companyCityTwo,
            companyCountryTwo: req.body.companyCountryTwo,
            companyPostCodeTwo: req.body.companyPostCodeTwo,
            responsibilityTwo: req.body.responsibilityTwo,
            responsibilityTwo: req.body.responsibilityTwo,
            reasonForLeavingTwo: req.body.reasonForLeavingTwo,
            collegeName: req.body.collegeName,
            collegeStartDate: req.body.collegeStartDate,
            collegeFinishDate: req.body.collegeFinishDate,
            collegeAddress: req.body.collegeAddress,
            collegeCity: req.body.collegeCity,
            collegeCountry: req.body.collegeCountry,
            collegePostCode: req.body.collegePostCode,
            collegeGrades: req.body.collegeGrades,
            universityName: req.body.universityName,
            universityStartDate: req.body.universityStartDate,
            universityFinishDate: req.body.universityFinishDate,
            universityAddress: req.body.universityAddress,
            universityCity: req.body.universityCity,
            universityCountry: req.body.universityCountry,
            universityPostCode: req.body.universityPostCode,
            universityGrades: req.body.universityGrades,
            otherSchoolName: req.body.otherSchoolName,
            otherSchoolStartDate: req.body.otherSchoolStartDate,
            otherSchoolFinishDate: req.body.otherSchoolFinishDate,
            otherSchoolAddress: req.body.otherSchoolAddress,
            otherSchoolCity: req.body.otherSchoolCity,
            otherSchoolCountry: req.body.otherSchoolCountry,
            otherSchoolPostCode: req.body.otherSchoolPostCode,
            otherSchoolGrades: req.body.otherSchoolGrades,
            refereeOneName: req.body.refereeOneName,
            refereeOneRelationship: req.body.refereeOneRelationship,
            refereeOnePhone: req.body.refereeOnePhone,
            refereeOneCompany: req.body.refereeOneCompany,
            refereeOneEmail: req.body.refereeOneEmail,
            refereeOneAddress: req.body.refereeOneAddress,
            refereeTwoName: req.body.refereeTwoName,
            refereeTwoRelationship: req.body.refereeTwoRelationship,
            refereeTwoPhone: req.body.refereeTwoPhone,
            refereeTwoCompany: req.body.refereeTwoCompany,
            refereeTwoEmail: req.body.refereeTwoEmail,
            refereeTwoAddress: req.body.refereeTwoAddress,
            criminalRecord: req.body.criminalRecord,
            investigation: req.body.investigation,
            disqualified: req.body.disqualified,
            furtherDetails: req.body.furtherDetails,
            agreement: req.body.agreement,
        });

        res.json({ message: "Application successful", newApply: jobApplication }); // Send created post data
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
router.get("/allApplication", async (req, res) => {
    mongoose.connect(process.env.MONGOOSE_API_ID);
    const applications = await JobApplication.find()
        .sort({ createdAt: -1 })
        .limit(20);
    res.json({ allApplications: applications });
});

// Delete Job
router.delete("/application/:id", async (req, res) => {
    mongoose.connect(process.env.MONGOOSE_API_ID);
    const { id } = req.params;
    const deleteInfor = await JobApplication.findByIdAndDelete(id);

    if (deleteInfor) {
        res.status(200).json({
            success: true,
            message: "application deleted successfully.",
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