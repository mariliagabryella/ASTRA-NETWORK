const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class CryptoService {
    async generateNebulaKeys(hostName) {
        const binPath = path.join(__dirname, '../../bin/nebula-cert');
        const tempDir = path.join(__dirname, '../../temp-keys');

        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const keyBaseName = path.join(tempDir, `${hostName}_${Date.now()}`);

        return new Promise((resolve, reject) => {
            // Comando para o nebula-cert
       const command = `"${binPath}" keygen -out-key "${keyBaseName}.key" -out-pub "${keyBaseName}.pub"`;
            exec(command, (error) => {
                if (error) {
                    return reject(new Error(`Falha ao gerar chaves: ${error.message}`));
                }

                try {
                    // Lê o conteúdo dos arquivos
                    const publicKey = fs.readFileSync(`${keyBaseName}.pub`, 'utf8');
                    const privateKey = fs.readFileSync(`${keyBaseName}.key`, 'utf8');

                    // Apaga os arquivos temporários imediatamente
                    fs.unlinkSync(`${keyBaseName}.pub`);
                    fs.unlinkSync(`${keyBaseName}.key`);

                    resolve({ publicKey, privateKey });
                } catch (readError) {
                    reject(new Error(`Erro ao ler/limpar chaves: ${readError.message}`));
                }
            });
        });
    }
}

module.exports = new CryptoService();