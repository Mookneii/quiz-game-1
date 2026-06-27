import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    // Validation
    if (!email || !password) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      // API CALL
      const response = await fetch(`http://${window.location.hostname}:8080/api/auth/login`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid email or password");
      }

      const data = await response.json();
      console.log("LOGIN RESPONSE:", data);

      console.log("Login success:", data);

      // SAVE TOKEN
      localStorage.setItem("token", data.token);

      // SAVE USER MANUALLY
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id,
          email: data.email,
          fullName: data.name,
        }),
      );

      // Redirect to homepage
      window.location.href = "/";
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md rounded-[30px] border-4 border-gray-200 shadow-xl p-8">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold">
              Q
            </div>

            <h1 className="text-2xl font-bold text-gray-800">QuizUp</h1>
          </Link>
        </div>

        {/* Heading */}
        <h2 className="text-4xl font-bold text-gray-800">Welcome Back</h2>

        <p className="text-gray-500 mt-3 leading-7">
          Login to continue your learning journey.
        </p>

        {/* FORM */}
        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          {/* EMAIL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>

            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#f5f4ff] border border-transparent rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#f5f4ff] border border-transparent rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-green-400"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
              >
                👁️
              </button>
            </div>
          </div>

          {/* ERROR */}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 transition text-white font-semibold py-4 rounded-xl shadow-lg hover:scale-[1.01] disabled:opacity-50"
          >
            {loading ? "Logging In..." : "Log In"}
          </button>
        </form>

        {/* REGISTER */}
        <p className="text-center text-gray-500 mt-8">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-emerald-500 font-semibold">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
