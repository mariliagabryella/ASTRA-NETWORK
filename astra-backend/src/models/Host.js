const mongoose = require('mongoose');

const HostSchema = new mongoose.Schema({
    name: { type: String, required: true },
    ip: { type: String, required: true },    // O IP final ex: 192.168.0.5
    mask: { type: String, default: '24' },
    isLighthouse: { type: Boolean, default: false },
    publicIp: { type: String },
    port: { type: String },
    publicKey: { type: String },
    privateKey: { type: String },
    description: { type: String, default: '' },
    groups: [String],
    configContent: String
}, { timestamps: true });

module.exports = mongoose.model('Host', HostSchema);