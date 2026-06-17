const fs   = require('fs');
const path = require('path');

const Host          = require('../models/Host');
const NetworkConfig = require('../models/NetworkConfig');
const cryptoService = require('../services/cryptoService');
const configService = require('../services/configService');

// ─── Helpers ────────────────────────────────────────────────────────────────

const ok   = (res, data, status = 200) => res.status(status).json({ success: true,  ...data });
const fail = (res, error, status = 500) => res.status(status).json({ success: false, error });

// Usa sempre os caminhos das settings (nunca hardcoded)
const getCA = () => {
    const { caCrt } = cryptoService.getPaths();
    const caDir     = cryptoService.getCADir();
    return { caCrt, caKey: path.join(caDir, 'ca.key'), caDir };
};


// ─── Hosts ──────────────────────────────────────────────────────────────────

exports.getAllHosts = async (req, res) => {
    try {
        const hosts = await Host.find().sort({ createdAt: -1 });
        ok(res, { data: hosts });
    } catch (e) {
        fail(res, e.message);
    }
};

exports.getHostById = async (req, res) => {
    try {
        const host = await Host.findById(req.params.id);
        if (!host) return fail(res, 'Host não encontrado', 404);
        ok(res, { data: host });
    } catch (e) {
        fail(res, e.message);
    }
};

exports.createHost = async (req, res) => {
    try {
        const {
            name, ip, mask, groups, isLighthouse,
            publicIp, publicDomain, port = '4242', expiry, description
        } = req.body;

        const credentials = await cryptoService.generateAndSignHost(name, ip);

        const groupsArray = Array.isArray(groups)
            ? groups
            : (groups ? groups.split(',').map(g => g.trim()) : []);

        const host = await Host.create({
            name, ip, mask, groups: groupsArray,
            isLighthouse: !!isLighthouse,
            publicIp, publicDomain, port, expiry, description,
            publicKey:   credentials.publicKey,
            privateKey:  credentials.privateKey,
            certificate: credentials.certificate,
        });

        ok(res, { data: host }, 201);
    } catch (e) {
        fail(res, e.message);
    }
};

exports.updateHost = async (req, res) => {
    try {
        const oldHost = await Host.findById(req.params.id);
        if (!oldHost) return fail(res, 'Host não encontrado', 404);

        const nameChanged = req.body.name && req.body.name !== oldHost.name;
        const ipChanged   = req.body.ip   && req.body.ip   !== oldHost.ip;

        if (nameChanged || ipChanged) {
            const credentials = await cryptoService.generateAndSignHost(
                req.body.name ?? oldHost.name,
                req.body.ip   ?? oldHost.ip
            );
            req.body.publicKey   = credentials.publicKey;
            req.body.privateKey  = credentials.privateKey;
            req.body.certificate = credentials.certificate;
        }

        const updated = await Host.findByIdAndUpdate(req.params.id, req.body, { new: true });
        ok(res, { data: updated });
    } catch (e) {
        fail(res, e.message);
    }
};

exports.deleteHost = async (req, res) => {
    try {
        const host = await Host.findByIdAndDelete(req.params.id);
        if (!host) return fail(res, 'Host não encontrado', 404);
        ok(res, { message: 'Host removido com sucesso' });
    } catch (e) {
        fail(res, e.message);
    }
};

exports.downloadConfigFile = async (req, res) => {
    try {
        const host = await Host.findById(req.params.id);
        if (!host) return res.status(404).json({ success: false, message: 'Host não encontrado' });

        const { caCrt } = getCA();
        if (!fs.existsSync(caCrt)) {
            return res.status(400).json({ success: false, message: 'CA não encontrada. Inicializa a CA nas Configurações primeiro.' });
        }

        const allHosts = await Host.find();
        const caCert   = fs.readFileSync(caCrt, 'utf-8');

        const yaml = configService.generateConfigYaml(
            host, allHosts, caCert, host.certificate, host.privateKey
        );

        res.setHeader('Content-Type', 'application/x-yaml');
        return res.send(yaml);
    } catch (err) {
        console.error('downloadConfigFile error:', err);
        return res.status(500).json({ success: false, message: 'Erro ao gerar config' });
    }
};


// ─── Rede ───────────────────────────────────────────────────────────────────

exports.getNextAvailableIp = async (req, res) => {
    try {
        const config = await NetworkConfig.findOne();
        const baseIp = config?.baseIp ?? '10.0.0';
        const mask   = config?.mask   ?? '24';

        const lastHost = await Host.findOne().sort({ createdAt: -1 });

        let nextOctet = 1;
        if (lastHost?.ip) {
            const parts = lastHost.ip.split('.');
            if (parts.length === 4 && `${parts[0]}.${parts[1]}.${parts[2]}` === baseIp) {
                nextOctet = parseInt(parts[3]) + 1;
                if (nextOctet > 254) nextOctet = 1;
            }
        }

        ok(res, { suggestedIp: `${baseIp}.${nextOctet}`, mask });
    } catch (e) {
        fail(res, e.message);
    }
};

