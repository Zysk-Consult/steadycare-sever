const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const CareerSchema = new Schema(
  {
    jobTitle: { type: String },
    jobType: { type: String },
    location: { type: String },
    location: { type: String },
    salary: { type: String },
    jobDescription: { type: String },
    status: { type: Boolean },
    // file: { type: String },
    author : {type:Schema.Types.ObjectId, ref:"User"}
  },
  {
    timestamps: true,
  }
);

const CareerModel = model("Career", CareerSchema);

module.exports = CareerModel;
