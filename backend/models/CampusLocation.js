const mongoose = require('mongoose');

const CampusLocationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    googleMapsLink: {
        type: String,
        required: true
    },
    college: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: 'General'
    },
    description: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'busy', 'full'],
        default: 'active'
    },
    occupancy: {
        type: String,
        default: '0%'
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CampusLocation', CampusLocationSchema);
