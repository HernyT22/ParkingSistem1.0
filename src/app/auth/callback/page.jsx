import { useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useNavigate } from "react-router"

export default function Callback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        navigate("/")
      } else {
        navigate("/login")
      }
    }
    handleAuth()
  }, [navigate])

  return <p>Procesando...</p>
}