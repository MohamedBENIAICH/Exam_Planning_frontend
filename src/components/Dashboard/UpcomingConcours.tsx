import React, { useEffect, useState, useCallback } from "react";
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
  CheckCircle,
  XCircle,
  Pencil,
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
  supervisors_notified: boolean;
  candidats_notified: boolean;
  supervisors_notified_at: string | null;
  candidats_notified_at: string | null;
  created_at: string;
  updated_at: string;
  candidats: Candidat[];
  superviseurs: Superviseur[];
  professeurs: Professeur[];
  classroom_assignments?: any[]; // For details modal
  repartition?: any[]; // Added for the new repartition format
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
  limit?: number;
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
  limit,
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
  const [detailLoading, setDetailLoading] = useState(false);
  const [showClassroomAssignments, setShowClassroomAssignments] = useState(false);

  // Safe JSON parsing function
  const safeJsonParse = useCallback((jsonString: string) => {
    try {
      if (!jsonString) return null;
      return JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      return null;
    }
  }, []);

  const [formLoading, setFormLoading] = useState(false);
  const [sendingConvocations, setSendingConvocations] = useState<{ [key: number]: boolean }>({});
  const [sendingSupervisorNotifications, setSendingSupervisorNotifications] = useState<{ [key: number]: boolean }>({});
  const [sendingCandidatConvocations, setSendingCandidatConvocations] = useState<{ [key: number]: boolean }>({});
  const { toast} = useToast();

  // Sort concours by date
  let sortedConcours = [...concours].sort(
    (a, b) => new Date(a.date_concours).getTime() - new Date(b.date_concours).getTime()
  );
  if (limit) {
    sortedConcours = sortedConcours.slice(-limit);
  }

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

  // Handler to send convocations (legacy - keep for backward compatibility)
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

  // Handler to send supervisor/professor notifications
  const handleSendSupervisorNotifications = async (concourId: number) => {
    try {
      setSendingSupervisorNotifications(prev => ({ ...prev, [concourId]: true }));

      const response = await fetch(
        `http://127.0.0.1:8000/api/concours/${concourId}/send-supervisor-notifications-manual`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de l'envoi des notifications");
      }

      toast({
        title: "Succès",
        description: "Les notifications ont été envoyées aux professeurs et superviseurs.",
        className: "bg-green-50 border-green-200 text-green-800",
      });

      // Refresh the page
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer les notifications",
        variant: "destructive",
      });
    } finally {
      setSendingSupervisorNotifications(prev => ({ ...prev, [concourId]: false }));
    }
  };

  // Handler to send candidat convocations
  const handleSendCandidatConvocations = async (concourId: number) => {
    try {
      setSendingCandidatConvocations(prev => ({ ...prev, [concourId]: true }));

      const response = await fetch(
        `http://127.0.0.1:8000/api/concours/${concourId}/send-candidat-convocations-manual`,
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
        title: "Succès",
        description: `Les convocations ont été envoyées à ${data.candidats_count} candidat(s).`,
        className: "bg-green-50 border-green-200 text-green-800",
      });

      // Refresh the page
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer les convocations",
        variant: "destructive",
      });
    } finally {
      setSendingCandidatConvocations(prev => ({ ...prev, [concourId]: false }));
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

        // Get the updated concours data from the backend (includes email status)
        const updatedData = await response.json();

        toast({
          title: "Succès",
          description: "Concours modifié ! Les convocations mises à jour avec QR codes ont été envoyées automatiquement aux candidats."
        });

        // Use the data from the backend which includes the updated email status
        onConcoursUpdate(updatedData as Concours);
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

      // Close the details dialog if it's open
      setIsDetailDialogOpen(false);
      setSelectedConcours(null);
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
        <div className="grid grid-cols-1 gap-4">
          {groupedConcours[date].map((concours) => (
            <Card key={concours.id} className="w-full">
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{concours.titre}</h3>
                    <p className="text-sm text-gray-500">{concours.description}</p>
                  </div>
                  <Badge variant={concours.status === 'cancelled' ? 'destructive' : 'default'}>
                    {format(new Date(concours.date_concours), "dd/MM/yyyy")}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{concours.heure_debut} - {concours.heure_fin}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{concours.candidats.length} candidats</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-500">
                      <Building className="w-4 h-4 mr-2" />
                      <span className="truncate">
                        {(() => {
                          try {
                            const parsed = typeof concours.locaux === 'string' ? JSON.parse(concours.locaux) : concours.locaux;
                            return Array.isArray(parsed) && parsed[0]?.nom_local 
                              ? parsed[0].nom_local 
                              : (Array.isArray(parsed) ? parsed[0]?.nom_du_local || 'N/A' : concours.locaux || 'N/A');
                          } catch (e) {
                            return concours.locaux || 'N/A';
                          }
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Info className="w-4 h-4 mr-2" />
                      <span>{concours.type_epreuve}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {concours.superviseurs?.length > 0 && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate" title={concours.superviseurs.map(s => `${s.prenom} ${s.nom}`).join(', ')}>
                          {concours.superviseurs.length} surveillant(s)
                        </span>
                      </div>
                    )}
                    {concours.professeurs?.length > 0 && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate" title={concours.professeurs.map(p => `${p.prenom} ${p.nom}`).join(', ')}>
                          {concours.professeurs.length} professeur(s)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left side: Details button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShowDetails(concours)}
                    >
                      Détails
                    </Button>

                    {/* Right side: Email status and action buttons - only for "Concours à venir" page */}
                    {title === "Concours à venir" && (
                      <div className="flex-1 space-y-3">
                        {/* Email Status Display */}
                        <div className="flex items-center justify-end gap-4 text-sm">
                          <div className="flex items-center gap-1.5">
                            {concours.supervisors_notified ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className={concours.supervisors_notified ? "text-green-600 font-medium" : "text-gray-500"}>
                              Profs/Superviseurs
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {concours.candidats_notified ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className={concours.candidats_notified ? "text-green-600 font-medium" : "text-gray-500"}>
                              Candidats
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReport(concours.id)}
                            disabled={concours.status === 'cancelled'}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Compte Rendu
                          </Button>

                          {/* Show notification buttons only if not already sent */}
                          {!concours.supervisors_notified && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendSupervisorNotifications(concours.id)}
                              disabled={sendingSupervisorNotifications[concours.id] || concours.status === 'annulé'}
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              {sendingSupervisorNotifications[concours.id] ? "Envoi..." : "Envoyer aux Profs"}
                            </Button>
                          )}

                          {!concours.candidats_notified && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendCandidatConvocations(concours.id)}
                              disabled={sendingCandidatConvocations[concours.id] || concours.status === 'annulé'}
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              {sendingCandidatConvocations[concours.id] ? "Envoi..." : "Envoyer aux Candidats"}
                            </Button>
                          )}

                          {/* Modifier button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditConcour(concours)}
                            disabled={concours.status === 'cancelled'}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Modifier
                          </Button>

                          {/* Supprimer button */}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(concours)}
                            disabled={concours.status === 'cancelled'}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* For past concours or "Les 5 derniers concours", only show download button */}
                    {(title === "Concours passés" || title === "Les 5 derniers concours") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadReport(concours.id)}
                        disabled={concours.status === 'cancelled'}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Compte Rendu
                      </Button>
                    )}
                  </div>
                </div>
              </div>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Détails du Concours
            </DialogTitle>
            {selectedConcours && (
              <p className="text-gray-500 font-medium">
                {selectedConcours.titre}
              </p>
            )}
          </DialogHeader>
          {selectedConcours && (
            <div className="space-y-6 py-2">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm uppercase text-gray-500 font-medium mb-1">
                      Informations Générales
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Titre:</span>
                        <span className="font-medium text-right">
                          {selectedConcours.titre || "Non spécifié"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Description:</span>
                        <span className="font-medium text-right">
                          {selectedConcours.description || "Non spécifiée"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type d'épreuve:</span>
                        <span className="font-medium">
                          {selectedConcours.type_epreuve || "Non spécifié"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Statut:</span>
                        <Badge variant={selectedConcours.status === 'active' ? 'default' : 'secondary'}>
                          {selectedConcours.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm uppercase text-gray-500 font-medium mb-1">
                      Localisation
                    </h3>
                    <div className="space-y-2">
                      {selectedConcours.repartition && selectedConcours.repartition.length > 0 ? (
                        selectedConcours.repartition.map((salle) => (
                          <div key={salle.classroom_id} className="mb-2">
                            <div className="font-medium">{salle.classroom_name}</div>
                            <div className="text-sm text-gray-600">
                              Capacité: {salle.assigned}/{salle.capacity} places
                            </div>
                          </div>
                        ))
                      ) : selectedConcours.locaux ? (
                        <p className="font-medium text-gray-800">
                          {(() => {
                            const parsedLocaux = safeJsonParse(selectedConcours.locaux);
                            if (Array.isArray(parsedLocaux) && parsedLocaux.length > 0) {
                              return parsedLocaux[0]?.nom_local || selectedConcours.locaux;
                            } else if (typeof selectedConcours.locaux === 'string') {
                              return selectedConcours.locaux;
                            }
                            return 'Aucun détail de local disponible';
                          })()}
                        </p>
                      ) : (
                        <p className="text-gray-500">Aucun local spécifié</p>
                      )}
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
                        <div className="w-5 mr-2 text-gray-400">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <span className="text-gray-800">
                          {selectedConcours.date_concours ? 
                            format(new Date(selectedConcours.date_concours), "PPP", { locale: fr }) :
                            "Date non spécifiée"
                          }
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-5 mr-2 text-gray-400">
                          <Clock className="h-4 w-4" />
                        </div>
                        <span className="text-gray-800">
                          {selectedConcours.heure_debut || "--:--"} - {selectedConcours.heure_fin || "--:--"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm uppercase text-gray-500 font-medium mb-1">
                      Candidats
                    </h3>
                    <div className="space-y-1">
                      {selectedConcours.candidats && selectedConcours.candidats.length > 0 ? (
                        <div>
                          <p className="font-medium text-gray-800">
                            {selectedConcours.candidats.length} candidat(s) inscrit(s)
                          </p>
                          <div className="mt-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                              <span>Dont assignés:</span>
                              <span>
                                {selectedConcours.repartition?.reduce((acc, salle) => acc + salle.candidats.length, 0) || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500">Aucun candidat</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm uppercase text-gray-500 font-medium mb-1">
                      Encadrement
                    </h3>
                    <div className="space-y-2">
                      {selectedConcours.superviseurs && selectedConcours.superviseurs.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-600 font-medium">Surveillants:</span>
                          <ul className="mt-1 space-y-1">
                            {selectedConcours.superviseurs.map((superviseur) => (
                              <li key={superviseur.id} className="font-medium text-gray-800">
                                {superviseur.prenom} {superviseur.nom}
                                {superviseur.service && ` (${superviseur.service})`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {selectedConcours.professeurs && selectedConcours.professeurs.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-600 font-medium">Professeurs:</span>
                          <ul className="mt-1 space-y-1">
                            {selectedConcours.professeurs.map((professeur) => (
                              <li key={professeur.id} className="font-medium text-gray-800">
                                {professeur.prenom} {professeur.nom}
                                {professeur.departement && ` (${professeur.departement})`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {(!selectedConcours.superviseurs || selectedConcours.superviseurs.length === 0) && 
                       (!selectedConcours.professeurs || selectedConcours.professeurs.length === 0) && (
                        <p className="text-gray-500">Aucun encadrant spécifié</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                  <h3 className="font-medium">Répartition des candidats</h3>
                  <Badge variant="outline">
                    {selectedConcours.repartition?.reduce((acc, salle) => acc + salle.candidats.length, 0) || 0} candidats répartis
                  </Badge>
                </div>
                <div className="p-4">
                  {selectedConcours.repartition && selectedConcours.repartition.length > 0 ? (
                    <div className="space-y-4">
                      {selectedConcours.repartition.map((salle) => (
                        <div key={salle.classroom_id} className="border rounded-md overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                            <div>
                              <span className="font-medium">{salle.classroom_name}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                ({salle.departement})
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {salle.assigned}/{salle.capacity} places
                            </div>
                          </div>
                          <div className="max-h-40 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Place</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNE</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CIN</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {salle.candidats.map((c) => (
                                  <tr key={`${salle.classroom_id}-${c.candidat_id}`} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                      {c.seat_number}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                      {c.prenom} {c.nom}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                      {c.cne}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                      {c.cin}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      Aucune répartition de candidats disponible
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedConcours(null);
                setShowCandidates(false);
              }}
            >
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