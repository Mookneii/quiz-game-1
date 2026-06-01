import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Trophy,
  PenSquare,
  MessageCircle,
  Smartphone,
  PieChart,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function FeaturesPage() {
  // CHECK LOGIN
  const token =
    localStorage.getItem("token");
  const navigate = useNavigate();

  const features = [
    {
      icon: <Users className="w-6 h-6 text-purple-500" />,
      title: "Real-Time Multiplayer",
      description:
        "Compete with friends and classmates in live quiz sessions with minimal latency and high engagement.",
    },
    {
      icon: <Trophy className="w-6 h-6 text-orange-500" />,
      title: "Live Leaderboard",
      description:
        "See who is leading in real-time with dynamic score updates and exciting animations as players climb the ranks.",
    },
    {
      icon: <PenSquare className="w-6 h-6 text-blue-500" />,
      title: "Easy Quiz Builder",
      description:
        "Create custom quizzes in minutes with our intuitive editor, featuring AI assistance and rich media support.",
    },
    {
      icon: <MessageCircle className="w-6 h-6 text-green-500" />,
      title: "Instant Feedback",
      description:
        "Get immediate results and detailed explanations for every answer, helping students learn from their mistakes.",
    },
    {
      icon: <Smartphone className="w-6 h-6 text-pink-500" />,
      title: "Mobile Friendly",
      description:
        "Play and create quizzes on any device, anywhere. Optimized for browsers and mobile screens alike.",
    },
    {
      icon: <PieChart className="w-6 h-6 text-indigo-500" />,
      title: "Analytics Dashboard",
      description:
        "Track progress and performance with detailed reports, heatmaps, and individual student insights.",
    },
  ];

  return (
    <div className="bg-[#f8f8f8] text-gray-800 font-sans">
        <Navbar />
      {/* HEADER */}
      <div className="max-w-4xl mx-auto text-center">
        <span className="bg-green-100 text-green-600 px-4 py-1 rounded-full text-sm font-medium">
          All-in-one Platform
        </span>

        <h1 className="text-5xl font-bold text-gray-900 mt-6 leading-tight">
          Powerful Features for <br />
          <span className="text-green-500 italic">
            Interactive Learning
          </span>
        </h1>

        <p className="text-gray-500 mt-6 max-w-2xl mx-auto leading-8">
          Everything you need to create engaging multiplayer quizzes,
          manage students, and track real-time learning progress in one
          place.
        </p>
      </div>

      {/* FEATURES GRID */}
      <div className="max-w-6xl mx-auto mt-20 grid md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition p-8"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-5">
              {feature.icon}
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {feature.title}
            </h3>

            <p className="text-gray-500 leading-7 text-sm">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* DASHBOARD IMAGE */}
      <div className="max-w-6xl mx-auto mt-24">
        <div className="bg-gradient-to-r from-purple-100 to-gray-200 rounded-3xl overflow-hidden shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71"
            alt="Dashboard Preview"
            className="w-full h-[420px] object-cover opacity-90"
          />
        </div>
      </div>

      {/* CTA SECTION */}
      <div className="max-w-6xl mx-auto mt-24">
        <div className="relative overflow-hidden bg-green-500 rounded-3xl py-20 px-8 text-center text-white shadow-2xl">
          {/* Background circles */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-green-400 rounded-full opacity-30"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-300 rounded-full opacity-20"></div>

          <h2 className="text-4xl font-bold mb-5 relative z-10">
            Ready to create your first quiz?
          </h2>

          <p className="max-w-2xl mx-auto text-white/90 mb-10 relative z-10">
            Join thousands of educators and students who are already
            transforming the way they learn and play.
          </p>

          <button
            onClick={() => {
              if (token) {
                navigate("/create-quiz");
              } else {
                navigate("/signup");
              }
            }}
            className="bg-white text-emerald-600 px-8 py-3 rounded-full font-semibold"
          >
            {token ? "Create Your Quiz" : "Get Started for Free"}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}