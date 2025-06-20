import React, { useState } from "react";
import "../styles/qrcode.css";
import { QRCodeCanvas } from "qrcode.react";
import Sidebar from "./Sidebar";
import ChatBot from "./ChatBot";
const QRCodeGenerator = () => {
  const [text, setText] = useState("");

  return (
    <div className="container">
        <Sidebar/>
         <ChatBot/>
      <h1>QR Code Generator</h1>
      <input
        type="text"
        placeholder="Enter text or URL"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="input-box"
      />
      {text && (
        <div className="qr-box">
          <QRCodeCanvas value={text} size={200} />
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;
