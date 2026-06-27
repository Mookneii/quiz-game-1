import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import Features from "./pages/Features";
import Contact from "./pages/Contact";
import JoinGame from "./pages/JoinGame";
import Register from "./pages/Register";
import Login from "./pages/Login";
import HostDashboard from "./pages/Dashboard";
import AnswerRes from "./pages/AnswerRes";
import LeaderboardPage from "./pages/Leaderboard";
import LobbyPlayer from "./pages/LobbyPlayer";
import LobbyHost from "./pages/LobbyHost";
import GameRoom from "./pages/GameRoom";
import WaitingAnswer from "./pages/WaitingAnswer";
import HostLiveGame from "./pages/HostLiveGame";
import CreateQuiz from "./pages/CreateQuiz";
import EditQuiz from "./pages/EditQuiz";
import GameHistory from "./pages/GameHistory";
import GameHistoryDetail from "./pages/GameHistoryDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/features" element={<Features />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/JoinGame" element={<JoinGame />} />
        <Route path="/lobby" element={<LobbyPlayer />} />
        <Route path="/lobby/:pin" element={<LobbyPlayer />} />
        <Route path="/lobby-host" element={<LobbyHost />} />
        <Route path="/lobby-host/:pin" element={<LobbyHost />} />
        <Route path="/game" element={<GameRoom />} />
        <Route path="/waiting" element={<WaitingAnswer />} />
        <Route path="/host-live-game" element={<HostLiveGame />} />
        <Route path="/host-live-game/:pin" element={<HostLiveGame />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/host" element={<HostDashboard />} />
        <Route path="/results" element={<AnswerRes />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/create-quiz" element={<CreateQuiz />} />
        <Route path="/create-quiz/:quizId" element={<CreateQuiz />} />
        <Route path="/edit-quiz/:quizId" element={<EditQuiz />} />
        <Route path="/join/:roomCode" element={<JoinGame />} />
        <Route path="/game-history" element={<GameHistory />} />
        <Route path="/game-history/:gameResultId" element={<GameHistoryDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
