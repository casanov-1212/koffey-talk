// routes/authRoutes.js CORRIGÉ AVEC BCRYPTJS
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs'); // Utiliser bcryptjs comme dans votre fichier
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Inscription avec statut pending
router.post('/register', async (req, res) => {
  console.log('=== TENTATIVE D\'INSCRIPTION ===');
  console.log('Body reçu:', req.body);
  
  try {
    const { username, email, password } = req.body;

    // Vérifier que tous les champs sont présents
    if (!username || !email || !password) {
      console.log('Données manquantes - username:', username, 'email:', email, 'password:', password ? 'présent' : 'absent');
      return res.status(400).json({
        success: false,
        message: 'Nom d\'utilisateur, email et mot de passe requis'
      });
    }

    console.log('Vérification utilisateur existant pour:', { username, email });

    // Vérifications existantes
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      console.log('Utilisateur existant trouvé:', existingUser.username);
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email ou nom d\'utilisateur existe déjà'
      });
    }

    // Hasher le mot de passe avec bcryptjs
    console.log('Hachage du mot de passe...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Hash généré (longueur):', hashedPassword.length);

    console.log('Création de l\'utilisateur...');

    // Créer l'utilisateur avec status 'pending'
   const user = await User.create({
  username,
  email,
  password: hashedPassword
  // status sera automatiquement 'approved' grâce au default du modèle
});

    console.log('Utilisateur créé avec succès:', user.username);

    res.status(201).json({
  success: true,
  message: 'Compte créé avec succès. Vous pouvez maintenant vous connecter.',
  userId: user._id
});
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription'
    });
  }
});

// Connexion - vérifier le statut
router.post('/login', async (req, res) => {
  console.log('=== TENTATIVE DE CONNEXION ===');
  console.log('Body reçu:', req.body);
  console.log('Headers Content-Type:', req.headers['content-type']);
  
  try {
    const { email, password } = req.body;

    // Vérifier si les données sont présentes
    if (!email || !password) {
      console.log('Données manquantes - email:', email, 'password:', password ? 'présent' : 'absent');
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    console.log('Recherche utilisateur avec email:', email);

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    console.log('Utilisateur trouvé:', user ? `${user.username} (status: ${user.status || 'pas de status'})` : 'AUCUN');
    
    if (!user) {
      console.log('Utilisateur non trouvé pour email:', email);
      return res.status(400).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    console.log('Statut du compte:', user.status);

    // Vérifier le statut du compte
    if (user.status === 'pending') {
      console.log('Compte en attente d\'approbation');
      return res.status(403).json({
        success: false,
        message: 'Votre compte est en attente d\'approbation par un administrateur.'
      });
    }

    if (user.status === 'rejected') {
      console.log('Compte rejeté');
      return res.status(403).json({
        success: false,
        message: `Votre compte a été rejeté. Raison: ${user.rejectionReason || 'Non spécifiée'}`
      });
    }

    if (user.status === 'suspended') {
      console.log('Compte suspendu');
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été suspendu. Contactez un administrateur.'
      });
    }

    console.log('Vérification du mot de passe...');
    console.log('Hash stocké:', user.password);
    console.log('Mot de passe fourni:', password);
    console.log('Longueur hash stocké:', user.password.length);

    // Vérification du mot de passe avec bcryptjs
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Résultat comparaison bcryptjs:', isMatch);
    
    if (!isMatch) {
      console.log('Mot de passe incorrect');
      return res.status(400).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    console.log('Génération du token JWT...');

    // Générer le token JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'votre-secret-jwt-changez-moi-en-production',
      { expiresIn: '7d' }
    );

    console.log('Connexion réussie pour:', user.username);

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion'
    });
  }
});

// Route pour obtenir les informations de l'utilisateur connecté
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
});

// Route de déconnexion (optionnelle, côté client principalement)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

// Route de debug pour réinitialiser un mot de passe
router.post('/reset-password-debug', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email et nouveau mot de passe requis'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Hacher le nouveau mot de passe avec bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    console.log('Nouveau hash généré pour', email, ':', hashedPassword);

    // Mettre à jour le mot de passe
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });
  } catch (error) {
    console.error('Erreur réinitialisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation'
    });
  }
});

module.exports = router;