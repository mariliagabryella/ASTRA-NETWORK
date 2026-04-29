const Host = require('../models/Host');
const cryptoService = require('../services/cryptoService');
// Adiciona no final do hostController.js
exports.getNextAvailableIp = async (req, res) => {
    try {
        // Busca o host mais recente para ver o último IP usado
        const lastHost = await Host.findOne().sort({ createdAt: -1 });
        
        let nextNumber = 1;
        let baseIp = "10.0.0"; // Teu padrão

        if (lastHost && lastHost.ip) {
            const parts = lastHost.ip.split('.');
            if (parts.length === 4) {
                baseIp = `${parts[0]}.${parts[1]}.${parts[2]}`;
                nextNumber = parseInt(parts[3]) + 1;
            }
        }

        // Se passar de 254, volta para o 1 (limite de rede /24)
        if (nextNumber > 254) nextNumber = 1;

        res.status(200).json({ 
            success: true, 
            suggestedIp: `${baseIp}.${nextNumber}`,
            mask: "/24"
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
// LISTAR TODOS
exports.getAllHosts = async (req, res) => {
    try {
        const hosts = await Host.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: hosts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// BUSCAR UM POR ID (A que faltava!)
exports.getHostById = async (req, res) => {
    try {
        const host = await Host.findById(req.params.id);
        if (!host) return res.status(404).json({ success: false, message: "Host não encontrado" });
        res.status(200).json({ success: true, data: host });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// CRIAR
exports.createHost = async (req, res) => {
    try {
        const { name, ip, mask, isLighthouse, publicIp, port, description } = req.body;
        let { publicKey } = req.body;
        let privateKey = '';

        if (!publicKey) {
            const keys = await cryptoService.generateNebulaKeys(name);
            publicKey = keys.publicKey;
            privateKey = keys.privateKey;
        }

        const newHost = new Host({
            name, ip, mask, isLighthouse, publicIp, port, publicKey, privateKey, description
        });

        await newHost.save();
        res.status(201).json({ success: true, data: newHost });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.updateHost = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // REGRA DE OURO: Remover o _id e o __v dos dados de atualização
        // O MongoDB não permite atualizar o campo _id
        delete updateData._id;
        delete updateData.__v;

        console.log("Dados que vou realmente gravar:", updateData);

        const updatedHost = await Host.findByIdAndUpdate(
            id, 
            { $set: updateData }, // Usamos $set para garantir que apenas estes campos mudem
            { returnDocument: 'after', runValidators: true }
        );

        if (!updatedHost) {
            return res.status(404).json({ success: false, message: "Host não encontrado" });
        }

        res.status(200).json({ success: true, data: updatedHost });
    } catch (error) {
        console.error("Erro no update:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
// APAGAR
exports.deleteHost = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedHost = await Host.findByIdAndDelete(id);
        if (!deletedHost) return res.status(404).json({ success: false, message: "Host não encontrado" });
        res.status(200).json({ success: true, message: "Host removido com sucesso" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// No seu arquivo de rotas (ex: server.js)
// app.delete('/api/hosts/:id', hostController.deleteHost);
// const Host = require('../models/Host');
// const cryptoService = require('../services/cryptoService');
// const configGenerator = require('../services/configGenerator');

// const createHost = async (req, res) => {
//     try {
//         const {
//             name, ip, mask, groups,
//             isLighthouse, publicIp, port,
//             expiry, description
//         } = req.body;

//         console.log(`[Astra] Provisionando host: ${name}`);

//         const groupsArray = Array.isArray(groups)
//             ? groups
//             : (groups ? groups.split(',').map(g => g.trim()) : []);

//         // Gera par de chaves para a CA (usada como chave mestra do host por agora)
//         const caKeys = cryptoService.generateKeyPair();

//         // Gera certificado do host assinado com a chave privada da CA
//         const certificate = await cryptoService.createHostCertificate(
//             { name, ip, groups: groupsArray },
//             caKeys.privateKey
//         );

//         // Busca lighthouses existentes para construir o config
//         const lighthouses = await Host.find({ isLighthouse: true });
//         const lighthouseList = lighthouses.map(lh => ({
//             nebulaIp: lh.ip,
//             publicIp: lh.publicIp
//         }));

//         // Gera config YAML usando o configGenerator real
//         const configContent = configGenerator.generate(
//             {
//                 role: isLighthouse ? 'lighthouse' : 'host',
//                 nebulaIp: ip,
//                 publicIp,
//                 port,
//                 groups: groupsArray
//             },
//             lighthouseList
//         );

//         // Salva no MongoDB
//         const newHost = new Host({
//             name, ip, mask,
//             groups: groupsArray,
//             isLighthouse: !!isLighthouse,
//             publicIp, port, expiry, description,
//             configContent,
//             // Guarda as chaves geradas (adiciona estes campos ao schema se necessário)
//             publicKey: certificate.hostKeys.publicKey,
//             issuedAt: certificate.issuedAt,
//             expiresAt: certificate.expiresAt
//         });

//         await newHost.save();

//         res.status(201).json({
//             success: true,
//             message: 'Host provisionado e salvo!',
//             host: newHost
//         });

//     } catch (error) {
//         console.error('[Astra] Erro ao criar host:', error);
//         res.status(500).json({ success: false, error: error.message });
//     }
// };

// const getAllHosts = async (req, res) => {
//     try {
//         const hosts = await Host.find().sort({ createdAt: -1 });
//         res.json(hosts);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// const getHostById = async (req, res) => {
//     try {
//         const host = await Host.findById(req.params.id);
//         if (!host) return res.status(404).json({ error: 'Host não encontrado' });
//         res.json(host);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// const deleteHost = async (req, res) => {
//     try {
//         const host = await Host.findByIdAndDelete(req.params.id);
//         if (!host) return res.status(404).json({ error: 'Host não encontrado' });
//         res.json({ success: true, message: 'Host removido.' });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// module.exports = { createHost, getAllHosts, getHostById, deleteHost };