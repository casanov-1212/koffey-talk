// ===== server.js COMPLET CORRIGÉ FINAL =====
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('./middleware/auth');

const connectDB = require('./config/database');
// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  console.log('Erreur non gérée:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.log('Exception non capturée:', err.message);
  process.exit(1);
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

console.log('Serveur WhatsApp complet avec Socket.IO...');
connectDB();

// =================================
// VARIABLES GLOBALES
// =================================
const connectedUsers = new Map();

// Rendre io et connectedUsers disponibles
app.set('io', io);
app.set('connectedUsers', connectedUsers);

// =================================
// MIDDLEWARES GLOBAUX
// =================================
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Middleware debug
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// =================================
// CONFIGURATION MULTER
// =================================
const uploadsDir = './uploads/avatars';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Modifiez la configuration Multer (autour de la ligne 68) :
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/avatars/');
  },
  filename: (req, file, cb) => {
    // Générer un nom unique sans dépendre de req.user
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

// =================================
// ROUTES PRINCIPALES
// =================================

// Routes d'authentification (UNE SEULE FOIS)
app.use('/api/auth', require('./routes/authRoutes'));

// Routes d'administration  
app.use('/api/admin', require('./routes/adminRoutes'));

// Routes de messages - CORRIGÉ
app.use('/api/messages', require('./routes/messageRoutes'));

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Serveur WhatsApp complet fonctionnel',
    timestamp: new Date().toISOString()
  });
});

app.get('/fix-admin-status', async (req, res) => {
  const User = require('./models/User');
  await User.updateOne(
    {email: 'admin@test.com'}, 
    {accountStatus: 'approved'}
  );
  res.json({success: true, message: 'Admin status fixed'});
});

// Route de debug temporaire
app.get('/debug-users', async (req, res) => {
  try {
    const User = require('./models/User');
    const users = await User.find({}).select('-password');
    res.json({ users });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Route temporaire pour broadcast
app.post('/api/admin/broadcast-message', async (req, res) => {
  try {
    const { message } = req.body;
    console.log('Broadcast message reçu:', message);
    res.json({ success: true, message: 'Message diffusé (simulation)' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route temporaire pour message individuel  
app.post('/api/admin/send-message', async (req, res) => {
  try {
    const { recipient, message } = req.body;
    console.log('Message individuel:', { recipient, message });
    res.json({ success: true, message: 'Message envoyé (simulation)' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================
// ROUTES DE FIX (TEMPORAIRES)
// =================================

// ROUTE GET pour fix admin (navigateur)
app.get('/fix-admin', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const User = require('./models/User');
    
    console.log('=== FIX ADMIN PASSWORD ===');
    
    // Vérifier si admin existe
    const admin = await User.findOne({email: 'admin@test.com'});
    if (!admin) {
      return res.json({
        success: false,
        message: 'Admin user not found',
        tip: 'Create admin user first'
      });
    }
    
    // Générer nouveau hash
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);
    
    console.log('Ancien hash:', admin.password);
    console.log('Nouveau hash:', hash);
    
    // Mettre à jour admin
    const result = await User.updateOne(
      {email: 'admin@test.com'}, 
      {$set: {password: hash}}
    );
    
    console.log('Résultat update:', result);
    
    res.json({
      success: true, 
      message: 'Mot de passe admin corrigé avec bcryptjs!',
      oldHash: admin.password.substring(0, 20) + '...',
      newHash: hash.substring(0, 20) + '...',
      result: result
    });
  } catch (error) {
    console.error('Erreur fix admin:', error);
    res.json({success: false, error: error.message});
  }
});

// ROUTE POST pour reset password debug
app.post('/api/auth/reset-password-debug', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const User = require('./models/User');
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email et nouveau mot de passe requis'
      });
    }
    
    const user = await User.findOne({email});
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    
    await User.updateOne({email}, {password: hash});
    
    res.json({
      success: true, 
      message: 'Mot de passe réinitialisé avec succès!'
    });
  } catch (error) {
    console.error('Erreur reset password:', error);
    res.status(500).json({
      success: false, 
      error: error.message
    });
  }
});

// ROUTE pour créer admin si inexistant
app.get('/create-admin', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const User = require('./models/User');
    
    // Vérifier si admin existe déjà
    const existingAdmin = await User.findOne({email: 'admin@test.com'});
    if (existingAdmin) {
      return res.json({
        success: false,
        message: 'Admin already exists',
        tip: 'Use /fix-admin to fix password'
      });
    }
    
    // Créer admin
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);
    
    const admin = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: hash,
      role: 'admin',
      status: 'approved'
    });
    
    res.json({
      success: true,
      message: 'Admin créé avec succès!',
      admin: {
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Erreur création admin:', error);
    res.json({success: false, error: error.message});
  }
});

// Routes messages
app.get('/api/messages/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Terme de recherche requis'
      });
    }

    const User = require('./models/User');
    const users = await User.find({
      username: { $regex: query, $options: 'i' }
    }).select('-password').limit(10);

    res.json({ success: true, users: users });
  } catch (error) {
    console.error('Erreur recherche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche'
    });
  }
});

