const express = require("express");
const ProductModel = require("../models/productModel");
const authMiddleware = require("../middleware/authMiddleware");


const router = express.Router();


router.get("/", async (req, res) => {
    try {
        let { page, limit } = req.query; 

        page = parseInt(page); 
        limit = parseInt(limit);

        const products = await ProductModel.find()
            .sort({ createdAt: -1 }) 
            .skip((page - 1) * limit) 
            .limit(limit)

        const totalProducts = await ProductModel.countDocuments(); 

        res.json({
            totalPages: Math.ceil(totalProducts / limit), 
            currentPage: page,
            products
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.get("/search", async (req, res) => {
    try {
        const { keyword } = req.query; 

        if (!keyword) {
            return res.status(400).json({ message: "Vui lòng nhập từ khóa tìm kiếm!" });
        }

        const products = await ProductModel.find({
            $or: [
                { name: { $regex: keyword, $options: "i" } },
                { category: { $regex: keyword, $options: "i" } }
            ]
        }).populate("review.userId", "name email");


        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const { name, category, price, originalQuantity, stockQuantity, description, imageUrl, brand, review } = req.body;

        const product = new ProductModel({
            name,
            category,
            price,
            stockQuantity,
            originalQuantity,
            description,
            imageUrl,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            brand,
            review: review || []
        });

        await product.save();

        res.status(201).json({
            message: "Đã thêm sản phẩm"
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


router.get("/:id", async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.id).populate("review.userId", "name");
        if (!product) return res.status(404).json({ message: "Sản phẩm không tồn tại" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post("/:id/review", async (req, res) => {
    try {
        const { userId, comment, rating } = req.body;
        const product = await ProductModel.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Sản phẩm không tồn tại" });

        await product.addReview(userId, comment, rating);
        res.status(201).json({ message: "Đánh giá đã được thêm thành công" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete("/:productId/review/:reviewId", async (req, res) => {
    try {
        await ProductModel.deleteReview(req.params.reviewId);
        res.json({ message: "Đánh giá đã được xóa" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const updatedProduct = await ProductModel.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại" });
        }

        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Xóa sản phẩm
router.delete("/:id", async (req, res) => {
    try {
        const deletedProduct = await ProductModel.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại" });
        }
        res.json({ message: "Đã xóa sản phẩm thành công" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Loc sản phẩm theo các tiêu chí như giá, danh mục, thương hiệu
router.get("/filter", async (req, res) => {
    try {
      const { sortBy = "createdAt", order = "desc", minPrice, maxPrice, category, brand } = req.query;
  
      let filter = {};
  
      if (minPrice && maxPrice) {
        filter.price = { $gte: Number(minPrice), $lte: Number(maxPrice) };
      }
  
      if (category) {
        filter.category = category;
      }
  
      if (brand) {
        filter.brand = brand;
      }
  
      const sortOption = {};
      sortOption[sortBy] = order === "asc" ? 1 : -1;
  
      const products = await ProductModel.find(filter).sort(sortOption);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  



module.exports = router;
