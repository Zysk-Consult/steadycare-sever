const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const ReviewSchema = new Schema(
  {
    title: { type: String },
    comment: { type: String },
    sender: { type: String },
  },
  {
    timestamps: true,
  }
);

const ReviewModel = model("Review", ReviewSchema);

module.exports = ReviewModel;
