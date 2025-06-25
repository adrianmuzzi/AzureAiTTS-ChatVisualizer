require('dotenv').config(); 
// Loads environment variables from a .env file into process.env

const express = require('express'); 
// Web framework for building API endpoints and handling HTTP requests

const cors = require('cors'); 
// Middleware to enable Cross-Origin Resource Sharing (CORS)

const axios = require('axios'); 
// HTTP client used to make API calls (e.g., to Azure TTS service)

const { AIProjectClient } = require('@azure/ai-projects'); 
// Azure AI Foundry client to interact with your AI project (e.g., to send prompts and receive completions)

const { DefaultAzureCredential } = require('@azure/identity'); 
// Auth mechanism that works with managed identity, Visual Studio, Azure CLI, etc.

// Initialize Express app
const app = express();
app.use(cors()); // Allow requests from other origins (frontend)
app.use(express.json()); // Automatically parse JSON bodies in requests

// Load environment variables for Azure AI Foundry and TTS
const AZURE_AI_ENDPOINT = process.env.AZURE_AI_ENDPOINT;
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_REGION = process.env.AZURE_REGION;

// Set up Azure AI Foundry client using DefaultAzureCredential
const credential = new DefaultAzureCredential(); 
const client = new AIProjectClient(AZURE_AI_ENDPOINT, credential); 
const deploymentName = 'gpt-4o'; // Model to use (must match Azure deployment name)

// POST /ask — handle chat prompt submission and get response from Azure AI
app.post('/ask', async (req, res) => {
  const { prompt } = req.body;

  try {
    // Create a client for model inference using Azure OpenAI-style API
    const inferenceClient = await client.inference.azureOpenAI({
      apiVersion: '2024-10-21', // API version for Azure Foundry
    });

    // Send chat completion request to model
    const response = await inferenceClient.chat.completions.create({
      model: deploymentName, // Azure deployment name (gpt-4o)
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract model's response text from API response
    const reply = response.choices?.[0]?.message?.content ?? 'No response';
    res.json({ reply }); // Send the reply back to the frontend
  } catch (err) {
    console.error('Error getting response from model:', err);
    res.status(500).send('Failed to get response'); // Error fallback
  }
});

// POST /api/tts — converts text to speech using Azure Cognitive Services
app.post('/api/tts', async (req, res) => {
  const { text, voiceName = 'en-US-JennyNeural' } = req.body;

  // Construct Speech Synthesis Markup Language (SSML)
  const ssml = `
    <speak version='1.0' xml:lang='en-US'>
      <voice xml:lang='en-US' xml:gender='Female' name='${voiceName}'>
        ${text}
      </voice>
    </speak>`;

  try {
    // Send POST request to Azure TTS API
    const ttsResponse = await axios({
      method: 'POST',
      url: `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY, // Azure Speech API key
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', // Output audio quality
        'User-Agent': 'azure-tts-react-demo',
      },
      data: ssml,
      responseType: 'arraybuffer', // Expect audio binary data
    });

    // Set response type to audio for frontend playback
    res.set('Content-Type', 'audio/mpeg');
    res.send(ttsResponse.data); // Send raw audio bytes
  } catch (err) {
    // Log detailed error message
    console.error('Azure TTS error:', err.response?.data || err.message);
    res.status(500).send('Azure TTS failed');
  }
});

// Start backend server on port 3001
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`Listening for requests...`);
});
