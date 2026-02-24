// ===== src/components/MessageBubble.js =====
import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

const MessageBubble = ({ message, isOwnMessage }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`message ${isOwnMessage ? 'sent' : 'received'}`}>
      <div className="message-bubble">
        <div className="message-content">
          {message.content}
        </div>
        <div className="message-time">
          {formatTime(message.timestamp || message.createdAt)}
          {isOwnMessage && (
            <span style={{ marginLeft: '4px' }}>
              {message.read ? (
                <CheckCheck size={14} color="var(--whatsapp-blue)" />
              ) : message.delivered ? (
                <CheckCheck size={14} color="var(--gray-500)" />
              ) : (
                <Check size={14} color="var(--gray-500)" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
