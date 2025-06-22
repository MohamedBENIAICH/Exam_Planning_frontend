import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import {
  Plus,
  Calendar as CalendarIcon,
  Filter,
  Users,
  Building,
  Info,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
  Download,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import ExamForm from "@/components/Exams/ExamForm";
import { useToast } from "@/hooks/use-toast";
import {
  mockExams,
  mockClassrooms,
  mockTeachers,
  mockStudents,
} from "@/lib/mockData";
import { Exam } from "@/types";
import { fr } from "@/translations/fr";
import { downloadExamPdf } from "@/services/examService";

type Assignment = {
  classroom_id: number;
  classroom_name: string;
  capacity: number;
  students: {
    student_id: number;
    first_name: string;
    last_name: string;
    seat_number: number;
  }[];
};

const ExamScheduling = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showStudents, setShowStudents] = useState(false);
  const { toast } = useToast();
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [importedStudents, setImportedStudents] = useState(mockStudents);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [fetchedStudents, setFetchedStudents] = useState<
    Array<{
      id: number;
      nom: string;
      prenom: string;
      numero_etudiant: string;
      email: string;
      filiere: string;
      niveau: string;
    }>
  >([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [moduleNames, setModuleNames] = useState<Record<string, string>>({});
  const [classroomNames, setClassroomNames] = useState<Record<string, string>>(
    {}
  );
  const [formationName, setFormationName] = useState<string>("");
  const [filiereName, setFiliereName] = useState<string>("");

  interface ApiExam {
    id: number;
    formation: string;
    filiere: string;
    module_id: string;
    semestre: string;
    date_examen: string;
    heure_debut: string;
    heure_fin: string;
    locaux?: string;
    superviseurs?: Array<{
      id: number;
      nom: string;
      prenom: string;
      email: string;
    }>;
    professeurs?: Array<{
      id: number;
      nom: string;
      prenom: string;
      email: string;
    }>;
    created_at: string;
    updated_at: string;
    students?: Array<{
      id: number;
      nom: string;
      prenom: string;
      numero_etudiant: string;
      email: string;
      filiere: string;
      niveau: string;
      created_at: string;
      updated_at: string;
      pivot: {
        exam_id: number;
        student_id: number;
      };
    }>;
  }

  const formatTime = (dateTimeString: string): string => {
    if (!dateTimeString) return "";
    try {
      // For time strings like "09:00", just return them as is
      if (/^\d{2}:\d{2}$/.test(dateTimeString)) {
        return dateTimeString;
      }
      // For datetime strings, extract the time part
      const cleanDateTime = dateTimeString.split(".")[0].replace("T", " ");
      const date = new Date(cleanDateTime);
      return format(date, "H:mm");
    } catch (e) {
      console.error("Error formatting time:", e);
      return dateTimeString || "";
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) {
      return "Date non spécifiée";
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Date invalide";
      }

      const formattedDate = date.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      return formattedDate;
    } catch (error) {
      return "Date invalide";
    }
  };

  // Define the API response type
  interface ApiResponse {
    status: string;
    data: ApiExam[];
  }

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/exams/latest");
        const data: ApiResponse = await response.json();

        if (data.status === "success") {
          const formattedExams = data.data.slice(0, 5).map((apiExam) => {
            const classrooms = apiExam.locaux
              ? apiExam.locaux.split(",").map((local) => local.trim())
              : [];

            // Use module_id from the API response
            const examModuleId = apiExam.module_id;

            return {
              id: apiExam.id.toString(),
              courseCode: examModuleId || "",
              courseName: examModuleId || "",
              module: examModuleId?.toString() || "",
              cycle: apiExam.formation || "",
              filiere: apiExam.filiere || "",
              date: apiExam.date_examen || "",
              startTime: apiExam.heure_debut || "",
              endTime: apiExam.heure_fin || "",
              classrooms: classrooms,
              supervisors: apiExam.superviseurs
                ? Array.isArray(apiExam.superviseurs)
                  ? apiExam.superviseurs.map((supervisor) =>
                      `${supervisor.prenom || ""} ${
                        supervisor.nom || ""
                      }`.trim()
                    )
                  : [apiExam.superviseurs]
                : [],
              students: apiExam.students
                ? apiExam.students.map((student) => student.id.toString())
                : [],
              // Ajouter les données brutes pour l'affichage des détails
              rawSuperviseurs: apiExam.superviseurs,
              rawProfesseurs: apiExam.professeurs,
              rawStudents: apiExam.students,
            };
          });

          setExams(formattedExams);
        } else {
          throw new Error("Failed to fetch exams");
        }
      } catch (err) {
        console.error("Error fetching exams:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setExams(mockExams.slice(0, 5));
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const fetchStudentsForExam = async (examId: string) => {
    setIsLoadingStudents(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/students/by-exam/${examId}`
      );
      const data = await response.json();

      if (data.status === "success" && Array.isArray(data.data)) {
        setFetchedStudents(data.data);
      } else {
        console.error("Failed to fetch students:", data);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const fetchAssignmentsForExam = async (examId: string) => {
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

  const fetchFormationAndFiliereNames = async (
    formationId: string,
    filiereId: string
  ) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/formations/${formationId}/filieres/${filiereId}`
      );
      const data = await response.json();

      if (data.status === "success") {
        setFormationName(data.data.formation.formation_intitule);
        setFiliereName(data.data.filiere.filiere_intitule);
      }
    } catch (error) {
      console.error("Error fetching formation and filière names:", error);
    }
  };

  const handleShowDetails = (exam: Exam) => {
    setSelectedExam(exam);
    fetchStudentsForExam(exam.id);
    fetchAssignmentsForExam(exam.id);
    fetchFormationAndFiliereNames(exam.formation || exam.cycle, exam.filiere);
  };

  const getStudentNames = (studentIds: string[]) => {
    // If we have fetched students, use them to display names
    if (fetchedStudents.length > 0) {
      return studentIds.map((id) => {
        const student = fetchedStudents.find((s) => s.id.toString() === id);
        if (student) {
          return `${student.prenom} ${student.nom}`;
        }
        return `Student ${id}`;
      });
    }

    // Fallback to the original logic if we don't have fetched students
    return studentIds.map((id) => {
      // Find the student in the importedStudents array
      const student = importedStudents.find((s) => {
        return s.id === id || s.id.toString() === id;
      });

      if (student) {
        return `${student.firstName} ${student.lastName}`;
      }

      // If we still haven't found the student, try to generate a mock name based on the ID
      return `Student ${id}`;
    });
  };

  const updateClassroomAvailability = async (
    classroomIds: string[] | undefined,
    isAvailable: boolean
  ) => {
    try {
      // Check if classroomIds is defined and is an array
      if (!classroomIds || !Array.isArray(classroomIds)) {
        return;
      }

      // Convert string IDs to numbers for the API
      const numericClassroomIds = classroomIds
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id));

      if (numericClassroomIds.length === 0) {
        return;
      }

      // Update each classroom's availability
      for (const classroomId of numericClassroomIds) {
        try {
        const response = await fetch(
            `http://127.0.0.1:8000/api/classrooms/${classroomId}/disponibilite`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
              body: JSON.stringify({
                disponible_pour_planification: isAvailable,
              }),
          }
        );

        if (!response.ok) {
            throw new Error(`Failed to update classroom ${classroomId}`);
          }
        } catch (error) {
          console.error(`Error updating classroom ${classroomId}:`, error);
        }
      }
    } catch (error) {
      console.error("Error updating classroom availability:", error);
    }
  };

  const handleAddEditExam = async (exam: Exam) => {
    try {
      setLoading(true);

      // Determine if this is an edit or create operation
      const isEditing = !!exam.id;

      // Prepare the exam data for the API
        const examData = {
        formation: exam.formation || exam.cycle || "",
        filiere: exam.filiere || "",
        module_id: exam.module || "",
        semestre: exam.semester || "",
        date_examen: exam.date || "",
        heure_debut: exam.startTime || "",
        heure_fin: exam.endTime || "",
        locaux: exam.classrooms ? exam.classrooms.join(", ") : "",
        superviseurs: exam.supervisors || [],
        professeurs: exam.professors || [],
        students: exam.students || [],
      };

      let response;
      if (isEditing) {
        // Update existing exam
        response = await fetch(
          `http://127.0.0.1:8000/api/exams/${exam.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(examData),
          }
        );
      } else {
        // Create new exam
        response = await fetch("http://127.0.0.1:8000/api/exams", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(examData),
        });
      }

        if (!response.ok) {
          const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to ${isEditing ? "update" : "create"} exam`
        );
      }

      const result = await response.json();

      if (result.status === "success") {
        // Refresh the exams list
        const examsResponse = await fetch("http://127.0.0.1:8000/api/exams/latest");
        const examsData: ApiResponse = await examsResponse.json();

        if (examsData.status === "success") {
          const formattedExams = examsData.data.slice(0, 5).map((apiExam) => {
            const classrooms = apiExam.locaux
              ? apiExam.locaux.split(",").map((local) => local.trim())
              : [];

            const examModuleId = apiExam.module_id;

            return {
              id: apiExam.id.toString(),
              courseCode: examModuleId || "",
              courseName: examModuleId || "",
              module: examModuleId?.toString() || "",
              cycle: apiExam.formation || "",
              filiere: apiExam.filiere || "",
              date: apiExam.date_examen || "",
              startTime: apiExam.heure_debut || "",
              endTime: apiExam.heure_fin || "",
              classrooms: classrooms,
              supervisors: apiExam.superviseurs
                ? Array.isArray(apiExam.superviseurs)
                  ? apiExam.superviseurs.map((supervisor) =>
                      `${supervisor.prenom || ""} ${
                        supervisor.nom || ""
                      }`.trim()
                    )
                  : [apiExam.superviseurs]
                : [],
              students: apiExam.students
                ? apiExam.students.map((student) => student.id.toString())
                : [],
              rawSuperviseurs: apiExam.superviseurs,
              rawProfesseurs: apiExam.professeurs,
              rawStudents: apiExam.students,
            };
          });

          setExams(formattedExams);
        }

        // Close the dialog
        setIsDialogOpen(false);
        setEditingExam(null);

        // Show success message
        toast({
          title: "Succès",
          description: `Examen ${isEditing ? "modifié" : "créé"} avec succès!`,
        });
      } else {
        throw new Error(
          result.message || `Failed to ${isEditing ? "update" : "create"} exam`
        );
      }
    } catch (error) {
      console.error("Error saving exam:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error
          ? error.message
          : "Une erreur s'est produite lors de la sauvegarde de l'examen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setIsDialogOpen(true);
  };

  const handleDeleteExam = async (examId) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/exams/${examId}/cancel`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel exam");
      }

      toast({
        title: "Succès",
        description: "L'examen a été annulé et supprimé avec succès.",
      });

      // Refresh the exams list to remove the deleted exam
      const examsResponse = await fetch("http://127.0.0.1:8000/api/exams/latest");
      const examsData: ApiResponse = await examsResponse.json();

      if (examsData.status === "success") {
        const formattedExams = examsData.data.slice(0, 5).map((apiExam) => {
          const classrooms = apiExam.locaux
            ? apiExam.locaux.split(",").map((local) => local.trim())
            : [];

          const examModuleId = apiExam.module_id;

          return {
            id: apiExam.id.toString(),
            courseCode: examModuleId || "",
            courseName: examModuleId || "",
            module: examModuleId?.toString() || "",
            cycle: apiExam.formation || "",
            filiere: apiExam.filiere || "",
            date: apiExam.date_examen || "",
            startTime: apiExam.heure_debut || "",
            endTime: apiExam.heure_fin || "",
            classrooms: classrooms,
            supervisors: apiExam.superviseurs
              ? Array.isArray(apiExam.superviseurs)
                ? apiExam.superviseurs.map((supervisor) =>
                    `${supervisor.prenom || ""} ${
                      supervisor.nom || ""
                    }`.trim()
                  )
                : [apiExam.superviseurs]
              : [],
            students: apiExam.students
              ? apiExam.students.map((student) => student.id.toString())
              : [],
            rawSuperviseurs: apiExam.superviseurs,
            rawProfesseurs: apiExam.professeurs,
            rawStudents: apiExam.students,
          };
        });

        setExams(formattedExams);
      }
    } catch (error) {
      console.error("Error cancelling exam:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'annulation de l'examen",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setExamToDelete(null);
    }
  };

  const handleDeleteClick = (exam: Exam) => {
    setExamToDelete(exam);
    setIsDeleteDialogOpen(true);
  };

  const handleDownloadPdf = async (examId: string) => {
    try {
      await downloadExamPdf(examId);
      toast({
        title: "Succès",
        description: "Le PDF de convocation a été téléchargé avec succès.",
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le PDF. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const fetchClassroomName = async (classroomId: string) => {
    try {
      if (!classroomId) {
        return "";
      }

      const response = await fetch(
        `http://localhost:8000/api/classrooms/name/${classroomId}`
      );
      const data = await response.json();

      if (data.status === "success" && data.data) {
        setClassroomNames((prev) => {
          const newNames = {
            ...prev,
            [classroomId]: data.data.nom_du_local,
          };
          return newNames;
        });
        return data.data.nom_du_local;
      }

      return classroomId;
    } catch (error) {
      console.error(
        `Error fetching classroom info for name ${classroomId}:`,
        error
      );
      return classroomId;
    }
  };

  // Update the useEffect to fetch classroom names when exams are loaded
  useEffect(() => {
    const fetchClassroomNames = async () => {
      if (exams.length > 0) {
        // Get all unique classroom IDs from all exams
        const classroomIds = exams
          .map((exam) => exam.data?.locaux)
          .filter(Boolean)
          .flat()
          .filter((id): id is string => id !== undefined && id !== null);

        const uniqueClassroomIds = [...new Set(classroomIds)];

        if (uniqueClassroomIds.length === 0) {
          return;
        }

        await Promise.all(
          uniqueClassroomIds.map((id) => id && fetchClassroomName(id))
        );
      }
    };

    fetchClassroomNames();
  }, [exams]);

  const getClassroomNames = (classroomIds: string[] | undefined): string => {
    if (
      !classroomIds ||
      !Array.isArray(classroomIds) ||
      classroomIds.length === 0
    ) {
      return "No classrooms assigned";
    }

    // Get the names from our state
    const names = classroomIds.map((id) => classroomNames[id] || id).join(", ");
    return names;
  };

  const getTeacherNames = (teacherIds: string[] | undefined): string => {
    if (!teacherIds || !Array.isArray(teacherIds) || teacherIds.length === 0) {
      return "No supervisors assigned";
    }

    return teacherIds.join(", ");
  };

  const getStudentCount = (studentIds: string[] | undefined): number => {
    if (!studentIds || !Array.isArray(studentIds)) {
      return 0;
    }

    return studentIds.length;
  };

  const fetchModuleName = async (moduleId: string) => {
    try {
      if (!moduleId) {
        return "";
      }

      // Ensure moduleId is a string and clean it
      const cleanModuleId = moduleId.toString().trim();

      // First check if we already have the name cached
      if (moduleNames[cleanModuleId]) {
        return moduleNames[cleanModuleId];
      }

      try {
        const response = await fetch(
          `http://localhost:8000/api/modules/${cleanModuleId}/name`
        );
        const data = await response.json();

        if (data.status === "success" && data.data) {
          const moduleName = data.data.module_name;
          setModuleNames((prev) => {
            const newNames = {
              ...prev,
              [cleanModuleId]: moduleName,
            };
            return newNames;
          });
          return moduleName;
        } else {
          // If the API call fails, use the module ID as the name
          setModuleNames((prev) => ({
            ...prev,
            [cleanModuleId]: cleanModuleId,
          }));
          return cleanModuleId;
        }
      } catch (error) {
        console.error(
          `Error fetching module name for ID ${cleanModuleId}:`,
          error
        );
        // If there's an error, use the module ID as the name
        setModuleNames((prev) => ({
          ...prev,
          [cleanModuleId]: cleanModuleId,
        }));
        return cleanModuleId;
      }
    } catch (error) {
      console.error(`Error in fetchModuleName for ID ${moduleId}:`, error);
      return moduleId;
    }
  };

  // Update the useEffect to fetch module names when exams are loaded
  useEffect(() => {
    const fetchModuleNames = async () => {
      if (exams.length > 0) {
        // Try different possible locations for module ID
        const moduleIds = exams
          .map((exam) => {
            // Try different possible locations for module ID
            const possibleModuleId =
              exam.module ||
              exam.data?.module ||
              exam.courseCode ||
              exam.courseName;

            if (!possibleModuleId) {
              return null;
            }

            return possibleModuleId.toString().trim();
          })
          .filter((id): id is string => id !== null && id !== "");

        const uniqueModuleIds = [...new Set(moduleIds)];

        if (uniqueModuleIds.length === 0) {
          return;
        }

        await Promise.all(
          uniqueModuleIds.map((id) => id && fetchModuleName(id))
        );
      }
    };

    fetchModuleNames();
  }, [exams]);

  // Update the display of module names in the card
  const getModuleDisplayName = (moduleId: string) => {
    if (!moduleId) {
      return "Unknown Module";
    }

    // First try to get the name from our cache
    const cachedName = moduleNames[moduleId];
    if (cachedName) {
      return cachedName;
    }

    // If no cached name, try to get it from the exam data
    const exam = exams.find((e) => e.module === moduleId);
    if (exam?.courseName) {
      return exam.courseName;
    }

    // If all else fails, return the module ID
    return moduleId;
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          title="Planification des examens"
          subtitle="Planifier et gérer les examens"
          actions={
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) setEditingExam(null);
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Planifier un examen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingExam
                      ? "Modifier l'examen"
                      : "Planifier un nouvel examen"}
                  </DialogTitle>
                </DialogHeader>
                <ExamForm
                  exam={editingExam || undefined}
                  onSubmit={handleAddEditExam}
                  onCancel={() => {
                    setIsDialogOpen(false);
                    setEditingExam(null);
                  }}
                  setSelectedStudents={setSelectedStudents}
                />
              </DialogContent>
            </Dialog>
          }
        />
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          <h1 className="text-2xl font-bold mb-6">Les 5 dernières examens</h1>
          <Tabs defaultValue="grid">
            <div className="flex justify-between items-center mb-4">
              {/* <TabsList>
                <TabsTrigger value="grid">Grid View</TabsTrigger>
                <TabsTrigger value="calendar">Calendar View</TabsTrigger>
              </TabsList> */}
              {/* <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button> */}
            </div>

            <TabsContent value="grid" className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <p>Loading exams...</p>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64 text-red-500">
                  <p>{error}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {exams.map((exam) => {
                      // Log exam data before rendering
                      const moduleId = exam.module || exam.data?.module;
                      const examDate = exam.date || exam.data?.date_examen;
                      console.log("Exam data for rendering:", {
                        examId: exam.id,
                        moduleId: moduleId,
                        date: examDate,
                        classrooms: exam.classrooms,
                        fullExam: JSON.stringify(exam, null, 2),
                        allKeys: Object.keys(exam),
                      });

                      return (
                        <Card key={exam.id}>
                          <CardHeader>
                            <div className="flex justify-between">
                              <div>
                                <CardTitle>
                                  Exam de {getModuleDisplayName(moduleId || "")}
                                </CardTitle>
                                <CardDescription>{moduleId}</CardDescription>
                              </div>
                              <Badge>{formatDate(examDate)}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium flex items-center gap-1">
                                  <CalendarIcon className="h-4 w-4" />
                                  Time & Duration
                                </p>
                                <p className="text-sm">
                                  {formatTime(exam.startTime)} -{" "}
                                  {formatTime(exam.endTime)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium flex items-center gap-1">
                                  <Building className="h-4 w-4" />
                                  Classrooms
                                </p>
                                <p className="text-sm">
                                  {getClassroomNames(exam.classrooms)}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {fr.examScheduling.supervisors}:
                                </p>
                                <p className="text-sm">
                                  {exam.supervisors &&
                                  exam.supervisors.length > 0
                                    ? exam.supervisors.join(", ")
                                    : "Aucun superviseur assigné"}
                                </p>
                              </div>
                              {/* Professors */}
                              <div>
                                <p className="text-sm font-medium flex items-center gap-1">
                                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                                  Professeurs:
                                </p>
                                <p className="text-sm">
                                  {exam.rawProfesseurs &&
                                    (Array.isArray(exam.rawProfesseurs)
                                      ? exam.rawProfesseurs
                                          .map((professeur) =>
                                            `${professeur.prenom || ""} ${
                                              professeur.nom || ""
                                            }`.trim()
                                          )
                                          .join(", ")
                                      : exam.rawProfesseurs ||
                                        "Aucun professeur assigné")}
                                </p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium flex items-center gap-1">
                                <Users className="h-4 w-4" />{" "}
                                {/* Use Users icon as before */}
                                {fr.examScheduling.students}:
                              </p>
                              <p className="text-sm">
                                {getStudentCount(exam.students)}{" "}
                                {fr.examScheduling.studentCount}
                              </p>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditExam(exam)}
                            >
                              Modifier
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick(exam)}
                            >
                              Supprimer
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadPdf(exam.id)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              PDF
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShowDetails(exam)}
                            >
                              <Info className="h-4 w-4 mr-2" />
                              Detail
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>

                  {exams.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-64">
                      <CalendarIcon className="h-10 w-10 text-muted-foreground mb-4" />
                      <h3 className="font-medium">No exams scheduled</h3>
                      <p className="text-muted-foreground mb-4">
                        Start by scheduling an exam for this session
                      </p>
                      <Button onClick={() => setIsDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule Exam
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="calendar">
              <Card>
                <CardHeader>
                  <CardTitle>{fr.examScheduling.calendarView}</CardTitle>
                  <CardDescription>
                    {fr.examScheduling.calendarDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96 flex items-center justify-center border rounded-md">
                    <p className="text-muted-foreground">
                      {fr.examScheduling.calendarComingSoon}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Details Modal */}
      <Dialog
        open={!!selectedExam}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedExam(null);
            setShowStudents(false);
            setFormationName("");
            setFiliereName("");
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-lg">
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
                        <span className="text-gray-600">Formation:</span>
                        <span className="font-medium">
                          {formationName || "Chargement..."}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Filière:</span>
                        <span className="font-medium">
                          {filiereName || "Chargement..."}
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
                        {getClassroomNames(selectedExam.classrooms)}
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
                          <CalendarIcon className="h-4 w-4" />
                        </div>
                        <span className="text-gray-800">
                          {selectedExam.date &&
                            format(new Date(selectedExam.date), "PPP")}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-5 mr-2 text-gray-400">
                          <ClockIcon className="h-4 w-4" />
                        </div>
                        <span className="text-gray-800">
                          {selectedExam.startTime} - {selectedExam.endTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm uppercase text-gray-500 font-medium mb-1">
                      Supervision
                    </h3>
                    <div className="space-y-2">
                      {selectedExam.supervisors &&
                        selectedExam.supervisors.length > 0 && (
                          <div>
                            <span className="text-sm text-gray-600 font-medium">
                              Surveillants:
                            </span>
                            <p className="font-medium text-gray-800">
                              {getTeacherNames(selectedExam.supervisors)}
                            </p>
                          </div>
                        )}
                      {selectedExam.rawProfesseurs && (
                        <div>
                          <span className="text-sm text-gray-600 font-medium">
                            Professeurs:
                          </span>
                          <p className="font-medium text-gray-800">
                            {Array.isArray(selectedExam.rawProfesseurs)
                              ? selectedExam.rawProfesseurs
                                  .map((professeur) =>
                                    `${professeur.prenom || ""} ${
                                      professeur.nom || ""
                                    }`.trim()
                                  )
                                  .join(", ")
                              : selectedExam.rawProfesseurs ||
                                "Aucun professeur assigné"}
                          </p>
                        </div>
                      )}
                      {(!selectedExam.supervisors ||
                        selectedExam.supervisors.length === 0) &&
                        (!selectedExam.rawProfesseurs ||
                          (Array.isArray(selectedExam.rawProfesseurs) &&
                            selectedExam.rawProfesseurs.length === 0)) && (
                          <p className="font-medium text-gray-800">
                            Aucun surveillant ou professeur assigné
                          </p>
                        )}
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
                      <ChevronUpIcon className="h-4 w-4" />
                      Masquer la liste des étudiants
                    </>
                  ) : (
                    <>
                      <ChevronDownIcon className="h-4 w-4" />
                      Afficher la liste des étudiants (
                      {selectedExam.students.length})
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
                        {selectedExam.students.length} au total
                      </span>
                    </div>
                    {isLoadingAssignments ? (
                      <div>Chargement des affectations de places...</div>
                    ) : assignments.length === 0 ? (
                      <div>Aucune affectation de place trouvée.</div>
                    ) : (
                      <div className="space-y-4">
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
                                  <UserIcon className="h-3 w-3 text-gray-400 mr-2" />
                                  {student.first_name} {student.last_name}
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

      {/* Add Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'annulation</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir annuler l'examen pour{" "}
              {examToDelete?.module} ? Cette action enverra automatiquement des notifications d'annulation aux étudiants, professeurs et superviseurs concernés.
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
              onClick={() => examToDelete && handleDeleteExam(examToDelete.id)}
              disabled={loading}
            >
              {loading ? "Annulation..." : "Annuler l'examen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamScheduling;
