import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Plus,
  Calendar as CalendarIcon,
  Users,
  Building,
  Info,
  ClockIcon,
  ChevronDown,
  ChevronUp,
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
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import ConcoursForm from "@/components/Concours/ConcoursForm";
import { useToast } from "@/components/ui/use-toast";

const ConcourScheduling = () => {
  const [concours, setConcours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingConcour, setEditingConcour] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedConcour, setSelectedConcour] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [concourToDelete, setConcourToDelete] = useState(null);
  const { toast } = useToast();

  // Dummy data for availableLocaux, Professeurs, Superviseurs, Candidats
  // Replace with your API calls if needed
  const availableLocaux = [
    { id: "1", nom_du_local: "Salle A" },
    { id: "2", nom_du_local: "Salle B" },
  ];
  const availableProfesseurs = [
    { id: "1", nom: "Dupont", prenom: "Marie" },
    { id: "2", nom: "Martin", prenom: "Jean" },
  ];
  const availableSuperviseurs = [
    { id: "1", nom: "Durand", prenom: "Paul" },
    { id: "2", nom: "Petit", prenom: "Lucie" },
  ];
  const availableCandidats = [
    { id: "1", nom: "Ben Ali", prenom: "Sara", email: "sara@exemple.com" },
    {
      id: "2",
      nom: "El Amrani",
      prenom: "Youssef",
      email: "youssef@exemple.com",
    },
  ];

  useEffect(() => {
    const fetchConcours = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/concours/latest"
        );
        const data = await response.json();
        if (Array.isArray(data)) {
          setConcours(data.slice(0, 5));
        } else {
          setError("Erreur lors du chargement des concours");
        }
      } catch (err) {
        setError("Erreur lors du chargement des concours");
      } finally {
        setLoading(false);
      }
    };
    fetchConcours();
  }, []);

  const handleAddEditConcour = async (concour) => {
    try {
      setLoading(true);
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
        toast({ title: "Succès", description: "Concours modifié !" });
        setConcours((prev) =>
          prev.map((c) =>
            c.id === editingConcour.id ? { ...concour, id: c.id } : c
          )
        );
      } else {
        // Create concours
        const response = await fetch("http://127.0.0.1:8000/api/concours", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(concour),
        });
        if (!response.ok) throw new Error("Erreur lors de l'ajout");
        const data = await response.json();
        toast({ title: "Succès", description: "Concours ajouté !" });
        setConcours((prev) =>
          [
            { ...concour, id: data.data?.id || Date.now().toString() },
            ...prev,
          ].slice(0, 5)
        );
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'enregistrement",
        variant: "destructive",
      });
    } finally {
      setEditingConcour(null);
      setIsDialogOpen(false);
      setLoading(false);
    }
  };

  const handleEditConcour = (concour) => {
    setEditingConcour(concour);
    setIsDialogOpen(true);
  };

  const handleDeleteConcour = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`http://127.0.0.1:8000/api/concours/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Erreur lors de la suppression");
      setConcours((prev) => prev.filter((c) => c.id !== id));
      toast({
        title: "Supprimé",
        description: "Concours supprimé",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setConcourToDelete(null);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          title="Planification des concours"
          subtitle="Planifier et gérer les concours"
          actions={
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) setEditingConcour(null);
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Planifier un concours
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingConcour
                      ? "Modifier le concours"
                      : "Planifier un nouveau concours"}
                  </DialogTitle>
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
          }
        />
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          <h1 className="text-2xl font-bold mb-6">Les 5 derniers concours</h1>
          <Tabs defaultValue="grid">
            <TabsContent value="grid" className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <p>Chargement des concours...</p>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64 text-red-500">
                  <p>{error}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {concours.map((concour) => (
                    <Card key={concour.id}>
                      <CardHeader>
                        <div className="flex justify-between">
                          <div>
                            <CardTitle>{concour.titre}</CardTitle>
                            <CardDescription>
                              {concour.description}
                            </CardDescription>
                          </div>
                          <Badge>
                            {format(
                              new Date(concour.date_concours),
                              "yyyy-MM-dd"
                            )}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              Heure
                            </p>
                            <p className="text-sm">
                              {concour.heure_debut} - {concour.heure_fin}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium flex items-center gap-1">
                              <Building className="h-4 w-4" />
                              Locaux
                            </p>
                            <p className="text-sm">
                              {Array.isArray(concour.locaux)
                                ? concour.locaux.join(", ")
                                : concour.locaux}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              Superviseurs
                            </p>
                            <p className="text-sm">
                              {Array.isArray(concour.superviseurs)
                                ? concour.superviseurs.join(", ")
                                : concour.superviseurs || "Aucun"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium flex items-center gap-1">
                              <UserIcon className="h-4 w-4 text-muted-foreground" />
                              Professeurs
                            </p>
                            <p className="text-sm">
                              {Array.isArray(concour.professeurs)
                                ? concour.professeurs.join(", ")
                                : concour.professeurs || "Aucun"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Candidats
                          </p>
                          <p className="text-sm">
                            {Array.isArray(concour.candidats)
                              ? concour.candidats.length
                              : 0}{" "}
                            au total
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium flex items-center gap-1">
                            <Info className="h-4 w-4" />
                            Type d'épreuve
                          </p>
                          <p className="text-sm">{concour.type_epreuve}</p>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditConcour(concour)}
                        >
                          Modifier
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setConcourToDelete(concour);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          Supprimer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedConcour(concour)}
                        >
                          <Info className="h-4 w-4 mr-2" />
                          Détail
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Details Modal */}
      <Dialog
        open={!!selectedConcour}
        onOpenChange={(open) => {
          if (!open) setSelectedConcour(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails du Concours</DialogTitle>
          </DialogHeader>
          {selectedConcour && (
            <div className="space-y-4">
              <div>
                <strong>Description:</strong> {selectedConcour.description}
              </div>
              <div>
                <strong>Date:</strong>{" "}
                {format(new Date(selectedConcour.date_concours), "PPP")}
              </div>
              <div>
                <strong>Heure:</strong> {selectedConcour.heure_debut} -{" "}
                {selectedConcour.heure_fin}
              </div>
              <div>
                <strong>Locaux:</strong>{" "}
                {Array.isArray(selectedConcour.locaux)
                  ? selectedConcour.locaux.join(", ")
                  : selectedConcour.locaux}
              </div>
              <div>
                <strong>Type d'épreuve:</strong> {selectedConcour.type_epreuve}
              </div>
              <div>
                <strong>Superviseurs:</strong>{" "}
                <ul className="list-disc ml-6">
                  {Array.isArray(selectedConcour.superviseurs) &&
                  selectedConcour.superviseurs.length > 0 ? (
                    selectedConcour.superviseurs.map((s) => (
                      <li key={s.id}>
                        {s.prenom} {s.nom} {s.poste ? `(${s.poste})` : ""}
                      </li>
                    ))
                  ) : (
                    <li>Aucun</li>
                  )}
                </ul>
              </div>
              <div>
                <strong>Professeurs:</strong>{" "}
                <ul className="list-disc ml-6">
                  {Array.isArray(selectedConcour.professeurs) &&
                  selectedConcour.professeurs.length > 0 ? (
                    selectedConcour.professeurs.map((p) => (
                      <li key={p.id}>
                        {p.prenom} {p.nom}{" "}
                        {p.departement ? `(${p.departement})` : ""}
                      </li>
                    ))
                  ) : (
                    <li>Aucun</li>
                  )}
                </ul>
              </div>
              <div>
                <strong>Candidats:</strong>
                <ul className="list-disc ml-6">
                  {Array.isArray(selectedConcour.candidats) &&
                  selectedConcour.candidats.length > 0 ? (
                    selectedConcour.candidats.map((c) =>
                      typeof c === "string" ? (
                        <li key={c}>{c}</li>
                      ) : (
                        <li key={c.id}>
                          {c.prenom} {c.nom} ({c.email})
                        </li>
                      )
                    )
                  ) : (
                    <li>Aucun candidat</li>
                  )}
                </ul>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedConcour(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le concours{" "}
              {concourToDelete?.titre} ? Cette action ne peut pas être annulée.
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
              onClick={() =>
                concourToDelete && handleDeleteConcour(concourToDelete.id)
              }
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

export default ConcourScheduling;
