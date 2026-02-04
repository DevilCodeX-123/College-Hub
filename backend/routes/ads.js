const express = require('express');
const router = express.Router();
const Ad = require('../models/Ad');
const User = require('../models/User');

// Middleware to check if user is owner
const isOwner = async (req, res, next) => {
    try {
        const user = await User.findById(req.body.requestingUserId || req.query.requestingUserId);
        if (user && user.role === 'owner') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied. Owner only.' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @route   POST api/ads
// @desc    Create a new ad
// @access  Owner
router.post('/', isOwner, async (req, res) => {
    try {
        const newAd = new Ad(req.body);
        const ad = await newAd.save();
        res.status(201).json(ad);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   GET api/ads
// @desc    Get ads (All approved for Owner, My ads for others)
// @access  Authenticated
router.get('/', async (req, res) => {
    try {
        const { requestingUserId } = req.query;
        if (!requestingUserId) {
            return res.status(400).json({ message: 'requestingUserId is required' });
        }

        const user = await User.findById(requestingUserId);
        let query = { requestedBy: requestingUserId };

        if (user && user.role === 'owner') {
            // Owner sees all approved/rejected ads (history), pending is separate
            query = { status: { $ne: 'pending' } };
        }

        const ads = await Ad.find(query)
            .populate({
                path: 'requestedBy',
                select: 'name email college role joinedClubs',
                populate: {
                    path: 'joinedClubs',
                    select: 'name'
                }
            })
            .sort({ createdAt: -1 });
        res.json(ads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   GET api/ads/pending
// @desc    Get all pending ad requests
// @access  Owner
router.get('/pending', isOwner, async (req, res) => {
    try {
        const ads = await Ad.find({ status: 'pending' }).populate('requestedBy', 'name email college role').sort({ createdAt: -1 });
        res.json(ads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST api/ads/request
// @desc    Request a new ad
// @access  Admin, Coordinator, Secretary
router.post('/request', async (req, res) => {
    try {
        const { requestingUserId } = req.body;
        const user = await User.findById(requestingUserId);
        if (!user || !['admin', 'club_coordinator', 'club_head'].includes(user.role)) {
            return res.status(403).json({ message: 'Only Admins, Coordinators, and Secretaries can request ads.' });
        }

        const newAd = new Ad({
            ...req.body,
            status: 'pending',
            paymentStatus: 'pending',
            requestedBy: requestingUserId,
            isActive: false // Pending ads are not active
        });
        const ad = await newAd.save();
        res.status(201).json(ad);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   PUT api/ads/:id/status
// @desc    Approve or Reject an ad request
// @access  Owner
router.put('/:id/status', isOwner, async (req, res) => {
    try {
        const { status, rejectionReason, paymentStatus } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const updateData = {
            status,
            rejectionReason,
            isActive: status === 'approved' // Automatically activate if approved
        };

        if (paymentStatus) {
            updateData.paymentStatus = paymentStatus;
        }

        const ad = await Ad.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!ad) return res.status(404).json({ message: 'Ad not found' });
        res.json(ad);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   GET api/ads/active
// @desc    Get active ads for user's college
// @access  Public
router.get('/active', async (req, res) => {
    try {
        const { college } = req.query;

        // Find ads that are active and either:
        // 1. targetingType is 'worldwide'
        // 2. targetingType is 'college' (shows to all colleges in this context usually, but we check if user's college matches if provided)
        // 3. targetingType is 'specific_colleges' and user's college is in the list

        const query = {
            isActive: true,
            status: 'approved',
            $or: [
                { targetingType: 'worldwide' }
            ],
            $expr: { $lt: ["$totalViewsCount", "$maxTotalViews"] }
        };

        // Page targeting filter
        const { page, clubId } = req.query;
        if (page) {
            query.$or.push({ targetPages: 'all' }, { targetPages: page });
        } else {
            // If no page specified, assume 'all' or no specific page restriction
            // But we'll usually provide page from frontend
        }

        if (clubId) {
            query.$or.push({ targetClubs: clubId });
        }

        if (college) {
            query.$or.push(
                { targetingType: 'college' }, // Assume 'college' means all colleges for now if not 'worldwide'
                {
                    targetingType: 'specific_colleges',
                    targetColleges: college
                }
            );
        }

        const ads = await Ad.find(query);
        res.json(ads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   PUT api/ads/:id
// @desc    Update an ad
// @access  Owner
router.put('/:id', isOwner, async (req, res) => {
    try {
        const ad = await Ad.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!ad) return res.status(404).json({ message: 'Ad not found' });
        res.json(ad);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE api/ads/:id
// @desc    Delete an ad
// @access  Owner
router.delete('/:id', isOwner, async (req, res) => {
    try {
        const ad = await Ad.findByIdAndDelete(req.params.id);
        if (!ad) return res.status(404).json({ message: 'Ad not found' });
        res.json({ message: 'Ad deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST api/ads/:id/view
// @desc    Increment total view count for an ad
// @access  Public
router.post('/:id/view', async (req, res) => {
    try {
        const ad = await Ad.findByIdAndUpdate(req.params.id, { $inc: { totalViewsCount: 1 } }, { new: true });
        if (!ad) return res.status(404).json({ message: 'Ad not found' });
        res.json({ totalViewsCount: ad.totalViewsCount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST api/ads/:id/view
// @desc    Increment view count for an ad
// @access  Public
router.post('/:id/view', async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);
        if (!ad) {
            return res.status(404).json({ message: 'Ad not found' });
        }

        ad.totalViewsCount += 1;

        // Check if max views reached
        if (ad.totalViewsCount >= ad.maxTotalViews) {
            ad.isActive = false;
        }

        await ad.save();
        res.json({ views: ad.totalViewsCount, isActive: ad.isActive });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
