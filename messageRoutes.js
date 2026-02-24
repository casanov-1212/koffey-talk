// ===== routes/messageRoutes.js (corrigé) =====
const express = require('express');
const {
  sendMessage,
  getMessages,
  getContacts,
  searchUsers
} = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');
const { messageValidation } = require('../middleware/validation');

const router = express.Router(); // LIGNE MANQUANTE AJOUTÉE

// Toutes les routes sont protégées
router.use(authenticateToken);

router.post('/send', messageValidation, sendMessage);
router.get('/conversation/:contact', getMessages);
router.get('/contacts', getContacts);
router.get('/search', searchUsers);

module.exports = router;