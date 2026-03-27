import { useEffect } from "react"

import { useNavigate } from "react-router"

export default function Callback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/")
      } else if (event === "PASSWORD_RECOVERY") {
        navigate("/reset-password")
      } else {
        navigate("/login")
      }
    })
  }, [navigate])

  return <p>Procesando autenticación...</p>
}