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
}

interface ConcoursSectionProps {
  title: string;
  concours: Concours[];
  loading: boolean;
  error: string | null;
  onConcoursUpdate: (updatedConcours: Concours) => void;
  availableLocaux?: any[];
  availableProfesseurs?: any[];
  availableSuperviseurs?: any[];
  availableCandidats?: any[];
}

const ConcoursSection = ({
  title,
  concours,
  loading,
  error,
  onConcoursUpdate,
  availableLocaux = [],
  availableProfesseurs = [],
  availableSuperviseurs = [],
  availableCandidats = [],
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
        toast({ title: "Succès", description: "Concours modifié !" });
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
        `http://127.0.0.1:8000/api/concours/${concoursId}/cancel`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel concours");
      }

      toast({
        title: "Succès",
        description: "Le concours a été annulé avec succès.",
      });

      // Remove the concours from the list
      onConcoursUpdate({ ...concoursToDelete!, id: -1 }); // Mark as deleted (parent should filter out)
    } catch (error) {
      console.error("Error cancelling concours:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'annulation du concours",
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

  const handleShowDetails = (concours: Concours) => {
    setSelectedConcours(concours);
    setIsDetailDialogOpen(true);
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
    <div className="text-center py-12 flex flex-col items-center gap-2">
      <Calendar className="h-12 w-12 text-gray-300" />
      <p className="font-medium text-gray-500 mt-2">Aucun concours</p>
      <p className="text-sm text-gray-400">Les concours apparaîtront ici</p>
    </div>
  );

  // Main concours list grouped by date
  const renderConcoursGroups = () => {
    const today = new Date();
    return Object.entries(groupedConcours).map(([dateKey, concoursForDate]) => {
      const concoursDate = new Date(dateKey);
      const isToday = format(today, "yyyy-MM-dd") === dateKey;
      const daysUntil = Math.ceil(
        (concoursDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return (
        <div key={dateKey} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isToday ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
              }`}
            >
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">
                {format(new Date(dateKey), "EEEE d MMMM yyyy", { locale: fr })}
              </h3>
              {isToday ? (
                <Badge variant="default" className="mt-1">
                  Aujourd'hui
                </Badge>
              ) : daysUntil <= 7 ? (
                <Badge variant="outline" className="mt-1">
                  Dans {daysUntil} jour{daysUntil > 1 ? "s" : ""}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="space-y-3 pl-12">
            {concoursForDate.map((concour) => (
              <Card
                key={concour.id}
                className="border border-gray-200 hover:shadow-md transition-all duration-300"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">
                          {concour.titre}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{concour.type_epreuve}</span>
                        <span>•</span>
                        <span>{concour.status}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {concour.heure_debut} - {concour.heure_fin}
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {concour.locaux}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2 text-gray-700 text-sm">{concour.description}</div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 p-4 pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShowDetails(concour)}
                  >
                    <Info className="h-4 w-4 mr-2" />
                    Détail
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSendConvocations(concour.id)}
                    disabled={sendingConvocations[concour.id]}
                    className="mr-2"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {sendingConvocations[concour.id]
                      ? "Envoi..."
                      : "Envoyer convocations candidats"
                    }
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadReport(concour.id)}
                    className="mr-2"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Compte Rendu
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditConcour(concour)}
                    className="mr-2"
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setConcoursToDelete(concour);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      );
    });
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
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Détails du Concours
            </DialogTitle>
            {selectedConcours && (
              <p className="text-gray-500 font-medium">{selectedConcours.titre}</p>
            )}
          </DialogHeader>
          {selectedConcours && (
            <>
              <div className="space-y-6 py-2">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="text-sm uppercase text-gray-500 font-medium mb-1">
                        Informations générales
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Description:</span>
                          <span className="font-medium">{selectedConcours.description}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type d'épreuve:</span>
                          <span className="font-medium">{selectedConcours.type_epreuve}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-medium">{selectedConcours.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="text-sm uppercase text-gray-500 font-medium mb-1">
                        Localisation
                      </h3>
                      <div className="space-y-1">
                        <p className="font-medium text-gray-800">
                          {Array.isArray(selectedConcours.locaux)
                            ? selectedConcours.locaux.join(", ")
                            : selectedConcours.locaux}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="text-sm uppercase text-gray-500 font-medium mb-1">
                        Horaire
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <span className="text-gray-600 mr-2">Date:</span>
                          <span className="text-gray-800">
                            {selectedConcours.date_concours ? format(new Date(selectedConcours.date_concours), "PPP", { locale: fr }) : "Non spécifié"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-600 mr-2">Heure:</span>
                          <span className="text-gray-800">
                            {selectedConcours.heure_debut} - {selectedConcours.heure_fin}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="text-sm uppercase text-gray-500 font-medium mb-1">
                        Supervision
                      </h3>
                      <div className="space-y-2">
                        {selectedConcours.superviseurs && selectedConcours.superviseurs.length > 0 && (
                          <div>
                            <span className="text-sm text-gray-600 font-medium">Surveillants:</span>
                            <p className="font-medium text-gray-800">
                              {selectedConcours.superviseurs.map((s: any) => `${s.prenom} ${s.nom}`).join(", ")}
                            </p>
                          </div>
                        )}
                        {selectedConcours.professeurs && selectedConcours.professeurs.length > 0 && (
                          <div>
                            <span className="text-sm text-gray-600 font-medium">Professeurs:</span>
                            <p className="font-medium text-gray-800">
                              {selectedConcours.professeurs.map((p: any) => `${p.prenom} ${p.nom}`).join(", ")}
                            </p>
                          </div>
                        )}
                        {(!selectedConcours.superviseurs || selectedConcours.superviseurs.length === 0) &&
                          (!selectedConcours.professeurs || selectedConcours.professeurs.length === 0) && (
                            <p className="font-medium text-gray-800">Aucun surveillant ou professeur assigné</p>
                          )}
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button 
                        variant="outline"
                        onClick={() => setShowClassroomAssignments(true)}
                        className="flex items-center gap-2"
                      >
                        <Users className="h-4 w-4" />
                        Voir les affectations des salles
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              {/* CANDIDATES DROPDOWN AT BOTTOM, FULL WIDTH */}
              <div className="pt-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => setShowCandidates(!showCandidates)}
                  className="w-full flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50"
                >
                  {showCandidates ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Masquer la liste des candidats
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Afficher la liste des candidats ({selectedConcours.candidats ? selectedConcours.candidats.length : 0})
                    </>
                  )}
                </Button>
                {showCandidates && (
                  <div className="mt-4 bg-gray-50 p-4 rounded-md w-full">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm uppercase text-gray-500 font-medium">
                        Candidats & Détails
                      </h3>
                      <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                        {selectedConcours.candidats ? selectedConcours.candidats.length : 0} au total
                      </span>
                    </div>
                    {selectedConcours.candidats && selectedConcours.candidats.length === 0 ? (
                      <div className="text-gray-500 italic p-4">Aucun candidat trouvé.</div>
                    ) : (
                      <div className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(() => {
                            // Ensure we have exactly two locaux
                            let locaux: string[] = [];
                            
                            // Handle different possible types of selectedConcours.locaux
                            if (Array.isArray(selectedConcours.locaux)) {
                              // If it's an array, use it directly
                              locaux = selectedConcours.locaux;
                            } else if (typeof selectedConcours.locaux === 'string') {
                              // If it's a string, try to parse it as JSON or split by comma
                              try {
                                const parsed = JSON.parse(selectedConcours.locaux);
                                locaux = Array.isArray(parsed) ? parsed : [selectedConcours.locaux];
                              } catch (e) {
                                locaux = selectedConcours.locaux.split(',').map((s: string) => s.trim());
                              }
                            }
                            
                            // If no valid locaux are defined, use default ones
                            const defaultLocaux = ['Salle 1', 'Salle 2'];
                            const activeLocaux = locaux.length >= 2 ? locaux.slice(0, 2) : defaultLocaux;
                            
                            // Group students by their assigned local
                            const studentsByLocal: Record<string, any[]> = {};
                            
                            // Initialize all locaux with empty arrays
                            activeLocaux.forEach(local => {
                              studentsByLocal[local] = [];
                            });
                            
                            // Distribute students to locaux in a round-robin fashion
                            selectedConcours.candidats.forEach((candidat: any, index: number) => {
                              const localIndex = index % activeLocaux.length;
                              const localName = activeLocaux[localIndex];
                              studentsByLocal[localName].push(candidat);
                            });
                            
                            // Render each local section with its students
                            return activeLocaux.map((localName) => {
                              const studentsInLocal = studentsByLocal[localName] || [];
                              const localInfo = availableLocaux.find(l => l.nom_du_local === localName);
                              const capacity = localInfo?.capacite || studentsInLocal.length;
                              
                              return (
                                <div key={localName} className="border rounded-lg overflow-hidden bg-white">
                                  <div className="bg-gray-50 px-4 py-2 border-b">
                                    <div className="flex justify-between items-center">
                                      <h4 className="font-medium text-gray-900">
                                        {localName}
                                      </h4>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                          {studentsInLocal.length} / {capacity} places
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="divide-y">
                                    {studentsInLocal.map((student, index) => (
                                      <div 
                                        key={`${localName}-${student.id}-${index}`} 
                                        className="px-4 py-2 flex justify-between items-center hover:bg-gray-50"
                                      >
                                        <div className="flex items-center">
                                          <span className="font-medium text-gray-900">
                                            {student.nom} {student.prenom}
                                          </span>
                                        </div>
                                        <span className="text-sm text-blue-600 font-medium">
                                          Place {index + 1}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
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
