const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    type: String, // e.g., 'Web', 'App', 'Hardware'
    memberLimit: { type: Number, default: 4 },
    problemStatement: String,
    idea: String,
    requestedBy: String, // User ID of creator
    joinCode: { type: String, unique: true, sparse: true },
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
        deadline: { type: Date, required: true },
        status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
        assigneeId: String,
        assigneeName: String,
        submissionLink: String,
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
