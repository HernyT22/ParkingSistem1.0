import { useState } from "react"
import { authService } from "../services/auth.service"

export function useAuthPresenter() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"login" | "register">("login")

  const handleLogin = async () => {
    setError(null)
    setLoading(true)
    try {
      await authService.signIn(email, password)
    } catch (e: any) {
      setError("Email o contraseña incorrectos")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    setError(null)
    setLoading(true)
    try {
      await authService.signUp(email, password)
      setError("Revisá tu email para confirmar la cuenta")
    } catch (e: any) {
      setError("Error al registrar. Verificá los datos.")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await authService.signOut()
  }

  return {
    email, setEmail,
    password, setPassword,
    error, loading, mode, setMode,
    handleLogin, handleRegister, handleLogout,
  }
}