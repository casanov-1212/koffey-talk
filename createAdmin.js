const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = require('./config/database');
const User = require('./models/User');

const createAdmin = async () => {
  try {
    await connectDB();

    // Supprimer complètement l'admin existant
    await User.deleteMany({ 
      $or: [{ email: 'admin@test.com' }, { username: 'admin' }] 
    });
    console.log('Admin existant supprimé');

    const plainPassword = 'admin123';
    
    // Utiliser le même processus que votre route register
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    console.log('Nouveau hash généré:', hashedPassword);

    // Créer l'admin
    await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin',
      status: 'approved',
      approvedAt: new Date()
    });

    // Test immédiat
    const testResult = await bcrypt.compare(plainPassword, hashedPassword);
    console.log('Test de vérification:', testResult);

    if (testResult) {
      console.log('✅ Admin créé avec succès !');
    } else {
      console.log('❌ Erreur dans la création du hash');
    }

    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
};

createAdmin();