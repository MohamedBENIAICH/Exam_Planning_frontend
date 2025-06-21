import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Building,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Info,
  Trash2,
  Download,
  Mail,
  ChevronUp,
  ChevronDown,
  User,
  Users,
} from "lucide-react";
import ClassroomAssignments from "@/components/ClassroomAssignments/ClassroomAssignments";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import ConcoursForm from "@/components/Concours/ConcoursForm";

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
  classroom_assignments?: any[]; // For details modal
}

interface ConcoursSectionProps {
  title: string;
  concours: Concours[];
  loading: boolean;
  error: string | null;
  onConcoursUpdate: (updatedConcours: Concours) => void;
  onConcoursDelete: (deletedConcoursId: number) => void;
  availableLocaux?: any[];
  availableProfesseurs?: any[];
  availableSuperviseurs?: any[];
  availableCandidats?: any[];
  showEditButton?: boolean;
}

const ConcoursSection = ({
  title,
  concours,
  loading,
  error,
  onConcoursUpdate,
  onConcoursDelete,
  availableLocaux = [],
  availableProfesseurs = [],
  availableSuperviseurs = [],
  availableCandidats = [],
  showEditButton = true,
}: ConcoursSectionProps) => {
  const [showCandidates, setShowCandidates] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const concoursPerPage = 5;
  const [selectedConcours, setSelectedConcours] = useState<Concours | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [concoursToDelete, setConcoursToDelete] = useState<Concours | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConcour, setEditingConcour] = useState<Concours | null>(null);
  const [showClassroomAssignments, setShowClassroomAssignments] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [sendingConvocations, setSendingConvocations] = useState<{ [key: number]: boolean }>({});
  const { toast } = useToast();
  const [detailLoading, setDetailLoading] = useState(false);

  // Sort concours by date
  const sortedConcours = [...concours].sort(
    (a, b) => new Date(a.date_concours).getTime() - new Date(b.date_concours).getTime()
  );

  // Calculate pagination
  const totalPages = Math.ceil(sortedConcours.length / concoursPerPage);
  const startIndex = (currentPage - 1) * concoursPerPage;
  const endIndex = startIndex + concoursPerPage;
  const paginatedConcours = sortedConcours.slice(startIndex, endIndex);

  // Group paginated concours by date
  const groupedConcours = paginatedConcours.reduce((acc, concours) => {
    const dateKey = format(new Date(concours.date_concours), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(concours);
    return acc;
  }, {} as Record<string, Concours[]>);

  // Handler to download concours report
  const handleDownloadReport = async (concourId: number) => {
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
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de télécharger le compte rendu",
        variant: "destructive",
      });
    }
  };

  // Handler to send convocations
  const handleSendConvocations = async (concourId: number) => {
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
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer les convocations",
        variant: "destructive",
      });
    } finally {
      setSendingConvocations(prev => ({ ...prev, [concourId]: false }));
    }
  };

  // Handler to add or edit a concours
  const handleAddEditConcour = async (concour: Partial<Concours>) => {
    try {
      setFormLoading(true);
      if (editingConcour) {
        // Update concours
        const response = await fetch(
          `http://127.0.0.1:8000/api/concours/${editingConcour.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(concour),
          }
        );
        if (!response.ok) throw new Error("Erreur lors de la modification");
        toast({ 
          title: "Succès", 
          description: "Concours modifié ! Les convocations mises à jour avec QR codes ont été envoyées automatiquement aux candidats." 
        });
        onConcoursUpdate({ ...concour, id: editingConcour.id } as Concours);
        setEditingConcour(null);
        setIsDialogOpen(false);
      } else {
        // Create concours
        const response = await fetch("http://127.0.0.1:8000/api/concours", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(concour),
        });
        if (!response.ok) throw new Error("Erreur lors de l'ajout");
        const data = await response.json();
        toast({
          title: "Succès",
          description:
            "Concours créé ! Les convocations ont été envoyées automatiquement aux surveillants et professeurs.",
        });
        onConcoursUpdate({ ...concour, id: data.id || Date.now() } as Concours);
        setEditingConcour(null);
        setIsDialogOpen(false);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'enregistrement",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Handler to start editing a concours
  const handleEditConcour = (concour: Concours) => {
    setEditingConcour(concour);
    setIsDialogOpen(true);
  };

  // Handler to delete a concours (API call)
  const handleDeleteConcours = async (concoursId: number) => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/concours/${concoursId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("La suppression du concours a échoué");
      }

      toast({
        title: "Succès",
        description: "Le concours a été supprimé avec succès.",
      });

      // Remove the concours from the list using the new prop
      onConcoursDelete(concoursId);
    } catch (error: any) {
      console.error("Erreur lors de la suppression du concours:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors de la suppression du concours.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setConcoursToDelete(null);
    }
  };

  // Reset to first page when concours change
  useEffect(() => {
    setCurrentPage(1);
  }, [concours]);

  const handleShowDetails = async (concours: Concours) => {
    setDetailLoading(true);
    setIsDetailDialogOpen(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/concours/${concours.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch concours details");
      }
      const data = await response.json();
      setSelectedConcours(data);
    } catch (error) {
      console.error("Error fetching details:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du concours.",
        variant: "destructive",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteClick = (concours: Concours) => {
    setConcoursToDelete(concours);
    setIsDeleteDialogOpen(true);
  };

  // Pagination rendering
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between mt-4 px-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Précédent
        </Button>
        <span className="text-sm text-gray-600">
          Page {currentPage} sur {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Suivant
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  };

  // Loading state
  const renderLoadingState = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border rounded-md">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2 mt-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Error state
  const renderErrorState = () => (
    <div className="text-center py-8 flex flex-col items-center gap-2">
      <AlertCircle className="h-10 w-10 text-red-500" />
      <p className="text-red-500 font-medium">{error}</p>
      <p className="text-muted-foreground text-sm">
        Veuillez vérifier votre connexion et réessayer plus tard
      </p>
    </div>
  );

  // Empty state
  const renderEmptyState = () => (
    <div className="text-center py-10">
      <h3 className="text-xl font-semibold">Aucun concours trouvé</h3>
      <p className="text-gray-500">Il n'y a pas de concours à afficher pour le moment.</p>
    </div>
  );

  // Main concours list grouped by date
  const renderConcoursGroups = () => {
    return Object.keys(groupedConcours).map((date) => (
      <div key={date}>
        <h3 className="text-lg font-semibold my-4">
          {format(new Date(date), "EEEE, d MMMM yyyy", { locale: fr })}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {groupedConcours[date].map((concours) => (
            <Card key={concours.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{concours.titre}</CardTitle>
                    <CardDescription>{concours.description}</CardDescription>
                  </div>
                  <Badge variant={concours.status === 'annulé' ? 'destructive' : 'default'}>
                    {format(new Date(concours.date_concours), "dd-MM-yyyy")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>
                      {concours.heure_debut} - {concours.heure_fin}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Building className="w-4 h-4 mr-2" />
                    <span>
                      {
                        Array.isArray(concours.locaux)
                          ? concours.locaux.map((l: any) => l.nom_local || l.nom_du_local).join(", ")
                          : typeof concours.locaux === 'string'
                            ? (() => {
                                try {
                                  const parsed = JSON.parse(concours.locaux);
                                  return Array.isArray(parsed) ? parsed.map(l => l.nom_local).join(", ") : concours.locaux;
                                } catch (e) {
                                  return concours.locaux;
                                }
                              })()
                            : 'N/A'
                      }
                    </span>
                  </div>
                </div>
                <div className="col-span-1">
                  {concours.superviseurs && concours.superviseurs.length > 0 && (
                    <div className="mb-2">
                      <p className="font-semibold flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        Superviseurs
                      </p>
                      <p className="text-sm text-gray-500">
                        {concours.superviseurs.map((s) => `${s.nom} ${s.prenom}`).join(", ")}
                      </p>
                    </div>
                  )}
                  {concours.professeurs && concours.professeurs.length > 0 && (
                    <div className="mb-2">
                      <p className="font-semibold flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        Professeurs
                      </p>
                      <p className="text-sm text-gray-500">
                        {concours.professeurs.map((p) => `${p.nom} ${p.prenom}`).join(", ")}
                      </p>
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{concours.candidats.length} au total</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Info className="w-4 h-4 mr-2" />
                    <span>Type d'épreuve: {concours.type_epreuve}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col items-stretch pt-4">
                <div className="flex justify-between items-center mb-4">
                  {showEditButton && (
                    <Button
                      variant="outline"
                      onClick={() => handleEditConcour(concours)}
                      disabled={concours.status === 'annulé'}
                    >
                      Modifier
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteClick(concours)}
                    disabled={concours.status === 'annulé'}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                  <Button variant="ghost" onClick={() => handleShowDetails(concours)}>
                    <Info className="w-4 h-4 mr-2" />
                    Détail
                  </Button>
                </div>
                <div className="border-t pt-4">
                  <Button
                    variant="outline"
                    className="w-full mb-2"
                    onClick={() => handleSendConvocations(concours.id)}
                    disabled={sendingConvocations[concours.id] || concours.status === 'annulé'}
                  >
                    {sendingConvocations[concours.id] ? (
                      "Envoi en cours..."
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Envoyer convocations candidats
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleDownloadReport(concours.id)}
                    disabled={concours.status === 'annulé'}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Compte Rendu
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <>
      <Card className="border-gray-200 shadow-sm h-full">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {title}
              </CardTitle>
              <CardDescription className="mt-1">
                {!loading && !error && `${sortedConcours.length} concours${sortedConcours.length > 1 ? "s" : ""}`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {loading && renderLoadingState()}
          {error && renderErrorState()}
          {!loading && !error && sortedConcours.length > 0 && (
            <>
              {renderConcoursGroups()}
              {renderPagination()}
            </>
          )}
          {!loading && !error && sortedConcours.length === 0 && renderEmptyState()}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedConcours}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedConcours(null);
            setShowCandidates(false);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle>Détails du Concours</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="p-6 text-center">Chargement des détails...</div>
          ) : selectedConcours && selectedConcours.classroom_assignments ? (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">ÉTUDIANTS & PLACES</h3>
                <Badge>
                  {selectedConcours.classroom_assignments.length} au total
                </Badge>
              </div>

              {Object.values(
                selectedConcours.classroom_assignments.reduce((acc, assign) => {
                  if (!assign.classroom) return acc;
                  const classId = assign.classroom.id;
                  if (!acc[classId]) {
                    acc[classId] = {
                      classroom: assign.classroom,
                      candidats: [],
                    };
                  }
                  if (assign.candidat) {
                    acc[classId].candidats.push(assign.candidat);
                  }
                  return acc;
                }, {})
              ).map(({ classroom, candidats }: any) => (
                <div key={classroom.id} className="mb-4 border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">
                      {classroom.nom_du_local} (Capacité : {classroom.capacite})
                    </h4>
                    <span className="text-sm text-gray-500">
                      {candidats.length} / {classroom.capacite} places occupées
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {candidats.map((candidat: any, index: number) => (
                      <div
                        key={candidat.id}
                        className="bg-gray-100 p-2 rounded-md"
                      >
                        <p className="font-medium">{candidat.nom} {candidat.prenom}</p>
                        <p className="text-sm text-gray-600">Place : {index + 1}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6">Aucune donnée de répartition disponible.</div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Classroom Assignments Dialog */}
      <Dialog open={showClassroomAssignments} onOpenChange={setShowClassroomAssignments}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedConcours && (
            <ClassroomAssignments 
              concoursId={selectedConcours.id} 
              onClose={() => setShowClassroomAssignments(false)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit/Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingConcour ? "Modifier le concours" : "Ajouter un concours"}</DialogTitle>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'annulation</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir annuler le concours {concoursToDelete?.titre} ? Cette action enverra automatiquement des notifications d'annulation aux candidats, professeurs et superviseurs concernés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Fermer
            </Button>
            <Button
              variant="destructive"
              onClick={() => concoursToDelete && handleDeleteConcours(concoursToDelete.id)}
              disabled={isDeleting || !concoursToDelete}
            >
              {isDeleting ? "Annulation..." : "Annuler le concours"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConcoursSection;
export { ConcoursSection };
