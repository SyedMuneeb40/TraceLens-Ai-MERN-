const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  purpose: {
    type: String,
    enum: ["REGISTRATION", "PASSWORD_UPDATE"],
    required: true,
    default: "REGISTRATION"
  },
  createdAt: { type: Date, default: Date.now, expires: 300 } // 300 seconds = 5 minutes mein auto delete
});

module.exports = mongoose.model("OTP", otpSchema);
