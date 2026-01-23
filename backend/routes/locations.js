const express = require('express');
const router = express.Router();
const CampusLocation = require('../models/CampusLocation');

// GET all locations for a specific college
router.get('/', async (req, res) => {
    try {
        const { college } = req.query;
        let query = {};
        if (college) {
            query.college = college;
        }
        const locations = await CampusLocation.find(query).sort({ createdAt: -1 });
        res.json(locations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CREATE a new location
router.post('/', async (req, res) => {
    try {
        const { name, googleMapsLink, college, category, description, userId } = req.body;
        const location = new CampusLocation({
            name,
            googleMapsLink,
            college,
            category: category || 'General',
            description: description || '',
            uploadedBy: userId
        });
        const newLocation = await location.save();
        res.status(201).json(newLocation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE a location
router.delete('/:id', async (req, res) => {
    try {
        const location = await CampusLocation.findByIdAndDelete(req.params.id);
        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }
        res.json({ message: 'Location deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
