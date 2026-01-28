const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    type: String, // e.g., 'Web', 'App', 'Hardware', 'Other'
    projectTypeDescription: String, // For 'Other' type
    teamName: String,
    memberLimit: { type: Number, default: 4 },
    problemStatement: String,
    idea: String,
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // User ID of creator
    joinCode: { type: String, unique: true, sparse: true }, // PRIVATE: Only visible to members
    isPublicChallenge: { type: Boolean, default: false }, // If true, Problem Statement is public
    joinRequests: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: String,
        skills: String,
        experiences: String,
        comments: String,
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
        requestedAt: { type: Date, default: Date.now }
    }],
    clubId: String,
    clubName: String,
    college: String,
    progress: { type: Number, default: 0 },
    team: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of User IDs (populated)
    deadline: Date,
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'on_hold', 'rejected'],
        default: 'pending'
    },
    timeGoals: [{
        title: { type: String, required: true },
        description: String,
        deadline: { type: Date, required: true },
        status: { type: String, enum: ['pending', 'submitted', 'approved', 'rejected', 'completed'], default: 'pending' },
        assignedType: { type: String, enum: ['all', 'specific'], default: 'specific' },
        assignees: [{ type: String }], // Array of User IDs
        completedBy: [{ type: String }], // Member IDs who marked it as done
        submissionLink: String,
        submissionTitle: String,
        submissionDescription: String,
        submissionKey: String,
        requirementKey: String,
        completedAt: Date,
        createdAt: { type: Date, default: Date.now }
    }],
    resources: [{
        title: { type: String, required: true },
        description: String,
        url: { type: String, required: true },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedByName: String,
        addedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

projectSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
projectSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Project', projectSchema);
