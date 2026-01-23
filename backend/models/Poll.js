const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: [{
        text: { type: String, required: true },
        votes: { type: Number, default: 0 }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    },
    votedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    targetRoles: [{
        type: String,
        enum: ['student', 'club_member', 'core_member', 'club_coordinator', 'club_co_coordinator', 'club_head', 'admin', 'co_admin', 'all'],
        default: 'all'
    }],
    college: {
        type: String,
        default: null
    },
    specificEmails: [{
        type: String
    }],
    clubId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        default: null
    },
    expiresAt: {
        type: Date,
        default: null
    },
    isRatingPoll: {
        type: Boolean,
        default: false
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Poll', pollSchema);
