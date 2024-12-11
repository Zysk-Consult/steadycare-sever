const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const PostSchema = new Schema(
  {
    title: { type: String },
    summary: { type: String },
    comment: { type: String },
    file: { type: String },
    author : {type:Schema.Types.ObjectId, ref:"User"}
  },
  {
    timestamps: true,
  }
);

const PostModel = model("Post", PostSchema);

module.exports = PostModel;
