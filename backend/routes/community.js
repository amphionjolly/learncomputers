const express = require('express');
const router = express.Router();
const Question = require('../models/Question');

// Get all questions
router.get('/', async (req,res)=>{
  const questions = await Question.find().sort({createdAt:-1});
  res.json(questions);
});

// Post question
router.post('/', async (req,res)=>{
  const q = new Question(req.body);
  await q.save();
  res.json(q);
});

// Post answer
router.post('/:id/answer', async (req,res)=>{
  const q = await Question.findById(req.params.id);
  q.answers.push(req.body);
  await q.save();
  res.json(q);
});

module.exports = router;
