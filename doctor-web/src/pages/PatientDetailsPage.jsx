import { useParams } from 'react-router-dom'
import NavBar from '../components/NavBar'

export default function PatientDetailsPage() {
  const { patientId } = useParams()

  return (
    <>
      <NavBar />
      <div className="p-8 bg-gray-50 min-h-screen">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">
          Patient: {patientId}
        </h1>
        <p className="text-gray-600">Patient details page - Coming soon</p>
      </div>
    </>
  )
}
