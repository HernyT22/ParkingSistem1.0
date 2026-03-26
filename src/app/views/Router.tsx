import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router"
import { AuthProvider } from "../context/AuthContext"
import { ProtectedRoute } from "./ProtectedRoute"
import { AuthView } from "./AuthView"
import App from "./App"

export function AppRouter() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthView />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}