import React, { useState, useEffect } from "react";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import { ConcoursSection } from "@/components/Dashboard/UpcomingConcours";

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
  const [currentPage, setCurrentPage] = useState(1);
  const concoursPerPage = 5;

  // Pagination helpers
  const totalPages = Math.ceil(concours.length / concoursPerPage);
  const startIndex = (currentPage - 1) * concoursPerPage;
  const endIndex = startIndex + concoursPerPage;
  const paginatedConcours = concours.slice(startIndex, endIndex);

  useEffect(() => {
    const fetchConcours = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/concours/upcoming");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        let concoursList = [];
        if (Array.isArray(data)) {
          concoursList = data;
        } else if (data.status === "success" && Array.isArray(data.data)) {
          concoursList = data.data;
        } else {
          setError("Format de réponse API invalide");
        }
        // Filtrer côté frontend pour ne garder que les concours à venir (date future OU aujourd'hui et heure de début pas encore passée)
        const now = new Date();
        setConcours(concoursList.filter(c => {
          const concoursDate = new Date(c.date_concours);
          const concoursDebut = new Date(c.date_concours + 'T' + c.heure_debut);
          // Si la date est après aujourd'hui
          if (concoursDate > new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
            return true;
          }
          // Si la date est aujourd'hui et l'heure de début n'est pas encore passée
          if (
            concoursDate.getFullYear() === now.getFullYear() &&
            concoursDate.getMonth() === now.getMonth() &&
            concoursDate.getDate() === now.getDate() &&
            concoursDebut > now
          ) {
            return true;
          }
          return false;
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement des concours à venir");
      } finally {
        setLoading(false);
      }
    };
    fetchConcours();
  }, []);

  const handleConcoursUpdate = (updatedConcours: Concours) => {
    setConcours((prevConcours) =>
      prevConcours.map((concour) => (concour.id === updatedConcours.id ? updatedConcours : concour))
    );
  };

  const handleConcoursDelete = (deletedConcoursId: number) => {
    setConcours((prevConcours) =>
      prevConcours.filter((concour) => concour.id !== deletedConcoursId)
    );
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          title="Concours à venir"
          subtitle="Planification des concours futurs"
        />
        <div className="flex-1 p-4 sm:p-6">
          <ConcoursSection
            title="Concours à venir"
            concours={paginatedConcours}
            loading={loading}
            error={error}
            onConcoursUpdate={handleConcoursUpdate}
            onConcoursDelete={handleConcoursDelete}
            showEditButton={true}
          />
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4 gap-2">
              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </button>
              <span className="px-2 py-1">Page {currentPage} sur {totalPages}</span>
              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpcomingConcours;