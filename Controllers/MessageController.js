// ===== controllers/messageController.js CORRIGÉ =====
const Message = require('../models/Message');
const User = require('../models/User');

// Envoyer un message
const sendMessage = async (req, res) => {
  try {
    const { recipient, content, messageType = 'text' } = req.body;
    const sender = req.user.username;

    // Vérifier si le destinataire existe
    const recipientUser = await User.findOne({ username: recipient });
    if (!recipientUser) {
      return res.status(404).json({
        success: false,
        message: 'Destinataire non trouvé'
      });
    }

    // Créer le message
    const message = await Message.create({
      sender,
      recipient,
      content,
      messageType
    });

    res.status(201).json({
      success: true,
      message: 'Message envoyé',
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du message',
      error: error.message
    });
  }
};

// Obtenir les messages entre deux utilisateurs
const getMessages = async (req, res) => {
  try {
    const { contact } = req.params;
    const currentUser = req.user.username;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Récupérer les messages
    const messages = await Message.find({
      $or: [
        { sender: currentUser, recipient: contact },
        { sender: contact, recipient: currentUser }
      ]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Marquer les messages reçus comme lus
    await Message.updateMany(
      { sender: contact, recipient: currentUser, read: false },
      { read: true }
    );

    res.json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total: messages.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des messages',
      error: error.message
    });
  }
};

// Obtenir la liste des contacts avec le dernier message - VERSION CORRIGÉE
const getContacts = async (req, res) => {
  try {
    const currentUser = req.user.username;
    console.log('getContacts appelé pour:', currentUser);

    // Récupérer tous les utilisateurs qui ont échangé des messages avec l'utilisateur actuel
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: currentUser },
            { recipient: currentUser }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$sender', currentUser] },
              then: '$recipient',
              else: '$sender'
            }
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipient', currentUser] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Si aucune conversation, retourner tous les utilisateurs comme contacts potentiels
    if (messages.length === 0) {
      console.log('Aucune conversation trouvée, retour de tous les utilisateurs');
      const users = await User.find({ 
        username: { $ne: currentUser },
        status: 'approved',
        role: { $ne: 'admin' }
      }).select('-password').limit(50);

      const contacts = users.map(user => ({
        user: {
          username: user.username,
          email: user.email,
          isOnline: user.isOnline || false,
          lastSeen: user.lastSeen || new Date(),
          avatar: user.avatar
        },
        lastMessage: null,
        unreadCount: 0
      }));

      console.log('Utilisateurs trouvés:', contacts.length);
      return res.json({
        success: true,
        contacts
      });
    }

    // Enrichir avec les informations utilisateur
    const contacts = await Promise.all(
      messages.map(async (msg) => {
        try {
          const user = await User.findOne({ username: msg._id }).select('-password');
          if (!user) {
            console.log('Utilisateur non trouvé:', msg._id);
            return null;
          }
          return {
            user: {
              username: user.username,
              email: user.email,
              isOnline: user.isOnline || false,
              lastSeen: user.lastSeen || new Date(),
              avatar: user.avatar
            },
            lastMessage: msg.lastMessage,
            unreadCount: msg.unreadCount
          };
        } catch (error) {
          console.error('Erreur lors de la récupération de l\'utilisateur:', msg._id, error);
          return null;
        }
      })
    );

    // Filtrer les contacts null
    const validContacts = contacts.filter(contact => contact !== null);
    console.log('Contacts avec conversations trouvés:', validContacts.length);

    res.json({
      success: true,
      contacts: validContacts
    });
  } catch (error) {
    console.error('Erreur getContacts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des contacts',
      error: error.message
    });
  }
};

// Rechercher des utilisateurs
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUser = req.user.username;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Terme de recherche requis'
      });
    }

    const users = await User.find({
      username: { $ne: currentUser },
      status: 'approved',
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('-password').limit(20);

    res.json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche',
      error: error.message
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getContacts,
  searchUsers
};