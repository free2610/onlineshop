const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// Buyurtma qo'shish
router.post("/", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: "Server xatosi" });
  }
});

// Buyurtmalarni olish
router.get("/", async (req, res) => {
  try {
    const { user } = req.query;
    const query = user ? { user } : {};
    const orders = await Order.find(query).populate("user").populate("items.productId");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server xatosi" });
  }
});

// Buyurtma olish
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user").populate("items.productId");
    if (!order) return res.status(404).json({ message: "Buyurtma topilmadi" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server xatosi" });
  }
});

// Buyurtmani tasdiqlash
router.put("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server xatosi" });
  }
});

module.exports = router;