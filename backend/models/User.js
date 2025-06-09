const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  type: { type: String, enum: ["user", "admin"], default: "user" },
  image: { type: String, default: "https://via.placeholder.com/40" }
});

module.exports = mongoose.model("User", userSchema);