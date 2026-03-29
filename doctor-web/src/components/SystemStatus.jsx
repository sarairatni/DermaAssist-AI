import React from "react";
import { Activity, AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function SystemStatus() {
  const metrics = [
    {
      label: "Active Analyses",
      value: "12",
      icon: Activity,
      color: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "Pending Reviews",
      value: "5",
      icon: Clock,
      color: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      label: "Completed Today",
      value: "28",
      icon: CheckCircle,
      color: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      label: "System Alerts",
      value: "2",
      icon: AlertCircle,
      color: "bg-red-100",
      iconColor: "text-red-600",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">System Status</h2>

      <div className="space-y-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div
              key={idx}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`${metric.color} p-3 rounded-lg`}>
                  <Icon className={`${metric.iconColor}`} size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{metric.label}</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {metric.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
