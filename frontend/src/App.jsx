import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import Features from "./pages/Features";
import Contact from "./pages/Contact";
import JoinGame from "./pages/JoinGame";
import Register from "./pages/Register";
import Login from "./pages/Login";
import HostDashboard from "./pages/Dashboard";
import QuizBuilder from "./pages/Quizbuilder";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/features" element={<Features />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/JoinGame" element={<JoinGame/>} />
        <Route path="/signup" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<HostDashboard />} />
        <Route path="/host" element={<HostDashboard />} />
        <Route path="/create-quiz" element={<QuizBuilder />} />
      </Routes>
    </BrowserRouter>
  );
}