exports.getNetworkConfig = async (req, res) => {
    try {
        const config = await NetworkConfig.findOne();
        ok(res, {
            baseIp: config?.baseIp ?? '10.0.0',
            mask:   config?.mask   ?? '24',
            ...(!config && { message: 'Usando valores padrão' }),
        });
    } catch (e) {
        fail(res, e.message);
    }
};

exports.saveNetworkConfig = async (req, res) => {
    const { baseIp, mask } = req.body ?? {};
    if (!baseIp || !mask) return fail(res, 'baseIp e mask são obrigatórios.', 400);

    try {
        const config = await NetworkConfig.findOneAndUpdate(
            {},
            { baseIp, mask },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
        ok(res, { data: config });
    } catch (e) {
        fail(res, e.message);
    }
};


// ─── CA ─────────────────────────────────────────────────────────────────────

exports.getCAStatus = (_req, res) => {
    const { caCrt, caKey, caDir } = getCA();
    const initialized = fs.existsSync(caCrt) && fs.existsSync(caKey);
    res.json({ initialized, ...(initialized && { caDir }) });
};

exports.initializeCA = async (req, res) => {
    try {
        const { networkName, duration } = req.body;
        if (!networkName) return fail(res, 'Nome da rede é obrigatório.', 400);

        const result = await cryptoService.initializeCA(networkName, duration);
        ok(res, result);
    } catch (e) {
        fail(res, e.message);
    }
};

exports.initializeNetwork = async (req, res) => {
    try {
        const { networkName, baseIp, mask } = req.body;

        if (!networkName) return fail(res, 'Nome da rede é obrigatório.', 400);
        if (!baseIp || !mask) return fail(res, 'baseIp e mask são obrigatórios.', 400);

        await NetworkConfig.findOneAndUpdate(
            {},
            { networkName, baseIp, mask },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );

        await cryptoService.initializeCA(networkName);

        ok(res, { message: `Rede "${networkName}" inicializada com sucesso.` });
    } catch (e) {
        fail(res, e.message);
    }
};



// const fs   = require('fs');
// const path = require('path');
 
// const Host          = require('../models/Host');
// const NetworkConfig = require('../models/NetworkConfig');
// const cryptoService = require('../services/cryptoService');
// const configService = require('../services/configService');
 
// const CA_DIR  = path.join(__dirname, '../../ca');
// const CA_CRT  = path.join(CA_DIR, 'ca.crt');
// const CA_KEY  = path.join(CA_DIR, 'ca.key');
 
// // ─── Helpers ────────────────────────────────────────────────────────────────
 
// const ok   = (res, data, status = 200) => res.status(status).json({ success: true,  ...data });
// const fail = (res, error, status = 500) => res.status(status).json({ success: false, error });
 
 
// // ─── Hosts ──────────────────────────────────────────────────────────────────
 
// exports.getAllHosts = async (req, res) => {
//     try {
//         const hosts = await Host.find().sort({ createdAt: -1 });
//         ok(res, { data: hosts });
//     } catch (e) {
//         fail(res, e.message);
//     }
// };
 
// exports.getHostById = async (req, res) => {
//     try {
//         const host = await Host.findById(req.params.id);
//         if (!host) return fail(res, 'Host não encontrado', 404);
//         ok(res, { data: host });
//     } catch (e) {
//         fail(res, e.message);
//     }
// };
 
// exports.createHost = async (req, res) => {
//     try {
//         const {
//             name,
//             ip,
//             mask,
//             groups,
//             isLighthouse,
//             publicIp,
//             publicDomain,
//             port = '4242',
//             expiry,
//             description
//         } = req.body;

//         const credentials = await cryptoService.generateAndSignHost(name, ip);

//         const groupsArray = Array.isArray(groups)
//             ? groups
//             : (groups ? groups.split(',').map(g => g.trim()) : []);

//         const host = await Host.create({
//             name,
//             ip,
//             mask,
//             groups: groupsArray,
//             isLighthouse: !!isLighthouse,
//             publicIp,
//             publicDomain,
//             port,
//             expiry,
//             description,
//             publicKey: credentials.publicKey,
//             privateKey: credentials.privateKey,
//             certificate: credentials.certificate,
//         });

//         ok(res, { data: host }, 201);
//     } catch (e) {
//         fail(res, e.message);
//     }
// };
 
// exports.updateHost = async (req, res) => {
//     try {
//         const oldHost = await Host.findById(req.params.id);
//         if (!oldHost) return fail(res, 'Host não encontrado', 404);
 
//         const nameChanged = req.body.name && req.body.name !== oldHost.name;
//         const ipChanged   = req.body.ip   && req.body.ip   !== oldHost.ip;
 
//         if (nameChanged || ipChanged) {
//             const credentials = await cryptoService.generateAndSignHost(
//                 req.body.name ?? oldHost.name,
//                 req.body.ip   ?? oldHost.ip
//             );
//             req.body.publicKey   = credentials.publicKey;
//             req.body.privateKey  = credentials.privateKey;
//             req.body.certificate = credentials.certificate;
//         }
 
//         const updated = await Host.findByIdAndUpdate(req.params.id, req.body, { new: true });
//         ok(res, { data: updated });
//     } catch (e) {
//         fail(res, e.message);
//     }
// };
 
// exports.deleteHost = async (req, res) => {
//     try {
//         const host = await Host.findByIdAndDelete(req.params.id);
//         if (!host) return fail(res, 'Host não encontrado', 404);
//         ok(res, { message: 'Host removido com sucesso' });
//     } catch (e) {
//         fail(res, e.message);
//     }
// };
 
// exports.downloadConfigFile = async (req, res) => {
//     try {
//         const host = await Host.findById(req.params.id);
//         if (!host) return res.status(404).json({ success: false, message: 'Host não encontrado' });

//         const allHosts = await Host.find();
//         const caCert = fs.readFileSync(CA_CRT, 'utf-8');

//         const yaml = configService.generateConfigYaml(
//             host,
//             allHosts,
//             caCert,
//             host.certificate,
//             host.privateKey
//         );

//         res.setHeader('Content-Type', 'application/x-yaml');
//         return res.send(yaml);
//     } catch (err) {
//         console.error('downloadConfigFile error:', err);
//         return res.status(500).json({ success: false, message: 'Erro ao gerar config' });
//     }
// };
 
// exports.generateConfigYaml = (host, allHosts, caCert, hostPublicKey, hostPrivateKey) => {
//     const config = {
//         role: 'host',
//         nebulaIp: host.ip,
//         publicIp: host.publicIp,
//         port: host.port,
//         groups: host.groups,
//         expiry: host.expiry,
//         description: host.description,
//         configContent: host.configContent,
//         publicKey: hostPublicKey,
//         privateKey: hostPrivateKey,
//         caCert,
//     };
//     return config;
// };
 
 
// // ─── Rede ───────────────────────────────────────────────────────────────────
 
// exports.getNextAvailableIp = async (req, res) => {
//     try {
//         const config   = await NetworkConfig.findOne();
//         const baseIp   = config?.baseIp ?? '10.0.0';
//         const mask     = config?.mask   ?? '24';
 
//         const lastHost = await Host.findOne().sort({ createdAt: -1 });
 
//         let nextOctet = 1;
//         if (lastHost?.ip) {
//             const parts = lastHost.ip.split('.');
//             if (parts.length === 4 && `${parts[0]}.${parts[1]}.${parts[2]}` === baseIp) {
//                 nextOctet = parseInt(parts[3]) + 1;
//                 if (nextOctet > 254) nextOctet = 1;
//             }
//         }
 
//         ok(res, { suggestedIp: `${baseIp}.${nextOctet}`, mask });
//     } catch (e) {
//         fail(res, e.message);
//     }
// };
 
// exports.getNetworkConfig = async (req, res) => {
//     try {
//         const config = await NetworkConfig.findOne();
 
//         ok(res, {
//             baseIp: config?.baseIp ?? '10.0.0',
//             mask:   config?.mask   ?? '24',
//             ...(!config && { message: 'Usando valores padrão' }),
//         });
//     } catch (e) {
//         fail(res, e.message);
//     }
// };
 
// exports.saveNetworkConfig = async (req, res) => {
//     const { baseIp, mask } = req.body ?? {};
 
//     if (!baseIp || !mask) {
//         return fail(res, 'baseIp e mask são obrigatórios.', 400);
//     }
 
//     try {
//         const config = await NetworkConfig.findOneAndUpdate(
//             {},
//             { baseIp, mask },
//             { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
//         );
//         ok(res, { data: config });
//     } catch (e) {
//         fail(res, e.message);
//     }
// };
 
 
// // ─── CA (Autoridade Certificadora) ──────────────────────────────────────────
 
// exports.getCAStatus = (_req, res) => {
//     const initialized = fs.existsSync(CA_CRT) && fs.existsSync(CA_KEY);
//     res.json({ initialized, ...(initialized && { caDir: CA_DIR }) });
// };
 
// exports.initializeCA = async (req, res) => {
//     try {
//         const { networkName } = req.body;
//         if (!networkName) return fail(res, 'Nome da rede é obrigatório.', 400);
 
//         const result = await cryptoService.initializeCA(networkName);
//         ok(res, result);
//     } catch (e) {
//         fail(res, e.message);
//     }
// };
 
// // Chamado no primeiro arranque do site — configura a rede E cria a CA de raiz
// exports.initializeNetwork = async (req, res) => {
//     try {
//         const { networkName, baseIp, mask } = req.body;
 
//         if (!networkName) return fail(res, 'Nome da rede é obrigatório.', 400);
//         if (!baseIp || !mask) return fail(res, 'baseIp e mask são obrigatórios.', 400);
 
//         // 1. Guarda a configuração de rede na BD
//         await NetworkConfig.findOneAndUpdate(
//             {},
//             { networkName, baseIp, mask },
//             { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
//         );
 
//         // 2. Cria a CA criptográfica
//         await cryptoService.initializeCA(networkName);
 
//         ok(res, { message: `Rede "${networkName}" inicializada com sucesso.` });
//     } catch (e) {
//         fail(res, e.message);
//     }
// };