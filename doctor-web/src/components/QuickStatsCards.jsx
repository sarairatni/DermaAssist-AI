import React, { useState, useEffect } from "react";
import { Users, Clipboard, Brain } from "lucide-react";
import axios from "axios";
import "../styles/animations.css"; // For pulsing animation

const API_URL = "http://localhost:8000";

export default function QuickStatsCards() {
  const [totalPatients, setTotalPatients] = useState(0);
  const [patientsThisMonth, setPatientsThisMonth] = useState(0);
  const [totalConsultations, setTotalConsultations] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Fetch all patients
      const patientsResponse = await axios.get(`${API_URL}/patients`);
      const allPatients = patientsResponse.data || [];
      setTotalPatients(allPatients.length);

      // Calculate patients this month
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const thisMonth = allPatients.filter((patient) => {
        if (patient.created_at) {
          const createdDate = new Date(patient.created_at);
          return (
            createdDate.getMonth() === currentMonth &&
            createdDate.getFullYear() === currentYear
          );
        }
        return false;
      }).length;
      setPatientsThisMonth(thisMonth);

      // Fetch consultations
      try {
        const consultationsResponse = await axios.get(
          `${API_URL}/consultations`,
        );
        const consultations = consultationsResponse.data || [];
        setTotalConsultations(
          Array.isArray(consultations) ? consultations.length : 0,
        );
      } catch (err) {
        console.log("Consultations endpoint not available, setting to 0");
        setTotalConsultations(0);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const stats = [
    { label: "Total Patients", value: totalPatients.toString(), icon: Users },
    {
      label: "Patients this month",
      value: patientsThisMonth.toString(),
      icon: Clipboard,
    },
    {
      label: "Consultations",
      value: totalConsultations.toString(),
      icon: Brain,
      hasPulse: true,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-6">
      {stats.map((stat, idx) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={idx}
            className="bg-white border border-gray-300 rounded-3xl px-6 py-6 flex items-center justify-between"
          >
            <div>
              <p className="text-gray-500 text-sm font-medium mb-2">
                {stat.label}
              </p>
              <p className="text-4xl font-bold text-gray-800">{stat.value}</p>
            </div>
            {stat.hasPulse && (
              <div className="flex flex-col items-center gap-2">
                <IconComponent size={32} className="text-[#0F6E56]" />
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            )}
            {!stat.hasPulse && (
              <IconComponent size={36} className="text-gray-400" />
            )}
          </div>
        );
      })}
    </div>
  );
}
