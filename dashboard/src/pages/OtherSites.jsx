import React, { useState } from "react";
import Sidebar from "./Sidebar";
import ChatBot from "./ChatBot";
import "../styles/OtherSites.css";

const sites = [
  {
    name: "National Book Store",
    img: "../src/pictures/nbs.jpg", // Update with your image path
    url: "http://192.168.9.16:5173/",
  },
  {
    name: "PNB",
    img: "../src/pictures/pnb.png",
    url: "http://192.168.9.23:5173/",
  },
  {
    name: "Jollibee",
    img: "../src/pictures/jalibe.jpg",
    url: "http://192.168.9.37:5173/",
  },
  {
    name: "Blended",
    img: "../src/pictures/Blended.jpg",
    url: "http://192.168.9.7:5173/",
  },
  {
    name: "ITBytes",
    img: "../src/pictures/itbytes.jpg",
    url: "http://192.168.9.4:5173/",
  },
  {
    name: "Dental Clinic",
    img: "../src/pictures/sml.jpg",
    url: "http://192.168.9.35:5173/",
  },
];

const OtherSites = () => {
  return (
    <div>
      <Sidebar />
      <ChatBot />
     
      <div className="other-sites center">
        <h1>Business Directory</h1>
        <div className="other-sites-container">
          {sites.map((site) => (
            <div className="site-card" key={site.name}>
              <div className="site-image">
                <img src={site.img} alt={site.name} />
              </div>
              <h3>{site.name}</h3>
              <button
                onClick={() => window.open(site.url, "_blank")}
                className="site-btn"
              >
                Visit Site
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OtherSites;
