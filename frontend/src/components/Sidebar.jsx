import React from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function Sidebar({
  activeMenu = "my-quizzes",
  isOpen = true,
  onToggle = () => {},
}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const menuItems = [
    {
      key: "my-quizzes",
      label: "My Quizzes",
      icon: "📚",
      action: () => navigate("/host"),
    },
    {
      key: "create-quiz",
      label: "Create Quiz",
      icon: "➕",
      action: () => navigate("/create-quiz"),
    },
  ];

  return (
    <>
      {/* MOBILE HAMBURGER */}
      <div className="md:hidden h-16 bg-white border-b flex items-center justify-between px-4">
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="text-lg font-bold text-gray-800">QuizUp</h1>
        <div className="w-8" />
      </div>

      {/* SIDEBAR */}
      <div
        className={`fixed md:relative inset-0 z-40 md:z-auto bg-white md:bg-[#eef2f7] border-r flex flex-col justify-between w-full md:w-[260px] transition-all duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          {/* LOGO - now green */}
          <div className="px-8 py-8 flex items-center gap-3">
            <button
              onClick={() => navigate("/host")}
              className="flex items-center gap-3 hover:opacity-80 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                ⚡
              </div>
              <h1 className="text-3xl font-bold text-gray-800 hidden md:block">
                QuizUp
              </h1>
            </button>
          </div>

          {/* MENU */}
          <div className="px-3 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  item.action();
                  onToggle();
                }}
                className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-semibold transition-all duration-200 ${
                  activeMenu === item.key
                    ? "bg-emerald-500 text-white shadow-md"
                    : "text-gray-700 hover:bg-white"
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* LOGOUT */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="text-gray-400 flex items-center gap-3 px-4 py-3 hover:text-red-500 transition w-full"
          >
            ↩ Logout
          </button>
        </div>
      </div>

      {/* MOBILE OVERLAY */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}