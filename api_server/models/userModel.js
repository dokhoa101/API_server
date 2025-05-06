const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  UserName: { type: String, required: true },  
  Password: { type: String, required: true },
  Email: { type: String, required: true, unique: true },
  PhoneNumber: { type: String, required: true, unique: true },
  Address: { type: String, default: "" }  
}, { versionKey: false });

userSchema.pre("save", async function (next) {
  if(!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const UserModel = mongoose.model("User", userSchema, "User");

module.exports = UserModel;

