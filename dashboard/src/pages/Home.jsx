import Sidebar from "./Sidebar";
import ChatBot from "./ChatBot";
import CardSwap, { Card } from "../components/CardSwap";
import "../styles/Home.css";
import backgroundImg from "../pictures/TaraLabaBackground.jpg";
import card1Img from "../pictures/Promo.jpg";
import card2Img from "../pictures/Promo2.jpg";
import card3Img from "../pictures/Promo3.jpg";
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { motion } from "framer-motion";
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import EmailIcon from '@mui/icons-material/Email';

function Home() {
  return (
    <div
      className="home"
      style={{
        height: "85vh",
        overflowY: "auto",
        overflowX: "hidden",
        position: "relative",
        backgroundColor: "#f9fafb"
      }}
    >
      <Sidebar />
      <ChatBot />
      <div className="content home-grid" style={{ marginBottom: "48px" }}>
        {/* Promo Card */}
        <div
          className="promo-text"
          style={{
            transition: "box-shadow 0.3s, transform 0.3s",
            boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
            backgroundColor: "#fff",
            borderRadius: "16px",
            padding: "24px 32px",
            maxWidth: "700px",
            margin: "32px auto",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            color: "#333",
            lineHeight: 1.6,
            cursor: "pointer",
            position: "relative",
            border: "1px solid #e5e7eb"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
            e.currentTarget.style.transform = "translateY(-3px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.10)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "18px",
              fontSize: "34px",
              color: "black",
              fontWeight: 700,
              letterSpacing: "0.5px",
              textAlign: "center",
              textShadow: "1px 1px 1px rgba(0,0,0,0.05)"
            }}
          >
            Welcome to TaraLaba Laundry Cafe!
          </h2>
          <p style={{ fontSize: "1.08rem" }}>
            We value taking good care of your clothes just as we value cleanliness and organization in our working environment.
            We believe that considering the cleanliness of the place where you drop off your clothes and the people you entrust them with really takes a big part in the quality of the service you get.
            If you are the kind who values the same thing, and believes in the same advocacy, this is the place for you! ✨
            <br /><br />
            Come visit us! Our team would love to meet and assist you on your laundry needs.
            And while you’re at it, grab a coffee or a drink on the side. Treat yourself! ☕️
          </p>
          <div
            style={{
              background: "#f1f5fb",
              borderRadius: "10px",
              padding: "18px 20px",
              marginTop: "18px",
              marginBottom: "0",
              boxShadow: "inset 0 2px 6px rgba(37,99,235,0.06)",
              display: "inline-block",
              border: "1px solid #dbeafe"
            }}
          >
            <span style={{ fontWeight: 700, color: "#2563eb" }}>Store hours:</span><br />
            <span style={{ color: "#222" }}>
              ✔️ <b>Open DAILY:</b> 8AM to 7PM. <span style={{ color: "#666" }}>(Last wash 6PM)</span><br />
              🕙 <b>DRY TIME:</b> approximately 40mins.<br />
              ☕️ <b>TaraKape</b> - Open DAILY 8AM-7PM
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: "5px",
              marginTop: "28px",
              borderRadius: "3px",
              background: "linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)"
            }}
          />
        </div>

        {/* CardSwap Carousel */}
        <div className="card-section">
          <div style={{ height: '300px', position: 'relative' }}>
            <CardSwap
              cardDistance={60}
              verticalDistance={70}
              delay={5000}
              pauseOnHover={false}
            >
              <Card>
                <h3>Card 1</h3>
                <img
                  src={card1Img}
                  alt="Card 1"
                  style={{ width: "100%", borderRadius: "8px" }}
                />
              </Card>
              <Card>
                <h3>Card 2</h3>
                <img
                  src={card2Img}
                  alt="Card 2"
                  style={{ width: "100%", borderRadius: "8px" }}
                />
              </Card>
              <Card>
                <h3>Card 3</h3>
                <img
                  src={card3Img}
                  alt="Card 3"
                  style={{ width: "100%", borderRadius: "8px" }}
                />
              </Card>
            </CardSwap>
          </div>
        </div>
      </div>

      {/* Animated Our Locations Section */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        viewport={{ once: true, amount: 0.3 }}
        style={{
          padding: "32px 24px 24px 24px",
          marginTop: "24px",
          textAlign: "Right",
          fontSize: "1.1rem",
          marginLeft: "900px",
          lineHeight: 1.7,
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 4px 16px rgba(37,99,235,0.10)",
          transition: "box-shadow 0.3s, transform 0.3s",
          cursor: "pointer",
          position: "relative",
          border: "1px solid #e5e7eb",
          maxWidth: "800px"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(37,99,235,0.18)";
          e.currentTarget.style.transform = "translateY(-3px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(37,99,235,0.10)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <b style={{ color: "black", fontSize: "34px" }}>Our locations:</b><br />
        📍TaraLaba Laundry Cafe - SOLANO<br />
        Burgos St., Brgy.Quirino. (Just across Danguilan Clinic) Solano, Nueva Vizcaya<br />
        📲 0917 112 8899<br /><br />
        📍TaraLaba Laundry Cafe - Bayombong<br />
        W.Bldg #75 Dumlao Blvd., cor. Mabini St., Brgy. Salvacion, Bayombong, Nueva Vizcaya (Just across NVGCHS)<br />
        📲 0916 787 8053
        <div
          style={{
            width: "5px",
            height: "100%",
            marginLeft: "0px",
            marginTop: "28px",
            borderRadius: "3px",
            background: "linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)",
            position: "absolute",
            left: 0,
            bottom: 0
          }}
        />
      </motion.div>

      {/* Animated Map Section */}
      <motion.div
        className="map-card-wrapper"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
        viewport={{ once: true, amount: 0.3 }}
        style={{
          display: "flex",
          justifyContent: "left",
          alignItems: "center",
          marginTop: "64px",
          marginLeft: "100px", // flush with sidebar
          marginBottom: "48px",
          width: "50%"
        }}
      >
        <div className="map-card" style={{ width: "100%", maxWidth: "1200px" }}>
          <MapContainer
            center={[16.502, 121.17]}
            zoom={12.5}
            className="leaflet-container"
            style={{
              width: "50%",
              height: "400px",
              borderRadius: "12px",
              
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[16.5194, 121.1945]}>
              <Popup>
                <b>TaraLaba Laundry Cafe - SOLANO</b><br />
                Burgos St., Brgy.Quirino.<br />
                (Just across Danguilan Clinic)<br />
                Solano, Nueva Vizcaya<br />
                📲 0917 112 8899
              </Popup>
            </Marker>
            <Marker position={[16.4818, 121.1456]}>
              <Popup>
                <b>TaraLaba Laundry Cafe - Bayombong</b><br />
                W.Bldg #75 Dumlao Blvd., cor. Mabini St.<br />
                Brgy. Salvacion, Bayombong, Nueva Vizcaya<br />
                (Just across NVGCHS)<br />
                📲 0916 787 8053
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </motion.div>

      {/* Footer with Social Links */}
      <footer className="home-footer">
        <div className="home-footer-links">
          <a href="https://www.facebook.com/taralaba.ph/" target="_blank" rel="noopener noreferrer" className="home-footer-link facebook">
            <FacebookIcon fontSize="medium" />
            Facebook
          </a>
          <a href="https://www.instagram.com/taralaba.social?fbclid=IwY2xjawLd_nRleHRuA2FlbQIxMABicmlkETFHN29KRDg3eFY1bklPSVNNAR4AyjE-R0hcKDpLje_3yafeQvlvFuxXp6PBKZUJEMYf5PVSf_LSGDuJmfTqtw_aem_7dD4iocYwXzDr0-6is50Tg" target="_blank" rel="noopener noreferrer" className="home-footer-link instagram">
            <InstagramIcon fontSize="medium" />
            Instagram
          </a>
          <a href="mailto:taralaba00@gmail.com" className="home-footer-link gmail">
            <EmailIcon fontSize="medium" />
            Gmail
          </a>
        </div>
        <div className="home-footer-copyright">
          &copy; {new Date().getFullYear()} TaraLaba Laundry Cafe. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default Home;
