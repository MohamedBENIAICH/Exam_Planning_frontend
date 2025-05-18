import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Building,
  AlertCircle,
  BookOpen,
  School,
  ChevronLeft,
  ChevronRight,
  Info,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  User,
} from "lucide-react";
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

interface ApiExam {
  id: number;
  cycle: string;
  filiere: string;
  module: string;
  date_examen: string;
  heure_debut: string;
  duree: number;
  locaux: string;
  superviseurs: string;
  created_at: string;
  updated_at: string;
}

interface Student {
  id: number;
  nom: string;
  prenom: string;
  numero_etudiant: string;
  email: string;
  filiere: string;
  niveau: string;
}

interface Assignment {
  classroom_id: number;
  classroom_name: string;
  capacity: number;
  students: {
    student_id: number;
    first_name: string;
    last_name: string;
    seat_number: number;
  }[];
}

const ExamSection = ({
  title,
  exams,
  loading,
  error,
}: {
  title: string;
  exams: ApiExam[];
  loading: boolean;
  error: string | null;
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const examsPerPage = 5;
  const [selectedExam, setSelectedExam] = useState<ApiExam | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<ApiExam | null>(null);
  const [showStudents, setShowStudents] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const { toast } = useToast();

  // Check if this is the past exams section
  const isPastExams = title === "Examens passés";

  // Sort exams by date
  const sortedExams = [...exams].sort(
    (a, b) =>
      new Date(a.date_examen).getTime() - new Date(b.date_examen).getTime()
  );

  // Calculate pagination
  const totalPages = Math.ceil(sortedExams.length / examsPerPage);
  const startIndex = (currentPage - 1) * examsPerPage;
  const endIndex = startIndex + examsPerPage;
  const paginatedExams = sortedExams.slice(startIndex, endIndex);

  // Group paginated exams by date
  const groupedExams = paginatedExams.reduce((acc, exam) => {
    const dateKey = format(new Date(exam.date_examen), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(exam);
    return acc;
  }, {} as Record<string, ApiExam[]>);

  // Reset to first page when exams change
  useEffect(() => {
    setCurrentPage(1);
  }, [exams]);

  const handleShowDetails = async (exam: ApiExam) => {
    setSelectedExam(exam);
    setIsDetailDialogOpen(true);
    setShowStudents(false);
    await fetchAssignmentsForExam(exam.id);
  };

  const fetchAssignmentsForExam = async (examId: number) => {
    setIsLoadingAssignments(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/exams/${examId}/assignments`
      );
      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.data.assignments)) {
        setAssignments(data.data.assignments);
      } else {
        setAssignments([]);
      }
    } catch (error) {
      setAssignments([]);
      console.error("Error fetching assignments:", error);
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const handleEditExam = (exam: ApiExam) => {
    // TODO: Implement edit functionality
    toast({
      title: "Modification",
      description: "La fonctionnalité de modification sera bientôt disponible",
    });
  };

  const handleDeleteClick = (exam: ApiExam) => {
    setExamToDelete(exam);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteExam = async (exam: ApiExam) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/exams/${exam.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast({
          title: "Examen supprimé",
          description: "L'examen a été supprimé avec succès",
          variant: "destructive",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description:
            errorData.message || "Échec de la suppression de l'examen",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description:
          "Une erreur s'est produite lors de la suppression de l'examen",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setExamToDelete(null);
    }
  };

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
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
        >
          Suivant
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  };

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

  const renderErrorState = () => (
    <div className="text-center py-8 flex flex-col items-center gap-2">
      <AlertCircle className="h-10 w-10 text-red-500" />
      <p className="text-red-500 font-medium">{error}</p>
      <p className="text-muted-foreground text-sm">
        Veuillez vérifier votre connexion et réessayer plus tard
      </p>
    </div>
  );

  const renderExamGroups = () => {
    const today = new Date();

    return Object.entries(groupedExams).map(([dateKey, examsForDate]) => {
      const examDate = new Date(dateKey);
      const isToday = format(today, "yyyy-MM-dd") === dateKey;
      const daysUntil = Math.ceil(
        (examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      return (
        <div key={dateKey} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isToday
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-600"
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
            {examsForDate.map((examen) => (
              <Card
                key={examen.id}
                className="border border-gray-200 hover:shadow-md transition-all duration-300"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-gray-500" />
                        <h3 className="font-medium text-gray-900">
                          {examen.module}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <School className="h-3 w-3" />
                        <span>
                          {examen.filiere} • {examen.cycle}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        {examen.heure_debut} ({examen.duree} min)
                      </Badge>

                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <Building className="h-3 w-3" />
                        {examen.locaux}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 p-4 pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShowDetails(examen)}
                  >
                    <Info className="h-4 w-4 mr-2" />
                    Détail
                  </Button>
                  {!isPastExams && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditExam(examen)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(examen)}
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

  const renderEmptyState = () => (
    <div className="text-center py-12 flex flex-col items-center gap-2">
      <Calendar className="h-12 w-12 text-gray-300" />
      <p className="font-medium text-gray-500 mt-2">Aucun examen</p>
      <p className="text-sm text-gray-400">Les examens apparaîtront ici</p>
    </div>
  );

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
                {!loading &&
                  !error &&
                  `${sortedExams.length} examen${
                    sortedExams.length > 1 ? "s" : ""
                  }`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {loading && renderLoadingState()}
          {error && renderErrorState()}
          {!loading && !error && sortedExams.length > 0 && (
            <>
              {renderExamGroups()}
              {renderPagination()}
            </>
          )}
          {!loading && !error && sortedExams.length === 0 && renderEmptyState()}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Détails de l'Examen
            </DialogTitle>
            {selectedExam && (
              <p className="text-gray-500 font-medium">{selectedExam.module}</p>
            )}
          </DialogHeader>
          {selectedExam && (
            <div className="space-y-6 py-2">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm uppercase text-gray-500 font-medium mb-1">
                      Informations du Programme
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cycle:</span>
                        <span className="font-medium">
                          {selectedExam.cycle}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Filière:</span>
                        <span className="font-medium">
                          {selectedExam.filiere}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm uppercase text-gray-500 font-medium mb-1">
                      Localisation
                    </h3>
                    <div className="space-y-1">
                      <p className="font-medium text-gray-800">
                        {selectedExam.locaux}
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
                        <div className="w-5 mr-2 text-gray-400">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <span className="text-gray-800">
                          {format(new Date(selectedExam.date_examen), "PPP", {
                            locale: fr,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-5 mr-2 text-gray-400">
                          <Clock className="h-4 w-4" />
                        </div>
                        <span className="text-gray-800">
                          {selectedExam.heure_debut} ({selectedExam.duree} min)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm uppercase text-gray-500 font-medium mb-1">
                      Supervision
                    </h3>
                    <div className="space-y-1">
                      <p className="font-medium text-gray-800">
                        {selectedExam.superviseurs}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowStudents(!showStudents)}
                  className="w-full flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50"
                >
                  {showStudents ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Masquer la liste des étudiants
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Afficher la liste des étudiants (
                      {assignments.reduce(
                        (total, assignment) =>
                          total + assignment.students.length,
                        0
                      )}
                      )
                    </>
                  )}
                </Button>
                {showStudents && (
                  <div className="mt-4 bg-gray-50 p-4 rounded-md">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm uppercase text-gray-500 font-medium">
                        Étudiants & Places
                      </h3>
                      <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                        {assignments.reduce(
                          (total, assignment) =>
                            total + assignment.students.length,
                          0
                        )}{" "}
                        au total
                      </span>
                    </div>
                    {isLoadingAssignments ? (
                      <div>Chargement des affectations de places...</div>
                    ) : assignments.length === 0 ? (
                      <div>Aucune affectation de place trouvée.</div>
                    ) : (
                      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                        {assignments.map((assignment) => (
                          <div key={assignment.classroom_id} className="mb-2">
                            <div className="font-semibold text-gray-700 mb-1">
                              {assignment.classroom_name} (Capacité :{" "}
                              {assignment.capacity})
                            </div>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {assignment.students.map((student) => (
                                <li
                                  key={student.student_id}
                                  className="text-sm py-1 px-2 border-b border-gray-100 flex items-center"
                                >
                                  <User className="h-3 w-3 text-gray-400 mr-2" />
                                  {student.last_name} {student.first_name}
                                  <span className="ml-auto text-xs text-gray-500">
                                    Place : {student.seat_number}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'examen de{" "}
              {examToDelete?.module} ? Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => examToDelete && handleDeleteExam(examToDelete)}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const UpcomingExams = () => {
  const [exams, setExams] = useState<ApiExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/exams");
        const data = await response.json();

        if (data.status === "success") {
          setExams(data.data);
        } else {
          setError("Échec du chargement des examens");
        }
      } catch (err) {
        setError("Une erreur s'est produite lors du chargement des examens");
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const currentDate = new Date();
  const pastExams = exams.filter(
    (exam) => new Date(exam.date_examen) < currentDate
  );
  const upcomingExams = exams.filter(
    (exam) => new Date(exam.date_examen) >= currentDate
  );

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-white p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ExamSection
          title="Examens passés"
          exams={pastExams}
          loading={loading}
          error={error}
        />
        <ExamSection
          title="Examens à venir"
          exams={upcomingExams}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
};

export default UpcomingExams;
