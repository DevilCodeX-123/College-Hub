const mongoose = require('mongoose');

const faqItemSchema = new mongoose.Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
    order: { type: Number, default: 0 }
});

const faqCategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    icon: { type: String, default: 'HelpCircle' },
    order: { type: Number, default: 0 },
    items: [faqItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('FAQ', faqCategorySchema);
