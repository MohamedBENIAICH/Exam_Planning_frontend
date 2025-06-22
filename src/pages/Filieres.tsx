import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import FilieresForm from "@/components/Filieres/FilieresForm.jsx";
import FilieresUpdateForm from "@/components/Filieres/FilieresUpdateForm.jsx";

const Filieres = () => {
  const { toast } = useToast();

  const [filieres, setFilieres] = useState<
    Array<{
      filiere_id: number;
      filiere_name: string;
      formation_name: string;
      departement_name: string;
    }>
  >([]);
  const [loadingFilieres, setLoadingFilieres] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFiliere, setEditFiliere] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  useEffect(() => {
    const fetchFilieres = async () => {
      setLoadingFilieres(true);
      try {
        const response = await fetch(
          "http://localhost:8000/api/filieres/filieres-with-details"
        );
        const data = await response.json();

        if (Array.isArray(data)) {
          setFilieres(data);
        } else if (data.data && Array.isArray(data.data)) {
          setFilieres(data.data);
        } else {
          setFilieres([]);
        }
      } catch {
        setFilieres([]);
      } finally {
        setLoadingFilieres(false);
      }
    };

    fetchFilieres();
  }, []);

  const totalPages = Math.ceil(filieres.length / itemsPerPage);
  const paginatedFilieres = filieres.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async (filiere_id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette filière ?"))
      return;
    setDeleteLoading(filiere_id);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/filieres/${filiere_id}`,
        { method: "DELETE" }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Erreur lors de la suppression de la filière"
        );
      }

      setFilieres((prev) => prev.filter((f) => f.filiere_id !== filiere_id));
      toast({
        title: "Suppression réussie",
        description: data.message || "La filière a bien été supprimée.",
        variant: "default",
        className: "bg-red-50 border-red-200 text-red-800",
        duration: 4000,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEdit = async (filiere) => {
    setEditFiliere({
      ...filiere,
      filiere_id: filiere.filiere_id,
      filiere_intitule: filiere.filiere_name,
      id_formation: filiere.id_formation ? String(filiere.id_formation) : "",
      id_departement: filiere.id_departement
        ? String(filiere.id_departement)
        : "",
    });
    setEditDialogOpen(true);
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          title="Filières"
          subtitle="Gestion des filières"
          actions={
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une filière
                </Button>
              </DialogTrigger>
              <DialogContent
                className="p-0"
                style={{
                  width: 600,
                  maxWidth: "90vw",
                  minHeight: 350,
                  padding: "1.5%",
                }}
              >
                <div
                  className="w-full"
                  style={{ maxWidth: 600, margin: "0 auto", minHeight: 200 }}
                >
                  <DialogHeader className="mt-8">
                    <DialogTitle>Ajouter une filière</DialogTitle>
                  </DialogHeader>
                  <FilieresForm
                    onSubmit={(data) => {
                      setIsDialogOpen(false);
                      setFilieres((prev) => [...prev, data]);
                    }}
                    onCancel={() => setIsDialogOpen(false)}
                  />
                </div>
              </DialogContent>
            </Dialog>
          }
        />

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent
            className="p-0"
            style={{
              width: 600,
              maxWidth: "90vw",
              minHeight: 350,
              padding: "1.5%",
            }}
          >
            <div
              className="w-full"
              style={{ maxWidth: 600, margin: "0 auto", minHeight: 200 }}
            >
              <DialogHeader className="mt-8">
                <DialogTitle>Modifier une filière</DialogTitle>
              </DialogHeader>
              <FilieresUpdateForm
                initialValues={editFiliere}
                onSubmit={(data) => {
                  setEditDialogOpen(false);
                  setFilieres((prev) =>
                    prev.map((f) =>
                      f.filiere_id === data.filiere_id
                        ? {
                            ...f,
                            filiere_name: data.filiere_intitule,
                            formation_name:
                              data.formation_name || f.formation_name,
                            departement_name:
                              data.departement_name || f.departement_name,
                          }
                        : f
                    )
                  );
                }}
                onCancel={() => setEditDialogOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

        <div className="mt-8 bg-white rounded shadow p-6 mx-6">
          {loadingFilieres ? (
            <div>Chargement...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filière</TableHead>
                    <TableHead>Formation</TableHead>
                    <TableHead>Département</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedFilieres.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        Aucune filière trouvée.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedFilieres.map((filiere) => (
                      <TableRow key={filiere.filiere_id}>
                        <TableCell>{filiere.filiere_name}</TableCell>
                        <TableCell>{filiere.formation_name}</TableCell>
                        <TableCell>{filiere.departement_name} </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Modifier"
                              onClick={() => handleEdit(filiere)}
                            >
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Supprimer"
                              onClick={() => handleDelete(filiere.filiere_id)}
                              disabled={deleteLoading === filiere.filiere_id}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </Button>
                  <span>
                    Page {currentPage} sur {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Filieres;
