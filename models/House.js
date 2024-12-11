const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const HouseSchema = new Schema(
  {
    houseTitle: { type: String },
    address: { type: String },
    description: { type: String },
    // location: { type: String },
    // salary: { type: String },
    // jobDescription: { type: String },
    file: { type: [String] },
    author : {type:Schema.Types.ObjectId, ref:"User"}
  },
  {
    timestamps: true,
  }
);

const HouseModel = model("House", HouseSchema);

module.exports = HouseModel;
