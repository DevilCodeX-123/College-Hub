const mongoose = require('mongoose');

const PlatformConfigSchema = new mongoose.Schema({
    adPaymentEnabled: { type: Boolean, default: false },

    // Pricing Rules (Per 100 Views)
    // Image Ads
    minSelfCollegePrice: { type: Number, default: 0 },
    specificCollegePrice: { type: Number, default: 0 },
    worldwidePrice: { type: Number, default: 0 },

    // Video Ads
    minSelfCollegeVideoPrice: { type: Number, default: 0 },
    specificCollegeVideoPrice: { type: Number, default: 0 },
    worldwideVideoPrice: { type: Number, default: 0 },

    qrCodeUrl: { type: String, default: '' },
    paymentWarning: {
        type: String,
        default: 'Please ensure you pay the correct amount. Incorrect payments may result in ad rejection without refund.'
    }
}, { timestamps: true });

module.exports = mongoose.model('PlatformConfig', PlatformConfigSchema);
