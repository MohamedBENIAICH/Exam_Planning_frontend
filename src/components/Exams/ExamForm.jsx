import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, Users, Building, Upload } from "lucide-react";
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

const formSchema = z.object({
  cycle: z.string().min(1, "Le cycle est requis"),
  filiere: z.string().min(1, "La filière est requise"),
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
  const { toast } = useToast();

  // Load available classrooms
  useEffect(() => {
    const loadClassrooms = async () => {
      try {
        const classrooms = await getAvailableClassrooms();
        setAvailableClassrooms(classrooms);
      } catch (error) {
        console.error("Error loading classrooms:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les salles disponibles",
          variant: "destructive",
        });
      }
    };

    loadClassrooms();
  }, [toast]);

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

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: exam
      ? {
          cycle: exam.cycle,
          filiere: exam.filiere,
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
          cycle: "",
          filiere: "",
          module: "",
          date: new Date(),
          startTime: "09:00",
          endTime: "11:00",
          classrooms: [],
          supervisors: [],
          students: [],
        },
  });

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
        !values.cycle ||
        !values.filiere ||
        !values.module ||
        !values.date ||
        !values.startTime ||
        !values.endTime ||
        !values.classrooms?.length ||
        !supervisorsToSubmit?.length ||
        !studentsToSubmit?.length
      ) {
        console.error("Missing required fields:", {
          cycle: values.cycle,
          filiere: values.filiere,
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
        cycle: values.cycle,
        filiere: values.filiere,
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
                {/* Cycle Field */}
                <FormField
                  control={form.control}
                  name="cycle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cycle</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Sélectionnez un cycle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tranc common">
                            Tranc Common
                          </SelectItem>
                          <SelectItem value="ingénieure">Ingénieure</SelectItem>
                          <SelectItem value="master">Master</SelectItem>
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
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Sélectionnez une filière" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockFilieres.map((filiere) => (
                            <SelectItem key={filiere.id} value={filiere.id}>
                              {filiere.name}
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
                      <FormControl>
                        <Input
                          placeholder="Entrez le module"
                          {...field}
                          className="bg-white"
                        />
                      </FormControl>
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
                              {classroom.name} ({classroom.building}) -
                              Capacité: {classroom.capacity}
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
                  <span className="animate-spin">⌛</span>
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
