import { lazy, Suspense, type ReactNode } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  AuthRedirectHandler,
  GuestOnlyRoute,
  ProtectedRoute,
} from "@/components/layout/RouteGuards";
import { Spinner } from "@/components/ui/Button";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider, ToastViewport } from "@/context/ToastContext";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const CalendarPage = lazy(() => import("@/pages/CalendarPage"));
const TopicsPage = lazy(() => import("@/pages/TopicsPage"));
const AddTopicPage = lazy(() => import("@/pages/AddTopicPage"));
const TopicDetailPage = lazy(() => import("@/pages/TopicDetailPage"));
const ComingSoonPage = lazy(() => import("@/pages/common"));

function LazyPage({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PageFallback />}>
      {children}
    </Suspense>
  );
}

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="h-7 w-7 text-brand-600" />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <ToastProvider>
          <AuthRedirectHandler />
          <ToastViewport />
          <Routes>
            <Route element={<GuestOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route
                  path="/"
                  element={
                    <LazyPage>
                      <DashboardPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <LazyPage>
                      <CalendarPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/today"
                  element={
                    <LazyPage>
                      <ComingSoonPage title="Today's Revision" />
                    </LazyPage>
                  }
                />
                <Route
                  path="/topics"
                  element={
                    <LazyPage>
                      <TopicsPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/topics/new"
                  element={
                    <LazyPage>
                      <AddTopicPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/topics/:id"
                  element={
                    <LazyPage>
                      <TopicDetailPage />
                    </LazyPage>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <LazyPage>
                      <ComingSoonPage title="Settings" />
                    </LazyPage>
                  }
                />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  );
}