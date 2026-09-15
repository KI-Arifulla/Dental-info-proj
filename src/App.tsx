import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import { TreatmentLibraryPage } from './pages/TreatmentLibraryPage'
import { TreatmentOptionsPage } from './pages/TreatmentOptionsPage'
import { OptionDetailPage } from './pages/OptionDetailPage'
import { ComparePage } from './pages/ComparePage'
import { PricingSettingsPage } from './pages/PricingSettingsPage'
import { LockScreen } from './pages/LockScreen'
import { NotFoundPage } from './pages/NotFoundPage'

function RequireAuth() {
  const { unlocked } = useAuth()
  return unlocked ? <Outlet /> : <Navigate to="/" replace />
}

function AppLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LockScreen />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/treatments" element={<TreatmentLibraryPage />} />
              <Route path="/treatment/:treatmentId" element={<TreatmentOptionsPage />} />
              <Route path="/treatment/:treatmentId/compare" element={<ComparePage />} />
              <Route
                path="/treatment/:treatmentId/option/:optionId"
                element={<OptionDetailPage />}
              />
              <Route path="/settings" element={<PricingSettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
