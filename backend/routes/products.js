const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// Mahsulot qo'shish
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, price, quantity, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : "https://via.placeholder.com/150";
    const product = new Product({ name, price, quantity, description, image });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "Server xatosi" });
  }
});

// Mahsulotlarni olish
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server xatosi" });
  }
});

// Mahsulotni olish
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Mahsulot topilmadi" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server xatosi" });
  }
});

// Mahsulotni tahrirlash
router.put("/:id", async (req, res) => {
  try {
    const { name, price, quantity, description } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, quantity, description },
      { new: true }
    );
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server xatosi" });
  }
});

// Mahsulotni o'chirish
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Mahsulot o'chirildi" });
  } catch (error) {
    res.status(500).json({ message: "Server xatosi" });
  }
});

module.exports = router;