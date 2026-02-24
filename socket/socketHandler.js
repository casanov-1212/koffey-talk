// ===== socket/socketHandler.js =====
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const User = require('../models/User');
const Message = require('../models/Message');

// Stocker les connexions actives
const activeUsers = new Map();

const socketHandler = (io) => {
  // Middleware d'authentification pour les sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Token manquant'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Utilisateur non trouvé'));
      }

      socket.userId = user._id.toString();
      socket.username = user.username;
      next();
    } catch (error) {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`Utilisateur connecté: ${socket.username}`);

    // Ajouter l'utilisateur aux connexions actives
    activeUsers.set(socket.userId, {
      socketId: socket.id,
      username: socket.username,
      isOnline: true
    });

    // Mettre à jour le statut en ligne
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date()
    });

    // Rejoindre une room personnelle
    socket.join(socket.userId);

    // Informer les autres utilisateurs du statut en ligne
    socket.broadcast.emit('user_online', {
      username: socket.username,
      isOnline: true
    });

    // Écouter les messages privés
    socket.on('send_message', async (data) => {
      try {
        const { recipient, content, messageType = 'text' } = data;

        // Sauvegarder le message en base
        const message = await Message.create({
          sender: socket.username,
          recipient,
          content,
          messageType,
          delivered: true
        });

        // Trouver le destinataire
        const recipientUser = await User.findOne({ username: recipient });
        if (recipientUser) {
          const recipientConnection = activeUsers.get(recipientUser._id.toString());
          
          if (recipientConnection) {
            // Envoyer le message au destinataire s'il est en ligne
            io.to(recipientUser._id.toString()).emit('receive_message', {
              id: message._id,
              sender: socket.username,
              content,
              messageType,
              timestamp: message.createdAt,
              read: false
            });
          }
        }

        // Confirmer l'envoi à l'expéditeur
        socket.emit('message_sent', {
          id: message._id,
          recipient,
          content,
          messageType,
          timestamp: message.createdAt,
          delivered: true
        });
      } catch (error) {
        socket.emit('message_error', {
          message: 'Erreur lors de l\'envoi du message',
          error: error.message
        });
      }
    });

    // Écouter la confirmation de lecture
    socket.on('mark_as_read', async (data) => {
      try {
        const { messageId } = data;
        await Message.findByIdAndUpdate(messageId, { read: true });
        
        // Informer l'expéditeur que le message a été lu
        const message = await Message.findById(messageId);
        if (message) {
          const senderUser = await User.findOne({ username: message.sender });
          if (senderUser) {
            const senderConnection = activeUsers.get(senderUser._id.toString());
            if (senderConnection) {
              io.to(senderUser._id.toString()).emit('message_read', {
                messageId,
                readBy: socket.username
              });
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du marquage comme lu:', error);
      }
    });

    // Écouter l'indication de frappe
    socket.on('typing', (data) => {
      const { recipient } = data;
      socket.to(recipient).emit('user_typing', {
        username: socket.username,
        isTyping: true
      });
    });

    socket.on('stop_typing', (data) => {
      const { recipient } = data;
      socket.to(recipient).emit('user_typing', {
        username: socket.username,
        isTyping: false
      });
    });

    // Gérer la déconnexion
    socket.on('disconnect', async () => {
      console.log(`Utilisateur déconnecté: ${socket.username}`);

      // Retirer des connexions actives
      activeUsers.delete(socket.userId);

      // Mettre à jour le statut hors ligne
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date()
      });

      // Informer les autres utilisateurs du statut hors ligne
      socket.broadcast.emit('user_offline', {
        username: socket.username,
        isOnline: false,
        lastSeen: new Date()
      });
    });
  });
};

module.exports = socketHandler;
