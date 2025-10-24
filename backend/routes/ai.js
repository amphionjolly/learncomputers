const express = require('express');
const router = express.Router();
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

router.post('/ask', async (req,res)=>{
  const {question} = req.body;
  const response = await openai.createChatCompletion({
    model: "gpt-4",
    messages:[{role:"user", content:question}]
  });
  res.json({answer: response.data.choices[0].message.content});
});

module.exports = router;
