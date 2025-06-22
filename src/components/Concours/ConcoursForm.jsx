import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Users, Building, Upload } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ImportCSVforConcours from "./ImportCSVforConcours";

const ConcoursForm = ({
  concour,
  onSubmit,
  onCancel,
  availableLocaux = [],
  availableProfesseurs = [],
  availableSuperviseurs = [],
  availableCandidats = [],
  typeEpreuves = ["écrit", "oral"],
}) => {
  console.log("ConcoursForm mounted");
  const { toast } = useToast();
  const [showImportCSV, setShowImportCSV] = useState(false);
  const [importedCandidats, setImportedCandidats] = useState([]);
  const [selectedCandidats, setSelectedCandidats] = useState(
    concour?.candidats || []
  );
  const [isEditMode] = useState(!!concour);

  // Locaux/classrooms logic
  const [selectedClassroomType, setSelectedClassroomType] = useState("amphi");
  const [selectedClassroomDepartment, setSelectedClassroomDepartment] =
    useState("");
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [amphitheaters, setAmphitheaters] = useState([]);
  const [loadingAmphitheaters, setLoadingAmphitheaters] = useState(false);
  const [availableClassrooms, setAvailableClassrooms] = useState([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [professorsByDepartment, setProfessorsByDepartment] = useState([]);
  const [loadingProfessors, setLoadingProfessors] = useState(false);
  const [supervisorsByDepartment, setSupervisorsByDepartment] = useState([]);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const [showSuperviseursList, setShowSuperviseursList] = useState(false);

  // Regroupe tous les locaux disponibles pour la correspondance lors de la soumission
  const allLocaux = [
    ...(Array.isArray(amphitheaters) ? amphitheaters : []),
    ...(Array.isArray(availableClassrooms) ? availableClassrooms : []),
    ...(Array.isArray(availableLocaux) ? availableLocaux : []),
  ];

  // Schéma de validation dynamique
  const formSchema = z.object({
    titre: z.string().min(1, "Le titre est requis"),
    description: z.string().optional(),
    date_concours: z.date({ required_error: "La date est requise" }),
    heure_debut: z.string().min(1, "L'heure de début est requise"),
    heure_fin: z.string().min(1, "L'heure de fin est requise"),
    type_epreuve: z.string().min(1, "Le type d'épreuve est requis"),
    locaux: z
      .array(z.string())
      .min(1, "Veuillez sélectionner au moins un local"),
    candidats: z.array(z.any()),
    professeurs: isEditMode
      ? z.array(z.string())
      : z
          .array(z.string())
          .min(1, "Veuillez sélectionner au moins un professeur"),
    superviseurs: isEditMode
      ? z.array(z.string())
      : z
          .array(z.string())
          .min(1, "Veuillez sélectionner au moins un superviseur"),
  });

  // Initialize form with default values
  const getDefaultValues = () => {
    const defaultValues = {
      titre: "",
      description: "",
      date_concours: new Date(),
      heure_debut: "09:00",
      heure_fin: "11:00",
      locaux: [],
      type_epreuve: "",
      candidats: [],
      professeurs: [],
      superviseurs: [],
    };

    if (!concour) return defaultValues;

    // Process concour data
    const processedValues = {
      ...defaultValues,
      titre: concour.titre || "",
      description: concour.description || "",
      date_concours: concour.date_concours ? new Date(concour.date_concours) : new Date(),
      heure_debut: concour.heure_debut || "09:00",
      heure_fin: concour.heure_fin || "11:00",
      type_epreuve: concour.type_epreuve || "",
      candidats: concour.candidats?.map(c => ({
        CNE: c.CNE,
        CIN: c.CIN,
        nom: c.nom,
        prenom: c.prenom,
        email: c.email,
      })) || [],
      professeurs: concour.professeurs?.map(p => p.id.toString()) || [],
      superviseurs: concour.superviseurs?.map(s => s.id.toString()) || [],
    };

    // Process locaux if they exist
    if (concour.locaux) {
      if (Array.isArray(concour.locaux) && concour.locaux.length > 0) {
        if (typeof concour.locaux[0] === 'string' || typeof concour.locaux[0] === 'number') {
          processedValues.locaux = concour.locaux.map(String);
        } else if (typeof concour.locaux[0] === 'object') {
          processedValues.locaux = concour.locaux
            .map(l => l.id?.toString() || l.nom_local || l.nom_du_local || "")
            .filter(Boolean);
        }
      } else if (typeof concour.locaux === 'string') {
        try {
          const parsed = JSON.parse(concour.locaux);
          if (Array.isArray(parsed)) {
            processedValues.locaux = parsed
              .map(l => (l.id?.toString() || l.nom_local || l.nom_du_local || ""))
              .filter(Boolean);
          }
        } catch (e) {
          processedValues.locaux = concour.locaux
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        }
      }
    }


    return processedValues;
  };

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  // Handle CSV import for candidats
  const handleImportComplete = (candidatsArray) => {
    setImportedCandidats(candidatsArray);
    form.setValue(
      "candidats",
      candidatsArray.map((c) => ({
        CNE: c.CNE,
        CIN: c.CIN,
        nom: c.nom,
        prenom: c.prenom,
        email: c.email,
      }))
    );
    setShowImportCSV(false);
  };

  // Initialize selected classrooms when editing a concours
  useEffect(() => {
    if (isEditMode && concour?.locaux) {
      // Extract the local IDs from the concour.locaux
      const localIds = [];
      const localObjects = [];
      
      if (Array.isArray(concour.locaux)) {
        // If it's an array of strings (IDs)
        if (concour.locaux.length > 0 && (typeof concour.locaux[0] === 'string' || typeof concour.locaux[0] === 'number')) {
          localIds.push(...concour.locaux.map(String));
        }
        // If it's an array of objects
        else if (concour.locaux.length > 0 && typeof concour.locaux[0] === 'object') {
          concour.locaux.forEach(local => {
            const id = local.id?.toString() || local.nom_local || local.nom_du_local;
            if (id) {
              localIds.push(id);
              localObjects.push(local);
            }
          });
        }
      } else if (typeof concour.locaux === 'string') {
        try {
          const parsed = JSON.parse(concour.locaux);
          if (Array.isArray(parsed)) {
            parsed.forEach(local => {
              if (typeof local === 'object') {
                const id = local.id?.toString() || local.nom_local || local.nom_du_local;
                if (id) {
                  localIds.push(id);
                  localObjects.push(local);
                }
              } else if (typeof local === 'string' || typeof local === 'number') {
                localIds.push(String(local));
              }
            });
          }
        } catch (e) {
          // If it's a comma-separated string
          const ids = concour.locaux.split(',').map(s => s.trim()).filter(Boolean);
          localIds.push(...ids);
        }
      }

      // Set the form value with unique IDs
      if (localIds.length > 0) {
        const uniqueLocalIds = [...new Set(localIds)];
        form.setValue('locaux', uniqueLocalIds);
        
        // If we have local objects, try to determine the classroom type and department
        if (localObjects.length > 0) {
          const firstLocal = localObjects[0];
          
          // Check if it's an amphi or classroom based on capacity or name
          const isAmphi = firstLocal.capacite > 100 || 
                         (firstLocal.nom_du_local && firstLocal.nom_du_local.toLowerCase().includes('amphi'));
          
          setSelectedClassroomType(isAmphi ? 'amphi' : 'classroom');
          
          // If it's a classroom, set the department
          if (!isAmphi && firstLocal.departement) {
            setSelectedClassroomDepartment(firstLocal.departement);
          }
        }
      }
    }
  }, [isEditMode, concour, form]);

  // Keep form candidats in sync with selectedCandidats
  useEffect(() => {
    if (
      selectedCandidats.length > 0 &&
      typeof selectedCandidats[0] === "object" &&
      !form.getValues("candidats").length
    ) {
      form.setValue(
        "candidats",
        selectedCandidats.map((c) => ({
          CNE: c.CNE,
          CIN: c.CIN,
          nom: c.nom,
          prenom: c.prenom,
          email: c.email,
        }))
      );
    }
  }, [selectedCandidats, form]);

  // Fonction pour vérifier la disponibilité des salles
  const checkSalleAvailability = async (date, heureDebut, heureFin, locaux) => {
    if (!date || !heureDebut || !heureFin || !locaux || locaux.length === 0) {
      return { available: true, conflicts: [] };
    }

    try {
      const response = await fetch(
        "http://localhost:8000/api/concours/check-salle-availability",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date_concours: format(date, "yyyy-MM-dd"),
            heure_debut: heureDebut,
            heure_fin: heureFin,
            locaux: locaux,
            exclude_concours_id: concour?.id || null,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de disponibilité:", error);
    }

    return { available: true, conflicts: [] };
  };

  // Vérifier la disponibilité quand les champs changent
  useEffect(() => {
    const date = form.getValues("date_concours");
    const heureDebut = form.getValues("heure_debut");
    const heureFin = form.getValues("heure_fin");
    const locaux = form.getValues("locaux");

    if (date && heureDebut && heureFin && locaux && locaux.length > 0) {
      const timeoutId = setTimeout(async () => {
        const availability = await checkSalleAvailability(
          date,
          heureDebut,
          heureFin,
          locaux
        );
        if (!availability.available) {
          toast({
            title: "Conflit de salles détecté",
            description: `Certaines salles ne sont pas disponibles à cette date/heure.`,
            variant: "destructive",
          });
        }
      }, 1000); // Délai de 1 seconde pour éviter trop de requêtes

      return () => clearTimeout(timeoutId);
    }
  }, [
    form.watch("date_concours"),
    form.watch("heure_debut"),
    form.watch("heure_fin"),
    form.watch("locaux"),
  ]);

  // Load departments
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoadingDepartments(true);
        const response = await fetch("http://localhost:8000/api/departements");
        const data = await response.json();
        if (data.status === "success") {
          const uniqueDepartments = [
            ...new Set(data.data.map((dept) => dept.nom_departement)),
          ];
          setDepartments(uniqueDepartments);
        }
      } catch (error) {
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

  // Load amphitheaters
  useEffect(() => {
    const fetchAmphitheaters = async () => {
      try {
        setLoadingAmphitheaters(true);

        // Always fetch all amphitheaters first
        const response = await fetch(
          "http://localhost:8000/api/classrooms/amphitheaters"
        );
        const data = await response.json();

        if (data.status !== "success") {
          throw new Error("Failed to fetch amphitheaters");
        }

        // If in edit mode and we have all required time info, check availability
        if (
          isEditMode &&
          form.getValues("date_concours") &&
          form.getValues("heure_debut") &&
          form.getValues("heure_fin")
        ) {
          try {
            const formattedDate = format(
              form.getValues("date_concours"),
              "yyyy-MM-dd"
            );
            const startTime = form.getValues("heure_debut").split(':').slice(0, 2).join(':'); // Ensure HH:MM format
            const endTime = form.getValues("heure_fin").split(':').slice(0, 2).join(':');

            // Fetch scheduled amphitheaters with proper error handling
            const scheduledResponse = await fetch(
              `http://localhost:8000/api/classrooms/availability?date=${formattedDate}&start_time=${startTime}&end_time=${endTime}&type=amphi`
            );
            
            if (scheduledResponse.ok) {
              const scheduledData = await scheduledResponse.json();
              
              if (scheduledData.status === "success") {
                const scheduledAmphiIds = scheduledData.data.scheduled_classrooms?.map((c) => c.id) || [];
                
                // Mark amphitheaters as unavailable if they are scheduled
                const amphitheatersWithAvailability = data.data.map((amphi) => ({
                  ...amphi,
                  isUnavailable: scheduledAmphiIds.includes(amphi.id),
                }));
                setAmphitheaters(amphitheatersWithAvailability);
                return;
              }
            }
            // If we get here, there was an issue with the availability check
            console.warn("Could not check amphitheater availability, showing all as available");
            setAmphitheaters(data.data);
            
          } catch (error) {
            console.error("Error checking amphitheater availability:", error);
            // If there's an error with availability check, still show all amphitheaters
            setAmphitheaters(data.data);
          }
        } else {
          // For creation mode or missing time info, just show all amphitheaters
          setAmphitheaters(data.data);
        }
      } catch (error) {
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
  }, [
    toast,
    isEditMode,
    form.watch("date_concours"),
    form.watch("heure_debut"),
    form.watch("heure_fin"),
  ]);

  // Load available classrooms based on date/time/department
  useEffect(() => {
    const fetchAvailableClassrooms = async () => {
      if (
        !selectedClassroomDepartment ||
        !form.getValues("date_concours") ||
        !form.getValues("heure_debut") ||
        !form.getValues("heure_fin")
      ) {
        setAvailableClassrooms([]);
        return;
      }

      try {
        setLoadingClassrooms(true);

        // Format date as YYYY-MM-DD
        const formattedDate = format(
          form.getValues("date_concours"),
          "yyyy-MM-dd"
        );
        const startTime = form.getValues("heure_debut");
        const endTime = form.getValues("heure_fin");

        if (isEditMode) {
          // Pour la modification : afficher tous les locaux du département, mais exclure ceux indisponibles
          // First API call to get scheduled classrooms
          const scheduledResponse = await fetch(
            `http://localhost:8000/api/classrooms/by-datetime?date_examen=${formattedDate}&heure_debut=${startTime}&heure_fin=${endTime}&departement=${selectedClassroomDepartment}`
          );
          const scheduledData = await scheduledResponse.json();

          if (scheduledData.status === "success") {
            const scheduledClassroomIds =
              scheduledData.data.scheduled_classrooms.map((c) => c.id);

            // Second API call to get all classrooms of the department
            const allClassroomsResponse = await fetch(
              `http://localhost:8000/api/classrooms/by-departement?departement=${selectedClassroomDepartment}`
            );
            const allClassroomsData = await allClassroomsResponse.json();

            if (allClassroomsData.status === "success") {
              // Marquer les locaux comme indisponibles s'ils sont dans la liste des salles programmées
              const classroomsWithAvailability = allClassroomsData.data.map(
                (classroom) => ({
                  ...classroom,
                  isUnavailable: scheduledClassroomIds.includes(classroom.id),
                })
              );
              setAvailableClassrooms(classroomsWithAvailability);
            }
          }
        } else {
          // Pour la création : logique existante (afficher seulement les locaux disponibles)
          const scheduledResponse = await fetch(
            `http://localhost:8000/api/classrooms/by-datetime?date_examen=${formattedDate}&heure_debut=${startTime}&heure_fin=${endTime}&departement=${selectedClassroomDepartment}`
          );
          const scheduledData = await scheduledResponse.json();

          if (scheduledData.status === "success") {
            const scheduledClassroomIds =
              scheduledData.data.scheduled_classrooms.map((c) => c.id);

            // Second API call to get available classrooms
            const availableResponse = await fetch(
              "http://localhost:8000/api/classrooms/not-in-list",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  classroom_ids: scheduledClassroomIds,
                }),
              }
            );
            const availableData = await availableResponse.json();

            if (availableData.status === "success") {
              // Filter classrooms by selected department
              const departmentClassrooms = availableData.data.filter(
                (classroom) =>
                  classroom.departement === selectedClassroomDepartment
              );
              setAvailableClassrooms(departmentClassrooms);
            }
          }
        }
      } catch (error) {
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
    form.watch("date_concours"),
    form.watch("heure_debut"),
    form.watch("heure_fin"),
    isEditMode,
    toast,
  ]);

  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        setLoadingSupervisors(true);
        const superviseursResponse = await fetch(
          `http://localhost:8000/api/superviseurs`
        );
        const superviseursData = await superviseursResponse.json();
        setSupervisorsByDepartment(
          Array.isArray(superviseursData) ? superviseursData : []
        );

        if (selectedDepartment) {
          setLoadingProfessors(true);
          const professeursResponse = await fetch(
            `http://localhost:8000/api/professeurs/by-departement?departement=${selectedDepartment}`
          );
          const professeursData = await professeursResponse.json();
          setProfessorsByDepartment(
            Array.isArray(professeursData) ? professeursData : []
          );
        } else {
          setProfessorsByDepartment([]);
        }
      } catch (error) {
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

  const handleFormSubmit = async (values) => {
    // Validation stricte pour la modification
    if (isEditMode) {
      if (!values.locaux || values.locaux.length === 0) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner au moins un local.",
          variant: "destructive",
        });
        return;
      }
      if (!values.professeurs || values.professeurs.length === 0) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner au moins un professeur.",
          variant: "destructive",
        });
        return;
      }
      if (!values.superviseurs || values.superviseurs.length === 0) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner au moins un superviseur.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const submissionData = { ...values };

      // Assurez-vous que les locaux sont bien un JSON stringifié d'objets avec les bons champs
      if (Array.isArray(submissionData.locaux)) {
        const locauxDetails = submissionData.locaux
          .map((localId) => {
            const localObj = allLocaux.find(
              (l) => l.id?.toString() === localId.toString()
            );
            if (localObj) {
              return {
                nom_local: localObj.nom_local || localObj.nom_du_local,
                capacity: localObj.capacity || localObj.capacite || 0,
              };
            }
            return null;
          })
          .filter(Boolean);
        submissionData.locaux = JSON.stringify(locauxDetails);
      }

      await onSubmit(submissionData);
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Erreur de soumission",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  const onInvalid = (errors) => {
    console.error("Form errors", errors);
    // Affiche un toast pour chaque champ en erreur
    if (errors.professeurs) {
      toast({
        title: "Erreur de validation",
        description: "Au moins un professeur est requis.",
        variant: "destructive",
      });
    }
    if (errors.superviseurs) {
      toast({
        title: "Erreur de validation",
        description: "Au moins un superviseur est requis.",
        variant: "destructive",
      });
    }
    // Vous pouvez ajouter d'autres toasts pour d'autres champs si nécessaire
  };

  // Debug: show form errors
  console.log("Form errors:", JSON.stringify(form.formState.errors, null, 2));

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit, onInvalid)}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Titre */}
          <FormField
            control={form.control}
            name="titre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titre</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Titre du concours" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Type d'épreuve */}
          <FormField
            control={form.control}
            name="type_epreuve"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type d'épreuve</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {typeEpreuves.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Description du concours" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date, Heure début, Heure fin */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="date_concours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date du concours</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal bg-white"
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
                  <PopoverContent align="start" className="w-auto p-0">
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
          <FormField
            control={form.control}
            name="heure_debut"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heure de début</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="heure_fin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heure de fin</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Locaux/Classrooms */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
          <FormField
            control={form.control}
            name="locaux"
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
                      selectedClassroomType === "amphi" ? "default" : "outline"
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
                          className={`flex items-center justify-between gap-2 p-2 rounded-md hover:bg-slate-100 ${
                            amphi.isUnavailable ? "opacity-60" : ""
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <Checkbox
                              id={`amphi-${amphi.id}`}
                              checked={field.value.includes(
                                amphi.id.toString()
                              )}
                              disabled={amphi.isUnavailable}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([
                                    ...field.value,
                                    amphi.id.toString(),
                                  ]);
                                } else {
                                  field.onChange(
                                    field.value.filter(
                                      (id) => id !== amphi.id.toString()
                                    )
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={`amphi-${amphi.id}`}
                              className={`text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer ${
                                amphi.isUnavailable ? "text-slate-500" : ""
                              }`}
                            >
                              {amphi.nom_du_local} - Capacité: {amphi.capacite}
                            </label>
                          </div>
                          <span
                            className={`font-medium text-sm px-2 py-1 rounded-full ${
                              amphi.isUnavailable
                                ? "text-red-600 bg-red-50"
                                : "text-green-600 bg-green-50"
                            }`}
                          >
                            {amphi.isUnavailable
                              ? "Indisponible"
                              : "Disponible"}
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
                    {/* Classrooms List */}
                    {selectedClassroomDepartment && (
                      <div className="mt-2 space-y-2 max-h-60 overflow-y-auto pr-2 py-2">
                        {loadingClassrooms ? (
                          <div className="text-center text-slate-500 py-2">
                            Chargement des salles disponibles...
                          </div>
                        ) : availableClassrooms.length > 0 ? (
                          availableClassrooms.map((classroom) => (
                            <div
                              key={classroom.id}
                              className={`flex items-center justify-between gap-2 p-2 rounded-md hover:bg-slate-100 ${
                                classroom.isUnavailable ? "opacity-60" : ""
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <Checkbox
                                  id={`classroom-${classroom.id}`}
                                  checked={field.value.includes(
                                    classroom.id.toString()
                                  )}
                                  disabled={classroom.isUnavailable}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([
                                        ...field.value,
                                        classroom.id.toString(),
                                      ]);
                                    } else {
                                      field.onChange(
                                        field.value.filter(
                                          (id) => id !== classroom.id.toString()
                                        )
                                      );
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`classroom-${classroom.id}`}
                                  className={`text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer ${
                                    classroom.isUnavailable
                                      ? "text-slate-500"
                                      : ""
                                  }`}
                                >
                                  {classroom.nom_du_local} - Capacité:{" "}
                                  {classroom.capacite}
                                </label>
                              </div>
                              <span
                                className={`font-medium text-sm px-2 py-1 rounded-full ${
                                  classroom.isUnavailable
                                    ? "text-red-600 bg-red-50"
                                    : "text-green-600 bg-green-50"
                                }`}
                              >
                                {classroom.isUnavailable
                                  ? "Indisponible"
                                  : "Disponible"}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-slate-500 py-2">
                            Aucune salle disponible pour ce département à cette
                            date et heure
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
                        const selectedItem =
                          amphitheaters.find(
                            (a) => a.id.toString() === selectedId
                          ) ||
                          availableClassrooms.find(
                            (c) => c.id.toString() === selectedId
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
                                  field.value.filter((id) => id !== selectedId)
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

        {/* Candidats (CSV Import) */}
        <FormField
          control={form.control}
          name="candidats"
          render={() => (
            <FormItem>
              <FormLabel className="flex items-center gap-1 text-lg font-medium mb-4">
                <Users className="h-5 w-5" />
                Candidats
              </FormLabel>
              <Button
                variant="outline"
                type="button"
                className="w-full bg-white flex items-center justify-center gap-2"
                onClick={() => setShowImportCSV(true)}
              >
                <Upload className="h-4 w-4" />
                {selectedCandidats.length === 0
                  ? "Importer la liste de candidats (CSV)"
                  : `${selectedCandidats.length} Candidats importés`}
              </Button>
              <Dialog open={showImportCSV} onOpenChange={setShowImportCSV}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Importer la liste de candidats</DialogTitle>
                  </DialogHeader>
                  <ImportCSVforConcours
                    onImportComplete={handleImportComplete}
                  />
                </DialogContent>
              </Dialog>
              {/* Show imported candidats count */}
              {importedCandidats.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  {importedCandidats.length} candidat(e)(s) sélectionné(s) d'après le fichier
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Professeurs */}
        <FormField
          control={form.control}
          name="professeurs"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <FormLabel className="flex items-center gap-1 text-lg font-medium">
                <Users className="h-5 w-5" />
                Les professeurs
              </FormLabel>
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
                                  professor.id.toString()
                                )}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([
                                      ...field.value,
                                      professor.id.toString(),
                                    ]);
                                  } else {
                                    field.onChange(
                                      field.value.filter(
                                        (id) => id !== professor.id.toString()
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

        {/* Superviseurs */}
        <FormField
          control={form.control}
          name="superviseurs"
          render={({ field }) => (
            <FormItem className="space-y-4 mt-6">
              <FormLabel className="flex items-center gap-1 text-lg font-medium">
                <Users className="h-5 w-5" />
                Les superviseurs
              </FormLabel>
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
                                  supervisor.id.toString()
                                )}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([
                                      ...field.value,
                                      supervisor.id.toString(),
                                    ]);
                                  } else {
                                    field.onChange(
                                      field.value.filter(
                                        (id) => id !== supervisor.id.toString()
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
            </FormItem>
          )}
        />

        {/* Selected Professors and Supervisors Section */}
        {(form.getValues("professeurs")?.length > 0 ||
          form.getValues("superviseurs")?.length > 0) && (
          <div className="mt-6 pt-4 border-t border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-3">
              Personnel sélectionné
            </h4>
            <div className="space-y-2">
              {/* Selected Professors */}
              {form.getValues("professeurs")?.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-slate-600 mb-2">
                    Professeurs ({form.getValues("professeurs").length})
                  </h5>
                  {form.getValues("professeurs").map((professorId) => {
                    const professor = professorsByDepartment.find(
                      (p) => p.id.toString() === professorId
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
                              form.getValues("professeurs");
                            form.setValue(
                              "professeurs",
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
              {form.getValues("superviseurs")?.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-slate-600 mb-2">
                    Superviseurs ({form.getValues("superviseurs").length})
                  </h5>
                  {form.getValues("superviseurs").map((supervisorId) => {
                    const supervisor = supervisorsByDepartment.find(
                      (s) => s.id.toString() === supervisorId
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
                              form.getValues("superviseurs");
                            form.setValue(
                              "superviseurs",
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

        {/* Footer */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" className="bg-blue-600 text-white">
            {concour ? "Mettre à jour le concours" : "Créer le concours"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ConcoursForm;
