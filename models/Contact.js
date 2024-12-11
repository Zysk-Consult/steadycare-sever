const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const ContactSchema = new Schema({
    fullName: { type: String },
    email: { type: String },
    message: { type: String },
},
    {
        timestamps: true,
    }
);

const ContactModel = model("Contact", ContactSchema);

module.exports = ContactModel;
