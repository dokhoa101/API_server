const express = require("express");
const router = express.Router();
const Payment = require("../models/paymentModel");

// Lấy tất cả thanh toán
router.get("/", async (req, res) => {
  try {
    const payments = await Payment.find().populate("OrderId");
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy thanh toán theo ID
router.get("/:id", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate("OrderId");
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Tạo thanh toán mới
router.post("/", async (req, res) => {
  try {
    const { OrderId, PaymentMethod, PaymentStatus, PaidDate } = req.body;

    const payment = new Payment({
      OrderId,
      PaymentMethod,
      PaymentStatus,
      PaidDate: PaidDate ?? null,
    });

    await payment.save();
    res.status(201).json({message: "Payment created"});
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Cập nhật thanh toán
router.put("/:id", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const { PaymentMethod, PaymentStatus } = req.body;

    if ("PaymentMethod" in req.body) payment.PaymentMethod = PaymentMethod;
    if ("PaymentStatus" in req.body) payment.PaymentStatus = PaymentStatus;
    if ("PaidDate" in req.body) payment.PaidDate = req.body.PaidDate;

    const updatedPayment = await payment.save();
    res.json(updatedPayment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Xoá thanh toán
router.delete("/:id", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    await payment.deleteOne();
    res.json({ message: "Payment deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy thanh toán theo userId (tìm qua đơn hàng)
router.get("/user/:userId", async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate({
        path: "OrderId",
        match: { UserId: req.params.userId }, 
        populate: { path: "UserId" }, 
      });

    const filteredPayments = payments.filter(p => p.OrderId !== null);

    res.json(filteredPayments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
