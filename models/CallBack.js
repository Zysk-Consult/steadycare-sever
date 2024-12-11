const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const CallBackSchema = new Schema({
    fullName: { type: String },
    email: { type: String },
    postCode: { type: String },
    phone: { type: String },
    careType: { type: String },
},
    {
        timestamps: true,
    }
);

const CallBackModel = model("CallBack", CallBackSchema);

module.exports = CallBackModel;
