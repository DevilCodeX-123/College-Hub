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
        comments: String,
        registrationType: { type: String, enum: ['individual', 'team'], default: 'individual' },
        teamMembers: [{
            name: String,
            email: String
        }],
        // Payment proof fields
        paymentProofUrl: String,
        transactionId: String
    }],
    stopRegistration: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    // Detailed Completion Fields
    duration: String, // e.g., "10:00 AM - 4:00 PM"
    scope: {
        type: String,
        enum: ['Club Level', 'College Level', 'Inter-College'],
        default: 'Club Level'
    },
    organizingClub: String,
    collaboratingClubs: [String],
    chiefGuests: [{
        name: String,
        designation: String
    }],
    competitions: [String],
    winners: [{
        competition: String, // Which contest/activity this winner belongs to
        name: String,
        position: String,
        prize: String,
        isTeam: { type: Boolean, default: false }
    }],
    // Payment Configuration (Optional)
    paymentQRCode: String, // URL to QR code image
    paymentAmountIndividual: Number,
    paymentAmountTeam: Number
}, { timestamps: true });

eventSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
eventSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Event', eventSchema);
