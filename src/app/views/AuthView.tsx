import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { useAuthPresenter } from "../presenters/useAuthPresenter"
import { useAuth } from "../context/AuthContext"
import { Button } from "../components/ui/button"
import { Car, Loader2 } from "lucide-react"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AuthView() {
  const p = useAuthPresenter()
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [frontError, setFrontError] = useState<string | null>(null)

  const errorToShow = useMemo(() => frontError ?? p.error, [frontError, p.error])

  useEffect(() => {
    if (!loading && session) {
      navigate("/", { replace: true })
    }
  }, [session, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden />
        <p className="text-gray-400 text-sm">Cargando...</p>
      </div>
    )
  }

  const validateFront = () => {
    const email = p.email.trim()
    const password = p.password

    if (!email) return "Debes ingresar un Email"
    if (!EMAIL_REGEX.test(email)) return "Debes ingresar un Email valido"
    if (!password) return "Debes ingresar una contraseña"
    if (password.length < 6) return "La contraseña debe tener 6 digitos como minimo"
    return null
  }

  const onSubmit = () => {
    const err = validateFront()
    if (err) {
      setFrontError(err)
      return
    }
    setFrontError(null)
    if (p.mode === "login") {
      p.handleLogin()
    } else {
      p.handleRegister()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8 space-y-6">

        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-blue-600 rounded-full p-3">
              <Car className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Playa de Estacionamiento</h1>
          <p className="text-sm text-gray-500">
            {p.mode === "login" ? "Iniciá sesión para continuar" : "Creá tu cuenta"}
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Email</label>
            <input
              type="email"
              value={p.email}
              onChange={(e) => {
                setFrontError(null)
                p.setEmail(e.target.value)
              }}
              placeholder="tu@email.com"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Contraseña</label>
            <input
              type="password"
              value={p.password}
              onChange={(e) => {
                setFrontError(null)
                p.setPassword(e.target.value)
              }}
              placeholder="••••••••"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>

          {errorToShow && (
            <p className="text-xs text-red-500 bg-red-50 rounded-md px-3 py-2">
              {errorToShow}
            </p>
          )}

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onSubmit}
            disabled={p.loading}
          >
            {p.loading ? "Cargando..." : p.mode === "login" ? "Ingresar" : "Registrarse"}
          </Button>
        </div>

        <div className="text-center">
          <button
            className="text-xs text-blue-600 hover:underline"
            onClick={() => p.setMode(p.mode === "login" ? "register" : "login")}
          >
            {p.mode === "login"
              ? "¿No tenés cuenta? Registrate"
              : "¿Ya tenés cuenta? Iniciá sesión"}
          </button>
        </div>
      </div>
    </div>
  )
}