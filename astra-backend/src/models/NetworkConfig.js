const mongoose = require('mongoose');

const NetworkConfigSchema = new mongoose.Schema({
    baseIp: { type: String, required: true }, // ex: "192.168.0"
    mask: { type: String, required: true },   
    // lastUsedIp: { type: Number, default: 0 }   // ex: "24"
}, { timestamps: true });

module.exports = mongoose.model('NetworkConfig', NetworkConfigSchema);