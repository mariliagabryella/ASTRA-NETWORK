const mongoose = require('mongoose');

const NetworkConfigSchema = new mongoose.Schema({
    baseIp: { type: String, default: '10.0.0' }, // Guarda apenas o prefixo
    mask: { type: String, default: '24' },
    lastUsedIp: { type: Number, default: 0 } // Para sabermos qual é a próxima "porta" (final do IP)
});

module.exports = mongoose.model('NetworkConfig', NetworkConfigSchema);