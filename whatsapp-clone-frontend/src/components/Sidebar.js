// ===== src/components/Sidebar.js (version corrigée) =====
import React, { useState, useEffect } from 'react';
import { LogOut, Search, MessageCircle, Settings, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/authContext';
import ContactSearch from './ContactSearch';
import NewContactModal from './NewContactModal';
import AvatarUpload from './AvatarUpload';

const Sidebar = ({ contacts, selectedContact, onContactSelect, user, onContactsUpdate }) => {
  const { logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);

  useEffect(() => {
    if (user) {
      setCurrentUserData(user);
    }
  }, [user]);

  const handleAvatarUpdate = (newAvatarUrl) => {
    setCurrentUserData(prev => prev ? {
      ...prev,
      avatar: newAvatarUrl
    } : null);
  };

  // CORRECTION: Ajouter des vérifications de sécurité
  const filteredContacts = contacts.filter(contact => {
    // Vérifier que contact et contact.user existent
    if (!contact || !contact.user || !contact.user.username) {
      return false;
    }
    
    return contact.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (contact.lastMessage?.content || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  const getInitials = (username) => {
    return username ? username.charAt(0).toUpperCase() : '?';
  };

  const handleContactAdded = (newContact) => {
    // Rafraîchir la liste des contacts
    if (onContactsUpdate) {
      onContactsUpdate();
    }
  };

  // AJOUT: Vérification de sécurité pour contacts
  if (!contacts) {
    return (
      <div className="sidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AvatarUpload 
              currentUser={currentUserData}
              onAvatarUpdate={handleAvatarUpdate}
            />
            <h2>{user?.username}</h2>
          </div>
        </div>
        <div className="contacts-list">
          <div className="empty-state">
            <MessageCircle size={48} color="var(--gray-400)" />
            <h3>Chargement des contacts...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AvatarUpload 
              currentUser={currentUserData}
              onAvatarUpdate={handleAvatarUpdate}
            />
            <h2>{user?.username}</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowNewContactModal(true)}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                color: 'var(--gray-500)',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--gray-200)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              title="Nouveau contact"
            >
              <UserPlus size={20} />
            </button>
            <button
              onClick={() => setShowSearch(!showSearch)}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                color: 'var(--gray-500)',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--gray-200)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              title="Rechercher"
            >
              <Search size={20} />
            </button>
            <button
              onClick={logout}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                color: 'var(--gray-500)',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--gray-200)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              title="Se déconnecter"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {showSearch && <ContactSearch />}

        <div className="search-box">
          <input
            type="text"
            placeholder="Rechercher des conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="contacts-list">
          {filteredContacts.length === 0 ? (
            <div className="empty-state">
              <MessageCircle size={48} color="var(--gray-400)" />
              <h3>Aucune conversation</h3>
              <p>Ajoutez des contacts pour commencer à discuter</p>
              <button
                onClick={() => setShowNewContactModal(true)}
                className="btn btn-primary"
                style={{ marginTop: '16px' }}
              >
                <UserPlus size={16} />
                Ajouter un contact
              </button>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.user.username}
                className={`contact-item ${
                  selectedContact?.user.username === contact.user.username ? 'active' : ''
                }`}
                onClick={() => onContactSelect(contact)}
              >
                <div style={{ position: 'relative' }}>
                  <div className="contact-avatar">
                    {getInitials(contact.user.username)}
                  </div>
                  {contact.user.isOnline && (
                    <div className="online-indicator"></div>
                  )}
                </div>
                
                <div className="contact-info">
                  <div className="contact-name">{contact.user.username}</div>
                  <div className="contact-last-message">
                    {contact.lastMessage?.content || 'Aucun message'}
                  </div>
                </div>
                
                <div className="contact-meta">
                  {contact.lastMessage && (
                    <div className="contact-time">
                      {formatTime(contact.lastMessage.createdAt)}
                    </div>
                  )}
                  {contact.unreadCount > 0 && (
                    <div className="unread-badge">{contact.unreadCount}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <NewContactModal
        isOpen={showNewContactModal}
        onClose={() => setShowNewContactModal(false)}
        onContactAdded={handleContactAdded}
      />
    </>
  );
};

export default Sidebar;