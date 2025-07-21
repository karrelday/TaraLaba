import React, { useState } from "react";
import Sidebar from "./Sidebar";
import ChatBot from "./ChatBot";
import "../styles/OtherSites.css";
import nbs from "../src/pictures/nbs.jpg";
import pnb from "../src/pictures/pnb.png";
import jollibee from "../src/pictures/jalibe.jpg";
import blended from "../src/pictures/Blended.jpg";
import itbytes from "../src/pictures/itbytes.jpg";
import dental from "../src/pictures/Dental.jpg";

const sites = [
  {
    name: "National Book Store",
    img: nbs,
    url: "http://192.168.9.16:5173/",
  },
  {
    name: "PNB",
    img: pnb,
    url: "pnb-client.vercel.app",
  },
  {
    name: "Jollibee",
    img: jollibee,
    url: "http://192.168.9.37:5173/",
  },
  {
    name: "Blended",
    img: blended,
    url: "http://192.168.9.7:5173/",
  },
  {
    name: "ITBytes",
    img: itbytes,
    url: "it-bytes-ui.vercel.app",
  },
  {
    name: "Dental Clinic",
    img: dental,
    url: "molar-record.vercel.app",
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
