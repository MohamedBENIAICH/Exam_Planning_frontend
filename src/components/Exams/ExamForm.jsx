import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isSameDay } from "date-fns";
import { CalendarIcon, Clock, Users, Building, Upload } from "lucide-react";
import Spinner from "@/components/ui/spinner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { mockStudents, mockFilieres } from "@/lib/mockData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { createExam, updateExam } from "../../services/examService";
import ImportCSV from "../Students/ImportCSV";
import { getAvailableClassrooms } from "@/services/classroomService";
import api from "@/services/api";
import {
  getSupervisorsByDepartment,
  getDepartments,
} from "@/services/supervisorService";
import {
  getFormations,
  getFilieresByFormation,
  getModulesByFormationAndFiliere,
} from "@/services/formationService";

const formSchema = z.object({
  formation: z.string().min(1, "La formation est requise"),
  filiere: z.string().min(1, "La filière est requise"),
  semester: z.string().min(1, "Le semestre est requis"),
  module: z.string().min(1, "Le module est requis"),
  date: z.date({
    required_error: "La date d'examen est requise",
  }),
  startTime: z.string().min(1, "L'heure de début est requise"),
  endTime: z.string().min(1, "L'heure de fin est requise"),
  classrooms: z
    .array(z.union([z.string(), z.number()]))
    .min(1, "Au moins une salle est requise"),
  supervisors: z.array(z.number()).optional(),
  professors: z.array(z.number()).min(1, "Au moins un professeur est requis"),
  students: z.array(z.string()),
}).refine(
  (data) => {
    if (!data.date || !data.startTime) return true;

    const [hours, minutes] = data.startTime.split(":").map(Number);
    const examDateTime = new Date(data.date);
    examDateTime.setHours(hours, minutes, 0, 0);

    return examDateTime >= new Date();
  },
  {
    message: "La date et l'heure de l'examen ne peuvent pas être dans le passé",
    path: ["date"], // Attach error to the date field
  }
);

