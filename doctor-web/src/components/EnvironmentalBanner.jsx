import React from "react";
import { Sun, Wind, Droplets, MapPin } from "lucide-react";

export default function EnvironmentalBanner() {
  const envData = {
    uvIndex: {
      label: "UV Index",
      value: "HIGH 7",
      color: "bg-green-100",
      textColor: "text-green-700",
    },
    aqi: {
      label: "AQI",
      value: "MODERATE 42",
      color: "bg-emerald-100",
      textColor: "text-emerald-700",
    },
    humidity: {
      label: "Humidity",
      value: "65%",
      color: "bg-teal-100",
      textColor: "text-teal-700",
    },
    location: "Boumerdes, Algeria",
  };

  return (
    <div className="bg-green-50 border-b border-green-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Environmental Pills */}
          <div className="flex items-center gap-4">
            {/* UV Index */}
            <div
              className={`${envData.uvIndex.color} ${envData.uvIndex.textColor} px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2`}
            >
              <Sun size={18} />
              {envData.uvIndex.label} {envData.uvIndex.value}
            </div>

            {/* AQI */}
            <div
              className={`${envData.aqi.color} ${envData.aqi.textColor} px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2`}
            >
              <Wind size={18} />
              {envData.aqi.label} {envData.aqi.value}
            </div>

            {/* Humidity */}
            <div
              className={`${envData.humidity.color} ${envData.humidity.textColor} px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2`}
            >
              <Droplets size={18} />
              {envData.humidity.label} {envData.humidity.value}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin size={18} className="text-green-600" />
            <span className="font-medium">{envData.location}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
