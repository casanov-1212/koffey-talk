// routes/adminRoutes.js CORRIGÉ
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Middleware d'authentification admin
const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Token requis' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre-secret-jwt-changez-moi-en-production');
    
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'admin' || user.status !== 'approved') {
      return res.status(403).json({ success: false, message: 'Accès administrateur requis' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token invalide' });
  }
};

// Route de test
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Routes admin accessibles!',
    timestamp: new Date().toISOString()
  });
});

// Récupérer toutes les demandes en attente
router.get('/pending-users', adminAuth, async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users: pendingUsers
    });
  } catch (error) {
    console.error('Erreur récupération demandes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des demandes'
    });
  }
});

// Récupérer tous les utilisateurs avec leur statut
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    
    const filter = status ? { status } : {};
    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .select('-password')
      .populate('approvedBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
});

// Approuver un utilisateur
router.post('/approve-user/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur n\'est pas en attente d\'approbation'
      });
    }

    await User.findByIdAndUpdate(userId, {
      status: 'approved',
      approvedBy: req.user._id,
      approvedAt: new Date(),
      rejectionReason: null
    });

    res.json({
      success: true,
      message: `Utilisateur ${user.username} approuvé avec succès`
    });
  } catch (error) {
    console.error('Erreur approbation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'approbation'
    });
  }
});

// Rejeter un utilisateur
router.post('/reject-user/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    await User.findByIdAndUpdate(userId, {
      status: 'rejected',
      rejectionReason: reason || 'Aucune raison spécifiée',
      approvedBy: null,
      approvedAt: null
    });

    res.json({
      success: true,
      message: `Utilisateur ${user.username} rejeté`
    });
  } catch (error) {
    console.error('Erreur rejet:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du rejet'
    });
  }
});

// Suspendre un utilisateur
router.post('/suspend-user/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de suspendre un administrateur'
      });
    }

    await User.findByIdAndUpdate(userId, {
      status: 'suspended',
      rejectionReason: reason || 'Compte suspendu par un administrateur'
    });

    res.json({
      success: true,
      message: `Utilisateur ${user.username} suspendu`
    });
  } catch (error) {
    console.error('Erreur suspension:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suspension'
    });
  }
});

// Réactiver un utilisateur
router.post('/reactivate-user/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    await User.findByIdAndUpdate(userId, {
      status: 'approved',
      rejectionReason: null,
      approvedBy: req.user._id,
      approvedAt: new Date()
    });

    res.json({
      success: true,
      message: `Utilisateur ${user.username} réactivé`
    });
  } catch (error) {
    console.error('Erreur réactivation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réactivation'
    });
  }
});

// Supprimer un utilisateur
router.delete('/delete-user/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer son propre compte'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Supprimer aussi tous les messages de cet utilisateur
    const Message = require('../models/Message');
    await Message.deleteMany({
      $or: [
        { sender: user.username },
        { recipient: user.username }
      ]
    });

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: `Utilisateur ${user.username} supprimé définitivement`
    });
  } catch (error) {
    console.error('Erreur suppression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
});

// ROUTE BROADCAST MESSAGE - CORRIGÉE
router.post('/broadcast-message', adminAuth, async (req, res) => {
  try {
    const { message } = req.body;
    
    console.log('Broadcast message reçu:', message);
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message requis'
      });
    }

    // Récupérer tous les utilisateurs approuvés (pas seulement role user)
    const users = await User.find({ 
      status: 'approved', 
      role: { $ne: 'admin' } // Tous sauf les admins
    });
    
    console.log(`Diffusion à ${users.length} utilisateurs`);

    const Message = require('../models/Message');
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');

    let messagesSent = 0;
    let messagesDelivered = 0;

    // Créer un message pour chaque utilisateur
    for (const user of users) {
      try {
        // Sauvegarder en base de données
        await Message.create({
          sender: 'ADMIN',
          recipient: user.username,
          content: message,
          messageType: 'text',
          delivered: true,
          read: false
        });
        messagesSent++;

        // Envoyer via Socket.IO si connecté
        if (io && connectedUsers) {
          const socketId = connectedUsers.get(user.username);
          if (socketId) {
            io.to(socketId).emit('admin_broadcast', {
              sender: 'ADMIN',
              content: message,
              timestamp: new Date(),
              type: 'broadcast'
            });
            messagesDelivered++;
            console.log(`Message envoyé à ${user.username} (socket: ${socketId})`);
          } else {
            console.log(`${user.username} n'est pas connecté`);
          }
        }
      } catch (error) {
        console.error(`Erreur envoi à ${user.username}:`, error);
      }
    }

    console.log(`Messages sauvegardés: ${messagesSent}, Messages temps réel: ${messagesDelivered}`);

    res.json({
      success: true,
      message: `Message diffusé à ${users.length} utilisateur(s)`,
      details: {
        totalUsers: users.length,
        messagesSaved: messagesSent,
        messagesDelivered: messagesDelivered
      }
    });
  } catch (error) {
    console.error('Erreur diffusion message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la diffusion'
    });
  }
});
// Dans adminRoutes.js - Ajoutez cette route

// Route pour récupérer les messages admin non lus
router.get('/messages/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const Message = require('../models/Message');
    
    // Récupérer tous les messages admin pour cet utilisateur
    const adminMessages = await Message.find({
      sender: 'ADMIN',
      recipient: user.username,
      read: false // Seulement les non lus
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      messages: adminMessages
    });
  } catch (error) {
    console.error('Erreur récupération messages admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des messages'
    });
  }
});

// Route pour marquer les messages admin comme lus
router.post('/mark-messages-read/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const Message = require('../models/Message');
    
    // Marquer tous les messages admin comme lus
    const result = await Message.updateMany(
      {
        sender: 'ADMIN',
        recipient: user.username,
        read: false
      },
      { read: true }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} messages marqués comme lus`
    });
  } catch (error) {
    console.error('Erreur marquage messages lus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage'
    });
  }
});

// Statistiques pour le dashboard admin
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const roleStats = await User.aggregate([
      {
        $match: { status: 'approved' }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const onlineUsers = await User.countDocuments({ isOnline: true, status: 'approved' });

    res.json({
      success: true,
      stats: {
        byStatus: stats,
        byRole: roleStats,
        totalUsers,
        onlineUsers
      }
    });
  } catch (error) {
    console.error('Erreur statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

module.exports = router;