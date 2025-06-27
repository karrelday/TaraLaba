import Sidebar from "./Sidebar";
import ChatBot from "./ChatBot";
import CardSwap, { Card } from "../components/CardSwap";
import "../styles/Home.css";
import backgroundImg from "../pictures/TaraLabaBackground.jpg";
import card1Img from "../pictures/Promo.jpg";
import card2Img from "../pictures/Promo2.jpg";
import card3Img from "../pictures/Promo3.jpg";

function Home() {
  return (
    <div className="home" style={{ position: "relative", overflow: "hidden" }}>
      <Sidebar />
      <ChatBot />
      <div className="content" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ height: '600px', position: 'relative' }}>
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
                alt="Card 1"
                style={{ width: "100%", borderRadius: "8px" }}
              />
            </Card>
            <Card>
              <h3>Card 3</h3>
              <img
                src={card3Img}
                alt="Card 1"
                style={{ width: "100%", borderRadius: "8px" }}
              />
            </Card>
          </CardSwap>
        </div>
      </div>
    </div>
  );
}

export default Home;