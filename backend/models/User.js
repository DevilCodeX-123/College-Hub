const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: String,
    role: {
        type: String,
        enum: ['owner', 'student', 'club_member', 'club_coordinator', 'club_co_coordinator', 'club_head', 'core_member', 'admin', 'co_admin'],
        default: 'student'
    },
    customTitle: { type: String }, // For custom titles like "Dean", "Principal", etc.
    college: String,
    branch: String,
    year: String,
    points: { type: Number, default: 0 },
    totalEarnedXP: { type: Number, default: 0 },
    weeklyXP: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [{
        name: String,
        icon: String,
        description: String,
        challengeName: String,
        clubName: String,
        earnedAt: { type: Date, default: Date.now }
    }],
    clubWeeklyBadges: [{
        clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
        clubName: String,
        rank: { type: Number, enum: [1, 2, 3] }, // 1 = Gold, 2 = Silver, 3 = Bronze
        weekStart: Date, // Monday of the week when badge was earned
        earnedAt: { type: Date, default: Date.now }
    }],
    joinedClubs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Club' }],
    blocked: {
        website: { type: Boolean, default: false },
        clubs: { type: Boolean, default: false },
        challenges: { type: Boolean, default: false }
    },
    primaryGoal: { type: String, default: 'Software Engineer' },
    secondaryGoal: { type: String, default: 'Tech Entrepreneur' },
    skills: { type: [String], default: ['Web Development', 'Problem Solving', 'Leadership'] },
    activity: [{
        type: { type: String, enum: ['challenge', 'project', 'event', 'club'] },
        refId: String,
        title: String,
        status: String,
        timestamp: { type: Date, default: Date.now }
    }],
    pointsHistory: [{
        amount: Number,
        reason: String,
        timestamp: { type: Date, default: Date.now },
        sourceId: String, // ID of challenge, project, etc.
        sourceType: { type: String, enum: ['challenge', 'project', 'event', 'bonus', 'initial'] },
        clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' }
    }],
    weeklyXPHistory: [{
        week: Date, // Monday of the week
        xp: Number,
        clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' }
    }],
    lastLoginDate: Date
}, { timestamps: true });

userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
userSchema.set('toJSON', {
    virtuals: true
});
userSchema.set('toObject', {
    virtuals: true
});

module.exports = mongoose.model('User', userSchema);
