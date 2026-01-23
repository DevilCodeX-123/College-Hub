const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    clubId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: false
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: false
    },
    type: {
        type: String,
        enum: ['text', 'system'],
        default: 'text'
    }
}, { timestamps: true });

messageSchema.pre('save', function (next) {
    if (!this.clubId && !this.projectId) {
        return next(new Error('A message must belong to either a club or a project.'));
    }
    next();
});

messageSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Message', messageSchema);
