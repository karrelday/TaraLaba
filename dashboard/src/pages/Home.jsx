import Sidebar from "./Sidebar";
import ChatBot from "./ChatBot";
import "../styles/Home.css";
import backgroundImg from "../pictures/TaraLabaBackground.jpg";

function Home() {
  return (
    <div className="home" style={{ position: "relative", overflow: "hidden" }}>
      <Sidebar />
      <ChatBot />
      <div className="content" style={{ position: "relative", zIndex: 1 }}>
      <img src="" alt="" />
      </div>
    </div>
  );
}

export default Home;