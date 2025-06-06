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
import NotFound from "./pages/NotFound";
import { StudentsProvider } from "./components/context/StudentsProvider"; // Import StudentsProvider
import ProfesseursForm from "./components/Professeurs/ProfesseursForm";

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
            <Route path="/professeurs" element={<Professeurs />} />
            <Route path="/professeurs/form" element={<ProfesseursForm />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </StudentsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
