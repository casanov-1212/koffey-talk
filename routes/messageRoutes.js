const express = require('express');
const {
  sendMessage,
  getMessages,
  getContacts,
  searchUsers
} = require('../Controllers/MessageController');
const { authenticateToken } = require('../middleware/auth');
const Message = require('../models/Message'); // Assurez-vous d'importer le modèle Message

const router = express.Router();

router.use(authenticateToken);

router.post('/send', sendMessage);
router.get('/conversation/:contact', getMessages);
router.get('/contacts', getContacts);
router.get('/search', searchUsers);

// NOUVELLES ROUTES POUR LES MESSAGES ADMIN
// Route pour récupérer les messages admin non lus pour l'utilisateur connecté
router.get('/admin-messages/unread', async (req, res) => {
  try {
    const username = req.user.username;
    console.log(`GET /api/messages/admin-messages/unread pour: ${username}`);

    // Récupérer tous les messages admin non lus pour cet utilisateur
    const unreadAdminMessages = await Message.find({
      sender: 'ADMIN',
      recipient: username,
      read: false
    }).sort({ createdAt: 1 }); // Trier par date croissante (plus anciens en premier)

    console.log(`Messages admin non lus trouvés pour ${username}:`, unreadAdminMessages.length);

    // Formatter les messages pour le frontend
    const formattedMessages = unreadAdminMessages.map(msg => ({
      id: msg._id,
      sender: 'ADMIN',
      content: msg.content,
      timestamp: msg.createdAt,
      messageType: msg.messageType || 'text',
      isAdmin: true,
      read: false
    }));

    res.json({
      success: true,
      messages: formattedMessages
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des messages admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des messages admin'
    });
  }
});

// Route pour marquer les messages admin comme lus (côté utilisateur)
router.post('/admin-messages/mark-read', async (req, res) => {
  try {
    const username = req.user.username;
    console.log(`POST /api/messages/admin-messages/mark-read pour: ${username}`);

    // Marquer tous les messages admin non lus comme lus
    const result = await Message.updateMany(
      {
        sender: 'ADMIN',
        recipient: username,
        read: false
      },
      { 
        read: true,
        readAt: new Date()
      }
    );

    console.log(`${result.modifiedCount} messages admin marqués comme lus pour ${username}`);

    res.json({
      success: true,
      message: `${result.modifiedCount} messages marqués comme lus`
    });

  } catch (error) {
    console.error('Erreur lors du marquage des messages admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage des messages'
    });
  }
});

module.exports = router;