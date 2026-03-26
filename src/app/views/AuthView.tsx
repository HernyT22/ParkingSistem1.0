import React, { useEffect } from "react"
import { useNavigate } from "react-router"
import { useAuthPresenter } from "../presenters/useAuthPresenter"
import { useAuth } from "../context/AuthContext"
import { Button } from "../components/ui/button"
import { Car, Loader2 } from "lucide-react"

export function AuthView() {
  const p = useAuthPresenter()
  const { session, loading } = useAuth()
  const navigate = useNavigate()

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
              onChange={(e) => p.setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Contraseña</label>
            <input
              type="password"
              value={p.password}
              onChange={(e) => p.setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>

          {p.error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-md px-3 py-2">
              {p.error}
            </p>
          )}

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={p.mode === "login" ? p.handleLogin : p.handleRegister}
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