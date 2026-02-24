// ===== models/Message.js =====
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: [true, 'L\'expéditeur est requis'],
    ref: 'User'
  },
  recipient: {
    type: String,
    required: [true, 'Le destinataire est requis'],
    ref: 'User'
  },
  content: {
    type: String,
    required: [true, 'Le contenu du message est requis'],
    maxlength: [1000, 'Le message ne peut pas dépasser 1000 caractères']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'audio'],
    default: 'text'
  },
  read: {
    type: Boolean,
    default: false
  },
  delivered: {
    type: Boolean,
    default: false
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, read: 1 });

module.exports = mongoose.model('Message', messageSchema);
