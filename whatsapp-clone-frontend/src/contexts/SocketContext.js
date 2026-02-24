// ===== src/contexts/SocketContext.js CORRIGÉ =====
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './authContext';
import { toast } from 'react-toastify';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket doit être utilisé dans SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [messages, setMessages] = useState([]);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      console.log('=== TENTATIVE DE CONNEXION SOCKET.IO ===');
      console.log('User:', user);
      console.log('Token présent:', !!token);
      console.log('Username:', user.username);

      const newSocket = io('http://localhost:3001', {
        auth: {
          token: token
        }
      });

      newSocket.on('connect', () => {
        console.log('✅ Connecté au serveur Socket.IO');
        console.log('Socket ID:', newSocket.id);
        console.log('User connecté:', user.username);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Erreur de connexion Socket.IO:', error);
        toast.error('Erreur de connexion temps réel');
      });

      // Événements utilisateur
      newSocket.on('user_online', (data) => {
        console.log('Utilisateur en ligne:', data);
        setOnlineUsers(prev => new Set([...prev, data.username]));
      });

      newSocket.on('user_offline', (data) => {
        console.log('Utilisateur hors ligne:', data);
        setOnlineUsers(prev => {
          const newSet = new Set([...prev]);
          newSet.delete(data.username);
          return newSet;
        });
      });

      // Messages normaux
      newSocket.on('receive_message', (message) => {
        console.log('Message reçu:', message);
        setMessages(prev => [...prev, message]);
      });

      newSocket.on('message_sent', (message) => {
        console.log('Message envoyé confirmé:', message);
        setMessages(prev => [...prev, message]);
      });

      // AJOUT: Gestion des messages admin
      newSocket.on('admin_broadcast', (data) => {
        console.log('🚀 Message admin broadcast reçu:', data);
        
        // Afficher une notification
        toast.info(`📢 Message admin: ${data.content}`, {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        // Ajouter aux messages
        const adminMessage = {
          id: Date.now(),
          sender: 'ADMIN',
          content: data.content,
          timestamp: data.timestamp,
          messageType: 'text',
          isAdmin: true,
          read: false
        };
        setMessages(prev => [...prev, adminMessage]);
      });

      newSocket.on('admin_message', (data) => {
        console.log('📨 Message admin individuel reçu:', data);
        
        toast.info(`📨 Message admin personnel: ${data.content}`, {
          position: "top-center",
          autoClose: 5000,
        });

        const adminMessage = {
          id: data.id || Date.now(),
          sender: 'ADMIN',
          content: data.content,
          timestamp: data.timestamp,
          messageType: 'text',
          isAdmin: true,
          read: false
        };
        setMessages(prev => [...prev, adminMessage]);
      });

      newSocket.on('message_error', (error) => {
        console.error('Erreur message:', error);
        toast.error(`Erreur: ${error.message}`);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Déconnecté du serveur:', reason);
        if (reason === 'io server disconnect') {
          // Le serveur a déconnecté la socket, reconnexion manuelle
          newSocket.connect();
        }
      });

      setSocket(newSocket);

      return () => {
        console.log('🔌 Fermeture de la connexion Socket.IO');
        newSocket.close();
      };
    } else {
      console.log('❌ Pas de connexion Socket.IO - user ou token manquant');
      console.log('User:', user);
      console.log('Token:', !!token);
    }
  }, [user, token]);

  const sendMessage = (recipient, content, messageType = 'text') => {
    if (socket) {
      console.log('Envoi message via Socket.IO:', { recipient, content });
      socket.emit('send_message', {
        recipient,
        content,
        messageType
      });
    } else {
      console.error('Socket non disponible pour envoi message');
    }
  };

  const markAsRead = (messageId) => {
    if (socket) {
      socket.emit('mark_as_read', { messageId });
    }
  };

  const startTyping = (recipient) => {
    if (socket) {
      socket.emit('typing', { recipient });
    }
  };

  const stopTyping = (recipient) => {
    if (socket) {
      socket.emit('stop_typing', { recipient });
    }
  };

  const value = {
    socket,
    onlineUsers,
    messages,
    setMessages,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};