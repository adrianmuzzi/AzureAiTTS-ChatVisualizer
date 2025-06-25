# Azure AI & TTS Chat Visualizer 🎧🤖

A web app that connects to **Azure AI Foundry** and **Azure Cognitive Services Text-to-Speech**, allowing users to chat with an AI and *hear* its responses — visualized in real time with glowing waveforms.

Built initially as a personal project (for a bit of fun).

Offers a great platform for extending with RAG for specific use with IP or other privacy sensitive data.

---

## ✨ Features

- 💬 Real-time chat with GPT-4o via Azure AI Projects  
- 🔊 Text-to-Speech using Azure Cognitive Services (TTS)  
- 🌈 Animated audio waveform visualizer (canvas-based)  
- 🎛️ Clean, responsive UI (React + Vite)  
- ⚙️ Express backend proxying AzureOpenAI + TTS requests

---

## 🧠 How it Works

**1.** User types a message → sent to the Express backend.  
**2.** Backend hits Azure AI Project (GPT-4o) → gets a text reply.  
**3.** Frontend plays the reply using Azure TTS, visualized with canvas.  
**4.** Canvas visualizer reflects audio waveform in glowing, animated style.

---

## 🚀 Tech Stack

| Layer     | Tools Used                                                                 |
|-----------|----------------------------------------------------------------------------|
| Frontend  | React, HTML5 Canvas, Vite                                                  |
| Backend   | Node.js, Express, Azure AI Projects SDK, Axios                             |
| Services  | Azure AI Foundry (GPT-4o), Azure Cognitive Services (TTS)                  |
| Auth      | `DefaultAzureCredential` (via Azure CLI) and static API key via `.env`     |
| Styling   | Vanilla CSS with shadows, gradients, and modern layout                     |

_Auth tooling for development purposes only. Recommend Managed Identities via Microsoft Entra in Production environments._

---

## 🗂️ Project Structure

```
azureai-chatvisualizer/
├── public/                # Static assets (favicon, etc.)
├── src/
│   └── App.jsx            # Main React component
│   └── App.css            # Glowing waveform styling
├── backend/
│   └── index.js           # Express server for AI + TTS proxy
├── .env                   # Azure keys (ignored by git)
├── .gitignore
├── package.json
└── vite.config.js
```

## 📦 Getting Started

### 1. Clone this repo

```bash
git clone https://github.com/your-username/azureai-chatvisualizer.git
cd azureai-chatvisualizer
```

### 2. Install Dependencies

You'll need to install both frontend and backend dependencies:

🔧 Frontend (React + Vite)
```
npm install
```
This installs React, Vite, and other UI dependencies needed to run the client.

🔧 Backend (Node.js + Azure SDKs)
```
cd backend
npm install
```
This sets up the Express server, Azure SDKs (like @azure/ai-projects), axios and dotenv.

### 3. Configure Environment Variables
Create a .env file inside the root directory with your Azure Cognitive Services key and region:
```env
AZURE_AI_ENDPOINT=https://<your-project>.services.ai.azure.com
AZURE_SPEECH_KEY=<your-speech-key>
AZURE_REGION=<your-region> # e.g. eastus
```
- AZURE_AI_ENDPOINT: This comes from your Azure AI Project overview page.
- AZURE_SPEECH_KEY: Found in your Azure Speech resource under Keys and Endpoint.
- AZURE_REGION: The region your speech resource is deployed in (e.g., eastus, australiaeast, etc.).

🔐 Your .env file is git-ignored by default to protect secrets.

### 4. Authenticate
Install the Azure CLI. If on Windows: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli-windows

Use ```az login``` to authenticate against your Azure Account and Subscription housing your Azure AI Foundary resources.

**See Security and Auth Details - this authentication process is intended for dev environments only**

### 5. Run the App

Two steps (easiest with two terminals)

🔧 Backend
From the root directory, ```node backend/index.js``` starts the Express API on http://localhost:3001, which handles chat requests and text-to-speech synthesis.

🔧 Frontend
From the root directory, ```npm run dev``` boots up the Vite-powered frontend on http://localhost:5173.

---

## Security and Auth Details

🔑 Authentication Methods
This project currently supports two forms of authentication, one for each Azure service it integrates with.

🧠 Azure AI Project
Auth Method: ```DefaultAzureCredential``` (from the Azure Identity SDK)

This is satisfied by the logged in user with ```az login``` via Azure CLI. This means the AI Project client connects securely without hardcoding secrets. Ideal for development.

🗣️ Azure Text-to-Speech (TTS)
Auth Method: API Key (via .env)

TTS still uses a traditional key-based method.
```
AZURE_SPEECH_KEY=your-key-here
```
This key is sent as a header (Ocp-Apim-Subscription-Key) in the HTTP POST request to the Speech API endpoint.

⚠️ Production Environments

In production, use **Managed Identity (MSI)**. This requires some experience and knowledge with Microsoft Entra. This allows configurable access without the use and storage of secrets.
```
const credential = new ManagedIdentityCredential();
```

🔐 Protect the .env File
The .env file contains API keys. The provided .gitignore already excludes it — do not commit this file to Git.

🚫 Never Expose Azure Keys in the Frontend
Only the backend should handle TTS or AI calls. The frontend sends requests to your local API (e.g. /ask, /api/tts), which acts as a proxy. This protects secrets from being exposed in browser dev tools or source maps.

🔐 Use HTTPS
Azure endpoints are HTTPS by default, but if deploying your app, make sure your frontend and backend are also served over HTTPS. This protects API keys and chat content from man-in-the-middle attacks.
