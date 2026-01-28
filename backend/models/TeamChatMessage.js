const mongoose = require('mongoose');

const teamChatMessageSchema = new mongoose.Schema({
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChallengeTeam', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for faster queries
teamChatMessageSchema.index({ teamId: 1, timestamp: -1 });

module.exports = mongoose.model('TeamChatMessage', teamChatMessageSchema);
