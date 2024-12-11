const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const UserSchema = new Schema({
  firstName: { type: String, require: true },
  lastName: { type: String, require: true },
  username: { type: String, require: true },
  email: { type: String, require: true, unique: true },
  password: { type: String, require: true },
  confirmPassword: { type: String, require: true },
  token: { type: String }
});

const UserModel = model("User", UserSchema);

module.exports = UserModel;