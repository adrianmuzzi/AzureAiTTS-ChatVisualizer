import React, { useState, useRef, useEffect } from 'react';
import './App.css';

export default function App() {
  // State for storing chat messages
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(''); // User input text
  const [exited, setExited] = useState(false); // Tracks if user typed 'exit'
  const bottomRef = useRef(null); // Ref for scrolling to bottom of chat
  const canvasRef = useRef(null); // Ref to the canvas element for waveform
  const [audioContext, setAudioContext] = useState(null); // Optional: manage audio context lifecycle

  // Utility to format current time for message timestamps
  const timeNow = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Removes emojis from input text for compatibility with TTS
  const stripEmojis = (text) =>
    text.replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD800-\uDFFF]|[\uFE00-\uFE0F]|\u24C2|\uD83C[\uDDE6-\uDDFF]|\uD83D[\uDC00-\uDE4F]|\uD83D[\uDE80-\uDEFF]|\uD83E[\uDD00-\uDDFF])/g,
      ''
    );

  // Draws a real-time waveform visualizer on the canvas
  const drawWaveform = (analyser, dataArray) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const draw = () => {
      requestAnimationFrame(draw); // Loop continuously for animation
      analyser.getByteTimeDomainData(dataArray); // Populate dataArray with waveform data

      ctx.clearRect(0, 0, WIDTH, HEIGHT); // Clear previous frame

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#7b2ff7';
      ctx.shadowColor = '#7b2ff7';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.beginPath();

      const sliceWidth = WIDTH / dataArray.length;
      let x = 0;

      // Draw waveform shape
      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0; // Normalize [0–255] to [0–2]
        const y = (v * HEIGHT) / 2;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
      }

      ctx.lineTo(WIDTH, HEIGHT / 2); // Ensure line ends neatly
      ctx.stroke();
    };

    draw(); // Start animation
  };

  // Fetches audio from backend TTS and plays it while visualizing
  const playTTS = async (text) => {
    try {
      const cleanedText = stripEmojis(text);

      // Request audio blob from backend
      const res = await fetch('http://localhost:3001/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanedText }),
      });

      const blob = await res.blob();
      const url = URL.createObjectURL(blob); // Create object URL for playback
      const audio = new Audio(url);

      // AudioContext setup for waveform visualization
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const source = context.createMediaElementSource(audio);
      const analyser = context.createAnalyser();
      analyser.fftSize = 64;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Connect audio nodes
      source.connect(analyser);
      analyser.connect(context.destination);

      setAudioContext(context); // Optional: useful for cleanup

      drawWaveform(analyser, dataArray); // Start waveform drawing
      audio.play(); // Begin playback
    } catch (err) {
      console.error('TTS fetch/playback failed:', err);
    }
  };

  // Handles chat submission and AI response
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    // Exit logic
    if (trimmed.toLowerCase() === 'exit') {
      setExited(true);
      return;
    }

    // Show user message
    const userMsg = { role: 'user', content: trimmed, time: timeNow() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      // Send prompt to backend for Azure AI response
      const res = await fetch('http://localhost:3001/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed }),
      });

      const data = await res.json();
      const aiMsg = {
        role: 'assistant',
        content: data.reply || 'Error: No response.',
        time: timeNow(),
      };

      setMessages((prev) => [...prev, aiMsg]); // Add AI response
      playTTS(aiMsg.content); // Speak the response
    } catch (err) {
      console.error('Backend call failed:', err);
      const errorMsg = {
        role: 'assistant',
        content: 'Oops, something went wrong.',
        time: timeNow(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      playTTS(errorMsg.content);
    }
  };

  // Exit screen
  if (exited) return <div className="exited">Exited. Goodbye!</div>;

  // Main UI
  return (
    <div className="app-container">
      <div className="content-wrapper">
        <h1 className="chat-heading">Azure AI & TTS Chat Visualizer</h1>

        <div className="chat-box">
          <div className="bubble-container">
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.role}`}>
                <div className="bubble-text">{m.content}</div>
                <div className="bubble-time">
                  {m.time} {m.role === 'user' && '✓'}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Waveform Canvas + Label */}
          <div className="visualizer-wrapper">
            <canvas ref={canvasRef} className="audio-visualizer" width="600" height="60" />
            <span className="visualizer-label">Visualizer</span>
          </div>

          {/* Input bar */}
          <form onSubmit={handleSubmit} className="input-form">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Type a message… (or "exit")'
              autoFocus
            />
            <button type="submit">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}
