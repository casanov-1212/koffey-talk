// ===== src/pages/Chat.js CORRIGÉ =====
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/authContext';
import { useSocket } from '../contexts/SocketContext';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import WelcomeScreen from '../components/WelcomeScreen';
import AdminPanel from '../components/AdminPanel';
import axios from 'axios';

const Chat = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminMessages, setAdminMessages] = useState([]);
  const [showAdminMessages, setShowAdminMessages] = useState(false);

  // Debug logs
  console.log('=== DEBUG CHAT COMPONENT ===');
  console.log('Données utilisateur complètes:', user);
  console.log('Role de l\'utilisateur:', user?.role);
  console.log('Est admin?', user && user.role === 'admin');

  useEffect(() => {
    fetchUnreadAdminMessages(); // Récupérer en premier
    fetchContacts();
  }, []);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.user.username);
    }
  }, [selectedContact]);

  // AJOUT: Écouter les messages admin via Socket.IO
  useEffect(() => {
    if (socket) {
      console.log('Configuration des listeners Socket.IO pour les messages admin');

      // Écouter les messages broadcast admin
      socket.on('admin_broadcast', (data) => {
        console.log('Message admin broadcast reçu:', data);
        
        const adminMessage = {
          id: Date.now(),
          sender: 'ADMIN',
          content: data.content,
          timestamp: data.timestamp,
          messageType: 'text',
          isAdmin: true,
          read: false
        };

        setAdminMessages(prev => [...prev, adminMessage]);
        setMessages(prev => [...prev, adminMessage]);
      });

      // Écouter les messages admin individuels
      socket.on('admin_message', (data) => {
        console.log('Message admin individuel reçu:', data);
        
        const adminMessage = {
          id: data.id || Date.now(),
          sender: 'ADMIN',
          content: data.content,
          timestamp: data.timestamp,
          messageType: 'text',
          isAdmin: true,
          read: false
        };

        setAdminMessages(prev => [...prev, adminMessage]);
        setMessages(prev => [...prev, adminMessage]);
      });

      // Écouter les messages normaux
      socket.on('receive_message', (data) => {
        console.log('Message normal reçu:', data);
        setMessages(prev => [...prev, data]);
      });

      return () => {
        socket.off('admin_broadcast');
        socket.off('admin_message');
        socket.off('receive_message');
      };
    }
  }, [socket]);

  const fetchContacts = async () => {
    try {
      const response = await axios.get('/messages/contacts');
      setContacts(response.data.contacts || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadAdminMessages = async () => {
    try {
      console.log('Récupération des messages admin non lus...');
      const response = await axios.get('/messages/admin-messages/unread');
      
      if (response.data.success && response.data.messages.length > 0) {
        console.log('Messages admin non lus récupérés:', response.data.messages);
        setAdminMessages(response.data.messages);
        
        const count = response.data.messages.length;
        console.log(`📬 ${count} message(s) admin non lu(s) récupéré(s)`);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des messages admin:', error);
    }
  };

  const fetchMessages = async (contactUsername) => {
    try {
      const response = await axios.get(`/messages/conversation/${contactUsername}`);
      let fetchedMessages = response.data.messages || [];
      
      // Ajouter les messages admin à la conversation
      fetchedMessages = [...fetchedMessages, ...adminMessages];
      
      // Trier par timestamp
      fetchedMessages.sort((a, b) => new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt));
      
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
    }
  };

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
  };

  const handleSendMessage = (content) => {
    if (socket && selectedContact) {
      // Ajouter immédiatement dans l'affichage
      const newMessage = {
        id: Date.now(),
        sender: user.username,
        content,
        messageType: 'text',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, newMessage]);

      // Envoyer au serveur
      socket.emit('send_message', {
        recipient: selectedContact.user.username,
        content,
        messageType: 'text'
      });
    }
  };

  const handleContactsUpdate = () => {
    fetchContacts();
  };

  const handleAdminNavigation = (destination) => {
    console.log('Navigation admin vers:', destination);
  };

  const markAdminMessagesAsRead = async () => {
    try {
      await axios.post('/messages/admin-messages/mark-read');
      setAdminMessages(prev => 
        prev.map(message => ({ ...message, read: true }))
      );
      console.log('Messages admin marqués comme lus');
    } catch (error) {
      console.error('Erreur lors du marquage des messages admin:', error);
      setAdminMessages(prev => 
        prev.map(message => ({ ...message, read: true }))
      );
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        <div>Chargement...</div>
      </div>
    );
  }

  if (user && user.role === 'admin') {
    return <AdminPanel onNavigate={handleAdminNavigation} />;
  }

  // Interface chat normale pour les utilisateurs réguliers
  return (
    <div className="container">
      {/* Bulle de notification admin luxueuse */}
      {adminMessages.filter(m => !m.read).length > 0 && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000
        }}>
          {/* Bulle de notification premium */}
          <div 
            onClick={() => setShowAdminMessages(!showAdminMessages)}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '50px',
              cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4), 0 4px 16px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              transform: showAdminMessages ? 'scale(1.05)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.6), 0 6px 20px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = showAdminMessages ? 'scale(1.05)' : 'scale(1)';
              e.target.style.boxShadow = '0 8px 32px rgba(102, 126, 234, 0.4), 0 4px 16px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{
              width: '8px',
              height: '8px',
              background: '#FFD700',
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }}></div>
            <span>💎 {adminMessages.filter(m => !m.read).length} message{adminMessages.filter(m => !m.read).length > 1 ? 's' : ''} VIP</span>
            <div style={{
              fontSize: '10px',
              opacity: 0.8,
              fontWeight: '400'
            }}>
              {showAdminMessages ? '✕' : '▼'}
            </div>
          </div>

          {/* Panneau déroulant premium */}
          {showAdminMessages && (
            <div style={{
              position: 'absolute',
              top: '60px',
              right: '0',
              width: '400px',
              maxHeight: '500px',
              background: 'linear-gradient(145deg, #ffffff, #f8f9ff)',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 8px 40px rgba(102, 126, 234, 0.1)',
              border: '1px solid rgba(102, 126, 234, 0.1)',
              overflow: 'hidden',
              backdropFilter: 'blur(20px)',
              animation: 'slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              {/* Header premium */}
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>💎 Messages VIP</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', opacity: 0.9 }}>Administration Executive</p>
                </div>
                <button
                  onClick={() => setShowAdminMessages(false)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '20px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                >
                  ×
                </button>
              </div>

              {/* Liste des messages premium */}
              <div style={{
                maxHeight: '350px',
                overflowY: 'auto',
                padding: '16px'
              }}>
                {adminMessages.filter(m => !m.read).map((msg, index) => (
                  <div key={msg.id || index} style={{
                    padding: '16px',
                    marginBottom: '12px',
                    background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)',
                    borderRadius: '12px',
                    border: '1px solid rgba(102, 126, 234, 0.1)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '700'
                      }}>
                        💎
                      </div>
                      <div>
                        <div style={{
                          fontWeight: '700',
                          color: '#2d3748',
                          fontSize: '14px'
                        }}>
                          Administration Executive
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#718096',
                          fontWeight: '500'
                        }}>
                          {new Date(msg.timestamp).toLocaleString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      color: '#4a5568',
                      lineHeight: '1.5',
                      fontSize: '14px',
                      marginLeft: '40px'
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer premium */}
              <div style={{
                padding: '20px',
                borderTop: '1px solid rgba(102, 126, 234, 0.1)',
                background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)'
              }}>
                <button
                  onClick={() => {
                    markAdminMessagesAsRead();
                    setShowAdminMessages(false);
                  }}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                  }}
                >
                  ✓ Marquer tout comme lu
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      {/* Layout corrigé avec flex */}
      <div style={{ 
        display: 'flex', 
        width: '100%', 
        height: '100%' 
      }}>
        <Sidebar
          contacts={contacts}
          selectedContact={selectedContact}
          onContactSelect={handleContactSelect}
          onContactsUpdate={handleContactsUpdate}
          user={user}
        />
        
        {selectedContact ? (
          <ChatArea
            contact={selectedContact}
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUser={user}
          />
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </div>
  );
};

export default Chat;