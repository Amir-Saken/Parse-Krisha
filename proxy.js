const mongoose = require("mongoose");
const db = require('./db')
const ProxySchema = new mongoose.Schema(
    {
        proxy:{
            type: String,
            required: true,
            unique: true,
        },
        host:{
            type: String,
            required: true,
        },
        port: {
            type: Number,
            required: true,
        },
        usedAt:{
            type: Date,
        },
        banned: {
            type: Boolean,
            required: true,
            default:false
        },
        flag: {
            type: Boolean,
            default:false
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("proxies", ProxySchema);