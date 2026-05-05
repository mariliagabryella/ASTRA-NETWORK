const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI =process.env.MONGODB_URI;

        if (!mongoURI) {
            throw new Error("A variável MONGODB_URI não está definida no ficheiro .env");
        }

        // 2. Conecta apenas UMA vez usando a string
        const conn = await mongoose.connect(mongoURI);
        
      
        console.log(`[Astra DB] MongoDB Conectado com sucesso!${conn.connection.host}`);
    } catch (error) {
        console.error(`[Astra DB] Erro de conexão: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;