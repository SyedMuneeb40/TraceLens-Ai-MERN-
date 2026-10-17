const { BrevoClient } = require("@getbrevo/brevo");
require("dotenv").config();

const apiInstance = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

const sendOTPEmailAPI = async (toEmail, otpCode) => {
  return apiInstance.transactionalEmails.sendTransacEmail({
    subject: "Your OTP Verification Code",
    htmlContent: `<h3>Your verification code is: <b>${otpCode}</b></h3>`,
    sender: { name: "TraceLens Ai", email: process.env.SENDER_EMAIL },
    to: [{ email: toEmail }]
  });
};

module.exports = { sendOTPEmailAPI };
