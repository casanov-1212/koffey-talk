// ===== src/hooks/useJitsiCall.js =====
import { useState, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { toast } from 'react-toastify';

export const useJitsiCall = (currentUser) => {
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const { socket } = useSocket();

  const generateRoomName = useCallback((user1, user2, callType) => {
    const users = [user1, user2].sort();
    const timestamp = Date.now();
    return `${callType}-${users[0]}-${users[1]}-${timestamp}`;
  }, []);

  const getJitsiUrl = useCallback((roomName, options = {}) => {
    const baseUrl = 'https://meet.jit.si';
    const params = new URLSearchParams();
    
    if (options.startWithVideoMuted) {
      params.append('config.startWithVideoMuted', 'true');
    }
    
    if (options.startWithAudioMuted) {
      params.append('config.startWithAudioMuted', 'true');
    }

    const paramString = params.toString();
    return `${baseUrl}/${roomName}${paramString ? `#${paramString}` : ''}`;
  }, []);

  const startCall = useCallback((contactUsername, callType) => {
    if (!socket || !currentUser) {
      toast.error('Connexion requise pour passer un appel');
      return;
    }

    const roomName = generateRoomName(currentUser.username, contactUsername, callType);
    const jitsiOptions = callType === 'audio' ? { startWithVideoMuted: true } : {};
    const jitsiUrl = getJitsiUrl(roomName, jitsiOptions);

    // Envoyer une invitation d'appel via Socket.IO
    socket.emit('call_invitation', {
      recipient: contactUsername,
      callType,
      roomName,
      jitsiUrl
    });

    // Ouvrir Jitsi Meet
    const callWindow = window.open(jitsiUrl, '_blank', 'width=1200,height=800');
    
    setActiveCall({
      type: callType,
      contact: contactUsername,
      roomName,
      window: callWindow,
      isInitiator: true
    });

    toast.success(`Appel ${callType === 'video' ? 'vidéo' : 'audio'} initié avec ${contactUsername}`);

    // Surveiller la fermeture de la fenêtre
    const checkClosed = setInterval(() => {
      if (callWindow.closed) {
        clearInterval(checkClosed);
        endCall();
      }
    }, 1000);

  }, [socket, currentUser, generateRoomName, getJitsiUrl]);

  const acceptCall = useCallback((callData) => {
    const jitsiUrl = callData.jitsiUrl;
    const callWindow = window.open(jitsiUrl, '_blank', 'width=1200,height=800');
    
    setActiveCall({
      type: callData.callType,
      contact: callData.caller,
      roomName: callData.roomName,
      window: callWindow,
      isInitiator: false
    });

    setIncomingCall(null);

    // Confirmer l'acceptation de l'appel
    socket?.emit('call_accepted', {
      caller: callData.caller,
      roomName: callData.roomName
    });

    toast.success(`Appel ${callData.callType === 'video' ? 'vidéo' : 'audio'} accepté`);

    // Surveiller la fermeture de la fenêtre
    const checkClosed = setInterval(() => {
      if (callWindow.closed) {
        clearInterval(checkClosed);
        endCall();
      }
    }, 1000);

  }, [socket]);

  const rejectCall = useCallback((callData) => {
    setIncomingCall(null);
    
    socket?.emit('call_rejected', {
      caller: callData.caller,
      roomName: callData.roomName
    });

    toast.info(`Appel de ${callData.caller} rejeté`);
  }, [socket]);

  const endCall = useCallback(() => {
    if (activeCall?.window && !activeCall.window.closed) {
      activeCall.window.close();
    }

    if (activeCall) {
      socket?.emit('call_ended', {
        contact: activeCall.contact,
        roomName: activeCall.roomName
      });
    }

    setActiveCall(null);
  }, [activeCall, socket]);

  // Écouter les événements d'appel entrants
  if (socket) {
    socket.off('call_invitation');
    socket.on('call_invitation', (data) => {
      setIncomingCall({
        caller: data.caller,
        callType: data.callType,
        roomName: data.roomName,
        jitsiUrl: data.jitsiUrl
      });
    });

    socket.off('call_accepted');
    socket.on('call_accepted', (data) => {
      toast.success(`${data.recipient} a accepté l'appel`);
    });

    socket.off('call_rejected');
    socket.on('call_rejected', (data) => {
      toast.info(`${data.recipient} a rejeté l'appel`);
      endCall();
    });

    socket.off('call_ended');
    socket.on('call_ended', (data) => {
      toast.info(`Appel avec ${data.contact} terminé`);
      if (activeCall?.window && !activeCall.window.closed) {
        activeCall.window.close();
      }
      setActiveCall(null);
    });
  }

  return {
    activeCall,
    incomingCall,
    startCall,
    acceptCall,
    rejectCall,
    endCall
  };
};

