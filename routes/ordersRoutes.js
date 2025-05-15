const express = require("express");
const OrderModel = require("../models/orderModel");  
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

// Lấy order của người dùng
router.get("/", authMiddleware, async (req, res) => {
    try {
        const orders = await OrderModel.find({ UserId: req.user.id });  
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: "Lỗi server" });
    }
});

// Lấy tất cả order
router.get("/all", async (req, res) => {
  try {
    
    const allOrders = await OrderModel.find({}).populate("UserId");
    res.json(allOrders);
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Lấy order theo id
router.get("/:id", async (req, res) => {
    try {
        const order = await OrderModel.findById(req.params.id).populate("UserId").populate("OrderDetail.ProductId");
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Tao đơn hàng mới
router.post("/newOrder", authMiddleware, async (req, res) => {
    try {
        const { OrderDetail, TotalPrice } = req.body;
        const UserId = req.user.id;
        const newOrder = new OrderModel({ UserId, OrderDetail, TotalPrice }); 
        await newOrder.save();
        res.status(201).json({ message: "Đã thêm đon hàng" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Hủy đơn hàng
router.put("/cancel/:id", async (req, res) => {
    try {
        const order = await OrderModel.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        order.Status = 'Cancelled';
        await order.save();
        res.status(200).json({ message: "Order cancelled successfully", order });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Lấy tất cả đơn hàng của người dùng theo userId, dùng cho admin
router.get("/user/:userId", async (req, res) => {
    try {
        const orders = await OrderModel.find({ UserId: req.params.userId })
            .populate("UserId")
            .populate("OrderDetail.ProductId");

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng nào cho người dùng này" });
        }

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: "Lỗi server", details: error.message });
    }
});

// Cập nhật trạng thái đơn hàng
router.put("/updateStatus/:id", async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = ["Waiting", "Processing", "Shipped", "Done", "Cancelled"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Trạng thái không hợp lệ." });
        }

        const order = await OrderModel.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
        }

        order.Status = status;
        await order.save();

        res.status(200).json({ message: "Cập nhật trạng thái thành công.", order });
    } catch (error) {
        res.status(500).json({ error: "Lỗi server", details: error.message });
    }
});

// Lấy tất cả đơn hàng theo trạng thái
router.get("/status/:status", async (req, res) => {
    try {
      const status = req.params.status;
      const orders = await OrderModel.find({ Status: status }).populate("UserId").populate("OrderDetail.ProductId");
  
      if (!orders || orders.length === 0) {
        return res.status(404).json({ message: "No orders found with this status" });
      }
  
      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  


module.exports = router;
