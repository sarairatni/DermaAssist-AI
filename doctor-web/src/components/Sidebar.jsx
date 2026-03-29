import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Phone, Settings } from "lucide-react";
import Logo from "./Logo";

export default function Sidebar({ open }) {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "Patients", path: "/patients" },
    { icon: Phone, label: "Contact", path: "/contact" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <div
      className={`w-60 bg-[#0F6E56] text-white flex flex-col transition-all duration-300 ${
        !open ? "hidden" : ""
      }`}
    >
      {/* Logo */}
      <Logo />

      {/* Menu Items */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item, idx) => {
          const IconComponent = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path === "/dashboard" && location.pathname === "/");

          return (
            <Link
              key={idx}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-all ${
                isActive
                  ? "bg-teal-600 text-white"
                  : "text-teal-100 hover:bg-teal-700 hover:text-white"
              }`}
            >
              <IconComponent size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-teal-600 text-center text-sm text-teal-100">
        <p>© 2026 DermaAssist</p>
      </div>
    </div>
  );
}
