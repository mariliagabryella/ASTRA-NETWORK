const mongoose = require('mongoose');

const HostSchema = new mongoose.Schema({
    name: String,
    ip: String,
    mask: String,
    groups: [String],
    isLighthouse: Boolean,
    publicIp: String,
    publicDomain: String,
    port: String,
    expiry: String,
    description: String,
    publicKey: String,
    privateKey: String,
    certificate: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Host', HostSchema);