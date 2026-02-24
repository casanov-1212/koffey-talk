//===== src/components/CallNotification.js =====
import React from 'react';
import { Phone, Video, PhoneOff } from 'lucide-react';

const CallNotification = ({ 
  isVisible, 
  callerName, 
  callType, 
  onAccept, 
  onReject, 
  isIncoming = true 
}) => {
  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'var(--surface-glass)',
      backdropFilter: 'blur(20px)',
      border: '1px solid var(--border-medium)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      boxShadow: 'var(--shadow-xl)',
      zIndex: 9999,
      minWidth: '300px',
      animation: 'slideInRight 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        {callType === 'video' ? (
          <Video size={24} color="var(--accent-primary)" />
        ) : (
          <Phone size={24} color="var(--accent-primary)" />
        )}
        <div>
          <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px' }}>
            {isIncoming ? `Appel ${callType === 'video' ? 'vidéo' : 'audio'} entrant` : 'Appel en cours...'}
          </h4>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
            {isIncoming ? `${callerName} vous appelle` : `Appel avec ${callerName}`}
          </p>
        </div>
      </div>
      
      {isIncoming && (
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onAccept}
            style={{
              background: 'var(--success)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'var(--transition-normal)'
            }}
          >
            {callType === 'video' ? <Video size={18} /> : <Phone size={18} />}
          </button>
          <button
            onClick={onReject}
            style={{
              background: 'var(--error)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'var(--transition-normal)'
            }}
          >
            <PhoneOff size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default CallNotification;
