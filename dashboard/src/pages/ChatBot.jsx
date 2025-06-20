import { useState } from 'react';
import axios from 'axios';
import '../styles/ChatBot.css';
import TextField from '@mui/material/TextField';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ChatIcon from '@mui/icons-material/Chat';

function ChatBot() {
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  async function generateAnswer() {
    if (!question.trim()) return; 

    const newAnswer = "...";
    setAnswers((prevAnswers) => [...prevAnswers, { question, answer: newAnswer }]);

    const response = await axios({
      url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCFRC3uuNRa3Vx-dzf5BM9d4dPFzDjfd8Q",
      method: "post",
      data: {
        contents: [{ parts: [{ text: question }] }],
      },
    });

    const answerText = response.data.candidates[0].content.parts[0].text;
    setAnswers((prevAnswers) => [
      ...prevAnswers.slice(0, -1), 
      { question, answer: answerText }
    ]);
    setQuestion("");
  }

  return (
    <div className="chatWrapper">
      {!isOpen && (
        <button className="chatToggle" onClick={() => setIsOpen(true)}>
          <ChatIcon fontSize="large" />
        </button>
      )}
      {isOpen && (
        <div className="chatContainer">
          <div className="chatHeader">
            <p>How can I help you?</p>
            <button className="closeButton" onClick={() => setIsOpen(false)}>✖</button>
          </div>

          <div className="messages">
            {answers.map((item, index) => (
              <div key={index} className="message-item">
                <div className="question">{item.question}</div>
                <div className="answer">{item.answer}</div>
              </div>
            ))}
          </div>

          <div className="input-container">
            <TextField
              className="chat"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Message..."
            />
            <button onClick={generateAnswer} className="submit">
              <ArrowUpwardIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatBot;
