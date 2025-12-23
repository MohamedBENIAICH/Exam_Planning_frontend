import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Edit, Trash2, Calendar, Users, Building, Clock } from "lucide-react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { getLatestExams, deleteExam } from "@/services/examService";
import ExamForm from "./ExamForm";

const ExamsList = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState(null);
  const { toast } = useToast();

  // Fetch latest exams from the API
  const fetchExams = async () => {
    try {
      setLoading(true);
      const data = await getLatestExams();
      setExams(data.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch exams. Please try again later.");
      toast({
        title: "Error",
        description: "Failed to load exams",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load exams on component mount
  useEffect(() => {
    fetchExams();
  }, []);

  // Handle exam deletion
  const handleDeleteClick = (exam) => {
    setExamToDelete(exam);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!examToDelete) return;

    setLoading(true);
    try {
      await api.post(`/exams/${examToDelete.id}/cancel`);

      // Remove the exam from the local state
      setExams(exams.filter((exam) => exam.id !== examToDelete.id));

      toast({
        title: "Examen annulé",
        description: `L'examen de ${examToDelete.module} a été annulé avec succès`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Impossible d'annuler l'examen: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setExamToDelete(null);
      setLoading(false);
    }
  };

  // Handle exam edit
  const handleEditClick = (exam) => {
    setExamToEdit(exam);
    setIsEditDialogOpen(true);
  };

  const handleExamUpdate = async (updatedExam) => {
    // Update the exam in the local state
    setExams(
      exams.map((exam) => (exam.id === updatedExam.id ? updatedExam : exam))
    );

    setIsEditDialogOpen(false);
    setExamToEdit(null);
  };

  if (loading && exams.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        Chargement des examens...
      </div>
    );
  }

  if (error && exams.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchExams}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Liste des Examens</h1>
        <Button
          onClick={() => {
            setExamToEdit(null);
            setIsEditDialogOpen(true);
          }}
        >
          Créer un nouvel examen
        </Button>
      </div>

      {exams.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">Aucun examen trouvé</p>
          <Button
            className="mt-4"
            onClick={() => {
              setExamToEdit(null);
              setIsEditDialogOpen(true);
            }}
          >
            Créer votre premier examen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <Card key={exam.id} className="overflow-hidden">
              <CardHeader className="bg-slate-50">
                <CardTitle className="text-lg">{exam.module}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(exam.date), "PPP")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {exam.startTime} ({exam.duration} min)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{exam.classrooms.length} salle(s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{exam.students.length} étudiant(s)</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between bg-slate-50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditClick(exam)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleDeleteClick(exam)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'annulation</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir annuler l'examen de{" "}
              {examToDelete?.module}? Cette action enverra automatiquement des
              notifications d'annulation aux étudiants, professeurs et
              superviseurs concernés.
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
              onClick={confirmDelete}
              disabled={loading}
            >
              {loading ? "Annulation..." : "Annuler l'examen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Exam Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {examToEdit ? "Modifier l'examen" : "Créer un nouvel examen"}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-6">
            <ExamForm
              exam={examToEdit}
              onSubmit={handleExamUpdate}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamsList;
