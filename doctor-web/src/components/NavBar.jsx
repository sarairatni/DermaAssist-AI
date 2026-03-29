import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../services/authStore";
import { Menu, Search, Bell, User } from "lucide-react";

export default function NavBar({ onMenuClick }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const doctor = {
    name: user?.fullName || "Dr. Ahmed Medina",
    avatar:
      user?.fullName
        ?.split(" ")
        .map((n) => n[0])
        .join("") || "DR",
  };

  return (
    <div className="bg-white border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
      {/* Left - Menu Toggle & Search */}
      <div className="flex items-center gap-6 flex-1">
        {/* Menu Toggle */}
        <button
          onClick={onMenuClick}
          className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
          title="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Search Input */}
        <div className="flex-1 max-w-md flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus-within:ring-2 focus-within:ring-teal-500">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search patient..."
            className="flex-1 bg-transparent text-gray-700 placeholder-gray-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Right - Notifications & Profile */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          onClick={() => navigate("/notifications")}
          className="relative w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
          title="View Notifications"
        >
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Doctor Profile */}
        <div
          onClick={() => navigate("/profile")}
          className="flex items-center gap-3 pl-4 border-l border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Avatar */}
          <div className="w-10 h-10 bg-[#0F6E56] rounded-full flex items-center justify-center text-white font-bold text-sm">
            <User size={18} />
          </div>

          {/* Name */}
          <span className="font-medium text-gray-800 text-sm">
            {doctor.name}
          </span>
        </div>
      </div>
    </div>
  );
}
