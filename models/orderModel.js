const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  UserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  OrderDate: { type: Date, default: Date.now },
  OrderDetail: [
    {
      ProductId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      Quantity: { type: Number, required: true, default: 1 },
    }
  ],
  TotalPrice: { type: Number, required: true, default: 0 },
  Status: { type: String, enum: ["Waiting", "Processing", "Shipped", "Done", "Cancelled"], default: "Waiting" }
});


const OrderModel = mongoose.model("Order", orderSchema, "Orders");
module.exports = OrderModel;