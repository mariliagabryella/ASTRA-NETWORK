require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const hostController = require('./controllers/hostController');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// Definição das Rotas
app.get('/api/hosts/next-ip', hostController.getNextAvailableIp);
app.get('/api/hosts/:id', hostController.getHostById);
app.get('/api/hosts', hostController.getAllHosts);
app.post('/api/hosts', hostController.createHost);
app.get('/api/hosts/:id', hostController.getHostById);
app.put('/api/hosts/:id', hostController.updateHost);
app.delete('/api/hosts/:id', hostController.deleteHost);

app.get('/', (req, res) => res.send('Astra API Online'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`[Astra] Servidor rodando em http://localhost:${PORT}`);
});