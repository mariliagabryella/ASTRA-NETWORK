require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const connectDB       = require('./config/db');
const hostController  = require('./controllers/hostController');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// ─── Rotas estáticas primeiro (sem :id) ─────────────────────────────────────
app.get('/api/hosts/network-config',    hostController.getNetworkConfig);
app.post('/api/hosts/network-config',   hostController.saveNetworkConfig);
app.get('/api/hosts/next-ip',           hostController.getNextAvailableIp);
app.get('/api/hosts/download/:id',      hostController.downloadConfigFile);

// ─── CA ──────────────────────────────────────────────────────────────────────
app.get('/api/ca/status',   hostController.getCAStatus);
app.post('/api/ca/init',    hostController.initializeCA);

// ─── Configurações (caminhos + gerar CA) ─────────────────────────────────────
const cryptoService = require('./services/cryptoService');

app.get('/api/hosts/settings/paths', (req, res) => {
    try {
        res.json({ success: true, data: cryptoService.getPaths() });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/hosts/settings/paths', (req, res) => {
    try {
        const { nebulaCert, caCrt } = req.body;
        if (!nebulaCert || !caCrt) {
            return res.status(400).json({ success: false, error: 'nebulaCert e caCrt são obrigatórios.' });
        }
        cryptoService.savePaths({ nebulaCert, caCrt });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/hosts/settings/generate-ca', async (req, res) => {
    try {
        const { name = 'nebula-ca', duration = 87600 } = req.body;
        const dur = parseInt(duration);
        if (isNaN(dur) || dur < 72) {
            return res.status(400).json({ success: false, error: 'Duração mínima: 72 horas.' });
        }
        const result = await cryptoService.initializeCA(name, dur);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── Hosts CRUD ──────────────────────────────────────────────────────────────
app.get('/api/hosts',           hostController.getAllHosts);
app.post('/api/hosts',          hostController.createHost);
app.get('/api/hosts/:id',       hostController.getHostById);
app.put('/api/hosts/:id',       hostController.updateHost);
app.delete('/api/hosts/:id',    hostController.deleteHost);

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`[Astra] Servidor rodando em http://localhost:${PORT}`);
});



// require('dotenv').config();
// const express = require('express');
// const cors    = require('cors');
// const connectDB       = require('./config/db');
// const hostController  = require('./controllers/hostController');

// const app = express();
// connectDB();

// app.use(cors());
// app.use(express.json());

// // ─── Rotas estáticas primeiro (sem :id) ─────────────────────────────────────
// app.get('/api/hosts/network-config',    hostController.getNetworkConfig);
// app.post('/api/hosts/network-config',   hostController.saveNetworkConfig);
// app.get('/api/hosts/next-ip',           hostController.getNextAvailableIp);
// app.get('/api/hosts/download/:id',      hostController.downloadConfigFile);

// // ─── CA ──────────────────────────────────────────────────────────────────────
// app.get('/api/ca/status',   hostController.getCAStatus);
// app.post('/api/ca/init',    hostController.initializeCA);

// // ─── Hosts CRUD ──────────────────────────────────────────────────────────────
// app.get('/api/hosts',           hostController.getAllHosts);
// app.post('/api/hosts',          hostController.createHost);
// app.get('/api/hosts/:id',       hostController.getHostById);
// app.put('/api/hosts/:id',       hostController.updateHost);
// app.delete('/api/hosts/:id',    hostController.deleteHost);

// // ─── Start ───────────────────────────────────────────────────────────────────
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`[Astra] Servidor rodando em http://localhost:${PORT}`);
// });