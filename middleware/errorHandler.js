// ===== middleware/errorHandler.js =====
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Erreur:', err);

  let error = { ...err };
  error.message = err.message;

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      error: message
    });
  }

  // Erreur de duplication MongoDB
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} déjà utilisé`;
    return res.status(400).json({
      success: false,
      message,
      error: message
    });
  }

  // Erreur ObjectId invalide
  if (err.name === 'CastError') {
    const message = 'Ressource non trouvée';
    return res.status(404).json({
      success: false,
      message,
      error: message
    });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Erreur serveur',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

module.exports = errorHandler;
