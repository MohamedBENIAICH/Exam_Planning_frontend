import ProfilePage from './pages/Profile/ProfilePage';
import SecuritePage from './pages/Securite/SecuritePage';
import StagePage from './pages/Stage/StagePage';

import AchatsPage from './pages/Achats/AchatsPage';

import ExamPlaningPage from './pages/ExamPlaning/ExamPlaningPage';
import RhPage from './pages/Rh/RhPage';
import ConcoursPage from './pages/Concours/ConcoursPage';

import DashboardLayoutBasic from './components/DashboardLayoutBasic'
import { Route, Routes } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import { StudentsProvider } from './components/Exams/context/StudentsProvider';
import Index from './pages/ExamPlaning/Index';
import Students from './pages/ExamPlaning/Students';
import Teachers from './pages/ExamPlaning/Teachers';
import Classrooms from './pages/ExamPlaning/Classrooms';
import ExamScheduling from './pages/ExamPlaning/ExamScheduling';
import NotFound from './pages/ExamPlaning/NotFound';

function App() {
  return (
    <Routes>
    <Route path="/" element={<DashboardLayoutBasic />}>
      <Route path="profile" element={<ProfilePage />} />
      <Route path="securite" element={<SecuritePage />} />
      <Route path="stage" element={<StagePage />} />
      <Route path="achats" element={<AchatsPage />} />
      <Route path="examplaning" element={
        <StudentsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/students" element={<Students />} />
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/classrooms" element={<Classrooms />} />
              <Route path="/exams" element={<ExamScheduling />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </StudentsProvider>
      } />
      <Route path="rh" element={<RhPage />} />
      <Route path="concours" element={<ConcoursPage />} />
    </Route>
  </Routes>
  )
}

export default App;
