const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
    name: { type: String, required: true },
    college: { type: String, required: true },
    description: String,
    logo: String,
    banner: String,
    coverImage: String,
    memberCount: { type: Number, default: 0 },
    points: { type: Number, default: 0 }, // Accumulated points for ranking
    monthlyPoints: { type: Number, default: 0 }, // Monthly points for ranking
    category: String,
    coordinator: String,
    coordinatorId: String, // Link to User ID
    socialLinks: {
        instagram: String,
        linkedin: String,
        website: String
    },
    tagline: String,
    vision: String,
    mission: String,
    contactEmail: String,
    contactPhone: String,
    gallery: [String],
    coreTeam: [{
        userId: String,
        name: String,
        role: String,
        customTitle: String
    }],
    pendingMembers: [{
        userId: String,
        name: String,
        email: String,
        requestedAt: { type: Date, default: Date.now }
    }],
    achievements: [{
        title: String,
        description: String,
        icon: String,
        earnedAt: Date,
        location: String,
        rank: String,
        driveLink: String,
        // Detailed Fields
        organizingClub: String,
        collaboratingClubs: [String],
        chiefGuests: [{
            name: String,
            designation: String
        }],
        competitions: [String],
        winners: [{
            name: String,
            position: String,
            prize: String
        }]
    }],
    joiningDeadline: Date,
    history: [{
        type: { type: String, enum: ['challenge', 'event'] },
        title: String,
        date: Date,
        description: String,
        link: String,
        coverImage: String,
        challengeId: String, // Link to original Challenge ID
        // Detailed Fields
        organizingClub: String,
        collaboratingClubs: [String],
        chiefGuests: [{
            name: String,
            designation: String
        }],
        competitions: [String],
        driveLink: String,
        winners: [{
            name: String,
            position: String,
            prize: String
        }],
        // Challenge Specifics
        category: String,
        points: Number,
        leaderboard: [{
            userId: String,
            name: String,
            avatar: String,
            rank: Number,
            score: Number,
            submissionLink: String,
            feedback: String
        }],
        location: String,
        duration: String, // e.g., "10:00 AM - 4:00 PM"
        participantCount: Number,
        scope: {
            type: String,
            enum: ['Club', 'College', 'Inter-College'],
            default: 'Club'
        }
    }],
    challengeSuggestions: [{
        title: String,
        description: String,
        points: { type: Number, default: 100 },
        difficulty: String,
        suggestedBy: {
            userId: String,
            userName: String
        },
        suggestedAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
    }],
    pointsHistory: [{
        amount: Number,
        reason: String,
        timestamp: { type: Date, default: Date.now },
        sourceId: String,
        sourceType: { type: String, enum: ['challenge', 'project', 'event', 'bonus'] }
    }]
}, { timestamps: true });

// Convert _id to id for frontend compatibility
clubSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
clubSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Club', clubSchema);
