const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Se process.env.MONGODB_URI for undefined, ele usa a string local
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/astra_db';
        
        await mongoose.connect(uri);
        console.log(`[Astra DB] MongoDB Conectado com sucesso!`);
    } catch (error) {
        console.error(`[Astra DB] Erro de conexão: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;