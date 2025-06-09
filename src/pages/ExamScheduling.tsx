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
    superviseurs?: string;
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
      console.log("No date string provided");
      return "Invalid Date";
    }

    try {
      // Parse the ISO date string
      const date = new Date(dateString);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.log("Invalid date string:", dateString);
        return "Invalid Date";
      }

      // Format the date as YYYY-MM-DD
      const formattedDate = format(date, "yyyy-MM-dd");
      console.log("Formatted date:", formattedDate);
      return formattedDate;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
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
          console.log("Raw API response for exams:", data.data);

          const formattedExams = data.data.slice(0, 5).map((apiExam) => {
            console.log("Processing exam:", {
              id: apiExam.id,
              module_id: apiExam.module_id,
              moduleIdType: typeof apiExam.module_id,
              locaux: apiExam.locaux,
              type: typeof apiExam.locaux,
            });

            const classrooms = apiExam.locaux
              ? apiExam.locaux.split(",").map((local) => local.trim())
              : [];

            console.log("Formatted classrooms:", {
              original: apiExam.locaux,
              split: classrooms,
            });

            // Use module_id from the API response
            const examModuleId = apiExam.module_id;
            console.log("Module ID for exam:", {
              id: apiExam.id,
              moduleId: examModuleId,
              moduleIdType: typeof examModuleId,
            });

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
              supervisors: apiExam.superviseurs ? [apiExam.superviseurs] : [],
              students: apiExam.students
                ? apiExam.students.map((student) => student.id.toString())
                : [],
            };
          });

          console.log("Formatted exams with classrooms:", formattedExams);
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
        console.log(
          `Fetched ${data.data.length} students for exam ID: ${examId}`
        );
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
    console.log("Processing student IDs:", studentIds);

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
      console.log(`Looking for student with ID: ${id} (type: ${typeof id})`);

      // Find the student in the importedStudents array
      const student = importedStudents.find((s) => {
        console.log(
          `Comparing ${
            s.id
          } (type: ${typeof s.id}) with ${id} (type: ${typeof id})`
        );
        return s.id === id || s.id.toString() === id;
      });

      if (student) {
        console.log(
          `Found student in importedStudents: ${student.firstName} ${student.lastName}`
        );
        return `${student.firstName} ${student.lastName}`;
      }

      // If we still haven't found the student, try to generate a mock name based on the ID
      console.log(`No student found with ID: ${id}, generating mock name`);
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
        console.warn("No classrooms to update availability for");
        return;
      }

      // Log the raw classroom IDs for debugging
      console.log("Raw classroom IDs received:", classroomIds);

      // Filter out any non-numeric IDs and convert to numbers
      const validClassroomIds = classroomIds
        .map((id) => {
          // If id is already a number, use it directly
          if (typeof id === "number") {
            return id;
          }
          // If id is a string that can be converted to a number, do so
          const numericId = parseInt(id, 10);
          if (!isNaN(numericId)) {
            return numericId;
          }
          // If id is a string that can't be converted to a number, try to extract the numeric part
          const match = id.match(/\d+/);
          if (match) {
            return parseInt(match[0], 10);
          }
          console.warn(`Could not extract numeric ID from: ${id}`);
          return null;
        })
        .filter((id): id is number => id !== null);

      if (validClassroomIds.length === 0) {
        console.warn(
          "No valid classroom IDs to update. Original IDs:",
          classroomIds
        );
        return;
      }

      console.log(
        `Starting availability update for ${validClassroomIds.length} classrooms:`,
        validClassroomIds.map((id) => `Classroom ID: ${id}`),
        `Setting availability to: ${isAvailable ? "available" : "unavailable"}`
      );

      const promises = validClassroomIds.map(async (id) => {
        console.log(
          `Processing classroom ${id}:`,
          `Setting availability to ${isAvailable ? "available" : "unavailable"}`
        );

        const requestBody = {
          disponible_pour_planification: isAvailable,
        };

        const response = await fetch(
          `http://localhost:8000/api/classrooms/${id}/disponibilite`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error(
            `Failed to update classroom ${id} availability:`,
            errorData
          );
          throw new Error(
            `Failed to update classroom ${id} availability: ${
              errorData.message || "Unknown error"
            }`
          );
        }

        const responseData = await response.json();
        console.log(
          `Successfully updated classroom ${id} availability:`,
          responseData
        );
      });

      await Promise.all(promises);
      console.log(
        "Completed availability updates for all classrooms:",
        validClassroomIds.map((id) => `Classroom ID: ${id}`)
      );
    } catch (error) {
      console.error("Error updating classroom availability:", error);
      throw error;
    }
  };

  const handleAddEditExam = async (exam: Exam) => {
    try {
      // Convert locaux to an array if it's a string
      const classroomIds = exam.data?.locaux
        ? Array.isArray(exam.data.locaux)
          ? exam.data.locaux
          : exam.data.locaux.split(",").map((id) => id.trim())
        : [];

      console.log("Full exam data structure:", {
        exam,
        classrooms: classroomIds,
        classroomDetails: classroomIds.map((id) => ({
          id,
          type: typeof id,
          isNumeric: !isNaN(Number(id)),
          rawValue: id,
        })),
        examKeys: Object.keys(exam),
        examValues: Object.values(exam),
      });

      if (editingExam) {
        console.log("Editing exam data:", {
          oldExam: editingExam,
          newExam: exam,
          oldClassrooms: editingExam.data?.locaux,
          newClassrooms: exam.data?.locaux,
        });

        // First, make the old classrooms available again
        if (editingExam.data?.locaux) {
          console.log(
            "Making old classrooms available:",
            editingExam.data.locaux.map((id) => `Classroom ID: ${id}`)
          );
          await updateClassroomAvailability(editingExam.data.locaux, true);
        }

        // Format the date to YYYY-MM-DD
        const examDate = new Date(exam.date);
        const formattedDate = format(examDate, "yyyy-MM-dd");

        // Format time to H:i format (e.g., "09:00")
        const formatTimeToHMM = (timeString: string) => {
          if (!timeString) return "";
          // If it's already in HH:mm format, return as is
          if (/^\d{2}:\d{2}$/.test(timeString)) {
            return timeString;
          }
          try {
            // Handle ISO format
            if (timeString.includes("T")) {
              return format(new Date(timeString), "HH:mm");
            }
            // Handle simple time format
            return timeString;
          } catch (e) {
            console.error("Error formatting time:", e);
            return timeString;
          }
        };

        const formattedStartTime = formatTimeToHMM(exam.startTime);
        const formattedEndTime = formatTimeToHMM(exam.endTime);

        // Get classroom names for the locaux field
        const classroomNames = exam.data?.locaux
          .map((id) => {
            const classroom = mockClassrooms.find((c) => c.id === id);
            return classroom ? classroom.name : id;
          })
          .join(", ");

        // Get supervisor names for the superviseurs field
        const supervisorNames = exam.supervisors
          .map((id) => {
            const supervisor = mockTeachers.find((t) => t.id === id);
            return supervisor
              ? `${supervisor.firstName} ${supervisor.lastName}`
              : id;
          })
          .join(", ");

        // Format students data according to backend requirements
        const formattedStudents = exam.students.map((student) => {
          if (typeof student === "string") {
            // If student is just an ID, find the full student data from importedStudents
            const studentData = importedStudents.find((s) => s.id === student);
            if (!studentData) {
              throw new Error(`Student with ID ${student} not found`);
            }
            return {
              studentId: studentData.id,
              firstName: studentData.firstName,
              lastName: studentData.lastName,
              email: studentData.email,
              program: studentData.program || "Default Program", // Provide a default if not available
            };
          }
          // If student is already an object with the required format
          return {
            studentId: student.studentId || student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            program: student.program || "Default Program",
          };
        });

        // Prepare the exam data for the API - exactly matching the Postman format
        const examData = {
          cycle: exam.cycle,
          filiere: exam.filiere,
          module: exam.module,
          date_examen: formattedDate,
          heure_debut: formattedStartTime,
          heure_fin: formattedEndTime,
          locaux: classroomNames,
          superviseurs: supervisorNames,
          classroom_ids: exam.data?.locaux.map((id) => parseInt(id, 10)),
          students: formattedStudents,
        };

        console.log("Sending data to API:", JSON.stringify(examData, null, 2));

        const response = await fetch(
          `http://127.0.0.1:8000/api/exams/${exam.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(examData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error("API error response:", errorData);
          throw new Error(errorData.message || "Failed to update exam");
        }

        // Make the new classrooms unavailable
        if (exam.data?.locaux) {
          console.log(
            "Making new classrooms unavailable:",
            exam.data.locaux.map((id) => `Classroom ID: ${id}`)
          );
          await updateClassroomAvailability(exam.data.locaux, false);
        }

        // Update the exams state with the response from the API
        setExams((prevExams) =>
          prevExams.map((e) =>
            e.id === exam.id
              ? {
                  ...e,
                  cycle: exam.cycle,
                  filiere: exam.filiere,
                  module: exam.module,
                  date: formattedDate,
                  startTime: formattedStartTime,
                  endTime: formattedEndTime,
                  classrooms: exam.data?.locaux,
                  supervisors: exam.supervisors,
                  students: exam.students,
                }
              : e
          )
        );

        toast({
          title: "Exam Updated",
          description: `Exam has been updated successfully`,
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800",
        });
      } else {
        console.log("Creating new exam with data:", {
          exam,
          classrooms: classroomIds,
          classroomDetails: classroomIds.map((id) => ({
            id,
            type: typeof id,
            isNumeric: !isNaN(Number(id)),
            rawValue: id,
          })),
        });

        // Handle creating new exam
        const newExam = { ...exam, id: Date.now().toString() };

        // Make classrooms unavailable for the new exam
        if (classroomIds.length > 0) {
          console.log(
            "Making classrooms unavailable for new exam:",
            classroomIds.map((id) => `Classroom ID: ${id}`)
          );

          // Ensure we're using numeric IDs
          const numericClassroomIds = classroomIds
            .map((id) => {
              if (typeof id === "number") return id;
              const numericId = parseInt(id, 10);
              if (!isNaN(numericId)) return numericId;
              const match = id.match(/\d+/);
              return match ? parseInt(match[0], 10) : null;
            })
            .filter((id): id is number => id !== null);

          if (numericClassroomIds.length === 0) {
            console.error("No valid numeric classroom IDs found for new exam");
            throw new Error("No valid classroom IDs provided for the exam");
          }

          console.log("Numeric classroom IDs to update:", numericClassroomIds);
          await updateClassroomAvailability(numericClassroomIds, false);
        }

        setExams((prevExams) => [...prevExams, newExam]);
        toast({
          title: "Success",
          description: "Exam has been scheduled successfully",
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800",
        });
      }
    } catch (error) {
      console.error("Error saving exam:", error);
      if (
        !(
          error instanceof Error && error.message.includes("Invalid time value")
        )
      ) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to save exam",
          variant: "destructive",
        });
      }
      return;
    }

    setEditingExam(null);
    setIsDialogOpen(false);
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setIsDialogOpen(true);
  };

  const handleDeleteExam = async (id: string) => {
    try {
      // Find the exam to get its classrooms
      const examToDelete = exams.find((exam) => exam.id === id);
      if (!examToDelete) {
        throw new Error("Exam not found");
      }

      // First make classrooms available
      if (examToDelete.data?.locaux) {
        console.log(
          "Making classrooms available after exam deletion:",
          examToDelete.data.locaux.map((id) => `Classroom ID: ${id}`)
        );
        await updateClassroomAvailability(examToDelete.data.locaux, true);
      }

      const response = await fetch(`http://127.0.0.1:8000/api/exams/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setExams((prevExams) => prevExams.filter((exam) => exam.id !== id));
        toast({
          title: "Exam Deleted",
          description: "The exam has been removed from the schedule",
          variant: "destructive",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete the exam",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the exam",
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
        console.log("Skipping fetch for empty classroom ID");
        return "";
      }
      console.log(`Fetching classroom info for name: ${classroomId}`);

      const response = await fetch(
        `http://localhost:8000/api/classrooms/name/${classroomId}`
      );
      const data = await response.json();
      console.log(`Classroom response for name ${classroomId}:`, data);

      if (data.status === "success" && data.data) {
        console.log(
          `Setting classroom info for name ${classroomId}:`,
          data.data
        );
        setClassroomNames((prev) => {
          const newNames = {
            ...prev,
            [classroomId]: data.data.nom_du_local,
          };
          console.log("Updated classroom names:", newNames);
          return newNames;
        });
        return data.data.nom_du_local;
      }

      console.log(`No classroom found for name ${classroomId}`);
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
        console.log("Unique classroom IDs to fetch:", uniqueClassroomIds);

        if (uniqueClassroomIds.length === 0) {
          console.log("No valid classroom IDs found in exams");
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
      console.log("No classrooms provided to getClassroomNames");
      return "No classrooms assigned";
    }

    console.log("Processing classroom names:", {
      classroomIds,
      type: typeof classroomIds[0],
      firstItem: classroomIds[0],
      allItems: classroomIds,
    });

    // Get the names from our state
    const names = classroomIds.map((id) => classroomNames[id] || id).join(", ");
    console.log("Joined classroom names:", names);
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
        console.log("Skipping fetch for empty module ID");
        return "";
      }
      console.log(`Fetching module name for ID: ${moduleId}`);

      // Ensure moduleId is a string and clean it
      const cleanModuleId = moduleId.toString().trim();

      // First check if we already have the name cached
      if (moduleNames[cleanModuleId]) {
        console.log(
          `Using cached module name for ID ${cleanModuleId}:`,
          moduleNames[cleanModuleId]
        );
        return moduleNames[cleanModuleId];
      }

      try {
        console.log(`Making API request for module ID: ${cleanModuleId}`);
        const response = await fetch(
          `http://localhost:8000/api/modules/${cleanModuleId}/name`
        );
        const data = await response.json();
        console.log(`Raw API response for module ID ${cleanModuleId}:`, data);

        if (data.status === "success" && data.data) {
          const moduleName = data.data.module_name;
          console.log(
            `Setting module name for ID ${cleanModuleId}:`,
            moduleName
          );
          setModuleNames((prev) => {
            const newNames = {
              ...prev,
              [cleanModuleId]: moduleName,
            };
            console.log("Updated module names:", newNames);
            return newNames;
          });
          return moduleName;
        } else {
          console.log(
            `API response did not contain expected data for module ID ${cleanModuleId}:`,
            data
          );
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
        // Log the complete exam structure
        console.log(
          "Complete exam structure:",
          exams.map((exam) => ({
            id: exam.id,
            module: exam.module,
            moduleType: typeof exam.module,
            courseName: exam.courseName,
            allKeys: Object.keys(exam),
          }))
        );

        // Try different possible locations for module ID
        const moduleIds = exams
          .map((exam) => {
            // Log all possible module ID locations
            console.log(`Exam ${exam.id} possible module locations:`, {
              rootModule: exam.module,
              moduleType: typeof exam.module,
              courseName: exam.courseName,
              allKeys: Object.keys(exam),
            });

            // Use the module field which now contains the module_id
            const examModuleId = exam.module;
            if (!examModuleId) {
              console.log(`No module ID found for exam ${exam.id}`);
              return null;
            }
            console.log(
              `Selected module ID for exam ${exam.id}:`,
              examModuleId,
              "type:",
              typeof examModuleId
            );
            return examModuleId;
          })
          .filter(Boolean);

        console.log("Extracted module IDs:", moduleIds);

        const uniqueModuleIds = [...new Set(moduleIds)];
        console.log("Unique module IDs to fetch:", uniqueModuleIds);

        if (uniqueModuleIds.length === 0) {
          console.log("No valid module IDs found in exams");
          return;
        }

        // Fetch module names in parallel
        await Promise.all(
          uniqueModuleIds.map((id) => {
            if (!id) return Promise.resolve();
            console.log(
              `Starting fetch for module ID: ${id}, type:`,
              typeof id
            );
            return fetchModuleName(id);
          })
        );
      }
    };

    fetchModuleNames();
  }, [exams]);

  // Update the display of module names in the card
  const getModuleDisplayName = (moduleId: string) => {
    if (!moduleId) {
      console.log("Empty module ID provided to getModuleDisplayName");
      return "Unknown Module";
    }
    console.log(
      `Getting display name for module ID: ${moduleId}, type:`,
      typeof moduleId
    );
    console.log("Current module names:", moduleNames);

    // First try to get the name from our cache
    const cachedName = moduleNames[moduleId];
    if (cachedName) {
      console.log(`Found cached name for module ID ${moduleId}:`, cachedName);
      return cachedName;
    }

    // If no cached name, try to get it from the exam data
    const exam = exams.find((e) => e.module === moduleId);
    if (exam?.courseName) {
      console.log(
        `Using course name as fallback for module ID ${moduleId}:`,
        exam.courseName
      );
      return exam.courseName;
    }

    // If all else fails, return the module ID
    console.log(
      `No name found for module ID ${moduleId}, using ID as fallback`
    );
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
                        fullExam: exam,
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
                                  {fr.examScheduling.supervisors}
                                </p>
                                <p className="text-sm">
                                  {getTeacherNames(exam.supervisors)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {fr.examScheduling.students}
                                </p>
                                <p className="text-sm">
                                  {getStudentCount(exam.students)}{" "}
                                  {fr.examScheduling.studentCount}
                                </p>
                              </div>
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
                    <div className="space-y-1">
                      <p className="font-medium text-gray-800">
                        {getTeacherNames(selectedExam.supervisors)}
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
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'examen pour{" "}
              {examToDelete?.module} ? Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => examToDelete && handleDeleteExam(examToDelete.id)}
              disabled={loading}
            >
              {loading ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamScheduling;
