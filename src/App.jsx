import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Classrooms from "./pages/Classrooms";
import Professeurs from "./pages/Professeurs";
import ExamScheduling from "./pages/ExamScheduling";
import ConcourScheduling from "./pages/ConcourScheduling";
import PastExams from "./pages/PastExams";
import UpcomingExams from "./pages/UpcomingExams";
import NotFound from "./pages/NotFound";
import { StudentsProvider } from "./components/context/StudentsProvider"; // Import StudentsProvider
import ProfesseursForm from "./components/Professeurs/ProfesseursForm";
import Superviseurs from "./pages/Superviseurs";
import SuperviseursForm from "./components/Superviseurs/SuperviseursForm";
import Formations from "./pages/Formations";
import FormationsForm from "./components/Formations/FormationsForm";
import Filieres from "./pages/Filieres";
import FilieresForm from "./components/Filieres/FilieresForm";
import FilieresUpdateForm from "./components/Filieres/FilieresUpdateForm.jsx";
import Modules from "./pages/Modules";
import ModulesForm from "./components/Modules/ModulesForm";
import ModulesUpdateForm from "./components/Modules/ModulesUpdateForm.jsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <StudentsProvider>
        {" "}
        {/* Wrap the app with StudentsProvider */}
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/students" element={<Students />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/classrooms" element={<Classrooms />} />
            <Route path="/exams" element={<ExamScheduling />} />
            <Route path="/concours" element={<ConcourScheduling />} />
            <Route path="/past-exams" element={<PastExams />} />
            <Route path="/upcoming-exams" element={<UpcomingExams />} />
            <Route path="/professeurs" element={<Professeurs />} />
            <Route path="/professeurs/form" element={<ProfesseursForm />} />
            <Route path="/superviseurs" element={<Superviseurs />} />
            <Route path="/superviseurs/form" element={<SuperviseursForm />} />
            <Route path="/formations" element={<Formations />} />
            <Route path="/formations/form" element={<FormationsForm />} />
            <Route path="/filieres" element={<Filieres />} />
            <Route path="/filieres/form" element={<FilieresForm />} />
            <Route
              path="/filieres/updateform"
              element={<FilieresUpdateForm />}
            />
            <Route path="/modules" element={<Modules />} />
            <Route path="/modules/form" element={<ModulesForm />} />
            <Route path="/modules/updateform" element={<ModulesUpdateForm />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </StudentsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
