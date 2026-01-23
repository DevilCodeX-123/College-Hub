const express = require('express');
const router = express.Router();
const Note = require('../models/Note');

// GET all notes for a specific college
router.get('/', async (req, res) => {
    try {
        const { college } = req.query;
        let query = {};
        if (college) {
            query.college = college;
        }
        const notes = await Note.find(query).sort({ createdAt: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET only public notes for a specific college (for students)
router.get('/public', async (req, res) => {
    try {
        const { college } = req.query;
        if (!college) {
            return res.status(400).json({ message: 'College name is required' });
        }
        const notes = await Note.find({ college, isPublic: true }).sort({ createdAt: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CREATE a new note
router.post('/', async (req, res) => {
    try {
        const { title, link, description, isPublic, college, userId } = req.body;
        const note = new Note({
            title,
            link,
            description,
            isPublic,
            college,
            uploadedBy: userId
        });
        const newNote = await note.save();
        res.status(201).json(newNote);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// UPDATE a note
router.put('/:id', async (req, res) => {
    try {
        const note = await Note.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }
        res.json(note);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE a note
router.delete('/:id', async (req, res) => {
    try {
        const note = await Note.findByIdAndDelete(req.params.id);
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }
        res.json({ message: 'Note deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
