const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");
const authMiddleware = require("../middleware/authMiddleware");
const generateToken = require("../config/jwt");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { Email, Password } = req.body;

  if (!Email || !Password) {
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
  }

  const admin = await Admin.findOne({ Email });
  if (!admin) {
    return res.status(400).json({ message: "Email không tồn tại!" });
  }

  const isMatch = (Password === admin.Password);
  if (!isMatch) {
    return res.status(401).json({ message: "Sai mật khẩu!" });
  }

  res.json({ message: "Đăng nhập thành công!", token: generateToken(admin._id) });
});

// Lấy thông tin Admin
router.get("/getAdminInfo", authMiddleware, async (req, res) => {
  const admin = await Admin.findById(req.user.id);
  if (!admin) {
    return res.status(404).json({ message: "Không tìm thấy admin!" });
  }
  res.json({ message: "Thông tin admin", admin });
});

module.exports = router;
