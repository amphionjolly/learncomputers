const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  title: String,
  content: String,
  answers: [{ content: String, user: String, likes: Number }],
  user: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', QuestionSchema);
