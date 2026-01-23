const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: { type: Date, required: true },
    clubId: String,
    clubName: String,
    college: String,
    description: String,
    location: String,
    coverImage: String,
    highlightsLink: String, // Google Drive link for past events
    specialGuests: [String],
    programs: [String], // List of programs/activities in the event
    xpReward: Number,
    type: {
        type: String,
        enum: ['workshop', 'competition', 'meetup', 'hackathon', 'cultural', 'sports'],
        default: 'meetup'
    },
    registrations: [{
        userId: String,
        name: String,
        email: String,
        program: String, // "Dance", "Singing", "General" etc.
        registeredAt: { type: Date, default: Date.now },
        comments: String
    }],
    stopRegistration: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false }
}, { timestamps: true });

eventSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
eventSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Event', eventSchema);
