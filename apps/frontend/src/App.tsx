import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loadProfileFromStorage } from '@/store/slices/profileSlice'
import type { AppDispatch, RootState } from '@/store'
import Layout from '@/components/ui/Layout'
import OnboardingPage from '@/pages/OnboardingPage'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import StudentsPage from '@/pages/StudentsPage'
import StudentDetailPage from '@/pages/StudentDetailPage'
import LessonsPage from '@/pages/LessonsPage'
import PaymentsPage from '@/pages/PaymentsPage'
import ReportsPage from '@/pages/ReportsPage'
import StatisticsPage from '@/pages/StatisticsPage'
import SettingsPage from '@/pages/SettingsPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(loadProfileFromStorage())
  }, [dispatch])

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/dashboard" element={<RequireAuth><Layout><DashboardPage /></Layout></RequireAuth>} />
        <Route path="/students" element={<RequireAuth><Layout><StudentsPage /></Layout></RequireAuth>} />
        <Route path="/students/:id" element={<RequireAuth><Layout><StudentDetailPage /></Layout></RequireAuth>} />
        <Route path="/lessons" element={<RequireAuth><Layout><LessonsPage /></Layout></RequireAuth>} />
        <Route path="/payments" element={<RequireAuth><Layout><PaymentsPage /></Layout></RequireAuth>} />
        <Route path="/reports" element={<RequireAuth><Layout><ReportsPage /></Layout></RequireAuth>} />
        <Route path="/statistics" element={<RequireAuth><Layout><StatisticsPage /></Layout></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Layout><SettingsPage /></Layout></RequireAuth>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default App
