import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Plus,
  CalendarIcon,
  Users,
  Building,
  Info,
  ClockIcon,
  ChevronDown,
  ChevronUp,
  UserIcon,
  Download,
  Mail,
} from "lucide-react";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import ConcoursForm from "@/components/Concours/ConcoursForm";
import { useToast } from "@/components/ui/use-toast";
import { ConcoursSection } from "@/components/Dashboard/UpcomingConcours";

const ConcourScheduling = () => {
  const [concours, setConcours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingConcour, setEditingConcour] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedConcour, setSelectedConcour] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [concourToDelete, setConcourToDelete] = useState(null);
  const [sendingConvocations, setSendingConvocations] = useState({});
  
  // Données dynamiques
  const [availableLocaux, setAvailableLocaux] = useState([]);
  const [availableProfesseurs, setAvailableProfesseurs] = useState([]);
  const [availableSuperviseurs, setAvailableSuperviseurs] = useState([]);
  const [availableCandidats, setAvailableCandidats] = useState([]);
  const [loadingData, setLoadingData] = useState({
    locaux: false,
    professeurs: false,
    superviseurs: false,
    candidats: false,
  });
  
  const { toast } = useToast();

  // Charger les données dynamiques
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Charger les locaux
        setLoadingData(prev => ({ ...prev, locaux: true }));
        const locauxResponse = await fetch("http://127.0.0.1:8000/api/classrooms");
        const locauxData = await locauxResponse.json();
        if (locauxData.status === "success") {
          setAvailableLocaux(locauxData.data);
        }

        // Charger les professeurs
        setLoadingData(prev => ({ ...prev, professeurs: true }));
        const professeursResponse = await fetch("http://127.0.0.1:8000/api/professeurs");
        const professeursData = await professeursResponse.json();
        if (professeursData.status === "success") {
          setAvailableProfesseurs(professeursData.data);
        }

        // Charger les superviseurs
        setLoadingData(prev => ({ ...prev, superviseurs: true }));
        const superviseursResponse = await fetch("http://127.0.0.1:8000/api/superviseurs");
        const superviseursData = await superviseursResponse.json();
        if (superviseursData.status === "success") {
          setAvailableSuperviseurs(superviseursData.data);
        }

        // Charger les candidats
        setLoadingData(prev => ({ ...prev, candidats: true }));
        const candidatsResponse = await fetch("http://127.0.0.1:8000/api/candidats");
        const candidatsData = await candidatsResponse.json();
        if (candidatsData.status === "success") {
          setAvailableCandidats(candidatsData.data);
        }

      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger certaines données",
          variant: "destructive",
        });
      } finally {
        setLoadingData({
          locaux: false,
          professeurs: false,
          superviseurs: false,
          candidats: false,
        });
      }
    };

    fetchAllData();
  }, [toast]);

  // Fetch concours as a named function so it can be reused
  const fetchConcours = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/concours/latest"
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        setConcours(data.slice(0, 5));
      } else {
        setError("Erreur lors du chargement des concours");
      }
    } catch (err) {
      setError("Erreur lors du chargement des concours");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConcours();
  }, []);

  const handleAddEditConcour = async (concourData) => {
    try {
      const submissionData = { ...concourData };

      // Handle locaux data properly
      if (Array.isArray(submissionData.locaux)) {
        // If it's an array of strings (IDs), keep it as is
        if (submissionData.locaux.length > 0 && typeof submissionData.locaux[0] === 'string') {
          // No need to stringify, the backend expects an array of IDs
          submissionData.locaux = submissionData.locaux;
        } else {
          // If it's an array of objects, extract the IDs
          submissionData.locaux = submissionData.locaux.map(local => 
            typeof local === 'object' ? local.id || local : local
          );
        }
      }

      setLoading(true);
      if (editingConcour) {
        // Update concours
        const response = await fetch(
          `http://127.0.0.1:8000/api/concours/${editingConcour.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(submissionData),
          }
        );
        console.log("Update response status:", response.status);
        if (!response.ok) throw new Error("Erreur lors de la modification");
        toast({
          title: "Succès",
          description: "Le concours a été modifié avec succès. Les convocations mises à jour avec QR codes ont été envoyées automatiquement aux candidats.",
        });
        setEditingConcour(null);
        setIsDialogOpen(false);
        fetchConcours(); // Refresh list after update
      } else {
        // Create concours
        console.log("Creating new concours with payload:", JSON.stringify(submissionData, null, 2));
        const response = await fetch("http://127.0.0.1:8000/api/concours", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submissionData),
        });
        console.log("Create response status:", response.status);
        if (!response.ok) throw new Error("Erreur lors de l'ajout");
        const data = await response.json();
        toast({
          title: "Succès",
          description: "Le concours a été ajouté avec succès.",
        });
        // Reset form state
        setEditingConcour(null);
        setIsDialogOpen(false);
        fetchConcours(); // Refresh list after add
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'enregistrement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditConcour = (concour) => {
    console.log("handleEditConcour called with concour:", concour);
    setEditingConcour(concour);
    setIsDialogOpen(true);
  };

  const handleDeleteConcour = async (concourId) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/concours/${concourId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("La suppression du concours a échoué");

      toast({
        title: "Succès",
        description: "Le concours a été supprimé avec succès.",
      });

      // Refetch the concours list to reflect the deletion
      fetchConcours();
    } catch (error) {
      toast({
        title: "Erreur",
        description:
          error.message ||
          "Une erreur s'est produite lors de la suppression du concours.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setConcourToDelete(null);
    }
  };

  const handleSendConvocations = async (concourId) => {
    try {
      setSendingConvocations(prev => ({ ...prev, [concourId]: true }));
      
      const response = await fetch(
        `http://127.0.0.1:8000/api/concours/${concourId}/send-convocations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de l'envoi des convocations");
      }

      toast({
        title: "Convocations envoyées",
        description: `Les convocations ont été envoyées avec succès à ${data.candidats_count} candidat(s).`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer les convocations",
        variant: "destructive",
      });
    } finally {
      setSendingConvocations(prev => ({ ...prev, [concourId]: false }));
    }
  };

  // Fonction pour obtenir le nom d'un local par son ID
  const getLocalName = (localId) => {
    const local = availableLocaux.find(l => l.id.toString() === localId.toString());
    return local ? local.nom_du_local : 'Local inconnu';
  };

  // Fonction pour obtenir le nom d'un professeur par son ID
  const getProfesseurName = (professeurId) => {
    const professeur = availableProfesseurs.find(p => p.id.toString() === professeurId.toString());
    return professeur ? `${professeur.prenom} ${professeur.nom}` : 'Professeur inconnu';
  };

  // Fonction pour obtenir le nom d'un superviseur par son ID
  const getSuperviseurName = (superviseurId) => {
    const superviseur = availableSuperviseurs.find(s => s.id.toString() === superviseurId.toString());
    return superviseur ? `${superviseur.prenom} ${superviseur.nom}` : 'Superviseur inconnu';
  };

  // Fonction pour obtenir le nom d'un candidat par son ID
  const getCandidatName = (candidatId) => {
    const candidat = availableCandidats.find(c => c.id.toString() === candidatId.toString());
    return candidat ? `${candidat.prenom} ${candidat.nom}` : 'Candidat inconnu';
  };

  // Function to handle report download
  const handleDownloadReport = async (concourId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/concours/${concourId}/download-report`, {
        method: "GET",
        headers: {
          "Content-Type": "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération du compte rendu");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Compte_Rendu_${concourId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Compte Rendu",
        description: "Le compte rendu a été téléchargé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de télécharger le compte rendu",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          title="Planification des concours"
          subtitle="Planifier et gérer les concours"
          actions={
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Planifier un concours
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingConcour
                      ? "Modifier le concours"
                      : "Planifier un nouveau concours"}
                  </DialogTitle>
                </DialogHeader>
                <ConcoursForm
                  concour={editingConcour || undefined}
                  onSubmit={handleAddEditConcour}
                  onCancel={() => {
                    setIsDialogOpen(false);
                    setEditingConcour(null);
                  }}
                  availableLocaux={availableLocaux}
                  availableProfesseurs={availableProfesseurs}
                  availableSuperviseurs={availableSuperviseurs}
                  availableCandidats={availableCandidats}
                />
              </DialogContent>
            </Dialog>
          }
        />
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          <Tabs defaultValue="grid">
            <TabsContent value="grid" className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <p>Chargement des concours...</p>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64 text-red-500">
                  <p>{error}</p>
                </div>
              ) : (
                <ConcoursSection
                  title="Les 5 derniers concours"
                  concours={concours}
                  loading={loading}
                  error={error}
                  onConcoursUpdate={handleAddEditConcour}
                  onConcoursDelete={handleDeleteConcour}
                  limit={5}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Details Modal */}
      <Dialog
        open={!!selectedConcour}
        onOpenChange={(open) => {
          if (!open) setSelectedConcour(null);
        }}
      >
        <DialogContent className="max-w-4xl p-8">
          <DialogHeader>
            <DialogTitle>Détails du Concours</DialogTitle>
          </DialogHeader>
          {selectedConcour && (
            <div className="space-y-6 p-2">
              <h2 className="text-2xl font-bold text-center mb-2">Détails du Concours</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <div className="bg-slate-50 rounded-lg p-4 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-lg font-semibold text-slate-700 mb-2">
                    <Info className="h-5 w-5 text-blue-500" />
                    Description
                  </div>
                  <div className="text-slate-800 text-base">{selectedConcour.description}</div>
                  <div className="flex items-center gap-2 mt-4">
                    <CalendarIcon className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Date :</span>
                    <span>{format(new Date(selectedConcour.date_concours), "PPP")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Heure :</span>
                    <span>{selectedConcour.heure_debut} - {selectedConcour.heure_fin}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">Locaux :</span>
                    <span className="truncate">
                      {(() => {
                        let locaux = selectedConcour.locaux;
                        if (Array.isArray(locaux) && locaux.length && typeof locaux[0] === 'object') {
                          return locaux.map(l => l.nom_local || l.nom_du_local).join(", ");
                        }
                        if (Array.isArray(locaux)) {
                          return locaux.map(id => getLocalName(id)).join(", ");
                        }
                        try {
                          const parsed = JSON.parse(locaux);
                          if (Array.isArray(parsed)) {
                            return parsed.map(l => l.nom_local || l.nom_du_local).join(", ");
                          }
                        } catch (e) {}
                        return locaux;
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-medium">Type d'épreuve :</span>
                    <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold ml-1">
                      {selectedConcour.type_epreuve}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 shadow-sm space-y-4">
                  <div>
                    <span className="font-semibold flex items-center gap-2 text-slate-700">
                      <Users className="h-5 w-5 text-pink-500" /> Superviseurs
                    </span>
                    <ul className="list-disc ml-6 mt-1 text-slate-800">
                      {Array.isArray(selectedConcour.superviseurs) && selectedConcour.superviseurs.length > 0 ? (
                        selectedConcour.superviseurs.map((s) => (
                          <li key={s.id}>{`${s.prenom} ${s.nom}`}</li>
                        ))
                      ) : (
                        <li>Aucun</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <span className="font-semibold flex items-center gap-2 text-slate-700">
                      <Users className="h-5 w-5 text-yellow-500" /> Professeurs
                    </span>
                    <ul className="list-disc ml-6 mt-1 text-slate-800">
                      {Array.isArray(selectedConcour.professeurs) && selectedConcour.professeurs.length > 0 ? (
                        selectedConcour.professeurs.map((p) => (
                          <li key={p.id}>{`${p.prenom} ${p.nom}`}</li>
                        ))
                      ) : (
                        <li>Aucun</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <span className="font-semibold flex items-center gap-2 text-slate-700">
                      <Users className="h-5 w-5 text-green-500" /> Candidats
                    </span>
                    <ul className="list-disc ml-6 mt-1 text-slate-800">
                      {Array.isArray(selectedConcour.candidats) && selectedConcour.candidats.length > 0 ? (
                        selectedConcour.candidats.map((c) => (
                          <li key={c.id}>{`${c.prenom} ${c.nom}`}</li>
                        ))
                      ) : (
                        <li>Aucun</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'annulation</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir annuler le concours{" "}
              {concourToDelete?.titre} ? Cette action enverra automatiquement des notifications d'annulation aux candidats, professeurs et superviseurs concernés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={loading}
            >
              Fermer
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                concourToDelete && handleDeleteConcour(concourToDelete.id)
              }
              disabled={loading}
            >
              {loading ? "Annulation..." : "Annuler le concours"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConcourScheduling;