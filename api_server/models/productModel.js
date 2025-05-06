const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    comment: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    time: { type: Date, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    stockQuantity: { type: Number, required: true },
    description: { type: String },
    imageUrl: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    brand: { type: String },
    review: [reviewSchema]
});

productSchema.methods.addReview = async function (userId, comment, rating) {
    this.review.push({ userId, comment, rating, time: new Date() });
    return await this.save();
};


productSchema.statics.deleteReview = async function (reviewId) {
    const product = await this.findOne({ "review._id": reviewId });
    if (!product) throw new Error("Không tìm thấy sản phẩm chứa đánh giá này");

    product.review = product.review.filter(r => r._id.toString() !== reviewId);
    await product.save();
};

const ProductModel = mongoose.model("Product", productSchema, "Products");

module.exports = ProductModel;
