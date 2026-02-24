import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AuthContext = createContext();

// Configuration Axios
axios.defaults.baseURL = 'http://localhost:3001/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Récupérer les vraies données utilisateur du localStorage
      const savedUserData = localStorage.getItem('userData');
      if (savedUserData) {
        try {
          const userData = JSON.parse(savedUserData);
          console.log('Données utilisateur récupérées du localStorage:', userData);
          setUser(userData);
        } catch (error) {
          console.error('Erreur parsing userData:', error);
          localStorage.removeItem('userData');
        }
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    try {
      console.log('=== DEBUG LOGIN FRONTEND ===');
      console.log('Email:', email);
      console.log('Password présent:', !!password);
      console.log('URL:', `${axios.defaults.baseURL}/auth/login`);

      // Validation côté client
      if (!email || !password) {
        const message = 'Email et mot de passe requis';
        toast.error(message);
        return { success: false, message };
      }

      const response = await axios.post('/auth/login', { 
        email: email.trim(),
        password: password.trim()
      });

      console.log('Réponse serveur complète:', response.data);

      // Vérifier la structure de la réponse
      if (!response.data || !response.data.success) {
        throw new Error('Réponse serveur invalide');
      }

      const { user, token } = response.data;
      
      console.log('=== DEBUG DONNÉES UTILISATEUR ===');
      console.log('Utilisateur reçu du backend:', user);
      console.log('Role:', user?.role);
      console.log('Username:', user?.username);

      if (!user || !token) {
        throw new Error('Données utilisateur ou token manquants');
      }

      // Sauvegarder les données utilisateur
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
      localStorage.setItem('userData', JSON.stringify(user)); // Sauver les données complètes
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      toast.success('Connexion réussie !');
      return { success: true };
    } catch (error) {
      console.error('=== ERREUR LOGIN ===');
      console.error('Error object:', error);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data complète:', JSON.stringify(error.response.data, null, 2));
        console.error('Message serveur:', error.response.data?.message);
        console.error('Headers:', error.response.headers);
      } else if (error.request) {
        console.error('Request:', error.request);
      } else {
        console.error('Message:', error.message);
      }

      let message = 'Erreur de connexion';
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            message = error.response.data?.message || 'Données invalides';
            break;
          case 403:
            message = error.response.data?.message || 'Compte en attente d\'approbation';
            break;
          case 401:
            message = 'Email ou mot de passe incorrect';
            break;
          case 500:
            message = 'Erreur serveur';
            break;
          default:
            message = error.response.data?.message || 'Erreur inconnue';
        }
      } else if (error.request) {
        message = 'Impossible de contacter le serveur';
      }

      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      console.log('=== DEBUG REGISTER FRONTEND ===');
      console.log('Data:', userData);

      // Validation côté client
      if (!userData.username || !userData.email || !userData.password) {
        const message = 'Tous les champs sont requis';
        toast.error(message);
        return { success: false, message };
      }

      const response = await axios.post('/auth/register', {
        username: userData.username.trim(),
        email: userData.email.trim(),
        password: userData.password.trim()
      });

      console.log('Réponse register:', response.data);

      const message = response.data.message || 'Inscription réussie';
      toast.success(message);
      return { success: true, message };
    } catch (error) {
      console.error('=== ERREUR REGISTER ===');
      console.error('Error:', error);

      const message = error.response?.data?.message || 'Erreur lors de l\'inscription';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userData'); // Supprimer les données utilisateur
    delete axios.defaults.headers.common['Authorization'];
    toast.info('Vous avez été déconnecté');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};