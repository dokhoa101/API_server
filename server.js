const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const connectDB = require("./config/db");
const cartRoutes = require("./routes/cartRoutes");
const paymentsRoutes = require("./routes/paymentsRoutes");
const productsRoutes = require("./routes/productsRoutes");
const ordersRoutes = require("./routes/ordersRoutes");
const adminRoutes = require("./routes/adminRoutes");


dotenv.config();

connectDB();

const app = express();

app.use(express.json()); 
app.use(cors()); 

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});
