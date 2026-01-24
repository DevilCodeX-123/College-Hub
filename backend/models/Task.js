const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    pointsReward: { type: Number, default: 50 },
    category: { type: String, enum: ['daily', 'academic', 'club', 'other'], default: 'daily' },
    clubId: String,
    clubName: String,
    targetType: { type: String, enum: ['all', 'club', 'specific'], default: 'all' },
    targetEmails: [String],
    college: String,
    createdBy: String,
    isPermanent: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

taskSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
taskSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Task', taskSchema);
