import React, { useState } from "react";
import NavBar from "../components/NavBar";
import Sidebar from "../components/Sidebar";
import EnvironmentalBanner from "../components/EnvironmentalBanner";
import QuickStatsCards from "../components/QuickStatsCards";
import RecentPatients from "../components/RecentPatients";
import SystemStatus from "../components/SystemStatus";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} />

      {/* Main Content - flex-1 makes it take remaining space */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Navigation Bar */}
        <NavBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto">
          {/* Environmental Banner - API Details */}
          <EnvironmentalBanner />

          {/* Main Dashboard Content */}
          <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Quick Stats Cards */}
            <QuickStatsCards />

            {/* Recent Patients & System Status Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Recent Patients */}
              <div>
                <RecentPatients />
              </div>

              {/* System Status */}
              <div>
                <SystemStatus />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
