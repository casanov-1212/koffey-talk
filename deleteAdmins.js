const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/database');
const User = require('./models/User');

const deleteAllAdmins = async () => {
  try {
    await connectDB();
    
    const result = await User.deleteMany({ role: 'admin' });
    
    console.log(`${result.deletedCount} administrateur(s) supprimé(s)`);
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
};

deleteAllAdmins();