const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
 try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    });

    logger.info(`MongoDB connecté: ${conn.connection.host}`);

    // Gestion des événements de connexion
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB déconnecté');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnecté');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Erreur MongoDB:', err);
    });

  } catch (error) {
    logger.error('Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};

module.exports = connectDB;