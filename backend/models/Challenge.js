const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    clubId: { type: String, required: true },
    clubName: String,
    points: { type: Number, default: 200 }, // Awarded on completion
    entryFee: { type: Number, default: 100 }, // Required to join
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    deadline: Date,
    participants: { type: Number, default: 0 },
    joinCode: { type: String, unique: true, sparse: true },
    status: {
        type: String,
        enum: ['active', 'completed', 'upcoming'],
        default: 'active'
    },
    phases: [{
        name: String, // e.g. "Phase 1", "Submission 1"
        deadline: Date,
        description: String
    }],
    category: String,
    isTeamChallenge: { type: Boolean, default: false },
    minTeamSize: { type: Number, default: 1 },
    maxTeamSize: { type: Number, default: 4 },
    prizes: { type: String }, // Description of prizes (e.g., "1st: T-Shirt, 2nd: Swag")
    submissions: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        userName: String,
        phaseId: { type: mongoose.Schema.Types.ObjectId }, // Track which phase this belongs to
        submissionLink: String,
        submittedAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        marks: { type: Number, min: 0, max: 100 }, // Marks out of 100
        feedback: String, // Optional feedback from admin
        reviewedAt: Date,
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
}, { timestamps: true });

challengeSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
challengeSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Challenge', challengeSchema);