// Route pour voir les connexions actives
app.get('/debug-connections', (req, res) => {
  const connections = Array.from(connectedUsers.entries());
  res.json({
    connectedUsers: connections,
    count: connections.length,
    usernames: Array.from(connectedUsers.keys())
  });
});

// Route avatar - VERSION CORRIGÉE
app.post('/api/user/avatar', authenticateToken, (req, res) => {
  console.log('Route avatar atteinte, utilisateur:', req.user.username);
  
  avatarUpload.single('avatar')(req, res, async (err) => {
    if (err) {
      console.error('Erreur upload:', err);
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });
    }

    try {
      const User = require('./models/User');
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl });

      res.json({
        success: true,
        message: 'Avatar mis à jour avec succès',
        avatarUrl: avatarUrl
      });
    } catch (error) {
      console.error('Erreur sauvegarde avatar:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la sauvegarde' });
    }
  });
});
// Route pour supprimer l'avatar
app.delete('/api/user/avatar', authenticateToken, async (req, res) => {
  try {
    const User = require('./models/User');
    
    // Récupérer l'ancien avatar pour le supprimer du système de fichiers
    const user = await User.findById(req.user._id);
    const oldAvatar = user.avatar;
    
    // Supprimer l'avatar de la base de données
    await User.findByIdAndUpdate(req.user._id, { avatar: null });
    
    // Optionnel : supprimer le fichier physique
    if (oldAvatar) {
      const fs = require('fs');
      const filePath = `./uploads/avatars/${path.basename(oldAvatar)}`;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.json({
      success: true,
      message: 'Avatar supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression avatar:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la suppression' 
    });
  }
});
// =================================
// GESTION SOCKET.IO
// =================================

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Token manquant'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre-secret-jwt-changez-moi-en-production');
    const User = require('./models/User');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(new Error('Utilisateur non trouvé'));
    }

    socket.userId = user._id.toString();
    socket.username = user.username;
    next();
  } catch (error) {
    next(new Error('Token invalide'));
  }
});

io.on('connection', async (socket) => {
  console.log(`🟢 Utilisateur connecté: ${socket.username}`);

  connectedUsers.set(socket.username, socket.id);

  const User = require('./models/User');
  await User.findByIdAndUpdate(socket.userId, {
    isOnline: true,
    lastSeen: new Date()
  });

  socket.broadcast.emit('user_online', {
    username: socket.username,
    isOnline: true
  });

  // GESTION DES MESSAGES EN TEMPS RÉEL
  socket.on('send_message', async (data) => {
    try {
      console.log('Message reçu via Socket.IO:', data);
      const Message = require('./models/Message');
      const { recipient, content, messageType = 'text' } = data;
      
      // Sauvegarder en base
      const message = await Message.create({
        sender: socket.username,
        recipient,
        content,
        messageType
      });

      console.log('Message sauvegardé:', message);

      // Envoyer confirmation à l'expéditeur
      socket.emit('message_sent', message);

      // Envoyer au destinataire s'il est connecté
      const recipientSocketId = connectedUsers.get(recipient);
      if (recipientSocketId) {
        console.log(`Envoi du message à ${recipient} (socket: ${recipientSocketId})`);
        io.to(recipientSocketId).emit('receive_message', message);
      } else {
        console.log(`${recipient} n'est pas connecté`);
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      socket.emit('message_error', { error: error.message });
    }
  });

  socket.on('disconnect', async () => {
    console.log(`🔴 Utilisateur déconnecté: ${socket.username}`);
    connectedUsers.delete(socket.username);

    await User.findByIdAndUpdate(socket.userId, {
      isOnline: false,
      lastSeen: new Date()
    });

    socket.broadcast.emit('user_offline', {
      username: socket.username,
      isOnline: false,
      lastSeen: new Date()
    });
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log('=== SERVEUR WHATSAPP COMPLET SUR PORT ' + PORT + ' ===');
  console.log('- API REST disponible');
  console.log('- Socket.IO configuré');  
  console.log('- Base de données connectée');
  console.log('- CORS configuré pour http://localhost:3000');
  console.log('- ROUTES DE FIX DISPONIBLES:');
  console.log('  * GET /fix-admin (pour corriger le mot de passe admin)');
  console.log('  * GET /create-admin (pour créer un admin si inexistant)');
  console.log('  * POST /api/auth/reset-password-debug');
});

module.exports = app;