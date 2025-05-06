const express = require("express");
const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Lấy thông tin giỏ hàng
router.get("/getCartInfo", authMiddleware, async (req, res) => {
    try {
        const cart = await Cart.findOne({ UserId: req.user.id }).populate("Products.ProductId");
        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Tạo giỏ hàng mới nếu chưa có
router.post("/createCart", authMiddleware, async (req, res) => {
    try {
        let cart = await Cart.findOne({ UserId: req.user.id });

        if (!cart) {
            cart = new Cart({ UserId: req.user.id, Products: [] });
            await cart.save();
            res.status(201).json({ message: "Giỏ hàng đã được tạo." });
        } else {
            res.status(400).json({ message: "Giỏ hàng đã tồn tại." });
        }
    } catch (error) {
        res.status(500).json({ message: "Thao tác bị lỗi, hãy thử lại sau.", error });
    }
});

// Thêm sản phẩm vào giỏ hàng
router.post("/addToCart", authMiddleware, async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || typeof quantity !== "number" || quantity <= 0) {
            return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
        }

        let cart = await Cart.findOne({ UserId: req.user.id });

        if (!cart) {
            cart = new Cart({ UserId: req.user.id, Products: [] });
        }

        const existingProduct = cart.Products.find(
            p => p.ProductId.toString() === productId.toString()
        );

        if (existingProduct) {
            existingProduct.Quantity += quantity;
        } else {
            cart.Products.push({ ProductId: productId, Quantity: quantity });
        }

        await cart.save();
        res.status(201).json({ message: "Sản phẩm đã được thêm vào giỏ hàng." });
    } catch (error) {
        res.status(500).json({ message: "Thao tác bị lỗi, hãy thử lại sau.", error });
    }
});

// Xóa 1 sản phẩm khỏi giỏ hàng
router.post("/deleteItem", authMiddleware, async (req, res) => {
    try {
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ message: "Thiếu productId" });
        }

        const cart = await Cart.findOne({ UserId: req.user.id });
        if (!cart) {
            return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });
        }

        const productIndex = cart.Products.findIndex(
            p => p.ProductId.toString() === productId.toString()
        );

        if (productIndex === -1) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại trong giỏ hàng" });
        }

        cart.Products.splice(productIndex, 1);
        await cart.save();

        res.status(200).json({ message: "Đã xóa khỏi giỏ hàng", cart });
    } catch (error) {
        res.status(500).json({ message: "Thao tác bị lỗi, hãy thử lại sau.", error });
    }
});

router.post("/updateQuantity", authMiddleware, async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || typeof quantity !== "number" || quantity < 0) {
            return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
        }

        const cart = await Cart.findOne({ UserId: req.user.id });

        if (!cart) {
            return res.status(404).json({ message: "Không tìm thấy giỏ hàng." });
        }

        const product = cart.Products.find(
            p => p.ProductId.toString() === productId.toString()
        );

        if (!product) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại trong giỏ hàng." });
        }

        if (quantity === 0) {
            // Nếu quantity là 0 thì xóa sản phẩm
            cart.Products = cart.Products.filter(
                p => p.ProductId.toString() !== productId.toString()
            );
        } else {
            product.Quantity = quantity;
        }

        await cart.save();
        res.status(200).json({ message: "Đã cập nhật số lượng sản phẩm", cart });
    } catch (error) {
        res.status(500).json({ message: "Thao tác bị lỗi, hãy thử lại sau.", error });
    }
});


module.exports = router;