const ExamForm = ({
  exam,
  onSubmit,
  onCancel,
  setSelectedStudents,
  setImportedStudents,
}) => {
  // Add debug logging for exam data
  useEffect(() => {
    console.log("Exam data received:", exam);
  }, [exam]);

  const [selectedStudentsLocal, setSelectedStudentsLocal] = useState(
    exam?.students || []
  );
  const [importedStudentsLocal, setImportedStudentsLocal] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [showImportCSV, setShowImportCSV] = useState(false);
  const [loading, setLoading] = useState(false);
  const [examId, setExamId] = useState(exam?.id || null);
  const [availableClassrooms, setAvailableClassrooms] = useState([]);
  const [supervisorsByDepartment, setSupervisorsByDepartment] = useState([]);
  const [professorsByDepartment, setProfessorsByDepartment] = useState([]);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const [loadingProfessors, setLoadingProfessors] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [formations, setFormations] = useState([]);
  const [loadingFormations, setLoadingFormations] = useState(false);
  const [filieres, setFilieres] = useState([]);
  const [loadingFilieres, setLoadingFilieres] = useState(false);
  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const { toast } = useToast();
  const [assignments, setAssignments] = useState(null);
  const [selectedClassroomType, setSelectedClassroomType] = useState(null);
  const [selectedClassroomDepartment, setSelectedClassroomDepartment] =
    useState("");
  const [amphitheaters, setAmphitheaters] = useState([]);
  const [loadingAmphitheaters, setLoadingAmphitheaters] = useState(false);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [showSuperviseursList, setShowSuperviseursList] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: exam
      ? {
        formation: exam.formation?.toString() || "",
        filiere: exam.filiere?.toString() || "",
        semester: exam.semestre?.toString() || "",
        module: exam.module?.toString() || "",
        date: exam.date_examen ? new Date(exam.date_examen) : new Date(),
        startTime: exam.heure_debut || "09:00",
        endTime: exam.heure_fin || "11:00",
        classrooms: Array.isArray(exam.classroom_ids)
          ? exam.classroom_ids
          : [],
        supervisors: Array.isArray(exam.superviseurs)
          ? exam.superviseurs.map((supervisor) => {
            const id =
              typeof supervisor === "object" ? supervisor.id : supervisor;
            const numId = typeof id === "string" ? parseInt(id, 10) : id;
            return isNaN(numId) ? 0 : numId;
          })
          : typeof exam.superviseurs === "string"
            ? exam.superviseurs.split(",").map((s) => {
              const numId = parseInt(s.trim(), 10);
              return isNaN(numId) ? 0 : numId;
            })
            : [],
        professors: Array.isArray(exam.professeurs)
          ? exam.professeurs.map((professor) => {
            const id =
              typeof professor === "object" ? professor.id : professor;
            const numId = typeof id === "string" ? parseInt(id, 10) : id;
            return isNaN(numId) ? 0 : numId;
          })
          : typeof exam.professeurs === "string"
            ? exam.professeurs.split(",").map((s) => {
              const numId = parseInt(s.trim(), 10);
              return isNaN(numId) ? 0 : numId;
            })
            : [],
        students: Array.isArray(exam.students) ? exam.students : [],
      }
      : {
        formation: "",
        filiere: "",
        semester: "",
        module: "",
        date: new Date(),
        startTime: "09:00",
        endTime: "11:00",
        classrooms: [],
        supervisors: [],
        professors: [],
        students: [],
      },
  });

  // Reset form when exam changes
  useEffect(() => {
    if (exam) {
      console.log("Resetting form with exam data:", exam);
      form.reset({
        formation: exam.formation?.toString() || "",
        filiere: exam.filiere?.toString() || "",
        semester: exam.semestre?.toString() || "",
        module: exam.module?.toString() || "",
        date: exam.date_examen ? new Date(exam.date_examen) : new Date(),
        startTime: exam.heure_debut || "09:00",
        endTime: exam.heure_fin || "11:00",
        classrooms: Array.isArray(exam.classroom_ids) ? exam.classroom_ids : [],
        supervisors: Array.isArray(exam.superviseurs)
          ? exam.superviseurs.map((supervisor) => {
            const id =
              typeof supervisor === "object" ? supervisor.id : supervisor;
            const numId = typeof id === "string" ? parseInt(id, 10) : id;
            return isNaN(numId) ? 0 : numId;
          })
          : typeof exam.superviseurs === "string"
            ? exam.superviseurs.split(",").map((s) => {
              const numId = parseInt(s.trim(), 10);
              return isNaN(numId) ? 0 : numId;
            })
            : [],
        professors: Array.isArray(exam.professeurs)
          ? exam.professeurs.map((professor) => {
            const id =
              typeof professor === "object" ? professor.id : professor;
            const numId = typeof id === "string" ? parseInt(id, 10) : id;
            return isNaN(numId) ? 0 : numId;
          })
          : typeof exam.professeurs === "string"
            ? exam.professeurs.split(",").map((s) => {
              const numId = parseInt(s.trim(), 10);
              return isNaN(numId) ? 0 : numId;
            })
            : [],
        students: Array.isArray(exam.students) ? exam.students : [],
      });
    }
  }, [exam, form]);

  // Initialize selected students when exam is provided
  useEffect(() => {
    if (exam?.students && Array.isArray(exam.students)) {
      setSelectedStudentsLocal(exam.students);
      if (setSelectedStudents) {
        setSelectedStudents(exam.students);
      }
    }
  }, [exam, setSelectedStudents]);

  // Initialize imported students when exam is provided
  useEffect(() => {
    if (exam?.students && Array.isArray(exam.students)) {
      const importedStudentsData = exam.students.map((studentId) => {
        const student = exam.students_data?.find(
          (s) => s.studentId === studentId
        );
        return student || { studentId };
      });
      setImportedStudentsLocal(importedStudentsData);
      if (setImportedStudents) {
        setImportedStudents(importedStudentsData);
      }
    }
  }, [exam, setImportedStudents]);

  // Initialize selected classroom type based on exam data
  useEffect(() => {
    if (
      exam?.classroom_ids &&
      Array.isArray(exam.classroom_ids) &&
      amphitheaters.length > 0
    ) {
      const hasAmphitheaters = exam.classroom_ids.some((id) =>
        amphitheaters.some((amphi) => amphi.id === id)
      );
      setSelectedClassroomType(hasAmphitheaters ? "amphi" : "classroom");
    }
  }, [exam, amphitheaters]);

  // Initialize selected department based on exam data
  useEffect(() => {
    if (
      exam?.classroom_ids &&
      Array.isArray(exam.classroom_ids) &&
      availableClassrooms.length > 0
    ) {
      const firstClassroom = availableClassrooms.find((c) =>
        exam.classroom_ids.includes(c.id)
      );
      if (firstClassroom?.departement) {
        setSelectedClassroomDepartment(firstClassroom.departement);
      }
    }
  }, [exam, availableClassrooms]);

  // Initialize selected department for professors when editing an exam
  useEffect(() => {
    const initializeProfessorsForEdit = async () => {
      if (
        !exam?.professeurs ||
        !Array.isArray(exam.professeurs) ||
        exam.professeurs.length === 0
      ) {
        return;
      }

      try {
        // Fetch all professors to find the department
        const response = await api.get("/professeurs");
        const allProfessors = response.data;

        // Find the first professor from the exam in the list
        const examProfessor = allProfessors.find(
          (prof) => prof.id === exam.professeurs[0]
        );

        if (examProfessor?.departement) {
          // Set the department which will trigger loading professors from that department
          setSelectedDepartment(examProfessor.departement);
        } else {
          // If no department found, just load all professors of that department
          // by fetching professors by department for each possible department
          // For now, set professors directly
          const examProfessors = allProfessors.filter((prof) =>
            exam.professeurs.includes(prof.id)
          );
          if (examProfessors.length > 0) {
            setProfessorsByDepartment(examProfessors);
            if (examProfessors[0].departement) {
              setSelectedDepartment(examProfessors[0].departement);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching professors for edit:", error);
      }
    };

    initializeProfessorsForEdit();
  }, [exam]);

  // Load formations
  useEffect(() => {
    const loadFormations = async () => {
      try {
        setLoadingFormations(true);
        const formationsData = await getFormations();
        setFormations(formationsData);
      } catch (error) {
        console.error("Error loading formations:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les formations",
          variant: "destructive",
        });
      } finally {
        setLoadingFormations(false);
      }
    };

    loadFormations();
  }, [toast]);



  // Load departments
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoadingDepartments(true);
        const response = await api.get("/departements");
        const data = response.data;

        if (data.status === "success") {
          // Extract unique department names
          const uniqueDepartments = [
            ...new Set(data.data.map((dept) => dept.nom_departement)),
          ];
          setDepartments(uniqueDepartments);
        } else {
          toast({
            title: "Erreur",
            description: "Impossible de charger les départements",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading departments:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les départements",
          variant: "destructive",
        });
      } finally {
        setLoadingDepartments(false);
      }
    };

    loadDepartments();
  }, [toast]);

  // Fetch supervisors when department changes
  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        // Fetch superviseurs (no department dependency)
        setLoadingSupervisors(true);
        const superviseursResponse = await api.get("/superviseurs");
        const superviseursData = superviseursResponse.data;
        setSupervisorsByDepartment(
          Array.isArray(superviseursData) ? superviseursData : []
        );

        // Only fetch professeurs if department is selected
        if (selectedDepartment) {
          setLoadingProfessors(true);
          const professeursResponse = await api.get(
            `/professeurs/by-departement?departement=${selectedDepartment}`
          );
          const professeursData = professeursResponse.data;
          setProfessorsByDepartment(
            Array.isArray(professeursData) ? professeursData : []
          );
        } else {
          setProfessorsByDepartment([]);
        }
      } catch (error) {
        console.error("Error loading supervisors:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les superviseurs et professeurs",
          variant: "destructive",
        });
      } finally {
        setLoadingSupervisors(false);
        setLoadingProfessors(false);
      }
    };

    fetchSupervisors();
  }, [selectedDepartment, toast]);

  // Load filieres when formation changes
  useEffect(() => {
    const selectedFormation = form.watch("formation");
    const loadFilieres = async () => {
      if (!selectedFormation) {
        setFilieres([]);
        return;
      }

      try {
        setLoadingFilieres(true);
        const filieresData = await getFilieresByFormation(selectedFormation);
        setFilieres(filieresData);
      } catch (error) {
        console.error("Error loading filieres:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les filières",
          variant: "destructive",
        });
      } finally {
        setLoadingFilieres(false);
      }
    };

    loadFilieres();
  }, [form.watch("formation"), toast]);

  // Load modules when formation, filiere, or semester changes
  useEffect(() => {
    const selectedFormation = form.watch("formation");
    const selectedFiliere = form.watch("filiere");
    const selectedSemester = form.watch("semester");

    const loadModules = async () => {
      if (!selectedFormation || !selectedFiliere || !selectedSemester) {
        setModules([]);
        return;
      }

      try {
        setLoadingModules(true);
        const modulesData = await getModulesByFormationAndFiliere(
          selectedFormation,
          selectedFiliere,
          selectedSemester
        );
        setModules(modulesData);
      } catch (error) {
        console.error("Error loading modules:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les modules",
          variant: "destructive",
        });
      } finally {
        setLoadingModules(false);
      }
    };

    loadModules();
  }, [
    form.watch("formation"),
    form.watch("filiere"),
    form.watch("semester"),
    toast,
  ]);

  // Debug: Log form state changes
  useEffect(() => {
    console.log("Current form values:", form.getValues());
  }, [form.watch()]);

  // Sync selectedStudentsLocal with form's students field
  useEffect(() => {
    form.setValue("students", selectedStudentsLocal);
  }, [selectedStudentsLocal, form]);

  // Sync selectedStudentsLocal with parent component
  useEffect(() => {
    if (setSelectedStudents) {
      setSelectedStudents(selectedStudentsLocal);
    }
  }, [selectedStudentsLocal, setSelectedStudents]);

  // Add useEffect for fetching amphitheaters
  useEffect(() => {
    const fetchAmphitheaters = async () => {
      try {
        setLoadingAmphitheaters(true);
        const response = await api.get("/classrooms/amphitheaters");
        const data = response.data;

        if (data.status === "success") {
          setAmphitheaters(data.data);
        } else {
          toast({
            title: "Erreur",
            description: "Impossible de charger les amphithéâtres",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading amphitheaters:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les amphithéâtres",
          variant: "destructive",
        });
      } finally {
        setLoadingAmphitheaters(false);
      }
    };

    fetchAmphitheaters();
  }, [toast]);

  // Add useEffect for fetching available classrooms
  useEffect(() => {
    const fetchAvailableClassrooms = async () => {
      if (
        !selectedClassroomDepartment ||
        !form.getValues("date") ||
        !form.getValues("startTime") ||
        !form.getValues("endTime")
      ) {
        setAvailableClassrooms([]);
        return;
      }

      try {
        setLoadingClassrooms(true);

        // Format date as YYYY-MM-DD
        const formattedDate = format(form.getValues("date"), "yyyy-MM-dd");
        const startTime = form.getValues("startTime");
        const endTime = form.getValues("endTime");

        // First API call to get scheduled classrooms
        const scheduledResponse = await api.get(
          `/classrooms/by-datetime?date_examen=${formattedDate}&heure_debut=${startTime}&heure_fin=${endTime}&departement=${selectedClassroomDepartment}`
        );
        const scheduledData = scheduledResponse.data;

        if (scheduledData.status === "success") {
          const scheduledClassroomIds =
            scheduledData.data.scheduled_classrooms.map((c) => c.id);

          // Second API call to get available classrooms
          const availableResponse = await api.post(
            "/classrooms/not-in-list",
            {
              classroom_ids: scheduledClassroomIds,
            }
          );
          const availableData = availableResponse.data;

          if (availableData.status === "success") {
            // Filter classrooms by selected department
            const departmentClassrooms = availableData.data.filter(
              (classroom) =>
                classroom.departement === selectedClassroomDepartment
            );
            setAvailableClassrooms(departmentClassrooms);
          }
        }
      } catch (error) {
        console.error("Error loading available classrooms:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les salles disponibles",
          variant: "destructive",
        });
      } finally {
        setLoadingClassrooms(false);
      }
    };

    fetchAvailableClassrooms();
  }, [
    selectedClassroomDepartment,
    form.watch("date"),
    form.watch("startTime"),
    form.watch("endTime"),
    toast,
  ]);

  const onFormSubmit = async (values) => {
    console.log("ðŸš€ Form submission started with values:", values);
    try {
      setLoading(true);

      // Map selected student IDs to their complete information from importedStudentsLocal
      const studentsToSubmit = selectedStudentsLocal
        .map((studentId) =>
          importedStudentsLocal.find(
            (student) => student.studentId === studentId
          )
        )
        .filter((student) => student !== undefined);

      console.log("studentsToSubmit:", studentsToSubmit);

      // Map selected supervisor IDs to their complete information
      const supervisorsToSubmit = values.supervisors
        ? values.supervisors
          .map((supervisorId) =>
            supervisorsByDepartment.find(
              (supervisor) => supervisor.id === supervisorId
            )
          )
          .filter((supervisor) => supervisor !== undefined)
        : [];

      // Map selected professor IDs to their complete information
      const professorsToSubmit = values.professors
        .map((professorId) =>
          professorsByDepartment.find(
            (professor) => professor.id === professorId
          )
        )
        .filter((professor) => professor !== undefined);

      console.log("Mapped students:", studentsToSubmit);
      console.log("Mapped supervisors:", supervisorsToSubmit);
      console.log("Mapped professors:", professorsToSubmit);

      // Format date as YYYY-MM-DD
      const formattedDate = format(values.date, "yyyy-MM-dd");

      // Validate required fields
      if (
        !values.formation ||
        !values.filiere ||
        !values.semester ||
        !values.module ||
        !values.date ||
        !values.startTime ||
        !values.endTime ||
        !values.classrooms?.length ||
        !professorsToSubmit?.length ||
        !studentsToSubmit?.length
      ) {
        console.error("Missing required fields:", {
          formation: values.formation,
          filiere: values.filiere,
          semester: values.semester,
          module: values.module,
          date: values.date,
          startTime: values.startTime,
          endTime: values.endTime,
          classrooms: values.classrooms,
          professors: professorsToSubmit,
          students: studentsToSubmit,
        });
        toast({
          title: "Erreur de validation",
          description: "Veuillez remplir tous les champs obligatoires",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Get classroom names for the locaux field
      const classroomNames = values.classrooms
        .map((id) => availableClassrooms.find((c) => c.id === id)?.name || id)
        .join(", ");

      // Format the data according to the backend's expected format
      const examData = {
        formation: values.formation,
        filiere: values.filiere,
        semestre: values.semester,
        module: values.module,
        date_examen: formattedDate,
        heure_debut: values.startTime,
        heure_fin: values.endTime,
        locaux: classroomNames,
        professeurs: professorsToSubmit
          .map((p) => `${p.prenom} ${p.nom}`)
          .join(", "),
        superviseurs:
          supervisorsToSubmit.length > 0
            ? supervisorsToSubmit.map((s) => `${s.prenom} ${s.nom}`).join(", ")
            : undefined,
        classroom_ids: values.classrooms.map((id) => parseInt(id, 10)),
        students: studentsToSubmit.map((student) => ({
          studentId: student.studentId || student.id,
          firstName: student.firstName || student.prenom,
          lastName: student.lastName || student.nom,
          email:
            student.email || `${student.studentId || student.id}@example.com`,
          program: student.program || values.filiere,
          cne: student.cne,
        })),
      };

      console.log("Submitting exam data:", examData);

      let result;
      if (exam?.id) {
        result = await updateExam(exam.id, examData);
        toast({
          title: "Examen mis à jour",
          description: `L'examen de ${values.module} a été mis à jour avec succès`,
        });

        // Close the dialog immediately after exam update
        if (onSubmit) {
          onSubmit(result);
        }
      } else {
        result = await createExam(examData);
        toast({
          title: "Examen créé",
          description: `L'examen de ${values.module} a été créé avec succès`,
        });
        setExamId(result?.id || result?.data?.id);

        // Close the dialog immediately after exam creation
        if (onSubmit) {
          onSubmit(result);
        }
      }

      console.log("API response:", result);

      // After creating the exam, immediately call the assignment endpoint
      try {
        // Use the exam ID from the result (adjust if your API returns the ID differently)
        const examId = result?.id || result?.data?.id;
        if (examId) {
          console.log("Assigning students to classrooms:", {
            classroom_ids: values.classrooms.map(Number),
            student_numeros: studentsToSubmit.map((s) =>
              String(s.studentId || s.numero_etudiant || s.id)
            ),
          });
          const assignmentResponse = await api.post(
            `/exams/${examId}/assignments`,
            {
              classroom_ids: values.classrooms.map(Number), // keep as numbers
              student_numeros: studentsToSubmit.map((s) =>
                String(s.studentId || s.numero_etudiant || s.id)
              ),
            }
          );
          const assignmentData = assignmentResponse.data;
          console.log("Assignment API response:", assignmentData);
          if (assignmentResponse.status === 200 || assignmentResponse.status === 201) {
            toast({
              title: "Affectation réussie",
              description:
                "Les étudiants ont été assignés à leurs salles et places.",
            });
          } else {
            throw new Error(
              assignmentData.message ||
              "Erreur lors de l'affectation des étudiants."
            );
          }
        }
      } catch (err) {
        toast({
          title: "Erreur d'affectation",
          description: err.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      if (
        error.message &&
        error.message.includes("Unexpected end of JSON input")
      ) {
        setLoading(false);
        return; // Do nothing: no log, no toast
      }
      console.error("Error saving exam:", error);
      toast({
        title: "Erreur",
        description: `Impossible d'enregistrer l'examen: ${error.message}`,
        variant: "destructive",
      });
      setLoading(false);
    }
    // Ensure loading is stopped after all logic
    setLoading(false);
  };

  const handleFormError = (errors) => {
    console.error("Form validation errors:", errors);
    toast({
      title: "Erreur de validation",
      description: "Veuillez vérifier tous les champs requis",
      variant: "destructive",
    });
  };

  const handleStudentSelection = (studentId) => {
    setSelectedStudentsLocal((prev) => {
      const newSelectedStudents = prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId];
      return newSelectedStudents;
    });
  };

  const selectAllStudents = () => {
    const allStudents = mockStudents.map((s) => s.id);
    setSelectedStudentsLocal(allStudents);
  };

  const clearStudentSelection = () => {
    setSelectedStudentsLocal([]);
  };

  const handleImportComplete = (importedStudents) => {
    // Store the complete student data
    setImportedStudentsLocal(importedStudents);

    // Store just the IDs for selection tracking
    const importedStudentIds = importedStudents.map((student) =>
      student.studentId.toString()
    );
    setSelectedStudentsLocal(importedStudentIds);

    // Update the form values with the student IDs
    form.setValue("students", importedStudentIds);

    if (setImportedStudents) {
      setImportedStudents(importedStudents);
    }

    // Also update the parent component's selected students if provided
    if (setSelectedStudents) {
      setSelectedStudents(importedStudentIds);
    }

    setShowImportCSV(false);

    toast({
      title: "Étudiants importés",
      description: `${importedStudents.length} étudiants ont été importés avec succès`,
    });
  };

  const handleSelectStudentsClick = () => {
    setShowImportCSV(true);
  };

  const showExamDetail = async (examId) => {
    // ...open your detail dialog/drawer here...
    const res = await api.get(`/exams/${examId}/assignments`);
    const data = res.data;
    setAssignments(data.data.assignments); // or adjust as needed
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          console.log("ðŸ”µ Form submit event triggered");
          form.handleSubmit(onFormSubmit, handleFormError)(e);
        }}
        className="space-y-6"
      >
        <div className="flex flex-col h-full max-h-[85vh]">
          <div className="flex-1 overflow-y-auto pr-4 pb-6">
            {/* Top section with basic exam info */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-lg font-medium mb-4">Informations de base</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Formation Field */}
                <FormField
                  control={form.control}
                  name="formation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Formation</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Reset filiere and module when formation changes
                          form.setValue("filiere", "");
                          form.setValue("module", "");
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Sélectionnez une formation" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingFormations ? (
                            <div className="p-2 text-center text-slate-500">
                              Chargement des formations...
                            </div>
                          ) : formations.length > 0 ? (
                            formations.map((formation) => (
                              <SelectItem
                                key={formation.id}
                                value={formation.id.toString()}
                              >
                                {formation.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-center text-slate-500">
                              Aucune formation disponible
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Filiere Field */}
                <FormField
                  control={form.control}
                  name="filiere"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Filière</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Reset module when filiere changes
                          form.setValue("module", "");
                        }}
                        defaultValue={field.value}
                        disabled={!form.getValues("formation")}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Sélectionnez une filière" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingFilieres ? (
                            <div className="p-2 text-center text-slate-500">
                              Chargement des filières...
                            </div>
                          ) : filieres.length > 0 ? (
                            filieres.map((filiere) => (
                              <SelectItem
                                key={filiere.id}
                                value={filiere.id.toString()}
                              >
                                {filiere.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-center text-slate-500">
                              {form.getValues("formation")
                                ? "Aucune filière disponible pour cette formation"
                                : "Veuillez d'abord sélectionner une formation"}
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Semester Field */}
                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semestre</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Reset module when semester changes
                          form.setValue("module", "");
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Sélectionnez un semestre" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map((semester) => (
                            <SelectItem
                              key={semester}
                              value={semester.toString()}
                            >
                              Semestre {semester}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Module Field */}
                <FormField
                  control={form.control}
                  name="module"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Module</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={
                          !form.getValues("formation") ||
                          !form.getValues("filiere") ||
                          !form.getValues("semester")
                        }
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Sélectionnez un module" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingModules ? (
                            <div className="p-2 text-center text-slate-500">
                              Chargement des modules...
                            </div>
                          ) : modules.length > 0 ? (
                            modules.map((module) => (
                              <SelectItem
                                key={module.id}
                                value={module.id.toString()}
                              >
                                {module.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-center text-slate-500">
                              {!form.getValues("formation")
                                ? "Veuillez d'abord sélectionner une formation"
                                : !form.getValues("filiere")
                                  ? "Veuillez d'abord sélectionner une filière"
                                  : !form.getValues("semester")
                                    ? "Veuillez d'abord sélectionner un semestre"
                                    : "Aucun module disponible pour cette combinaison"}
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Schedule section */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-lg font-medium mb-4">Planification</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date Field */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date d'examen</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal bg-white",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Choisissez une date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date().setHours(0, 0, 0, 0)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Start Time Field */}
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heure de début</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-slate-400" />
                          <Input
                            type="time"
                            {...field}
                            className="bg-white"
                            min={
                              form.getValues("date") && isSameDay(form.getValues("date"), new Date())
                                ? format(new Date(), "HH:mm")
                                : undefined
                            }
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* endTime Field */}
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heure de fin</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-slate-400" />
                          <Input
                            type="time"
                            {...field}
                            className="bg-white"
                            min={form.getValues("startTime")}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Students Field */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
              <FormField
                control={form.control}
                name="students"
                render={() => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1 text-lg font-medium mb-4">
                      <Users className="h-5 w-5" />
                      Étudiants
                    </FormLabel>
                    <Button
                      variant="outline"
                      type="button"
                      className="w-full bg-white flex items-center justify-center gap-2"
                      onClick={handleSelectStudentsClick}
                    >
                      <Upload className="h-4 w-4" />
                      {selectedStudentsLocal.length === 0
                        ? "Importer la liste d'étudiants (CSV)"
                        : `${selectedStudentsLocal.length} Étudiants importés`}
                    </Button>

                    {/* Direct import dialog */}
                    <Dialog
                      open={showImportCSV}
                      onOpenChange={setShowImportCSV}
                    >
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                          <DialogTitle>
                            Importer la liste d'étudiants
                          </DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-auto">
                          <ImportCSV onImportComplete={handleImportComplete} />
                        </div>
                      </DialogContent>
                    </Dialog>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Classrooms Field */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
              <FormField
                control={form.control}
                name="classrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1 text-lg font-medium mb-4">
                      <Building className="h-5 w-5" />
                      Les locaux
                    </FormLabel>

                    {/* Type Selection */}
                    <div className="flex gap-4 mb-4">
                      <Button
                        type="button"
                        variant={
                          selectedClassroomType === "amphi"
                            ? "default"
                            : "outline"
                        }
                        onClick={() => setSelectedClassroomType("amphi")}
                        className="flex-1"
                      >
                        Amphithéâtres
                      </Button>
                      <Button
                        type="button"
                        variant={
                          selectedClassroomType === "classroom"
                            ? "default"
                            : "outline"
                        }
                        onClick={() => setSelectedClassroomType("classroom")}
                        className="flex-1"
                      >
                        Salles de cours
                      </Button>
                    </div>

                    {selectedClassroomType === "amphi" && (
                      <div className="mt-2 space-y-2 max-h-60 overflow-y-auto pr-2 py-2">
                        {loadingAmphitheaters ? (
                          <div className="text-center text-slate-500 py-2">
                            Chargement des amphithéâtres...
                          </div>
                        ) : amphitheaters.length > 0 ? (
                          amphitheaters.map((amphi) => (
                            <div
                              key={amphi.id}
                              className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-slate-100"
                            >
                              <div className="flex items-start gap-2">
                                <Checkbox
                                  id={`amphi-${amphi.id}`}
                                  checked={field.value.includes(amphi.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([
                                        ...field.value,
                                        amphi.id,
                                      ]);
                                    } else {
                                      field.onChange(
                                        field.value.filter(
                                          (id) => id !== amphi.id
                                        )
                                      );
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`amphi-${amphi.id}`}
                                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {amphi.nom_du_local} - Capacité:{" "}
                                  {amphi.capacite}
                                </label>
                              </div>
                              <span className="text-green-600 font-medium text-sm px-2 py-1 bg-green-50 rounded-full">
                                Disponible
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-slate-500 py-2">
                            Aucun amphithéâtre disponible
                          </div>
                        )}
                      </div>
                    )}

                    {selectedClassroomType === "classroom" && (
                      <div className="space-y-4">
                        {/* Department Selection for Classrooms */}
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 mb-2">
                            Sélectionnez un département
                          </h4>
                          <Select
                            onValueChange={(value) =>
                              setSelectedClassroomDepartment(value)
                            }
                            value={selectedClassroomDepartment}
                          >
                            <SelectTrigger className="w-full bg-white">
                              <SelectValue placeholder="Sélectionnez un département" />
                            </SelectTrigger>
                            <SelectContent>
                              {loadingDepartments ? (
                                <div className="p-2 text-center text-slate-500">
                                  Chargement des départements...
                                </div>
                              ) : departments.length > 0 ? (
                                departments.map((department) => (
                                  <SelectItem
                                    key={department}
                                    value={department}
                                  >
                                    {department}
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="p-2 text-center text-slate-500">
                                  Aucun département disponible
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Classrooms List */}
                        {selectedClassroomDepartment && (
                          <div className="mt-2 space-y-2 max-h-60 overflow-y-auto pr-2 py-2">
                            {loadingClassrooms ? (
                              <div className="text-center text-slate-500 py-2">
                                Chargement des salles disponibles...
                              </div>
                            ) : availableClassrooms.length > 0 ? (
                              availableClassrooms
                                .filter((classroom) => {
                                  // Filter out amphitheaters when showing classrooms
                                  if (selectedClassroomType === "classroom") {
                                    return !amphitheaters.some(
                                      (amphi) => amphi.id === classroom.id
                                    );
                                  }
                                  return true;
                                })
                                .map((classroom) => (
                                  <div
                                    key={classroom.id}
                                    className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-slate-100"
                                  >
                                    <div className="flex items-start gap-2">
                                      <Checkbox
                                        id={`classroom-${classroom.id}`}
                                        checked={field.value.includes(
                                          classroom.id
                                        )}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            field.onChange([
                                              ...field.value,
                                              classroom.id,
                                            ]);
                                          } else {
                                            field.onChange(
                                              field.value.filter(
                                                (id) => id !== classroom.id
                                              )
                                            );
                                          }
                                        }}
                                      />
                                      <label
                                        htmlFor={`classroom-${classroom.id}`}
                                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                      >
                                        {classroom.nom_du_local} - Capacité:{" "}
                                        {classroom.capacite}
                                      </label>
                                    </div>
                                    <span className="text-green-600 font-medium text-sm px-2 py-1 bg-green-50 rounded-full">
                                      Disponible
                                    </span>
                                  </div>
                                ))
                            ) : (
                              <div className="text-center text-slate-500 py-2">
                                Aucune salle disponible pour ce département à
                                cette date et heure
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Selected Locaux Section */}
                    {field.value.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-slate-200">
                        <h4 className="text-sm font-medium text-slate-700 mb-3">
                          Locaux sélectionnés ({field.value.length})
                        </h4>
                        <div className="space-y-2">
                          {field.value.map((selectedId) => {
                            // Find the selected item from either amphitheaters or availableClassrooms
                            const selectedItem =
                              amphitheaters.find((a) => a.id === selectedId) ||
                              availableClassrooms.find(
                                (c) => c.id === selectedId
                              );

                            if (!selectedItem) return null;

                            return (
                              <div
                                key={selectedId}
                                className="flex items-center justify-between gap-2 p-2 rounded-md bg-slate-50 border border-slate-200"
                              >
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4 text-slate-500" />
                                  <span className="text-sm">
                                    {selectedItem.nom_du_local} - Capacité:{" "}
                                    {selectedItem.capacite}
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    field.onChange(
                                      field.value.filter(
                                        (id) => id !== selectedId
                                      )
                                    );
                                  }}
                                >
                                  Retirer
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Supervisors and Professors Field */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
              <FormField
                control={form.control}
                name="professors"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="flex items-center gap-1 text-lg font-medium">
                      <Users className="h-5 w-5" />
                      Les professeurs
                    </FormLabel>

                    {/* Department Selection and Professeurs List - Always visible */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">
                          Département
                        </h4>
                        <Select
                          value={selectedDepartment}
                          onValueChange={setSelectedDepartment}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un département" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedDepartment && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-slate-700 mb-2">
                            Professeur
                          </h4>
                          {loadingProfessors ? (
                            <div className="text-center text-slate-500 py-2">
                              Chargement des professeurs...
                            </div>
                          ) : professorsByDepartment.length > 0 ? (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 py-2">
                              {professorsByDepartment.map((professor) => (
                                <div
                                  key={professor.id}
                                  className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-100"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value.includes(
                                        professor.id
                                      )}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          field.onChange([
                                            ...field.value,
                                            professor.id,
                                          ]);
                                        } else {
                                          field.onChange(
                                            field.value.filter(
                                              (id) => id !== professor.id
                                            )
                                          );
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <label className="text-sm leading-none cursor-pointer flex-1">
                                    {professor.prenom} {professor.nom} -{" "}
                                    {professor.poste}
                                  </label>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-slate-500 py-2">
                              Aucun professeur disponible
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supervisors"
                render={({ field }) => (
                  <FormItem className="space-y-4 mt-6">
                    <FormLabel className="flex items-center gap-1 text-lg font-medium">
                      <Users className="h-5 w-5" />
                      Les superviseurs (optionnel)
                    </FormLabel>

                    {/* Superviseurs List - Only show if not only classrooms selected */}
                    {(!selectedClassroomType ||
                      selectedClassroomType === "amphi") && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-slate-700">
                              Superviseur
                            </h4>
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-sm text-blue-600 hover:text-blue-700"
                              onClick={() =>
                                setShowSuperviseursList(!showSuperviseursList)
                              }
                            >
                              {showSuperviseursList
                                ? "Masquer la liste des superviseurs"
                                : "Afficher tous les superviseurs"}
                            </Button>
                          </div>

                          {showSuperviseursList && (
                            <>
                              {loadingSupervisors ? (
                                <div className="text-center text-slate-500 py-2">
                                  Chargement des superviseurs...
                                </div>
                              ) : supervisorsByDepartment.length > 0 ? (
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 py-2">
                                  {supervisorsByDepartment.map((supervisor) => (
                                    <div
                                      key={supervisor.id}
                                      className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-100"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value.includes(
                                            supervisor.id
                                          )}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              field.onChange([
                                                ...field.value,
                                                supervisor.id,
                                              ]);
                                            } else {
                                              field.onChange(
                                                field.value.filter(
                                                  (id) => id !== supervisor.id
                                                )
                                              );
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <label className="text-sm leading-none cursor-pointer flex-1">
                                        {supervisor.prenom} {supervisor.nom} -{" "}
                                        {supervisor.poste}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center text-slate-500 py-2">
                                  Aucun superviseur disponible
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                  </FormItem>
                )}
              />
            </div>

            {/* Selected Professors and Supervisors Section */}
            {(form.getValues("professors")?.length > 0 ||
              form.getValues("supervisors")?.length > 0) && (
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">
                    Personnel sélectionné
                  </h4>
                  <div className="space-y-2">
                    {/* Selected Professors */}
                    {form.getValues("professors")?.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-slate-600 mb-2">
                          Professeurs ({form.getValues("professors").length})
                        </h5>
                        {form.getValues("professors").map((professorId) => {
                          const professor = professorsByDepartment.find(
                            (p) => p.id === professorId
                          );
                          if (!professor) return null;

                          return (
                            <div
                              key={professorId}
                              className="flex items-center justify-between gap-2 p-2 rounded-md bg-slate-50 border border-slate-200"
                            >
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-slate-500" />
                                <span className="text-sm">
                                  {professor.prenom} {professor.nom} -{" "}
                                  {professor.poste}
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  const currentProfessors =
                                    form.getValues("professors");
                                  form.setValue(
                                    "professors",
                                    currentProfessors.filter(
                                      (id) => id !== professorId
                                    )
                                  );
                                }}
                              >
                                Retirer
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Selected Supervisors */}
                    {form.getValues("supervisors")?.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-slate-600 mb-2">
                          Superviseurs ({form.getValues("supervisors").length})
                        </h5>
                        {form.getValues("supervisors").map((supervisorId) => {
                          const supervisor = supervisorsByDepartment.find(
                            (s) => s.id === supervisorId
                          );
                          if (!supervisor) return null;

                          return (
                            <div
                              key={supervisorId}
                              className="flex items-center justify-between gap-2 p-2 rounded-md bg-slate-50 border border-slate-200"
                            >
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-slate-500" />
                                <span className="text-sm">
                                  {supervisor.prenom} {supervisor.nom} -{" "}
                                  {supervisor.poste}
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  const currentSupervisors =
                                    form.getValues("supervisors");
                                  form.setValue(
                                    "supervisors",
                                    currentSupervisors.filter(
                                      (id) => id !== supervisorId
                                    )
                                  );
                                }}
                              >
                                Retirer
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* Form Footer - Fixed at bottom */}
          <div className="flex justify-end gap-2 mt-4 py-4 border-t bg-white sticky bottom-0">
            <Button
              variant="outline"
              type="button"
              onClick={(e) => {
                console.log("Cancel button clicked");
                onCancel?.(e);
              }}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              onClick={() => console.log("Submit button clicked")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Spinner />
                  Chargement...
                </div>
              ) : exam ? (
                "Mettre à jour l'examen"
              ) : (
                "Planifier l'examen"
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default ExamForm;
