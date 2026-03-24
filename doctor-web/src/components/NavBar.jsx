import { Link } from 'react-router-dom'
import { useAuthStore } from '../services/authStore'

export default function NavBar() {
  const logout = useAuthStore((state) => state.logout)

  return (
    <nav className="bg-blue-600 text-white p-4 shadow">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">DermAssist</h1>
        
        <div className="flex gap-4">
          <Link to="/dashboard" className="hover:bg-blue-700 px-3 py-2 rounded">
            Dashboard
          </Link>
          <Link to="/patients" className="hover:bg-blue-700 px-3 py-2 rounded">
            Patients
          </Link>
          <button
            onClick={() => {
              logout()
              window.location.href = '/login'
            }}
            className="hover:bg-red-600 px-3 py-2 rounded bg-red-500"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
