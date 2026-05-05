require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const hostController = require('./controllers/hostController');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// Rotas estáticas primeiro (sem :id)
app.get('/api/hosts/network-config', hostController.getNetworkConfig);
app.post('/api/hosts/network-config', hostController.saveNetworkConfig);
app.get('/api/hosts/next-ip', hostController.getNextAvailableIp);
app.get('/api/hosts', hostController.getAllHosts);

// Rotas dinâmicas depois
app.post('/api/hosts', hostController.createHost);
app.get('/api/hosts/:id', hostController.getHostById);
app.put('/api/hosts/:id', hostController.updateHost);
app.delete('/api/hosts/:id', hostController.deleteHost);


const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`[Astra] Servidor rodando em http://localhost:${PORT}`);
});