import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  Mail,
  Phone,
  MapPin,
  Send,
} from "lucide-react";

export default function Contact() {
  const token = localStorage.getItem("token");
  return (
    <>
      <Navbar />

      <div className="bg-[#f7f7f7] min-h-screen">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-r from-white to-green-50 py-24 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <span className="bg-green-100 text-green-600 px-4 py-1 rounded-full text-sm font-medium">
              Contact Us
            </span>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mt-6">
              Let’s Talk About <br />
              <span className="text-green-500 italic">
                Interactive Learning
              </span>
            </h1>

            <p className="text-gray-500 mt-6 max-w-2xl mx-auto leading-8">
              Have questions, feedback, or ideas? We’d love to hear from
              you. Reach out and our team will get back to you as soon as
              possible.
            </p>
          </div>

          {/* Background blur */}
          <div className="absolute top-0 right-0 w-52 h-52 bg-green-200 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-52 h-52 bg-blue-200 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        </section>

        {/* CONTACT SECTION */}
        <section className="max-w-6xl mx-auto py-20 px-6 grid md:grid-cols-2 gap-14 items-start">
          {/* LEFT INFO */}
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Get in Touch
            </h2>

            <p className="text-gray-500 leading-8 mb-10">
              Whether you are a student, teacher, or organization, we are
              always ready to support your learning journey.
            </p>

            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-start gap-5 bg-white p-6 rounded-2xl shadow-md">
                <div className="bg-green-100 p-3 rounded-xl">
                  <Mail className="text-green-600" />
                </div>

                <div>
                  <h3 className="font-semibold text-lg">Email</h3>
                  <p className="text-gray-500">
                    support@quizup.com
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-5 bg-white p-6 rounded-2xl shadow-md">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Phone className="text-blue-600" />
                </div>

                <div>
                  <h3 className="font-semibold text-lg">Phone</h3>
                  <p className="text-gray-500">
                    +855 12 345 678
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-5 bg-white p-6 rounded-2xl shadow-md">
                <div className="bg-purple-100 p-3 rounded-xl">
                  <MapPin className="text-purple-600" />
                </div>

                <div>
                  <h3 className="font-semibold text-lg">Location</h3>
                  <p className="text-gray-500">
                    Phnom Penh, Cambodia
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CONTACT FORM */}
          <div className="bg-white p-10 rounded-3xl shadow-xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Send a Message
            </h2>

            <form className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>

                <input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full border border-gray-200 rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>

                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full border border-gray-200 rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>

                <input
                  type="text"
                  placeholder="Enter subject"
                  className="w-full border border-gray-200 rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>

                <textarea
                  rows="5"
                  placeholder="Write your message..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-green-400 resize-none"
                ></textarea>
              </div>

              {/* Button */}
              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition"
              >
                <Send size={18} />
                Send Message
              </button>
            </form>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl py-20 px-10 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full"></div>

            <h2 className="text-4xl font-bold mb-5 relative z-10">
              Ready to start learning?
            </h2>

            <p className="max-w-2xl mx-auto text-white/90 mb-10 relative z-10">
              Join QuizUp today and experience a smarter, more interactive
              way to learn.
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
      </div>

      <Footer />
    </>
  );
}