const express = require("express");
const router = express.Router();
const User = require("../models/User");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// Foydalanuvchi ro'yxatdan o'tish
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { username, password, type } = req.body;
    if (await User.findOne({ username })) {
      return res.status(400).json({ message: "Bu foydalanuvchi nomi band!" });
    }
    const image = req.file ? `/uploads/${req.file.filename}` : "https://via.placeholder.com/40";
    const user = new User({ username, password, type, image });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server xatosi" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password, type } = req.body;
    const user = await User.findOne({ username, password, type });
    if (!user) {
      return res.status(400).json({ message: "Noto'g'ri ma'lumotlar!" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server xatosi" });
  }
});

// Foydalanuvchilarni olish
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server xatosi" });
  }
});

// Foydalanuvchini tahrirlash
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { username, password } = req.body;
    const updateData = { username, password };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server xatosi" });
  }
});

// Foydalanuvchini o'chirish
router.delete("/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Foydalanuvchi o'chirildi" });
  } catch (error) {
    res.status(500).json({ message: "Server xatosi" });
  }
});

module.exports = router;