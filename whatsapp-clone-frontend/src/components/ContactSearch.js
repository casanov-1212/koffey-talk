// ===== src/components/ContactSearch.js =====
import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ContactSearch = () => {
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

  const getInitials = (username) => {
    return username.charAt(0).toUpperCase();
  };

  const startConversation = async (user) => {
    // Cette fonction pourrait envoyer un message initial ou simplement sélectionner l'utilisateur
    toast.success(`Conversation avec ${user.username} démarrée`);
  };

  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-300)' }}>
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="Rechercher des utilisateurs..."
          value={searchTerm}
          onChange={handleInputChange}
          className="search-input"
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

      {loading && (
        <div style={{ textAlign: 'center', padding: '12px' }}>
          <div className="loading-spinner"></div>
        </div>
      )}

      {searchResults.length > 0 && (
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {searchResults.map((user) => (
            <div
              key={user._id}
              className="contact-item"
              onClick={() => startConversation(user)}
              style={{ padding: '8px 0' }}
            >
              <div className="contact-avatar">
                {getInitials(user.username)}
              </div>
              <div className="contact-info">
                <div className="contact-name">{user.username}</div>
                <div className="contact-last-message">{user.email}</div>
              </div>
              <Plus size={16} color="var(--whatsapp-green)" />
            </div>
          ))}
        </div>
      )}

      {searchTerm.length >= 2 && !loading && searchResults.length === 0 && (
        <div style={{ textAlign: 'center', padding: '12px', color: 'var(--gray-500)' }}>
          Aucun utilisateur trouvé
        </div>
      )}
    </div>
  );
};

export default ContactSearch;
