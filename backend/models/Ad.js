const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved' // Default to approved for ads created directly by owner
    },
    rejectionReason: {
        type: String
    },
    type: {
        type: String,
        enum: ['image', 'video'],
        required: true
    },
    url: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        default: 5 // Default 5 seconds for image ads
    },
    skipDelay: {
        type: Number,
        default: 3 // Default 3 seconds before skip button appears for videos
    },
    frequencyPerUser: {
        type: Number,
        default: 1
    },
    frequencyInterval: {
        type: Number,
        default: 24 // Default 24 hours between views for the same user
    },
    maxTotalViews: {
        type: Number,
        default: 1000 // Default total reach limit
    },
    totalViewsCount: {
        type: Number,
        default: 0
    },
    targetingType: {
        type: String,
        enum: ['worldwide', 'college', 'specific_colleges'],
        default: 'worldwide'
    },
    targetColleges: [{
        type: String
    }],
    targetClubs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club'
    }],
    targetPages: [{
        type: String,
        enum: ['all', 'dashboard', 'clubs', 'club_detail', 'challenges', 'projects', 'leaderboard', 'events', 'profile']
    }],
    clickUrl: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Payment Fields
    transactionId: {
        type: String
    },
    screenshotUrl: {
        type: String
    },
    amountPaid: {
        type: Number
    },
    totalRequiredAmount: {
        type: Number
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'verified', 'failed'],
        default: 'pending'
    }
});

module.exports = mongoose.model('Ad', AdSchema);
