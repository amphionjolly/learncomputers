// This is your secure backend server, now with logging!
// Copy and paste this into your 'server.js' file.

import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import 'dotenv/config';
import * as fs from 'fs'; // Import the File System module

const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Get the Secret API Key ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('FATAL ERROR: GEMINI_API_KEY is not defined.');
    console.log('Please create a .env file with GEMINI_API_KEY=YOUR_KEY');
    process.exit(1);
}

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

// --- The Architect's System Prompt (The "Brain") ---
const systemPrompt = `You are a world-class AI assistant acting as a Principal-level Software Architect and Mentor. Your name is Architect AI.
Your primary goal is to provide expert-level guidance, code, and explanations on all facets of Information Technology.
Core Directives:
1.  **Think like an Architect:** Consider scalability, maintainability, security, and performance.
2.  **Code Quality is Paramount:** Generate clean, robust, well-commented, and efficient code.
3.  **Provide Holistic Explanations:** Accompany code with logic, trade-offs, and edge cases.
4.  **Maintain Conversational Context:** Use the provided history to give context-aware responses.
5.  **Use Markdown:** Structure responses with Markdown, especially code blocks.`;

// --- Logging Setup ---

// Create a write stream for the log file. It will be created in the directory 
// where you run 'node server.js' (i.e., F:\learn-computers\backend).
const logFilePath = 'user_prompts.log';
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

// Function to log user prompts (used below in the API endpoint)
function logUserPrompt(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - USER: ${message}\n`;
    
    // Write the log entry to the stream
    try {
        logStream.write(logEntry);
    } catch (err) {
        console.error('Failed to write to log file:', err);
    }
}

// --- Your Server's API Endpoint ---
app.post('/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required.' });
        }

        // --- Log the user's prompt (THIS IS WHERE THE LOG IS TRIGGERED) ---
        logUserPrompt(message);
        // --- End of logging feature ---

        const updatedHistory = [
            ...history,
            { role: 'user', parts: [{ text: message }] }
        ];

        const payload = {
            contents: updatedHistory,
            tools: [{ "google_search": {} }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
        };

        // ... [Rest of the API call logic remains the same] ...
        const apiResponse = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error('Google API Error:', errorText);
            return res.status(apiResponse.status).json({ error: `Google API Error: ${errorText}` });
        }

        const result = await apiResponse.json();
        const candidate = result.candidates?.[0];

        if (!candidate || !candidate.content?.parts?.[0]?.text) {
            console.error('Unexpected API response structure:', result);
            return res.status(500).json({ error: 'Invalid response structure from Google API.' });
        }

        const botResponseText = candidate.content.parts[0].text;

        const finalHistory = [
            ...updatedHistory,
            { role: 'model', parts: [{ text: botResponseText }] }
        ];
        
        let sources = [];
        const groundingMetadata = candidate.groundingMetadata;
        if (groundingMetadata && groundingMetadata.groundingAttributions) {
            sources = groundingMetadata.groundingAttributions
                .map(attr => ({ uri: attr.web?.uri, title: attr.web?.title }))
                .filter(src => src.uri && src.title);
        }

        res.json({
            response: {
                text: botResponseText,
                sources: sources
            },
            history: finalHistory
        });

    } catch (error) {
        console.error('Error in /chat endpoint:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Secure proxy server running on http://localhost:${PORT}`);
    console.log(`Logging user prompts to ${logFilePath}`);
});
