// ===== src/components/WelcomeScreen.js =====
import React from 'react';
import { MessageCircle } from 'lucide-react';

const WelcomeScreen = () => {
  return (
    <div className="welcome-screen">
      <MessageCircle size={80} color="var(--gray-400)" />
      <h2>KOFFEY TALKS</h2>
      <p>
        Sélectionnez une conversation dans la barre latérale pour commencer à discuter,
        ou recherchez de nouveaux contacts pour démarrer une nouvelle conversation.
      </p>
    </div>
  );
};

export default WelcomeScreen;
