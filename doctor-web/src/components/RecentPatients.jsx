import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  User,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:8000";

export default function RecentPatients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/patients`);
      // Get the last 3 patients
      const lastThree = response.data.slice(-3).reverse();
      setPatients(lastThree);
    } catch (error) {
      console.error("Error loading patients:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-800">Recent Patients</h2>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
            <TrendingUp size={14} />
            Latest
          </span>
        </div>
        <button
          onClick={() => navigate("/patients")}
          className="flex items-center gap-2 text-[#0F6E56] hover:opacity-80 transition-all font-medium text-sm"
        >
          View All
          <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading patients...</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No patients yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => navigate(`/patients/${patient.id}`)}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-[#0F6E56] transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-[#0F6E56] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {patient.user?.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "P"}
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800">
                      {patient.user?.full_name || "Patient"}
                    </h3>
                    <div className="space-y-1 mt-2 text-sm text-gray-600">
                      {patient.user?.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={14} />
                          <span className="truncate">{patient.user.email}</span>
                        </div>
                      )}
                      {patient.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} />
                          <span>{patient.phone}</span>
                        </div>
                      )}
                      {patient.city && (
                        <div className="flex items-center gap-2">
                          <MapPin size={14} />
                          <span>{patient.city}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight
                  className="text-gray-400 flex-shrink-0 mt-1"
                  size={20}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
