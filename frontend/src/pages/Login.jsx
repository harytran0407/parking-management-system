import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Lock, Mail , ArrowLeft} from 'lucide-react'
import googleIcon from '../assets/google.png'

import { useGoogleLogin } from '@react-oauth/google'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('manager')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')


  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)


    try {
      await login(email, password, role)
      navigate(`/${role}`)
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  
  const roles = [
    { value: 'manager', label: 'Parking Manager' },
    { value: 'staff', label: 'Parking Staff' },
    { value: 'user', label: 'Driver' },
    { value: 'admin', label: 'Administrator' }
  ]

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
      
<div 
  className="absolute inset-0 bg-cover bg-center z-0 opacity-25" 
  style={{ backgroundImage: `url('https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=1920')` }}/>

<div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-dark-900/80 to-dark-900 z-0" />
    {/* Back to Home */}
        <Link to="/" className="absolute top-6 left-6 flex items-center gap-1.5 text-base font-semibold text-gray-400 hover:text-white transition duration-200">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to home</span>
        </Link>
      <div className="w-full max-w-md">
        <div className="card backdrop-blur-md bg-dark-900/70 border border-gray-800/50 shadow-2xl ">
        

          <div className="text-center mb-8 ">
            <h1 className="text-3xl font-bold text-white mb-2">Smartpark</h1>
            <p className="text-gray-400">Parking Management System</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input-field"
              >
                {roles.map(r => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
             {/* Link to register page    */}
             <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-sm">or</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          {/* Google button*/}
          <button 
            type="button" 
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition duration-200"
          >
            <img src={googleIcon} alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          {/* Dòng chữ chuyển hướng sang trang Đăng ký */}
          <p className="text-center text-sm text-gray-400 mt-6 mb-2">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-500 hover:underline font-medium">
              Register
            </Link>
          </p>

          <div className="mt-6 p-4 bg-dark-700 rounded-lg text-sm text-gray-300">
            <p className="font-semibold mb-2">Demo Credentials:</p>
            <p>Email: demo@smartpark.com</p>
            <p>Password: demo123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
