import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { DashboardPage } from './pages/DashboardPage'
import { TreatmentOptionsPage } from './pages/TreatmentOptionsPage'
import { OptionDetailPage } from './pages/OptionDetailPage'
import { ComparePage } from './pages/ComparePage'
import { NotFoundPage } from './pages/NotFoundPage'

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/treatment/:treatmentId" element={<TreatmentOptionsPage />} />
        <Route path="/treatment/:treatmentId/option/:optionId" element={<OptionDetailPage />} />
        <Route path="/treatment/:treatmentId/compare" element={<ComparePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
