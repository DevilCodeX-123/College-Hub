const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    pointsReward: { type: Number, default: 50 },
    category: { type: String, enum: ['daily', 'academic', 'club', 'operational', 'other'], default: 'daily' },
    clubId: String,
    clubName: String,
    targetType: { type: String, enum: ['all', 'club', 'specific'], default: 'all' },
    targetEmails: [String],
    college: String,
    createdBy: String,
    deadline: Date,
    isMandatory: { type: Boolean, default: true },
    isPermanent: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

taskSchema.pre('save', function (next) {
    if (this.status === 'active' && this.deadline) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (this.deadline < today) {
            this.status = 'inactive';
        }
    }
    next();
});

taskSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
taskSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Task', taskSchema);
