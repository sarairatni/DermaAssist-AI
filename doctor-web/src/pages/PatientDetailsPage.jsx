import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Upload,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Pill,
} from "lucide-react";

const API_URL = "http://localhost:8000";

// Mock analysis results - will be replaced when Model 1 is ready
const MOCK_ANALYSIS = {
  disease: "Eczéma Atopique",
  confidence: 87,
  urgency: "MODEREE",
  analysis:
    "Basé sur l'analyse de l'image, il s'agit d'une dermatite atopique avec inflammation modérée. La zone affectée montre des signes de sécheresse cutanée et de prurit.",
  questions: [
    {
      id: 1,
      text: "Depuis combien de temps avez-vous ces symptômes?",
      options: ["< 1 semaine", "1-2 semaines", "> 2 semaines"],
      answered: false,
    },
    {
      id: 2,
      text: "Y a-t-il des antécédents familiaux d'eczéma?",
      options: ["Oui", "Non", "Inconnu"],
      answered: false,
    },
  ],
  medications: [
    {
      name: "Crème Hydratante",
      description: "Hydrater la peau 2 fois par jour",
    },
    {
      name: "Topique Corticostéroïde",
      description: "Appliquer sur les zones affectées matin et soir",
    },
    {
      name: "Antihistaminique",
      description: "En cas de démangeaisons importantes",
    },
  ],
  alerts: [
    {
      type: "warning",
      message:
        "Consulter un dermatologue si pas d'amélioration après 2 semaines",
    },
    {
      type: "danger",
      message: "Éviter les irritants (savons agressifs, tissus synthétiques)",
    },
  ],
};

