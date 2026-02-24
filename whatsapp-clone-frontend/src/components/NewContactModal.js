// ===== src/components/NewContactModal.js =====
import React, { useState } from 'react';
import { X, UserPlus, Search } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const NewContactModal = ({ isOpen, onClose, onContactAdded }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (term) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/messages/search?query=${term}`);
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      toast.error('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    handleSearch(term);
  };

  const handleAddContact = async (user) => {
    try {
      // Envoyer un message initial pour créer la conversation
      const response = await axios.post('/messages/send', {
        recipient: user.username,
        content: `Salut ${user.username}! J'aimerais te parler.`,
        messageType: 'text'
      });

      if (response.data.success) {
        toast.success(`Contact ${user.username} ajouté !`);
        onContactAdded(user);
        onClose();
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du contact:', error);
      toast.error('Erreur lors de l\'ajout du contact');
    }
  };

  const getInitials = (username) => {
    return username.charAt(0).toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--white)',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'hidden',
        boxShadow: '0 10px 40px var(--shadow-lg)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--gray-300)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ margin: 0, color: 'var(--gray-800)' }}>
            Nouveau Contact
          </h2>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              color: 'var(--gray-500)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--gray-300)' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Rechercher par nom d'utilisateur ou email..."
              value={searchTerm}
              onChange={handleInputChange}
              className="search-input"
              style={{
                paddingLeft: '40px',
                width: '100%'
              }}
            />
            <Search 
              size={16} 
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--gray-500)'
              }}
            />
          </div>
        </div>

        {/* Results */}
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          padding: '10px 0'
        }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div className="loading-spinner"></div>
              <p style={{ marginTop: '10px', color: 'var(--gray-500)' }}>
                Recherche en cours...
              </p>
            </div>
          )}

          {!loading && searchTerm.length >= 2 && searchResults.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <UserPlus size={48} color="var(--gray-400)" />
              <h3 style={{ color: 'var(--gray-700)', marginTop: '16px' }}>
                Aucun utilisateur trouvé
              </h3>
              <p style={{ color: 'var(--gray-500)' }}>
                Essayez avec un autre terme de recherche
              </p>
            </div>
          )}

          {!loading && searchTerm.length < 2 && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Search size={48} color="var(--gray-400)" />
              <h3 style={{ color: 'var(--gray-700)', marginTop: '16px' }}>
                Rechercher des contacts
              </h3>
              <p style={{ color: 'var(--gray-500)' }}>
                Tapez au moins 2 caractères pour rechercher
              </p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div>
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  style={{
                    padding: '12px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--gray-200)',
                    transition: 'background-color 0.2s ease'
                  }}
                  onClick={() => handleAddContact(user)}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--gray-100)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <div className="contact-avatar">
                    {getInitials(user.username)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', color: 'var(--gray-800)' }}>
                      {user.username}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
                      {user.email}
                    </div>
                  </div>
                  <UserPlus size={20} color="var(--whatsapp-green)" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewContactModal;
