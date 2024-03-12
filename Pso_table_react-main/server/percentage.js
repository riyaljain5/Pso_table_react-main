// PercentageModel.js
const mongoose = require('mongoose');

const percentageSchema = new mongoose.Schema({
    co: String,
    percentage_po: [Number],
    percentage_pso: [Number],
});

const PercentageModel = mongoose.model('Percentage', percentageSchema);

module.exports = PercentageModel;
