const mongoose = require('mongoose');

const challengeTeamSchema = new mongoose.Schema({
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
    name: { type: String, required: true },
    leaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    joinCode: { type: String, unique: true, required: true },
    status: {
        type: String,
        enum: ['active', 'completed'],
        default: 'active'
    }
}, { timestamps: true });

module.exports = mongoose.model('ChallengeTeam', challengeTeamSchema);
