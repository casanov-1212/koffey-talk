const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = require('./config/database');
const User = require('./models/User');

const createTestUser = async () => {
  try {
    await connectDB();
    
    // Vérifier si l'utilisateur test existe déjà
    const existingUser = await User.findOne({ email: 'test@test.com' });
    if (existingUser) {
      console.log('Utilisateur test existe déjà');
      process.exit(0);
    }
    
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    await User.create({
      username: 'testuser',
      email: 'test@test.com',
      password: hashedPassword,
      status: 'approved',  // Directement approuvé pour les tests
      role: 'user'
    });
    
    console.log('Utilisateur test créé avec succès !');
    console.log('Email: test@test.com');
    console.log('Mot de passe: test123');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la création:', error);
    process.exit(1);
  }
};

createTestUser();