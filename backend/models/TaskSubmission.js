const mongoose = require('mongoose');

const taskSubmissionSchema = new mongoose.Schema({
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    userId: { type: String, required: true },
    userName: String,
    taskTitle: String,
    submissionLink: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    pointsAwarded: { type: Number, default: 0 },
    feedback: String,
    reviewedBy: String,
    reviewedAt: Date
}, { timestamps: true });

taskSubmissionSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
taskSubmissionSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('TaskSubmission', taskSubmissionSchema);
