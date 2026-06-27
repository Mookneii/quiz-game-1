import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");

    // Validation
    if (
      !name ||
      !email ||
      !password
    ) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      // BACKEND API
      const response = await fetch(
        `http://${window.location.hostname}:8080/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name: name,
            email: email,
            password: password,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Registration failed"
        );
      }

      const data = await response.json();

      console.log(
        "Register success:",
        data
      );

      // Save user manually
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id,
          email: data.email,
          fullName: data.name,
        })
      );

      // Redirect
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

          <h1 className="text-2xl font-bold text-gray-800">
            QuizUp
          </h1>
          </Link>
        </div>
        

        {/* Heading */}
        <h2 className="text-4xl font-bold text-gray-800">
          Create an Account
        </h2>

        <p className="text-gray-500 mt-3 leading-7">
          Join QuizUp today and start your
          learning journey.
        </p>

        {/* FORM */}
        <form
          onSubmit={handleRegister}
          className="mt-8 space-y-6"
        >
          {/* FULL NAME */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name
            </label>

            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) =>
                setFullName(e.target.value)
              }
              className="w-full bg-[#f5f4ff] border border-transparent rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>

            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
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
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="********"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                className="w-full bg-[#f5f4ff] border border-transparent rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-green-400"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
              >
                👁️
              </button>
            </div>
          </div>

          {/* TERMS */}
          <div className="flex items-center gap-3">
            <input type="checkbox" />

            <p className="text-sm text-gray-500">
              I agree to the{" "}
              <span className="text-green-500">
                Terms of Service
              </span>{" "}
              and{" "}
              <span className="text-green-500">
                Privacy Policy
              </span>
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <p className="text-red-500 text-sm text-center">
              {error}
            </p>
          )}

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 transition text-white font-semibold py-4 rounded-xl shadow-lg hover:scale-[1.01] disabled:opacity-50"
          >
            {loading
              ? "Creating Account..."
              : "Sign Up"}
          </button>
        </form>

        {/* LOGIN */}
        <p className="text-center text-gray-500 mt-8">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-emerald-500 font-semibold"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}