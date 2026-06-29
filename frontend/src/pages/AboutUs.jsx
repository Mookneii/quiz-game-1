
import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SeavhongImg from "../assets/Seavhong.jpg";
import PhengrothImg from "../assets/Phengroth.jpg";
import SorakmonyImg from "../assets/Sorakmony.jpg";
import PanhaImg from "../assets/Panha.jpg";
import TeamImg from "../assets/Team.png";

export default function AboutPage() {

  const token = localStorage.getItem("token");
  const teamMembers = [
    {
      name: "Chea Seavhong",
      role: "Leader",
      image: SeavhongImg,
    },
    {
      name: "Seng Phengroth",
      role: "Developer",
      image: PhengrothImg,
    },
    {
      name: "Mi Sorakmony",
      role: "Member",
      image: SorakmonyImg,
    },
    {
      name: "Kong Sokpanha",
      role: "Member",
      image: PanhaImg,
    },
  ];

  const values = [
    {
      title: "Innovation",
      description:
        "We constantly push boundaries to create engaging learning experiences.",
      icon: "💡",
    },
    {
      title: "Collaboration",
      description:
        "Learning is better together. We encourage teamwork and growth.",
      icon: "🤝",
    },
    {
      title: "Accessibility",
      description:
        "Education should be available and enjoyable for everyone.",
      icon: "⭐",
    },
  ];

  return (
    <div className="bg-[#f8f8f8] text-gray-800 font-sans">
        <Navbar />
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-r from-white to-purple-100 py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <span className="bg-green-100 text-green-600 text-sm px-4 py-1 rounded-full">
            About Us
          </span>

          <h1 className="text-5xl font-bold mt-6">
            About <span className="text-green-500">QuizUp</span>
          </h1>

          <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
            Making learning fun and accessible for everyone.
          </p>
        </div>

        {/* Background circles */}
        <div className="absolute top-10 right-10 w-40 h-40 bg-purple-200 rounded-full opacity-30 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-52 h-52 bg-green-200 rounded-full opacity-30 blur-3xl pointer-events-none"></div>
      </section>

      {/* STORY SECTION */}
      <section className="max-w-6xl mx-auto py-20 px-6 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-bold mb-6">Our Story</h2>

          <p className="text-gray-600 leading-8 mb-4">
            QuizUp began with a mission to transform learning into an
            enjoyable experience. We believe education should be interactive,
            accessible, and engaging for students everywhere.
          </p>

          <p className="text-gray-600 leading-8">
            Our team combines technology and creativity to deliver innovative
            quiz-based learning solutions for modern learners.
          </p>
        </div>

        <div className="relative">
          <div className="bg-white rounded-3xl shadow-2xl p-4">
            <img
              src={TeamImg}
              alt="team"
              className="rounded-2xl w-full h-[350px] object-cover"
            />
          </div>

          <div className="absolute -top-5 -right-5 bg-white shadow-lg px-4 py-2 rounded-xl text-sm">
            🚀 Innovation in Education
          </div>
        </div>
      </section>

      {/* MISSION SECTION */}
      <section className="bg-gradient-to-r from-green-400 to-teal-500 py-20 px-6 text-center text-white">
        <h2 className="text-4xl font-bold mb-6">Our Mission</h2>

        <p className="max-w-3xl mx-auto text-lg">
          “To transform education into an engaging and competitive
          experience.”
        </p>
      </section>

      {/* VALUES SECTION */}
      <section className="max-w-6xl mx-auto py-20 px-6 text-center">
        <h2 className="text-4xl font-bold mb-4">Our Values</h2>

        <p className="text-gray-500 mb-14">
          The principles that guide everything we do.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-md p-8 hover:shadow-xl transition"
            >
              <div className="text-4xl mb-4">{value.icon}</div>

              <h3 className="text-xl font-semibold mb-3">
                {value.title}
              </h3>

              <p className="text-gray-500 text-sm leading-7">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* TEAM SECTION */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">The Team</h2>

          <p className="text-gray-500 mb-14">
            Meet the passionate people behind our mission.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="bg-[#f7f7f7] rounded-3xl p-4 shadow hover:shadow-xl transition"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-52 object-cover rounded-2xl"
                />

                <h3 className="font-semibold mt-4">{member.name}</h3>

                <p className="text-green-500 text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="max-w-5xl mx-auto py-20 px-6">
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-4xl font-bold mb-4">
            Join thousands of learners worldwide
          </h2>

          <p className="mb-8 text-white/90">
            Start learning today and experience interactive quizzes with
            QuizUp.
          </p>

          <button
            onClick={() => {
              if (token) {
                navigate(
                  "/create-quiz"
                );
              } else {
                navigate("/signup");
              }
            }}
            className="bg-white text-emerald-600 px-8 py-3 rounded-full font-semibold"
          >
            {token
              ? "Create Your Quiz"
              : "Get Started for Free"}
          </button>
        </div>
      </section>
      <Footer />
    </div>
  );
}