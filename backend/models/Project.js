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
    team: [String], // Array of User IDs
    deadline: Date,
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'on_hold', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true });

projectSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
projectSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Project', projectSchema);
