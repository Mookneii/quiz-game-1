  import { BrowserRouter, Routes, Route } from "react-router-dom";
  import Home from "./pages/Home";
  import AboutUs from "./pages/AboutUs";
  import Features from "./pages/Features";
  import Contact from "./pages/Contact";
  import JoinGame from "./pages/JoinGame";
  import Register from "./pages/Register";
  import Login from "./pages/Login";
  import HostDashboard from "./pages/Dashboard";
  import CreateQuiz from "./pages/CreateQuiz";
  import EditQuiz from "./pages/EditQuiz";
  import LobbyHost from "./pages/LobbyHost";
  import HostLiveGame from "./pages/HostLiveGame";
  import LobbyPlayer from "./pages/LobbyPlayer";
  import GameRoom from "./pages/GameRoom";
  import WaitingAnswer from "./pages/WaitingAnswer";
  import AnswerRes from "./pages/AnswerRes";
  import Leaderboard from "./pages/Leaderboard";

  export default function App() {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/features" element={<Features />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/JoinGame" element={<JoinGame />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<HostDashboard />} />
          <Route path="/host" element={<HostDashboard />} />
          <Route path="/host/:pin" element={<LobbyHost />} />
          <Route path="/host-live-game/:pin" element={<HostLiveGame />} />
          <Route path="/lobby/:pin" element={<LobbyPlayer />} />
          <Route path="/game" element={<GameRoom />} />
          <Route path="/waiting" element={<WaitingAnswer />} />
          <Route path="/results" element={<AnswerRes />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/create-quiz" element={<CreateQuiz />} />
          <Route path="/edit-quiz" element={<EditQuiz />} />
        </Routes>
      </BrowserRouter>
    );
  }