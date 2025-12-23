import React, { useState, useEffect } from "react";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import { ExamSection } from "@/components/Dashboard/UpcomingExams";
import api from "@/services/api";

interface ApiExam {
  id: number;
  cycle: string;
  filiere_name: string;
  module_name: string;
  date_examen: string;
  heure_debut: string;
  heure_fin: string;
  duree: number;
  locaux: string;
  superviseurs: string;
  professeurs: string;
  created_at: string;
  updated_at: string;
}

const PastExams = () => {
  const [exams, setExams] = useState<ApiExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        console.log("Fetching past exams from API...");
        const response = await api.get("/exams/passed");

        console.log("Response status:", response.status);

        const data = response.data;
        console.log("API Response:", data);

        if (data.status === "success" && Array.isArray(data.data)) {
          console.log("Past exams found:", data.data.length);
          setExams(data.data);
        } else {
          console.error("API response format error:", data);
          setError("Format de réponse API invalide");
        }
      } catch (err) {
        console.error("Error fetching past exams:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Une erreur s'est produite lors du chargement des examens passés"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const handleExamUpdate = (updatedExam: ApiExam) => {
    setExams((prevExams) =>
      prevExams.map((exam) => (exam.id === updatedExam.id ? updatedExam : exam))
    );
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          title="Examens passés"
          subtitle="Historique des examens terminés"
        />
        <div className="flex-1 p-4 sm:p-6">
          <ExamSection
            title="Examens passés"
            exams={exams}
            loading={loading}
            error={error}
            onExamUpdate={handleExamUpdate}
          />
        </div>
      </div>
    </div>
  );
};

export default PastExams;
