const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    orderQuantity: { type: Number, required: true }
  }],
  phoneNumber: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  address: { type: String, required: true },
  status: { type: String, enum: ["pending", "confirmed"], default: "pending" },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);