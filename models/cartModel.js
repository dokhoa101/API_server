const mongoose = require("mongoose");
const Product = require("./productModel");

const cartSchema = new mongoose.Schema({
  UserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  Products: [
    {
      ProductId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      TimeAtToCart: { type: Date, default: Date.now },
      Quantity: {type: Number, default: 1}
    }
  ]
});

cartSchema.methods.deleteItem = async function (productId) {
  await Cart.updateOne(
      { _id: this._id }, 
      { $pull: { Products: { ProductId: productId } } }
  );
};


const CartModel = mongoose.model("Cart", cartSchema,"Cart");

module.exports = CartModel;
