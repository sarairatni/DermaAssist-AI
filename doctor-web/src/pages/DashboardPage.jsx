import { useEffect, useState } from 'react'
import { useAuthStore } from '../services/authStore'
import { patients } from '../services/api'
import NavBar from '../components/NavBar'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    totalPatients: 0,
    recentConsultations: 0,
    pendingAnalysis: 0,
  })

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await patients.list()
        setStats({
          totalPatients: response.data.length,
          recentConsultations: 0, // À implémenter
          pendingAnalysis: 0, // À implémenter
        })
      } catch (error) {
        console.error('Failed to load stats:', error)
      }
    }

    loadStats()
  }, [])

  return (
    <>
      <NavBar />
      <div className="p-8 bg-gray-50 min-h-screen">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-semibold uppercase mb-2">
              Total Patients
            </h3>
            <p className="text-4xl font-bold text-blue-600">{stats.totalPatients}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-semibold uppercase mb-2">
              Recent Consultations
            </h3>
            <p className="text-4xl font-bold text-green-600">{stats.recentConsultations}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-semibold uppercase mb-2">
              Pending Analysis
            </h3>
            <p className="text-4xl font-bold text-orange-600">{stats.pendingAnalysis}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Welcome to DermAssist AI</h2>
          <p className="text-gray-600">
            This is your medical dashboard where you can manage patient records,
            analyze skin images, and receive AI-powered insights.
          </p>
        </div>
      </div>
    </>
  )
}
