import React, { useEffect, useState } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setAuth } from "@/store/slices/authSlice";
import { getToken, apiClient } from "@/lib/api";
import type { AppDispatch, RootState } from "@/store";
import Layout from "@/components/ui/Layout";
import OnboardingPage from "@/pages/OnboardingPage";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import StudentsPage from "@/pages/StudentsPage";
import StudentDetailPage from "@/pages/StudentDetailPage";
import LessonsPage from "@/pages/LessonsPage";
import PaymentsPage from "@/pages/PaymentsPage";
import ReportsPage from "@/pages/ReportsPage";
import StatisticsPage from "@/pages/StatisticsPage";
import SettingsPage from "@/pages/SettingsPage";
import {
  loadProfileFromStorage,
  updateProfile,
} from "@/store/slices/profileSlice";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (token) {
      apiClient
        .get("/auth/me")
        .then(({ data }) => {
          dispatch(setAuth({ user: data, token }));
          dispatch(loadProfileFromStorage(data.id));
          dispatch(
            updateProfile({
              name: data.name,
              email: data.email,
              phone: data.phone ?? "",
              _userId: data.id,
            }),
          );
        })
        .catch(() => {
          import("@/lib/api").then(({ clearToken }) => clearToken());
        })
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, [dispatch]);

  if (!ready) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-page)",
        }}
      >
        <div style={{ fontSize: 13, color: "var(--text-3)" }}>
          Se încarcă...
        </div>
      </div>
    );
  }

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
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
