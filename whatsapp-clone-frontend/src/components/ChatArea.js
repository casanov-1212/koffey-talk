// ===== src/components/ChatArea.js =====
import React, { useState, useRef, useEffect } from 'react';
import { Send, Phone, Video, MoreVertical, Sidebar, Trash2, X, Paperclip, Image, FileVideo, Mic, File, Camera } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ContactSearch from './ContactSearch';
import NewContactModal from './NewContactModal';
import ProtectedRoute from './ProtectedRoute';
import WelcomeScreen from './WelcomeScreen';
import CallNotification from './CallNotification';
import { useJitsiCall } from '../hooks/useJitsiCall';

const ChatArea = ({ contact, messages, onSendMessage, currentUser, onDeleteConversation, onSendMedia }) => {
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef(null);
  const moreOptionsRef = useRef(null);
  const attachmentRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  // ✅ Hook déclaré au début avec les autres hooks
  const {
    activeCall,
    incomingCall,
    startCall,
    acceptCall,
    rejectCall,
    endCall
  } = useJitsiCall(currentUser);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fermer les menus si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(event.target)) {
        setShowMoreOptions(false);
      }
      if (attachmentRef.current && !attachmentRef.current.contains(event.target)) {
        setShowAttachmentMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Nettoyer l'enregistrement lors du démontage
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendWithFiles();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getInitials = (username) => {
    return username.charAt(0).toUpperCase();
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return '';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = (now - date) / (1000 * 60);

    if (diffInMinutes < 1) return 'à l\'instant';
    if (diffInMinutes < 60) return `il y a ${Math.floor(diffInMinutes)} min`;
    
    const diffInHours = diffInMinutes / 60;
    if (diffInHours < 24) return `il y a ${Math.floor(diffInHours)} h`;
    
    return date.toLocaleDateString('fr-FR');
  };

  const handleDeleteConversation = () => {
    if (onDeleteConversation) {
      onDeleteConversation(contact.id);
    }
    setShowDeleteConfirm(false);
    setShowMoreOptions(false);
  };

  // Gestion des fichiers
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
    setShowAttachmentMenu(false);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendWithFiles = async () => {
    if (selectedFiles.length > 0) {
      // Envoyer les fichiers
      for (const file of selectedFiles) {
        if (onSendMedia) {
          await onSendMedia(file, getFileType(file));
        }
      }
      setSelectedFiles([]);
    }
    
    // Envoyer le message texte s'il y en a un
    if (messageText.trim()) {
      onSendMessage(messageText.trim());
      setMessageText('');
    }
  };

  const getFileType = (file) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Enregistrement audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
        setSelectedFiles(prev => [...prev, file]);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Erreur lors de l\'accès au microphone:', error);
      alert('Impossible d\'accéder au microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
      setRecordingTime(0);
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <div className="contact-avatar">
              {getInitials(contact.user.username)}
            </div>
            {contact.user.isOnline && (
              <div className="online-indicator"></div>
            )}
          </div>
          <div className="chat-header-info">
            <h3>{contact.user.username}</h3>
            <div className="chat-header-status">
              {contact.user.isOnline 
                ? 'En ligne' 
                : `Vu ${formatLastSeen(contact.user.lastSeen)}`
              }
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => startCall(contact.user.username, 'audio')}
            disabled={!!activeCall}
            style={{
              border: 'none',
              background: 'none',
              cursor: activeCall ? 'not-allowed' : 'pointer',
              padding: '8px',
              borderRadius: '50%',
              color: activeCall ? 'var(--text-disabled)' : 'var(--text-muted)',
              transition: 'var(--transition-normal)'
            }}
            title="Appel audio"
          >
            <Phone size={20} />
          </button>
          <button
            onClick={() => startCall(contact.user.username, 'video')}
            disabled={!!activeCall}
            style={{
              border: 'none',
              background: 'none',
              cursor: activeCall ? 'not-allowed' : 'pointer',
              padding: '8px',
              borderRadius: '50%',
              color: activeCall ? 'var(--text-disabled)' : 'var(--text-muted)',
              transition: 'var(--transition-normal)'
            }}
            title="Appel vidéo"
          >
            <Video size={20} />
          </button>
          <button
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              color: 'var(--gray-500)',
              position: 'relative'
            }}
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            ref={moreOptionsRef}
          >
            <MoreVertical size={20} />
            
            {/* Menu déroulant des options */}
            {showMoreOptions && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  background: 'var(--background-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  zIndex: 1000,
                  minWidth: '200px',
                  overflow: 'hidden'
                }}
              >
                <button
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setShowMoreOptions(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: 'var(--danger-color)',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--hover-color)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <Trash2 size={16} />
                  Supprimer la conversation
                </button>
              </div>
            )}
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <h3>Commencez une conversation</h3>
            <p>Envoyez un message à {contact.user.username}</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageBubble
              key={message.id || index}
              message={message}
              isOwnMessage={message.sender === currentUser?.username}
            />
          ))
        )}
        {isTyping && (
          <div className="typing-indicator">
            {contact.user.username} est en train d'écrire...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-container">
        {/* Prévisualisation des fichiers sélectionnés */}
        {selectedFiles.length > 0 && (
          <div style={{
            padding: '12px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--background-secondary)',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            maxHeight: '150px',
            overflowY: 'auto'
          }}>
            {selectedFiles.map((file, index) => (
              <div key={index} style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'var(--background-primary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                maxWidth: '200px'
              }}>
                {getFileType(file) === 'image' && (
                  <Image size={16} color="var(--primary-color)" />
                )}
                {getFileType(file) === 'video' && (
                  <FileVideo size={16} color="var(--primary-color)" />
                )}
                {getFileType(file) === 'audio' && (
                  <Mic size={16} color="var(--primary-color)" />
                )}
                {getFileType(file) === 'document' && (
                  <File size={16} color="var(--text-muted)" />
                )}
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {file.name}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)'
                  }}>
                    {formatFileSize(file.size)}
                  </div>
                </div>
                
                <div
                  onClick={() => removeSelectedFile(index)}
                  style={{
                    cursor: 'pointer',
                    padding: '2px',
                    color: 'var(--text-muted)',
                    borderRadius: '50%'
                  }}
                >
                  <X size={14} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '12px' }}>
          {/* Bouton d'attachement */}
          <div style={{ position: 'relative' }} ref={attachmentRef}>
            <button
              type="button"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                color: 'var(--text-muted)',
                transition: 'all 0.2s'
              }}
              title="Joindre un fichier"
            >
              <Paperclip size={20} />
            </button>

            {/* Menu d'attachement */}
            {showAttachmentMenu && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                marginBottom: '8px',
                background: 'var(--background-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                zIndex: 1000,
                overflow: 'hidden',
                minWidth: '200px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    cameraInputRef.current.accept = 'image/*';
                    cameraInputRef.current.click();
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: 'var(--text-primary)',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--hover-color)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <Camera size={18} color="#4CAF50" />
                  <span>Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    cameraInputRef.current.accept = 'video/*';
                    cameraInputRef.current.click();
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: 'var(--text-primary)',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--hover-color)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <FileVideo size={18} color="#2196F3" />
                  <span>Vidéo</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: 'var(--text-primary)',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--hover-color)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <File size={18} color="#FF9800" />
                  <span>Document</span>
                </button>

                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: isRecording ? 'rgba(244, 67, 54, 0.1)' : 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: isRecording ? '#F44336' : 'var(--text-primary)',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isRecording) e.target.style.backgroundColor = 'var(--hover-color)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isRecording) e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <Mic size={18} color={isRecording ? '#F44336' : '#F44336'} />
                  <span>
                    {isRecording ? `Arrêter (${formatRecordingTime(recordingTime)})` : 'Audio'}
                  </span>
                </button>
              </div>
            )}
          </div>

          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tapez votre message..."
            className="chat-input"
            rows={1}
            style={{
              resize: 'none',
              overflow: 'hidden',
              flex: 1
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          
          <button
            type="submit"
            className="send-button"
            disabled={!messageText.trim() && selectedFiles.length === 0}
            style={{
              opacity: (!messageText.trim() && selectedFiles.length === 0) ? 0.5 : 1
            }}
          >
            <Send size={20} />
          </button>
        </div>

        {/* Inputs cachés pour les fichiers */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept="*/*"
        />
        
        <input
          ref={cameraInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          capture="environment"
        />
      </form>

      {/* ✅ CallNotifications placées à l'intérieur du container principal */}
      <CallNotification
        isVisible={!!incomingCall}
        callerName={incomingCall?.caller}
        callType={incomingCall?.callType}
        onAccept={() => acceptCall(incomingCall)}
        onReject={() => rejectCall(incomingCall)}
        isIncoming={true}
      />

      <CallNotification
        isVisible={!!activeCall}
        callerName={activeCall?.contact}
        callType={activeCall?.type}
        isIncoming={false}
      />

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              background: 'var(--background-primary)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
                Supprimer la conversation
              </h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  color: 'var(--text-muted)'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
              Êtes-vous sûr de vouloir supprimer cette conversation avec{' '}
              <strong>{contact.user.username}</strong> ? 
              Cette action est irréversible et tous les messages seront définitivement perdus.
            </p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--background-secondary)',
                  color: 'var(--text-primary)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConversation}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: 'var(--danger-color)',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatArea;