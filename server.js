require('dotenv').config();

const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.post('/api/summarize', async (req, res) => {
    try {
        const { transcript, prompt } = req.body;

        if (!transcript || !prompt) {
            return res.status(400).json({ error: 'Transcript and prompt are required.' });
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: `Here is a text transcript: "${transcript}". Please respond with a summary of the transcript based on this prompt: "${prompt}".`
                }
            ],
            model: "llama-3.1-8b-instant"
        });

        const summary = chatCompletion.choices[0]?.message?.content || "";

        res.json({ summary });
    } catch (error) {
        console.error('Error generating summary:', error);
        res.status(500).json({ error: 'Failed to generate summary.' });
    }
});

app.post('/api/share', async (req, res) => {
    try {
        const { summary, recipients } = req.body;

        if (!summary || !recipients) {
            return res.status(400).json({ error: 'Summary and recipients are required.' });
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipients.join(', '),
            subject: 'AI Meeting Notes Summary',
            text: `Hello, \n\nHere is a summary of the meeting notes:\n\n${summary}`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Email sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});