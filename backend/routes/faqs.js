const express = require('express');
const router = express.Router();
const FAQ = require('../models/FAQ');

// GET all FAQs
router.get('/', async (req, res) => {
    try {
        const faqs = await FAQ.find().sort({ order: 1 });
        res.json(faqs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST create category
router.post('/categories', async (req, res) => {
    try {
        const { name, icon, order } = req.body;
        const category = new FAQ({ name, icon, order: order || 0, items: [] });
        await category.save();
        res.status(201).json(category);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT update category
router.put('/categories/:id', async (req, res) => {
    try {
        const category = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(category);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE category
router.delete('/categories/:id', async (req, res) => {
    try {
        await FAQ.findByIdAndDelete(req.params.id);
        res.json({ message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST add item to category
router.post('/categories/:id/items', async (req, res) => {
    try {
        const category = await FAQ.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        category.items.push(req.body);
        await category.save();
        res.status(201).json(category);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT update item in category
router.put('/categories/:categoryId/items/:itemId', async (req, res) => {
    try {
        const category = await FAQ.findById(req.params.categoryId);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        const item = category.items.id(req.itemId);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        Object.assign(item, req.body);
        await category.save();
        res.json(category);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE item from category
router.delete('/categories/:categoryId/items/:itemId', async (req, res) => {
    try {
        const category = await FAQ.findById(req.params.categoryId);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        category.items.pull(req.params.itemId);
        await category.save();
        res.json(category);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
