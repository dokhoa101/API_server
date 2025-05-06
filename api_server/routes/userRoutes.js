const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const authMiddleware = require("../middleware/authMiddleware");
const generateToken = require("../config/jwt");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const Cart = require("../models/cartModel");
const redis = require("redis");

dotenv.config();
const router = express.Router();

// Kết nối Redis 
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  },
  password: process.env.REDIS_PASSWORD
});

redisClient.connect().catch(console.error);

// Đăng ký
router.post("/register", async (req, res) => {
  const { UserName, Email, Password, PhoneNumber } = req.body;

  if (!UserName || !Email || !Password || !PhoneNumber) {
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
  }

  const userExists = await User.findOne({ Email });
  if (userExists) {
    return res.status(400).json({ message: "Email đã tồn tại!" });
  }

  const hashedPassword = await bcrypt.hash(Password, 10);
  const newUser = new User({ UserName, Email, Password: hashedPassword, PhoneNumber });

  try {
    let cart = await Cart.findOne({ UserId: newUser._id });

    if (!cart) {
      cart = new Cart({ UserId: newUser._id, Product: [] });
      await cart.save();
    }
  } catch (error) {
    console.log(error);
  }

  await newUser.save();
  res.status(201).json({ message: "Đăng ký thành công!", token: generateToken(newUser._id) });
});

//Đăng nhập 
router.post("/login", async (req, res) => {
  const { Email, Password } = req.body;

  const user = await User.findOne({ Email });
  if (!user) return res.status(400).json({ message: "Email không tồn tại!" });

  const isMatch = await bcrypt.compare(Password, user.Password);
  if (!isMatch) return res.status(401).json({ message: "Sai mật khẩu!" });

  res.json({ message: "Đăng nhập thành công!", token: generateToken(user._id) });
});

//Lấy thông tin người dùng 
router.get("/getUserInfo", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ message: "Thông tin user", user });
});

// Gửi mã khôi phục mật khẩu
router.post("/forgotPassword", async (req, res) => {
  const { Email } = req.body;

  if (!Email) {
    return res.status(400).json({ message: "Vui lòng nhập email!" });
  }

  const user = await User.findOne({ Email });
  if (!user) {
    return res.status(400).json({ message: "Email không tồn tại!" });
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Lưu mã vào Redis 10 phút
  await redisClient.setEx(Email, 600, resetCode);

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.Email,
    subject: 'Password Reset',
    text: `Bạn đã yêu cầu đặt lại mật khẩu. Mã xác thực của bạn là: ${resetCode}`,
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      return res.status(500).json({ message: "Không thể gửi email!" });
    }
    res.json({ message: "Email xác nhận đã được gửi!" });
  });
});

// Xác minh mã đặt lại mật khẩu
router.post("/verifyResetCode", async (req, res) => {
  const { Email, resetCode, newPassword, confirmPassword } = req.body;

  if (!Email || !resetCode || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Mật khẩu không khớp!" });
  }

  const storedCode = await redisClient.get(Email);
  if (!storedCode || storedCode !== resetCode) {
    return res.status(400).json({ message: "Mã xác nhận không hợp lệ!" });
  }

  const user = await User.findOne({ Email });
  if (!user) {
    return res.status(400).json({ message: "Người dùng không tồn tại!" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.Password = hashedPassword;
  await user.save();

  await redisClient.del(Email); // Xoá mã sau khi dùng

  res.json({ message: "Mật khẩu đã được đặt lại thành công!" });
});

// Đặt lại mật khẩu bằng token
router.post("/resetPassword", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).json({ message: "Người dùng không tồn tại!" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.Password = hashedPassword;
    await user.save();

    res.json({ message: "Mật khẩu đã được đặt lại thành công!" });
  } catch (error) {
    res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
  }
});

//Danh sách người dùng 
router.get("/getAllUsers", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({});
    res.json({ message: "Danh sách người dùng", users });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách người dùng!" });
  }
});

//Tìm kiếm người dùng theo tên 
router.get("/searchUser", authMiddleware, async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ message: "Vui lòng nhập tên để tìm kiếm!" });
  }

  try {
    const users = await User.find({ UserName: { $regex: name, $options: "i" } });
    res.json({ message: "Kết quả tìm kiếm", users });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tìm kiếm người dùng!" });
  }
});

module.exports = router;
