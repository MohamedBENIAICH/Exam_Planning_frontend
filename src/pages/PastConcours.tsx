import React, { useState, useEffect } from "react";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import { ConcoursSection } from "@/components/Dashboard/UpcomingConcours";
import api from "@/services/api";

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
  supervisors_notified: boolean;
  candidats_notified: boolean;
  supervisors_notified_at: string | null;
  candidats_notified_at: string | null;
  created_at: string;
  updated_at: string;
  candidats: Candidat[];
  superviseurs: Superviseur[];
  professeurs: Professeur[];
}

const PastConcours = () => {
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
        const response = await api.get("/concours/passed");
        const data = response.data;
        let concoursList = [];
        if (Array.isArray(data)) {
          concoursList = data;
        } else if (data.status === "success" && Array.isArray(data.data)) {
          concoursList = data.data;
        } else {
          setError("Format de réponse API invalide");
        }
        // Filtrer côté frontend pour ne garder que les concours passés (date passée OU aujourd'hui et heure de fin passée)
        const now = new Date();
        setConcours(concoursList.filter(c => {
          const concoursDate = new Date(c.date_concours);
          const concoursFin = new Date(c.date_concours + 'T' + c.heure_fin);
          // Si la date est avant aujourd'hui
          if (concoursDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
            return true;
          }
          // Si la date est aujourd'hui et l'heure de fin est passée
          if (
            concoursDate.getFullYear() === now.getFullYear() &&
            concoursDate.getMonth() === now.getMonth() &&
            concoursDate.getDate() === now.getDate() &&
            concoursFin < now
          ) {
            return true;
          }
          return false;
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement des concours passés");
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
          title="Concours passés"
          subtitle="Historique des concours terminés"
        />
        <div className="flex-1 p-4 sm:p-6">
          <ConcoursSection
            title="Concours passés"
            concours={paginatedConcours}
            loading={loading}
            error={error}
            onConcoursUpdate={handleConcoursUpdate}
            onConcoursDelete={handleConcoursDelete}
            showEditButton={false}
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

export default PastConcours;
