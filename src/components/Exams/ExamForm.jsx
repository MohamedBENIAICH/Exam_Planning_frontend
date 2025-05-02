import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
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
import { getSupervisorsByDepartment, getDepartments } from "@/services/supervisorService";
import { getFormations, getFilieresByFormation, getModulesByFormationAndFiliere } from "@/services/formationService";
// import { Spinner } from "@/components/ui/spinner"; // Uncomment if you have a Spinner component

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
  classrooms: z.array(z.string()).min(1, "Au moins une salle est requise"),
  supervisors: z.array(z.number()).min(1, "Au moins un superviseur est requis"),
  students: z.array(z.string()),
});

const ExamForm = ({
  exam,
  onSubmit,
  onCancel,
  setSelectedStudents,
  setImportedStudents,
}) => {
  const [selectedStudentsLocal, setSelectedStudentsLocal] = useState(
    exam?.students || []
  );
  const [importedStudentsLocal, setImportedStudentsLocal] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [showImportCSV, setShowImportCSV] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableClassrooms, setAvailableClassrooms] = useState([]);
  const [supervisorsByDepartment, setSupervisorsByDepartment] = useState([]);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
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

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: exam
      ? {
          formation: exam.formation,
          filiere: exam.filiere,
          semester: exam.semester || "",
          module: exam.module,
          date: exam.date ? new Date(exam.date) : new Date(),
          startTime: exam.startTime,
          endTime: exam.endTime,
          classrooms: exam.classrooms,
          supervisors: exam.supervisors ? exam.supervisors.map(id => {
            // Handle both string and number IDs
            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
            return isNaN(numId) ? 0 : numId;
          }) : [],
          students: exam.students,
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
          students: [],
        },
  });

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

  // Load available classrooms based on selected date and time
  useEffect(() => {
    const loadAvailableClassrooms = async () => {
      const selectedDate = form.getValues("date");
      const startTime = form.getValues("startTime");
      const endTime = form.getValues("endTime");

      if (selectedDate && startTime && endTime) {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");

        try {
          // First API call to get scheduled classroom IDs
          const response = await fetch(`http://127.0.0.1:8000/api/classrooms/search?date_examen=${formattedDate}&heure_debut=${startTime}&heure_fin=${endTime}`);
          const data = await response.json();

          if (data.status === "success") {
            const scheduledClassroomIds = data.data.scheduled_classroom_ids;

            // Debugging: Check the scheduled classroom IDs
            console.log("Scheduled Classroom IDs:", scheduledClassroomIds);

            // Ensure that scheduledClassroomIds is not empty before making the second API call
            if (scheduledClassroomIds.length >= 0) {
              // Second API call to get available classrooms
              const availableResponse = await fetch(`http://127.0.0.1:8000/api/classrooms/not-in-list`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ classroom_ids: scheduledClassroomIds }), // Ensure this is an array
              });
              const availableData = await availableResponse.json();

              if (availableData.status === "success") {
                setAvailableClassrooms(availableData.data);
              } else {
                console.error("Error fetching available classrooms:", availableData);
                toast({
                  title: "Erreur",
                  description: "Impossible de charger les salles disponibles",
                  variant: "destructive",
                });
              }
            } else {
              console.warn("No scheduled classrooms found for the selected date and time.");
              toast({
                title: "Avertissement",
                description: "Aucune salle programmée trouvée pour cette date et heure.",
                variant: "default",
              });
            }
          } else {
            console.error("Error fetching scheduled classrooms:", data);
            toast({
              title: "Erreur",
              description: "Impossible de charger les salles programmées",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error loading classrooms:", error);
          toast({
            title: "Erreur",
            description: "Impossible de charger les salles disponibles",
            variant: "destructive",
          });
        }
      }
    };

    loadAvailableClassrooms();
  }, [form.watch("date"), form.watch("startTime"), form.watch("endTime"), toast]);

  // Load departments
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoadingDepartments(true);
        const response = await getDepartments();
        if (response.status === 'success') {
          setDepartments(response.data);
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
      if (!selectedDepartment) {
        setSupervisorsByDepartment([]);
        return;
      }

      try {
        setLoadingSupervisors(true);
        const response = await getSupervisorsByDepartment(selectedDepartment);
        if (response.status === 'success') {
          setSupervisorsByDepartment(response.data);
        } else {
          toast({
            title: "Erreur",
            description: "Impossible de charger les superviseurs",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading supervisors:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les superviseurs",
          variant: "destructive",
        });
      } finally {
        setLoadingSupervisors(false);
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
  }, [form.watch("formation"), form.watch("filiere"), form.watch("semester"), toast]);

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

  const onFormSubmit = async (values) => {
    console.log("🚀 Form submission started with values:", values);
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
        .map((supervisorId) =>
          supervisorsByDepartment.find(
            (supervisor) => supervisor.id === supervisorId
          )
        )
        .filter((supervisor) => supervisor !== undefined);

      console.log("Mapped students:", studentsToSubmit);
      console.log("Mapped supervisors:", supervisorsToSubmit);

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
        !supervisorsToSubmit?.length ||
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
          supervisors: supervisorsToSubmit,
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
        .map(id => availableClassrooms.find(c => c.id === id)?.name || id)
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
        superviseurs: supervisorsToSubmit.map(s => `${s.prenom} ${s.nom}`).join(", "),
        classroom_ids: values.classrooms.map(id => parseInt(id, 10)),
        students: studentsToSubmit.map(student => ({
          studentId: student.studentId || student.id,
          firstName: student.firstName || student.prenom,
          lastName: student.lastName || student.nom,
          email: student.email || `${student.studentId || student.id}@example.com`,
          program: student.program || values.filiere
        }))
      };

      console.log("Submitting exam data:", examData);

      let result;
      if (exam?.id) {
        result = await updateExam(exam.id, examData);
        toast({
          title: "Examen mis à jour",
          description: `L'examen de ${values.module} a été mis à jour avec succès`,
        });
      } else {
        result = await createExam(examData);
        toast({
          title: "Examen créé",
          description: `L'examen de ${values.module} a été créé avec succès`,
        });
      }

      console.log("API response:", result);

      if (onSubmit) {
        onSubmit(result);
      }

      // After creating the exam, immediately call the assignment endpoint
      try {
        // Use the exam ID from the result (adjust if your API returns the ID differently)
        const examId = result?.id || result?.data?.id;
        if (examId) {
          console.log("Assigning students to classrooms:", {
            classroom_ids: values.classrooms.map(Number),
            student_numeros: studentsToSubmit.map(s => String(s.studentId || s.numero_etudiant || s.id)),
          });
          const assignmentResponse = await fetch(
            `http://localhost:8000/api/exams/${examId}/assignments`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                classroom_ids: values.classrooms.map(Number), // keep as numbers
                student_numeros: studentsToSubmit.map(s => String(s.studentId || s.numero_etudiant || s.id)),
              }),
            }
          );
          const assignmentData = await assignmentResponse.json();
          console.log("Assignment API response:", assignmentData);
          if (assignmentResponse.ok) {
            toast({
              title: "Affectation réussie",
              description: "Les étudiants ont été assignés à leurs salles et places.",
            });
          } else {
            throw new Error(assignmentData.message || "Erreur lors de l'affectation des étudiants.");
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
      console.error("Error saving exam:", error);
      toast({
        title: "Erreur",
        description: `Impossible d'enregistrer l'examen: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
    const importedStudentIds = importedStudents.map((student) => student.id);
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
    const res = await fetch(`http://localhost:8000/api/exams/${examId}/assignments`);
    const data = await res.json();
    setAssignments(data.data.assignments); // or adjust as needed
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={(e) => {
          console.log("🔵 Form submit event triggered");
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
                              <SelectItem key={formation.id} value={formation.id.toString()}>
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
                              <SelectItem key={filiere.id} value={filiere.id.toString()}>
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
                            <SelectItem key={semester} value={semester.toString()}>
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
                        disabled={!form.getValues("formation") || !form.getValues("filiere") || !form.getValues("semester")}
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
                              <SelectItem key={module.id} value={module.id.toString()}>
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
                          <Input type="time" {...field} className="bg-white" />
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
                          <Input type="time" {...field} className="bg-white" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Supervisors Field */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
              <FormField
                control={form.control}
                name="supervisors"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="flex items-center gap-1 text-lg font-medium">
                      <Users className="h-5 w-5" />
                      Les superviseurs
                    </FormLabel>
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">
                        Sélectionnez un département
                      </h4>
                      <Select
                        onValueChange={(value) => setSelectedDepartment(value)}
                        value={selectedDepartment}
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
                              <SelectItem key={department} value={department}>
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

                    {selectedDepartment && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">
                          Superviseurs disponibles
                        </h4>
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
                                    checked={field.value.includes(supervisor.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([...field.value, supervisor.id]);
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
                                <label
                                  className="text-sm leading-none cursor-pointer flex-1"
                                >
                                  {supervisor.prenom} {supervisor.nom} ({supervisor.type || "Non spécifié"})
                                </label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-slate-500 py-2">
                            Aucun superviseur trouvé pour ce département
                          </div>
                        )}
                      </div>
                    )}

                    {field.value.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2 sticky top-0 bg-slate-50 py-1">
                          Superviseurs sélectionnés ({field.value.length})
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                          {supervisorsByDepartment
                            .filter((supervisor) => field.value.includes(supervisor.id))
                            .map((supervisor) => (
                              <div
                                key={supervisor.id}
                                className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-100"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={true}
                                    onCheckedChange={() => {
                                      field.onChange(
                                        field.value.filter(
                                          (id) => id !== supervisor.id
                                        )
                                      );
                                    }}
                                  />
                                </FormControl>
                                <label
                                  className="text-sm leading-none cursor-pointer flex-1"
                                >
                                  {supervisor.prenom} {supervisor.nom} ({supervisor.type || "Non spécifié"})
                                </label>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {field.value.length === 0 && (
                      <FormMessage>
                        Veuillez sélectionner au moins un superviseur
                      </FormMessage>
                    )}
                  </FormItem>
                )}
              />
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
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto pr-2 py-2">
                    {availableClassrooms.map((classroom) => (
                      <div
                        key={classroom.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-slate-100"
                      >
                        <div className="flex items-start gap-2">
                          <Checkbox
                            id={`classroom-${classroom.id}`}
                            checked={field.value.includes(classroom.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...field.value, classroom.id]);
                              } else {
                                field.onChange(field.value.filter((id) => id !== classroom.id));
                              }
                            }}
                          />
                          <label
                            htmlFor={`classroom-${classroom.id}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {classroom.nom_du_local} ({classroom.departement}) - Capacité: {classroom.capacite}
                          </label>
                        </div>
                        <span className="text-green-600 font-medium text-sm px-2 py-1 bg-green-50 rounded-full">
                          Disponible
                        </span>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              onClick={() => console.log("🔴 Submit button clicked")}
              className="bg-blue-600 hover:bg-blue-700"
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
