const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
    {
        user:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        refreshTokenHash:
        {
            type: String,
            required: true
        },
        ip:
        {
            type: String,
            required: true
        },
        userAgent:
        {
            type: String,
            required: true
        },
        revoked:{
            type: Boolean,
            default: false
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        }

    },
    {
        timestamps:true
    }
);

sessionSchema.index({user:1,revoked:1});
sessionSchema.index({expiresAt: 1},{expireAfterSeconds: 0});

const Session = mongoose.model("Session",sessionSchema);

module.exports = Session;
