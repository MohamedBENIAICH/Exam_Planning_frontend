import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExamInfoForm from "./ExamInfoForm";
import ExamForm from "./ExamForm"; // Formulaire des participants
import { AlertCircle, Check, ChevronRight, Loader2 } from "lucide-react";

// Importation factice pour simuler la récupération des données dynamiques
import { fetchClassrooms, fetchExams } from "@/lib/api";

const steps = [
  { id: "details", label: "Détails de l'examen" },
  { id: "participants", label: "Participants" },
  { id: "review", label: "Révision et confirmation" },
];

const ExamCreationWizard = () => {
  const { toast } = useToast();
  const [activeStep, setActiveStep] = useState("details");
  const [examInfo, setExamInfo] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les données des salles au montage du composant
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const classroomsData = await fetchClassrooms();
        setClassrooms(classroomsData);
        setLoading(false);
      } catch (err) {
        console.error("❌ Erreur lors du chargement des données :", err);
        setError("Impossible de charger les données des salles");
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ✅ Gestion de la soumission du formulaire des informations d'examen
  const handleExamInfoSubmit = (values) => {
    setExamInfo(values);
    setActiveStep("participants");
    toast({
      title: "Informations enregistrées",
      description: "Les détails de l'examen ont été sauvegardés.",
    });
  };

  // ✅ Gestion de la soumission du formulaire complet de l'examen
  const handleExamFormSubmit = (values) => {
    const completeExam = {
      ...examInfo,
      ...values,
      id: `exam-${Date.now()}`,
    };

    console.log("✅ Examen complet à soumettre :", completeExam);

    // ✅ Simuler une soumission réussie
    toast({
      title: "Examen créé avec succès",
      description: `L'examen "${examInfo.title}" a été programmé.`,
    });

    // Réinitialiser ou rediriger (ex: `redirect("/examens")`)
    setExamInfo(null);
    setActiveStep("details");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Chargement des données...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center border rounded-lg bg-red-50">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <h3 className="font-medium">Une erreur est survenue</h3>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Tabs value={activeStep}>
        <TabsList className="flex justify-between bg-gray-100 p-2 rounded-lg">
          {steps.map((step) => (
            <TabsTrigger
              key={step.id}
              value={step.id}
              className={`${
                activeStep === step.id ? "bg-primary text-white" : ""
              } px-4 py-2 rounded-md`}
            >
              {step.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="details">
          <ExamInfoForm
            classrooms={classrooms}
            onSubmit={handleExamInfoSubmit}
            onCancel={() => setActiveStep("details")}
          />
        </TabsContent>

        <TabsContent value="participants">
          {examInfo ? (
            <ExamForm
              examData={examInfo}
              onSubmit={handleExamFormSubmit}
              onCancel={() => setActiveStep("details")}
            />
          ) : (
            <div className="p-6 text-center border rounded-lg bg-yellow-50">
              <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-medium">
                Aucune information d'examen trouvée
              </h3>
              <p className="text-muted-foreground">
                Veuillez compléter les détails de l'examen avant de sélectionner
                des participants.
              </p>
              <Button onClick={() => setActiveStep("details")} className="mt-4">
                Retour
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="review">
          <div className="p-6 border rounded-lg bg-green-50">
            <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-medium text-green-700">Examen Prêt</h3>
            <p className="text-green-600">
              L'examen "{examInfo?.title}" est prêt à être soumis.
            </p>
            <div className="flex justify-center mt-4 gap-2">
              <Button
                variant="outline"
                onClick={() => setActiveStep("participants")}
              >
                Retour
              </Button>
              <Button
                onClick={handleExamFormSubmit}
                className="bg-green-600 text-white"
              >
                Confirmer et créer l'examen
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExamCreationWizard;
