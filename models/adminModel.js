const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
  UserName: { type: String, required: true },  
  Password: { type: String, required: true },
  Email: { type: String, required: true, unique: true },
  PhoneNumber: { type: String, required: true, unique: true },
  
}, { versionKey: false });

adminSchema.pre("save", async function (next) {
  if(!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const AdminModel = mongoose.model("Admin", adminSchema, "Admin");

module.exports = AdminModel;

