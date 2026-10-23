import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import { TreatmentLibraryPage } from './pages/TreatmentLibraryPage'
import { TreatmentOptionsPage } from './pages/TreatmentOptionsPage'
import { ComparePage } from './pages/ComparePage'
import { PricingSettingsPage } from './pages/PricingSettingsPage'
import { LockScreen } from './pages/LockScreen'
import { NotFoundPage } from './pages/NotFoundPage'
import { CasesBoardPage } from './pages/CasesBoardPage'
import { ConsultPage } from './pages/ConsultPage'

// 3D-heavy and patient-facing pages load on demand so each audience only downloads what it uses.
const OptionDetailPage = lazy(() =>
  import('./pages/OptionDetailPage').then((module) => ({ default: module.OptionDetailPage })),
)
const PatientCasePage = lazy(() =>
  import('./pages/PatientCasePage').then((module) => ({ default: module.PatientCasePage })),
)

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
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<LockScreen />} />
            <Route path="/c/:token" element={<PatientCasePage />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route path="/cases" element={<CasesBoardPage />} />
                <Route path="/cases/:caseId" element={<ConsultPage />} />
                <Route path="/consult/new" element={<ConsultPage />} />
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
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
