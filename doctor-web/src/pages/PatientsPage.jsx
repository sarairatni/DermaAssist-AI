import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { patients } from '../services/api'
import NavBar from '../components/NavBar'
import toast from 'react-hot-toast'

export default function PatientsPage() {
  const [patientsList, setPatientsList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const response = await patients.list()
        setPatientsList(response.data)
      } catch (error) {
        toast.error('Failed to load patients')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadPatients()
  }, [])

  return (
    <>
      <NavBar />
      <div className="p-8 bg-gray-50 min-h-screen">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Patients</h1>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : patientsList.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-600">No patients yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {patientsList.map((patient) => (
              <Link
                key={patient.id}
                to={`/patients/${patient.id}`}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Patient ID: {patient.id}
                </h2>
                {patient.city && <p className="text-gray-600">City: {patient.city}</p>}
                {patient.fitzpatrick_type && (
                  <p className="text-gray-600">Fitzpatrick: Type {patient.fitzpatrick_type}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
