import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Navbar_res() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      console.log("Navbar user:", storedUser);

      if (storedUser && storedUser !== "undefined") {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.log("Invalid user data");

      localStorage.removeItem("user");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem("user");

    setUser(null);

    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold">
            Q
          </div>

          <span className="text-xl font-bold text-emerald-600">QuizUp</span>
        </Link>


        {/* RIGHT SIDE */}
					<div className="flex items-center gap-3">
							<div className="rounded-full bg-slate-500 px-5 py-2 text-sm font-semibold text-white shadow-sm">
								GAME PIN: <span className="text-gray-50">123456</span>
							</div>
							<div className="rounded-full bg-slate-500 px-5 py-2 text-sm font-semibold text-white shadow-sm flex items-center gap-2">
								<span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-300 text-yellow-700">★</span>
								360
							</div>
					</div>
      </div>
    </header>
  );
}
