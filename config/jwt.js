// ===== config/jwt.js =====
module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'votre-secret-jwt-super-securise',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d'
};