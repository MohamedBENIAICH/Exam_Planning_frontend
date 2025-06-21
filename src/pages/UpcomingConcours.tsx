import React, { useState, useEffect } from "react";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import { ConcoursSection } from "@/components/Dashboard/UpcomingConcours";

// Interfaces for concours API structure
interface Candidat {
  id: number;
  CNE: string;
  CIN: string;
  nom: string;
  prenom: string;
  email: string;
}

interface Superviseur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  poste?: string;
  service?: string;
}

interface Professeur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  departement?: string;
}

interface Concours {
  id: number;
  titre: string;
  description: string;
  date_concours: string;
  heure_debut: string;
  heure_fin: string;
  locaux: string;
  type_epreuve: string;
  status: string;
  created_at: string;
  updated_at: string;
  candidats: Candidat[];
  superviseurs: Superviseur[];
  professeurs: Professeur[];
}

const UpcomingConcours = () => {
  const [concours, setConcours] = useState<Concours[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handler to update concours in state (e.g., after delete or edit)
  const handleConcoursUpdate = (updatedConcours: Concours) => {
    setConcours((prevConcours) =>
      prevConcours.map((concour) =>
        concour.id === updatedConcours.id ? updatedConcours : concour
      )
    );
  };

  const handleConcoursDelete = (deletedConcoursId: number) => {
    setConcours((prevConcours) =>
      prevConcours.filter((concour) => concour.id !== deletedConcoursId)
    );
  };

  useEffect(() => {
    const fetchConcours = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/concours/upcoming");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setConcours(data); // Tous les concours à venir
        } else if (data.status === "success" && Array.isArray(data.data)) {
          setConcours(data.data); // Tous les concours à venir
        } else {
          setError("Format de réponse API invalide");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement des concours à venir");
      } finally {
        setLoading(false);
      }
    };
    fetchConcours();
  }, []);


  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header 
          title="Concours à venir" 
          subtitle="Planification et suivi des concours futurs"
        />
        <div className="flex-1 p-4 sm:p-6">
          <ConcoursSection
            title="Concours à venir"
            concours={concours}
            loading={loading}
            error={error}
            onConcoursUpdate={handleConcoursUpdate}
            onConcoursDelete={handleConcoursDelete}
          />
        </div>
      </div>
    </div>
  );
};

export default UpcomingConcours; 