export default function PatientDetailsPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [answers, setAnswers] = useState({});
  const [analysisResults, setAnalysisResults] = useState(null);

  useEffect(() => {
    loadPatient();
  }, [patientId]);

  const loadPatient = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/patients/${patientId}`);
      setPatient(response.data);
    } catch (error) {
      console.error("Error loading patient:", error);
      toast.error("Failed to load patient details");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setImageFile(file);
        setShowAnalysis(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!imagePreview || !imageFile) {
      toast.error("Please upload an image first");
      return;
    }

    setAnalyzing(true);
    try {
      // Step 1: Upload image to backend
      const formData = new FormData();
      formData.append("file", imageFile);

      const uploadResponse = await axios.post(
        `${API_URL}/patients/${patientId}/skin-images`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const imageId = uploadResponse.data.id;
      console.log("Image uploaded successfully:", imageId);

      // Step 2: Call test analysis endpoint (generates random CNN data + triggers RAG)
      const analysisResponse = await axios.post(
        `${API_URL}/patients/${patientId}/test-analyze-skin-image`,
        {
          image_id: imageId,
          // Generate random condition with random confidence (0.75-0.95)
          // To specify: condition_name: "acne vulgaire", confidence: 0.88
        },
      );

      console.log("Analysis completed:", analysisResponse.data);
      setAnalysisResults(analysisResponse.data);
      setShowAnalysis(true);
      toast.success("Analysis completed successfully!");

      // Reset image upload form
      setImagePreview(null);
      setImageFile(null);
    } catch (error) {
      console.error("Error during analysis:", error);

      if (error.response?.status === 429) {
        const errorMsg =
          error.response?.data?.detail ||
          "Too many uploads. Please wait before uploading another image.";
        toast.error(errorMsg);
      } else {
        const errorMsg =
          error.response?.data?.detail ||
          error.response?.data?.message ||
          error.message ||
          "Failed to analyze image";
        toast.error(errorMsg);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnswerQuestion = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  if (loading) {
    return (
      <>
        <NavBar />
        <div className="flex h-screen bg-[#F8F9FA]">
          <Sidebar open={sidebarOpen} />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin">
              <div className="w-8 h-8 border-4 border-[#0F6E56] border-t-transparent rounded-full"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      <Sidebar open={sidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <NavBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <div className="flex-1 overflow-auto">
          <div className="p-8 space-y-6 max-w-7xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => navigate("/patients")}
              className="flex items-center gap-2 text-[#0F6E56] hover:opacity-80 transition-all font-medium"
            >
              <ArrowLeft size={20} />
              Back to Patients
            </button>

            {/* Patient Info Card */}
            {patient && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-1">
                      {patient.user?.full_name || "Patient"}
                    </h1>
                    <p className="text-gray-600">{patient.user?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {patient.phone || "N/A"}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      City: {patient.city || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">
                      Fitzpatrick Type
                    </p>
                    <p className="text-lg font-semibold text-gray-800">
                      {patient.fitzpatrick_type?.replace("TYPE_", "Type ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">
                      Medical History
                    </p>
                    <p className="text-sm text-gray-700">
                      {patient.medical_history || "None"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">
                      Status
                    </p>
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Upload and Analysis Section */}
            <div className="grid grid-cols-3 gap-6">
              {/* Left: Upload Section */}
              <div className="col-span-2">
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                      Skin Image Analysis
                    </h2>
                  </div>

                  {!imagePreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-[#0F6E56] rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload size={48} className="text-[#0F6E56] mb-2" />
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">
                            Click to upload
                          </span>{" "}
                          or drag and drop
                        </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF up to 10MB
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                    ) : (
                      <div className="space-y-4">
                        <img
                          src={imagePreview}
                          alt="Skin image preview"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => {
                            setImagePreview(null);
                            setShowAnalysis(false);
                          }}
                          className="text-sm text-[#0F6E56] hover:underline"
                        >
                          Change Image
                        </button>
                      </div>
                    )}

                    {imagePreview && analyzing && (
                      <button
                        disabled
                        className="w-full mt-4 bg-[#0F6E56] text-white py-3 rounded-lg font-semibold opacity-50 flex items-center justify-center gap-2"
                      >
                        <span className="animate-spin">◐</span>
                        Analyzing...
                      </button>
                    )}

                    {imagePreview && !analyzing && !showAnalysis && (
                      <div className="space-y-2">
                        <button
                          onClick={handleAnalyze}
                          className="w-full mt-4 bg-[#0F6E56] text-white py-3 rounded-lg font-semibold hover:bg-[#0d5a47] transition-all flex items-center justify-center gap-2"
                        >
                          Start Analysis
                        </button>
                        <p className="text-xs text-gray-500 text-center">
                          Get instant AI-powered diagnosis insights, confidence
                          levels, clinical recommendations, and personalized
                          medication alerts
                        </p>
                      </div>
                    )}

                    {imagePreview && showAnalysis && (
                      <button
                        onClick={() => setShowAnalysis(false)}
                        className="w-full mt-4 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                      >
                        Hide Analysis
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: Analysis Results */}
                {showAnalysis && (
                  <div className="col-span-1 space-y-4">
                    {/* Disease Card */}
                    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase mb-2 font-semibold">
                        Detected Condition
                      </p>
                      <p className="text-2xl font-bold text-gray-800">
                        {MOCK_ANALYSIS.disease}
                      </p>
                    </div>

                    {/* Confidence Badge */}
                    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase mb-2 font-semibold">
                        Confidence Score
                      </p>
                      <div className="mb-2">
                        <span className="text-3xl font-bold text-[#0F6E56]">
                          {MOCK_ANALYSIS.confidence}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all"
                          style={{ width: `${MOCK_ANALYSIS.confidence}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Urgency */}
                    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase mb-2 font-semibold">
                        Urgency Level
                      </p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          MOCK_ANALYSIS.urgency === "CRITIQUE"
                            ? "bg-red-100 text-red-700"
                            : MOCK_ANALYSIS.urgency === "ELEVEE"
                              ? "bg-orange-100 text-orange-700"
                              : MOCK_ANALYSIS.urgency === "MODEREE"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                        }`}
                      >
                        {MOCK_ANALYSIS.urgency}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Full Analysis Results */}
              {showAnalysis && analysisResults && (
                <div className="space-y-6">
                  {/* Analysis Text */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-[#0F6E56]">
                    <h3 className="text-lg font-bold text-gray-800 mb-3">
                      Initial Analysis
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {analysisResults.analyse_initiale ||
                        "Analysis pending..."}
                    </p>
                  </div>

                  {/* Confidence Level */}
                  {analysisResults.confidence_level && (
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Confidence Level
                      </h3>
                      <div
                        className={`inline-block px-4 py-2 rounded-lg font-semibold ${
                          analysisResults.confidence_level === "eleve"
                            ? "bg-green-100 text-green-700"
                            : analysisResults.confidence_level === "ambigu"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {analysisResults.confidence_level.toUpperCase()}
                      </div>
                    </div>
                  )}

                  {/* Fine-tuned Analysis */}
                  {analysisResults.analyse_affinee && (
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-[#0F6E56]">
                      <h3 className="text-lg font-bold text-gray-800 mb-3">
                        Refined Analysis
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {analysisResults.analyse_affinee}
                      </p>
                    </div>
                  )}

                  {/* Management Plan */}
                  {analysisResults.plan_prise_en_charge && (
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Management Plan
                      </h3>
                      <ol className="space-y-3">
                        {analysisResults.plan_prise_en_charge.map(
                          (step, idx) => (
                            <li key={idx} className="flex gap-3">
                              <span className="flex-shrink-0 w-6 h-6 bg-[#0F6E56] text-white rounded-full flex items-center justify-center text-sm font-semibold">
                                {idx + 1}
                              </span>
                              <span className="text-gray-700 pt-0.5">
                                {step}
                              </span>
                            </li>
                          ),
                        )}
                      </ol>
                    </div>
                  )}

                  {/* Medications to Avoid */}
                  {analysisResults.medicaments_a_eviter &&
                    analysisResults.medicaments_a_eviter.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm p-6 border border-red-200">
                        <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
                          <AlertCircle size={20} />
                          Medications to Avoid
                        </h3>
                        <div className="space-y-2">
                          {analysisResults.medicaments_a_eviter.map(
                            (med, idx) => (
                              <p key={idx} className="text-gray-700 text-sm">
                                • {med}
                              </p>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {/* Recommended Medications */}
                  {analysisResults.medicaments &&
                    analysisResults.medicaments.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <Pill size={20} className="text-[#0F6E56]" />
                          Recommended Medications
                        </h3>
                        <div className="space-y-3">
                          {analysisResults.medicaments.map((med, idx) => (
                            <div
                              key={idx}
                              className="flex gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <CheckCircle
                                size={20}
                                className="text-[#0F6E56] flex-shrink-0 mt-0.5"
                              />
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {typeof med === "string" ? med : med.name}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Alerts */}
                  {(analysisResults.alertes_patient ||
                    analysisResults.alertes_maladie) && (
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Clinical Alerts
                      </h3>
                      <div className="space-y-3">
                        {analysisResults.alertes_patient?.map((alert, idx) => (
                          <div
                            key={`alert-${idx}`}
                            className="flex gap-3 p-4 bg-red-50 rounded-lg border border-red-200"
                          >
                            <AlertCircle
                              size={20}
                              className="text-red-600 flex-shrink-0 mt-0.5"
                            />
                            <p className="text-sm text-red-700">
                              {typeof alert === "string"
                                ? alert
                                : alert.message}
                            </p>
                          </div>
                        ))}
                        {analysisResults.alertes_maladie?.map((alert, idx) => (
                          <div
                            key={`disease-${idx}`}
                            className="flex gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                          >
                            <AlertCircle
                              size={20}
                              className="text-yellow-600 flex-shrink-0 mt-0.5"
                            />
                            <p className="text-sm text-yellow-700">
                              {typeof alert === "string"
                                ? alert
                                : alert.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Urgency */}
                  {analysisResults.urgence_display && (
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                      <h3 className="text-lg font-bold text-gray-800 mb-3">
                        Urgency Level
                      </h3>
                      <p className="text-2xl font-bold">
                        {analysisResults.urgence_display}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
  );
}
