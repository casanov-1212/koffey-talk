// ===== scripts/seedDatabase.js =====
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Message = require('../models/Message');

const seedData = async () => {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp-clone');
    console.log('Connexion à MongoDB réussie');

    // Nettoyer les données existantes
    await User.deleteMany({});
    await Message.deleteMany({});
    console.log('Données existantes supprimées');

    // Créer des utilisateurs de test
    const users = [
      {
        username: 'alice',
        email: 'alice@example.com',
        password: 'Password123!',
        status: 'En ligne et disponible'
      },
      {
        username: 'bob',
        email: 'bob@example.com',
        password: 'Password123!',
        status: 'Occupé'
      },
      {
        username: 'charlie',
        email: 'charlie@example.com',
        password: 'Password123!',
        status: 'Ne pas déranger'
      }
    ];

    // Insérer les utilisateurs
    const createdUsers = await User.create(users);
    console.log(`${createdUsers.length} utilisateurs créés`);

    // Créer quelques messages de test
    const messages = [
      {
        sender: 'alice',
        recipient: 'bob',
        content: 'Salut Bob ! Comment ça va ?',
        messageType: 'text'
      },
      {
        sender: 'bob',
        recipient: 'alice',
        content: 'Salut Alice ! Ça va bien, merci !',
        messageType: 'text'
      },
      {
        sender: 'alice',
        recipient: 'charlie',
        content: 'Hey Charlie, tu es libre ce soir ?',
        messageType: 'text'
      }
    ];

    await Message.create(messages);
    console.log(`${messages.length} messages créés`);

    console.log('Données de test insérées avec succès !');
    console.log('Utilisateurs de test :');
    console.log('- alice@example.com / Password123!');
    console.log('- bob@example.com / Password123!');
    console.log('- charlie@example.com / Password123!');

    process.exit(0);
  } catch (error) {
    console.error('Erreur lors du seeding:', error);
    process.exit(1);
  }
};

seedData();
