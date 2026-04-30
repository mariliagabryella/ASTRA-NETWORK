const Host = require('../models/Host');
const NetworkConfig = require('../models/NetworkConfig');
const cryptoService = require('../services/cryptoService');


exports.getNextAvailableIp = async (req, res) => {
    try {
        // 1. Tenta buscar a configuração de rede definida no Setup Inicial
        const config = await NetworkConfig.findOne();
        
        // Se não houver config, usa um fallback, mas o ideal é vir da BD
        let baseIp = config ? config.baseIp : "10.0.0"; 
        let mask = config ? config.mask : "24";

        // 2. Busca o host mais recente para ver a sequência
        const lastHost = await Host.findOne().sort({ createdAt: -1 });
        
        let nextNumber = 1;

        if (lastHost && lastHost.ip) {
            const parts = lastHost.ip.split('.');
            if (parts.length === 4) {
                const currentBase = `${parts[0]}.${parts[1]}.${parts[2]}`;
                // Se o último host for da mesma rede, incrementa
                if (currentBase === baseIp) {
                    nextNumber = parseInt(parts[3]) + 1;
                }
            }
        }

        // Limite de rede /24
        if (nextNumber > 254) nextNumber = 1;

        res.status(200).json({ 
            success: true, 
            suggestedIp: `${baseIp}.${nextNumber}`,
            mask: mask // Retorna a máscara que guardaste na BD!
        });
    } catch (error) {
        console.error("Erro no next-ip:", error);
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


exports.getNetworkConfig = async (req, res) => {
    try {
        // Tenta buscar na BD
        const config = await NetworkConfig.findOne();
        
        // Se a BD falhar ou estiver vazia, enviamos um JSON de sucesso na mesma
        // Isto evita o erro 500 no frontend
        if (!config) {
            return res.status(200).json({ 
                success: true, 
                baseIp: "10.0.0", 
                mask: "24",
                message: "Usando valores padrão" 
            });
        }

        return res.status(200).json({ 
            success: true, 
            baseIp: config.baseIp, 
            mask: config.mask 
        });
    } catch (error) {
        // Se isto não aparecer no terminal, a rota está mal definida no server.js
        console.log("ERRO NO CONTROLLER:", error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

exports.saveNetworkConfig = async (req, res) => {
    // 1. Log para debug no terminal
    console.log("[Astra] Pedido POST recebido. Body:", req.body);

    // 2. Proteção contra body vazio (evita o erro 500)
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ 
            success: false, 
            error: "O servidor não recebeu dados. Verifica o Content-Type." 
        });
    }

    try {
        const { baseIp, mask } = req.body;

        // Validação simples
        if (!baseIp || !mask) {
            return res.status(400).json({ success: false, error: "IP e Máscara são obrigatórios." });
        }

        // 3. Gravação na BD (Versão atualizada sem Warnings)
        const config = await NetworkConfig.findOneAndUpdate(
            {}, 
            { baseIp, mask }, 
            { 
                upsert: true, 
                returnDocument: 'after', // Substitui o 'new: true'
                setDefaultsOnInsert: true 
            }
        );

        res.status(200).json({ success: true, data: config });
    } catch (error) {
        console.error("[ERRO BD]:", error);
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