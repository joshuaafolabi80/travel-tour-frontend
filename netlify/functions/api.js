// This file goes in: travel_tour_training(copy)/netlify/functions/api.js
// It's optional since we're using Heroku for the main backend

const express = require('express');
const serverless = require('serverless-http');

const app = express();

app.use(require('cors')());
app.use(require('express').json());

// Simple health check for Netlify functions
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Netlify function is working',
    timestamp: new Date().toISOString()
  });
});

// You can add simple serverless functions here if needed
app.get('/api/simple', (req, res) => {
  res.json({
    success: true,
    message: 'This is a simple serverless function'
  });
});

module.exports.handler = serverless(app);