const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  OrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Orders", required: true },
  PaymentMethod: { type: String, enum: ["Banking", "Cash", "CreditCard", "Paypal"], required: true },
  PaymentStatus: { type: String, enum: ["Pending", "Done", "Failed"], default: "Pending" },
  PaidDate: { type: Date, default: null }
});

const Payment = mongoose.model("Payments", paymentSchema,"Payments");
module.exports = Payment;

