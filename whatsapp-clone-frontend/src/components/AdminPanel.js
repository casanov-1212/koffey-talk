import React, { useState, useEffect } from 'react';
import { 
  Users, Check, X, Ban, Trash2, Send, 
  UserCheck, Clock, Mail, LogOut, Home, Star, Zap 
} from 'lucide-react';

const AdminPanel = ({ onNavigate }) => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [messageModal, setMessageModal] = useState({ show: false });
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Récupérer les informations de l'utilisateur actuel
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
    }
  };

  // Récupérer les demandes en attente
  const fetchPendingUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/pending-users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPendingUsers(data.users);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Récupérer tous les utilisateurs
  const fetchAllUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAllUsers(data.users);
        setOnlineUsers(data.users.filter(user => user.isOnline));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Approuver un utilisateur
  const approveUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/approve-user/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        alert('✅ Utilisateur approuvé avec succès !');
        fetchPendingUsers();
        fetchAllUsers();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Rejeter un utilisateur
  const rejectUser = async (userId) => {
    const reason = prompt('Raison du rejet (optionnel):');
    try {
      const response = await fetch(`http://localhost:3001/api/admin/reject-user/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        alert('❌ Utilisateur rejeté !');
        fetchPendingUsers();
        fetchAllUsers();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Bannir un utilisateur
  const banUser = async (userId) => {
    const reason = prompt('Raison du bannissement:');
    if (!reason) return;

    try {
      const response = await fetch(`http://localhost:3001/api/admin/suspend-user/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        alert('🚫 Utilisateur banni !');
        fetchAllUsers();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Réactiver un utilisateur
  const unbanUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/reactivate-user/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        alert('🎉 Utilisateur réactivé !');
        fetchAllUsers();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Supprimer un utilisateur
  const deleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/admin/delete-user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        alert('🗑️ Utilisateur supprimé définitivement !');
        fetchAllUsers();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Envoyer un message à tous
  const sendBroadcastMessage = async () => {
    if (!messageContent.trim()) {
      alert('Veuillez saisir un message');
      return;
    }

    setSendingMessage(true);
    try {
      const response = await fetch('http://localhost:3001/api/admin/broadcast-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: messageContent })
      });
      
      if (response.ok) {
        alert('🚀 Message diffusé à tous les utilisateurs !');
        setMessageModal({ show: false });
        setMessageContent('');
      } else {
        throw new Error('Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Fonction de déconnexion
  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  };

  // Formater la dernière connexion
  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Jamais connecté';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = (now - date) / (1000 * 60);

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${Math.floor(diffInMinutes)} min`;
    
    const diffInHours = diffInMinutes / 60;
    if (diffInHours < 24) return `Il y a ${Math.floor(diffInHours)} h`;
    
    return date.toLocaleDateString('fr-FR');
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#6B7280';
      case 'suspended': return '#EF4444';
      default: return '#6B7280';
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    if (activeTab === 'pending') {
      fetchPendingUsers();
    } else if (activeTab === 'users' || activeTab === 'online') {
      fetchAllUsers();
    }
  }, [activeTab]);
  /*Partie 2*/
  // Styles dynamiques et amusants
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    
    header: {
      background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #48dbfb 100%)',
      borderRadius: '25px',
      padding: '30px',
      marginBottom: '30px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
      border: '3px solid rgba(255,255,255,0.2)',
      animation: 'float 3s ease-in-out infinite',
      position: 'relative',
      overflow: 'hidden'
    },
    
    headerContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative',
      zIndex: 2
    },
    
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px'
    },
    
    headerIcon: {
      width: '70px',
      height: '70px',
      background: 'linear-gradient(45deg, #ff9a9e 0%, #fecfef 100%)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      animation: 'bounce 2s infinite'
    },
    
    headerTitle: {
      fontSize: '36px',
      fontWeight: '800',
      color: 'white',
      margin: 0,
      textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
      background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    
    headerSubtitle: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: '16px',
      marginTop: '8px'
    },
    
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    
    userInfo: {
      textAlign: 'right',
      color: 'white'
    },
    
    button: {
      padding: '12px 24px',
      border: 'none',
      borderRadius: '15px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      position: 'relative',
      overflow: 'hidden'
    },
    
    chatButton: {
      background: 'linear-gradient(45deg, #00d2ff 0%, #3a7bd5 100%)',
      color: 'white',
      boxShadow: '0 8px 20px rgba(0,210,255,0.3)'
    },
    
    logoutButton: {
      background: 'linear-gradient(45deg, #ff416c 0%, #ff4b2b 100%)',
      color: 'white',
      boxShadow: '0 8px 20px rgba(255,65,108,0.3)'
    },
    
    broadcastButton: {
      background: 'linear-gradient(45deg, #a8edea 0%, #fed6e3 100%)',
      color: '#333',
      padding: '20px 40px',
      fontSize: '18px',
      fontWeight: '700',
      borderRadius: '25px',
      boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
      border: '3px solid rgba(255,255,255,0.5)',
      marginBottom: '30px',
      width: '100%',
      maxWidth: '500px',
      margin: '0 auto 30px auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '15px',
      animation: 'pulse 2s infinite'
    },
    
    tabsContainer: {
      background: 'rgba(255,255,255,0.95)',
      borderRadius: '20px',
      marginBottom: '30px',
      boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      border: '2px solid rgba(255,255,255,0.8)'
    },
    
    tabsHeader: {
      display: 'flex',
      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
    },
    
    tab: {
      flex: 1,
      padding: '20px',
      border: 'none',
      background: 'transparent',
      color: 'rgba(255,255,255,0.7)',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      position: 'relative'
    },
    
    tabActive: {
      color: 'white',
      background: 'rgba(255,255,255,0.1)',
      transform: 'scale(1.05)'
    },
    
    tabContent: {
      padding: '30px',
      minHeight: '400px'
    },
    
    userCard: {
      background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
      borderRadius: '20px',
      padding: '25px',
      marginBottom: '20px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      border: '2px solid rgba(255,255,255,0.5)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    },
    
    userCardHover: {
      transform: 'translateY(-5px)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
    },
    
    actionButton: {
      padding: '10px 16px',
      border: 'none',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      margin: '0 4px'
    },
    
    approveButton: {
      background: 'linear-gradient(45deg, #56ab2f 0%, #a8e6cf 100%)',
      color: 'white',
      boxShadow: '0 5px 15px rgba(86,171,47,0.3)'
    },
    
    rejectButton: {
      background: 'linear-gradient(45deg, #ff416c 0%, #ff4b2b 100%)',
      color: 'white',
      boxShadow: '0 5px 15px rgba(255,65,108,0.3)'
    },
    
    banButton: {
      background: 'linear-gradient(45deg, #f7971e 0%, #ffd200 100%)',
      color: '#333',
      boxShadow: '0 5px 15px rgba(247,151,30,0.3)'
    },
    
    deleteButton: {
      background: 'linear-gradient(45deg, #cb2d3e 0%, #ef473a 100%)',
      color: 'white',
      boxShadow: '0 5px 15px rgba(203,45,62,0.3)'
    },
    
    unbanButton: {
      background: 'linear-gradient(45deg, #11998e 0%, #38ef7d 100%)',
      color: 'white',
      boxShadow: '0 5px 15px rgba(17,153,142,0.3)'
    },
    
    onlineIndicator: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      background: 'linear-gradient(45deg, #56ab2f 0%, #a8e6cf 100%)',
      animation: 'pulse 1.5s infinite',
      boxShadow: '0 0 10px rgba(86,171,47,0.5)'
    },
    
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#666'
    },
    
    emptyIcon: {
      margin: '0 auto 20px auto',
      opacity: 0.3
    }
  };

  // CSS Animations dans le style
  const cssAnimations = `
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-10px) rotate(1deg); }
    }
    
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      60% { transform: translateY(-5px); }
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    .user-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
    }
    
    .action-button:hover {
      transform: translateY(-2px);
      filter: brightness(1.1);
    }
    
    .broadcast-button:hover {
      transform: scale(1.02);
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
    }
  `;

  return (
    <div style={styles.container}>
      <style>{cssAnimations}</style>
      
      {/* Header Super Dynamique */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <div style={styles.headerIcon}>
              <Star size={35} color="white" />
            </div>
            <div>
              <h1 style={styles.headerTitle}>Panel d'Administration</h1>
              <p style={styles.headerSubtitle}>Gestion dynamique et amusante des utilisateurs</p>
            </div>
          </div>
          
          <div style={styles.headerRight}>
            {currentUser && (
              <div style={styles.userInfo}>
                <p style={{ fontWeight: '600', margin: 0, fontSize: '16px' }}>{currentUser.username}</p>
                <p style={{ fontSize: '14px', margin: 0, opacity: 0.9 }}>Super Administrateur</p>
              </div>
            )}
            
            <button 
              onClick={() => onNavigate && onNavigate('chat')}
              style={{...styles.button, ...styles.chatButton}}
              className="action-button"
            >
              <Home size={16} />
              Chat
            </button>
            
            <button 
              onClick={handleLogout}
              style={{...styles.button, ...styles.logoutButton}}
              className="action-button"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Bouton Message à tous - Super visible */}
      <div style={{ textAlign: 'center' }}>
        <button 
          onClick={() => setMessageModal({ show: true })}
          style={styles.broadcastButton}
          className="broadcast-button"
        >
          <Zap size={24} />
          Envoyer un message à TOUS les utilisateurs
          <Mail size={24} />
        </button>
      </div>
      
      {/* Onglets avec style dynamique */}
      <div style={styles.tabsContainer}>
        <div style={styles.tabsHeader}>
          {[
            { key: 'pending', label: `Demandes en attente (${pendingUsers.length})`, icon: Clock },
            { key: 'users', label: `Tous les utilisateurs (${allUsers.length})`, icon: Users },
            { key: 'online', label: `En ligne (${onlineUsers.length})`, icon: UserCheck }
          ].map(tab => (
            <button 
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                ...styles.tab,
                ...(activeTab === tab.key ? styles.tabActive : {})
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div style={styles.tabContent}>
          {/* Onglet Demandes en attente */}
          {activeTab === 'pending' && (
            <div>
              {pendingUsers.length === 0 ? (
                <div style={styles.emptyState}>
                  <Clock size={80} style={styles.emptyIcon} />
                  <h3>Aucune demande en attente</h3>
                  <p>Tous les utilisateurs ont été traités !</p>
                </div>
              ) : (
                pendingUsers.map(user => (
                  <div key={user._id} style={styles.userCard} className="user-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: '700', color: '#333' }}>
                          {user.username}
                        </h3>
                        <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '16px' }}>{user.email}</p>
                        <p style={{ margin: 0, color: '#999', fontSize: '14px' }}>
                          Inscrit le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          onClick={() => approveUser(user._id)}
                          style={{...styles.actionButton, ...styles.approveButton}}
                          className="action-button"
                        >
                          <Check size={16} />
                          Approuver
                        </button>
                        <button 
                          onClick={() => rejectUser(user._id)}
                          style={{...styles.actionButton, ...styles.rejectButton}}
                          className="action-button"
                        >
                          <X size={16} />
                          Rejeter
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Onglet Tous les utilisateurs */}
          {activeTab === 'users' && (
            <div>
              {allUsers.map(user => (
                <div key={user._id} style={styles.userCard} className="user-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={user.isOnline ? styles.onlineIndicator : { 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        background: '#ccc' 
                      }}></div>
                      <div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#333' }}>
                          {user.username}
                        </h3>
                        <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>{user.email}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span 
                            style={{
                              padding: '4px 12px',
                              borderRadius: '15px',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: 'white',
                              background: getStatusColor(user.status)
                            }}
                          >
                            {user.status === 'approved' ? 'Actif' : 
                             user.status === 'pending' ? 'En attente' :
                             user.status === 'suspended' ? 'Banni' : 'Rejeté'}
                          </span>
                          <span style={{ fontSize: '12px', color: '#999' }}>
                            {user.isOnline ? 'En ligne' : formatLastSeen(user.lastSeen)}
                          </span>
                          {user.role === 'admin' && (
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '15px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                              color: 'white'
                            }}>
                              Administrateur
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {user.role !== 'admin' && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {user.status === 'approved' && (
                          <button 
                            onClick={() => banUser(user._id)}
                            style={{...styles.actionButton, ...styles.banButton}}
                            className="action-button"
                          >
                            <Ban size={14} />
                            Bannir
                          </button>
                        )}
                        
                        {user.status === 'suspended' && (
                          <button 
                            onClick={() => unbanUser(user._id)}
                            style={{...styles.actionButton, ...styles.unbanButton}}
                            className="action-button"
                          >
                            <UserCheck size={14} />
                            Débannir
                          </button>
                        )}
                        
                        <button 
                          onClick={() => deleteUser(user._id)}
                          style={{...styles.actionButton, ...styles.deleteButton}}
                          className="action-button"
                        >
                          <Trash2 size={14} />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Onglet Utilisateurs en ligne */}
          {activeTab === 'online' && (
            <div>
              {onlineUsers.length === 0 ? (
                <div style={styles.emptyState}>
                  <UserCheck size={80} style={styles.emptyIcon} />
                  <h3>Aucun utilisateur connecté</h3>
                  <p>Personne n'est en ligne pour le moment</p>
                </div>
              ) : (
                onlineUsers.map(user => (
                  <div key={user._id} style={{
                    ...styles.userCard,
                    background: 'linear-gradient(135deg, rgba(86,171,47,0.1) 0%, rgba(168,230,207,0.1) 100%)',
                    border: '2px solid rgba(86,171,47,0.3)'
                  }} className="user-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{
                        ...styles.onlineIndicator,
                        width: '16px',
                        height: '16px'
                      }}></div>
                      <div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#333' }}>
                          {user.username}
                        </h3>
                        <p style={{ margin: '0 0 5px 0', color: '#666' }}>{user.email}</p>
                        <p style={{ margin: 0, color: '#56ab2f', fontWeight: '600' }}>En ligne maintenant</p>
                        {user.role === 'admin' && (
                          <span style={{
                            display: 'inline-block',
                            marginTop: '5px',
                            padding: '4px 12px',
                            borderRadius: '15px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                            color: 'white'
                          }}>
                            Administrateur
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal super stylé pour les messages */}
      {messageModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '25px',
            padding: '0',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            border: '3px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{
              background: 'linear-gradient(45deg, #ff6b6b 0%, #feca57 100%)',
              padding: '25px',
              borderRadius: '22px 22px 0 0'
            }}>
              <h3 style={{
                margin: 0,
                color: 'white',
                fontSize: '24px',
                fontWeight: '700',
                textAlign: 'center',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}>
                Message à tous les utilisateurs
              </h3>
            </div>
            
            <div style={{ padding: '30px', background: 'white', borderRadius: '0 0 22px 22px' }}>
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Tapez votre message super important..."
                style={{
                  width: '100%',
                  height: '120px',
                  padding: '15px',
                  border: '3px solid #f0f0f0',
                  borderRadius: '15px',
                  fontSize: '16px',
                  resize: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                  outline: 'none'
                }}
              />
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginTop: '20px',
                gap: '15px'
              }}>
                <button
                  onClick={() => {
                    setMessageModal({ show: false });
                    setMessageContent('');
                  }}
                  style={{
                    ...styles.actionButton,
                    background: 'linear-gradient(45deg, #bdc3c7 0%, #95a5a6 100%)',
                    color: 'white',
                    flex: 1
                  }}
                  className="action-button"
                >
                  Annuler
                </button>
                <button
                  onClick={sendBroadcastMessage}
                  disabled={sendingMessage}
                  style={{
                    ...styles.actionButton,
                    background: sendingMessage 
                      ? 'linear-gradient(45deg, #95a5a6 0%, #7f8c8d 100%)'
                      : 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    flex: 2,
                    fontSize: '16px',
                    fontWeight: '700'
                  }}
                  className="action-button"
                >
                  <Send size={16} />
                  {sendingMessage ? 'Envoi...' : 'Envoyer à tous'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;