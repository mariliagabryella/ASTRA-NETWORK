const { exec } = require('child_process');
const fs   = require('fs');
const path = require('path');

// ─── Settings (persiste em data/settings.json) ───────────────────────────────
const SETTINGS_FILE = path.join(__dirname, '../../data/settings.json');

const loadSettings = () => {
    try {
        if (fs.existsSync(SETTINGS_FILE))
            return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    } catch (_) {}
    return {};
};

const saveSettings = (data) => {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ ...loadSettings(), ...data }, null, 2));
};

// Caminhos por defeito
const DEFAULT_BIN = path.join(__dirname, '../../bin/nebula-cert');
const DEFAULT_CA  = path.join(__dirname, '../../ca');

class CryptoService {

    // ── Caminhos configurados nas Settings ───────────────────────────────────
    getPaths() {
        const s = loadSettings();
        return {
            nebulaCert: s.nebulaCert || DEFAULT_BIN,
            caCrt:      s.caCrt      || path.join(DEFAULT_CA, 'ca.crt'),
        };
    }

    savePaths({ nebulaCert, caCrt }) {
        saveSettings({ nebulaCert, caCrt });
    }

    // Devolve o dir da CA a partir do .crt configurado (ou o dir por defeito)
    getCADir() {
        const s = loadSettings();
        return s.caCrt ? path.dirname(s.caCrt) : DEFAULT_CA;
    }

    // ── 1. Inicializa a CA ────────────────────────────────────────────────────
    async initializeCA(networkName, durationHours = 87600) {
        const binPath = this.getPaths().nebulaCert;
        const caDir   = this.getCADir();

        if (!fs.existsSync(caDir)) fs.mkdirSync(caDir, { recursive: true });

        const caKey = path.join(caDir, 'ca.key');
        const caCrt = path.join(caDir, 'ca.crt');

        return new Promise((resolve, reject) => {
            const command = `"${binPath}" ca -name "${networkName}" -duration "${durationHours}h0m0s" -out-key "${caKey}" -out-crt "${caCrt}"`;
            exec(command, { timeout: 15000 }, (error) => {
                if (error) return reject(new Error(`Erro ao criar CA: ${error.message}`));
                saveSettings({ caCrt }); // atualiza caminho automaticamente
                resolve({ message: 'CA criada com sucesso', crtPath: caCrt });
            });
        });
    }

    // ── 2. Gera E Assina o Host ───────────────────────────────────────────────
    async generateAndSignHost(hostName, hostIp) {
        const binPath = this.getPaths().nebulaCert;
        const caDir   = this.getCADir();
        const tempDir = path.join(__dirname, '../../temp-keys');

        const caKey = path.join(caDir, 'ca.key');
        const caCrt = path.join(caDir, 'ca.crt');

        // Verificar se a CA existe antes de tentar assinar
        if (!fs.existsSync(caKey) || !fs.existsSync(caCrt)) {
            throw new Error('A Autoridade Certificadora (CA) não foi inicializada. Vá às configurações primeiro.');
        }

        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const keyBaseName = path.join(tempDir, `${hostName}_${Date.now()}`);

        return new Promise((resolve, reject) => {
            // PASSO A: Gerar Keygen (Chaves Privada e Pública)
            const keygenCmd = `"${binPath}" keygen -out-key "${keyBaseName}.key" -out-pub "${keyBaseName}.pub"`;

            exec(keygenCmd, (error) => {
                if (error) return reject(new Error(`Falha no keygen: ${error.message}`));

                // PASSO B: Sign — -in-pub é OBRIGATÓRIO para não gerar .key na raiz!
                const signCmd = `"${binPath}" sign -name "${hostName}" -ip "${hostIp}/24" -in-pub "${keyBaseName}.pub" -ca-crt "${caCrt}" -ca-key "${caKey}" -out-crt "${keyBaseName}.crt"`;

                exec(signCmd, (signError) => {
                    if (signError) return reject(new Error(`Falha ao assinar certificado: ${signError.message}`));

                    try {
                        const publicKey   = fs.readFileSync(`${keyBaseName}.pub`, 'utf8');
                        const privateKey  = fs.readFileSync(`${keyBaseName}.key`, 'utf8');
                        const certificate = fs.readFileSync(`${keyBaseName}.crt`, 'utf8');

                        // Limpeza imediata
                        fs.unlinkSync(`${keyBaseName}.pub`);
                        fs.unlinkSync(`${keyBaseName}.key`);
                        fs.unlinkSync(`${keyBaseName}.crt`);

                        resolve({ publicKey, privateKey, certificate });
                    } catch (readError) {
                        reject(new Error(`Erro ao processar ficheiros finais: ${readError.message}`));
                    }
                });
            });
        });
    }
}

