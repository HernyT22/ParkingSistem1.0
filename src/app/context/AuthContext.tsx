import React, { createContext, useContext, useEffect, useState } from "react"
import { Session } from "@supabase/supabase-js"
import { authService } from "../services/auth.service"

interface AuthContextType {
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authService.getSession().then((s) => {
      setSession(s)
      setLoading(false)
    })

    const { data: listener } = authService.onAuthStateChange((s) => {
      setSession(s)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)