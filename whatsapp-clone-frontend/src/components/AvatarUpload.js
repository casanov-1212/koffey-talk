// Créez le fichier src/components/AvatarUpload.js :

import React, { useState, useRef } from 'react';
import { Camera, X, Upload } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AvatarUpload = ({ currentUser, onAvatarUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef(null);

  const getInitials = (username) => {
    return username ? username.charAt(0).toUpperCase() : 'U';
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  const uploadAvatar = async (file) => {
    // Vérifier la taille du fichier (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (maximum 2MB)');
      return;
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Seules les images sont autorisées');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await axios.post('/user/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Photo de profil mise à jour !');
        if (onAvatarUpdate) {
          onAvatarUpdate(response.data.avatarUrl);
        }
        setShowModal(false);
      }
    } catch (error) {
      console.error('Erreur upload:', error);
      const message = error.response?.data?.message || 'Erreur lors de l\'upload';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const response = await axios.delete('/user/avatar');
      
      if (response.data.success) {
        toast.success('Photo de profil supprimée');
        if (onAvatarUpdate) {
          onAvatarUpdate(null);
        }
        setShowModal(false);
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <div 
        className="avatar-container"
        style={{
          position: 'relative',
          cursor: 'pointer',
          display: 'inline-block'
        }}
        onClick={() => setShowModal(true)}
      >
        {currentUser?.avatar ? (
          <img 
            src={`http://localhost:3001${currentUser.avatar}`}
            alt="Avatar"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--gray-300)'
            }}
          />
        ) : (
          <div className="contact-avatar">
            {getInitials(currentUser?.username)}
          </div>
        )}
        
        <div 
          className="camera-overlay"
          style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            backgroundColor: 'var(--whatsapp-green)',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white'
          }}
        >
          <Camera size={10} color="white" />
        </div>
      </div>

      {/* Modal de gestion d'avatar */}
      {showModal && (
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
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, color: 'var(--gray-800)' }}>
                Photo de profil
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--gray-500)'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px'
            }}>
              {/* Aperçu de l'avatar actuel */}
              <div style={{ textAlign: 'center' }}>
                {currentUser?.avatar ? (
                  <img 
                    src={`http://localhost:3001${currentUser.avatar}`}
                    alt="Avatar actuel"
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '4px solid var(--gray-200)'
                    }}
                  />
                ) : (
                  <div 
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--whatsapp-green)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '36px',
                      color: 'white',
                      fontWeight: '600'
                    }}
                  >
                    {getInitials(currentUser?.username)}
                  </div>
                )}
              </div>

              {/* Boutons d'action */}
              <div style={{
                display: 'flex',
                gap: '12px',
                width: '100%'
              }}>
                <button
                  onClick={openFileDialog}
                  disabled={uploading}
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {uploading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <Upload size={16} />
                  )}
                  {uploading ? 'Upload...' : 'Changer la photo'}
                </button>

                {currentUser?.avatar && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="btn btn-secondary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <X size={16} />
                    Supprimer
                  </button>
                )}
              </div>

              <p style={{
                fontSize: '12px',
                color: 'var(--gray-500)',
                textAlign: 'center',
                margin: 0
              }}>
                Formats acceptés : JPEG, PNG, GIF, WEBP (max 2MB)
              </p>
            </div>

            {/* Input file caché */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AvatarUpload;
