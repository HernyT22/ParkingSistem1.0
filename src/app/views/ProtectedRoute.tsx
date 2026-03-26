import React from "react"
import { Navigate } from "react-router"
import { Loader2 } from "lucide-react"
import { useAuth } from "../context/AuthContext"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50">
        <Loader2
          className="h-8 w-8 animate-spin text-blue-600"
          aria-hidden
        />
        <p className="text-gray-400 text-sm">Cargando...</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}