module.exports = new CryptoService();




// const { exec } = require('child_process');
// const fs = require('fs');
// const path = require('path');
 
// class CryptoService {
//     // 1. Inicializa a CA (Usado nas Configurações)
//     async initializeCA(networkName) {
//         const binPath = path.join(__dirname, '../../bin/nebula-cert');
//         const caDir = path.join(__dirname, '../../ca');
 
//         if (!fs.existsSync(caDir)) {
//             fs.mkdirSync(caDir, { recursive: true });
//         }
 
//         const caKey = path.join(caDir, 'ca.key');
//         const caCrt = path.join(caDir, 'ca.crt');
 
//         return new Promise((resolve, reject) => {
//             // A flag correta para o certificado da CA é -out-crt
//             const command = `"${binPath}" ca -name "${networkName}" -out-key "${caKey}" -out-crt "${caCrt}"`;
//             exec(command, { timeout: 10000 }, (error) => {
//                 if (error) return reject(new Error(`Erro ao criar CA: ${error.message}`));
//                 resolve({ message: "CA criada com sucesso" });
//             });
//         });
//     }
 
//     // 2. Gera E Assina o Host (Usado no HostController: Create e Update)
//     async generateAndSignHost(hostName, hostIp) {
//         const binPath = path.join(__dirname, '../../bin/nebula-cert');
//         const caDir = path.join(__dirname, '../../ca');
//         const tempDir = path.join(__dirname, '../../temp-keys');
 
//         // Caminhos da CA
//         const caKey = path.join(caDir, 'ca.key');
//         const caCrt = path.join(caDir, 'ca.crt');
 
//         // Verificar se a CA existe antes de tentar assinar
//         if (!fs.existsSync(caKey) || !fs.existsSync(caCrt)) {
//             throw new Error("A Autoridade Certificadora (CA) não foi inicializada. Vá às configurações primeiro.");
//         }
 
//         if (!fs.existsSync(tempDir)) {
//             fs.mkdirSync(tempDir, { recursive: true });
//         }
 
//         const keyBaseName = path.join(tempDir, `${hostName}_${Date.now()}`);
 
//         return new Promise((resolve, reject) => {
//             // PASSO A: Gerar Keygen (Chaves Privada e Pública)
//             const keygenCmd = `"${binPath}" keygen -out-key "${keyBaseName}.key" -out-pub "${keyBaseName}.pub"`;
 
//             exec(keygenCmd, (error) => {
//                 if (error) return reject(new Error(`Falha no keygen: ${error.message}`));
 
//                 // PASSO B: Sign (Assinar a chave pública com a CA para criar o .crt)
//                 // -in-pub é OBRIGATÓRIO: sem ele, o nebula-cert gera um novo .key na raiz do projeto!
//                 const signCmd = `"${binPath}" sign -name "${hostName}" -ip "${hostIp}/24" -in-pub "${keyBaseName}.pub" -ca-crt "${caCrt}" -ca-key "${caKey}" -out-crt "${keyBaseName}.crt"`;
 
//                 exec(signCmd, (signError) => {
//                     if (signError) return reject(new Error(`Falha ao assinar certificado: ${signError.message}`));
 
//                     try {
//                         // Ler os 3 conteúdos para guardar na DB
//                         const publicKey = fs.readFileSync(`${keyBaseName}.pub`, 'utf8');
//                         const privateKey = fs.readFileSync(`${keyBaseName}.key`, 'utf8');
//                         const certificate = fs.readFileSync(`${keyBaseName}.crt`, 'utf8');
 
//                         // Limpeza imediata
//                         fs.unlinkSync(`${keyBaseName}.pub`);
//                         fs.unlinkSync(`${keyBaseName}.key`);
//                         fs.unlinkSync(`${keyBaseName}.crt`);
 
//                         resolve({ publicKey, privateKey, certificate });
//                     } catch (readError) {
//                         reject(new Error(`Erro ao processar ficheiros finais: ${readError.message}`));
//                     }
//                 });
//             });
//         });
//     }
// }
 
// module.exports = new CryptoService();

