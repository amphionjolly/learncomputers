const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Signup
router.post('/signup', async (req,res)=>{
  const {email,password} = req.body;
  try{
    let user = await User.findOne({email});
    if(user) return res.status(400).json({msg:"User exists"});
    user = new User({email,password});
    await user.save();
    res.json({msg:"User created"});
  }catch(err){res.status(500).json({error:err.message})}
});

// Login
router.post('/login', async (req,res)=>{
  const {email,password} = req.body;
  try{
    const user = await User.findOne({email});
    if(!user) return res.status(400).json({msg:"Invalid credentials"});
    const isMatch = await bcrypt.compare(password,user.password);
    if(!isMatch) return res.status(400).json({msg:"Invalid credentials"});
    const token = jwt.sign({id:user._id}, process.env.JWT_SECRET,{expiresIn:'7d'});
    res.json({token,email:user.email});
  }catch(err){res.status(500).json({error:err.message})}
});

module.exports = router;
