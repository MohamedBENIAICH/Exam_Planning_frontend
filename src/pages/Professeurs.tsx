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
import { useNavigate } from "react-router-dom";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProfesseursForm from "@/components/Professeurs/ProfesseursForm";
import { useToast } from "@/hooks/use-toast"; // Ajoutez ceci si vous avez un hook toast
import api from "@/services/api";

const Professeurs = () => {
  const navigate = useNavigate();
  const { toast } = useToast(); // Ajoutez ceci

  const [professeurs, setProfesseurs] = useState<
    Array<{
      id: number;
      email: string;
      nom: string;
      prenom: string;
      departement: string;
    }>
  >([]);
  const [loadingProfesseurs, setLoadingProfesseurs] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editProfesseur, setEditProfesseur] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Toast for feedback (optional, if you use a toast system)
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  useEffect(() => {
    const fetchProfesseurs = async () => {
      setLoadingProfesseurs(true);
      try {
        const response = await api.get("/professeurs");
        const data = response.data;
        if (Array.isArray(data)) {
          setProfesseurs(data);
        } else if (data.data && Array.isArray(data.data)) {
          setProfesseurs(data.data);
        } else {
          setProfesseurs([]);
        }
      } catch {
        setProfesseurs([]);
      } finally {
        setLoadingProfesseurs(false);
      }
    };
    fetchProfesseurs();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(professeurs.length / itemsPerPage);
  const paginatedProfesseurs = professeurs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Delete handler
  const handleDelete = async (id: number) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce professeur ?"))
      return;
    setDeleteLoading(id);
    try {
      await api.delete(`/professeurs/${id}`);
      setProfesseurs((prev) => prev.filter((prof) => prof.id !== id));
      toast({
        title: "Suppression réussie",
        description: "Le professeur a bien été supprimé.",
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

  // Edit handler: open dialog with selected professeur data
  const handleEdit = (prof) => {
    setEditProfesseur(prof);
    setEditDialogOpen(true);
  };

  // Update handler: send PUT request to API
  const handleUpdate = async (values) => {
    if (!editProfesseur) return;
    try {
      await api.put(`/professeurs/${editProfesseur.id}`, values);
      // Update local state
      setProfesseurs((prev) =>
        prev.map((prof) =>
          prof.id === editProfesseur.id ? { ...prof, ...values } : prof
        )
      );
      toast({
        title: "Modification réussie",
        description: "Le professeur a bien été modifié.",
        variant: "default",
        className: "bg-blue-50 border-blue-200 text-blue-800",
        duration: 4000,
      });
      setEditDialogOpen(false);
      setEditProfesseur(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la modification",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          title="Professeurs"
          subtitle="Gestion des professeurs et superviseurs"
          actions={
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un professeur
                </Button>
              </DialogTrigger>
              <DialogContent
                className="p-0"
                style={{
                  width: 600,
                  maxWidth: "90vw",
                  minHeight: 550,
                  padding: "1.5%",
                }}
              >
                <div
                  className="w-full"
                  style={{ maxWidth: 600, margin: "0 auto", minHeight: 500 }}
                >
                  <DialogHeader className="mt-8">
                    <DialogTitle>Ajouter un professeur</DialogTitle>
                  </DialogHeader>
                  <ProfesseursForm
                    onSubmit={() => {
                      setIsDialogOpen(false);
                    }}
                    onCancel={() => setIsDialogOpen(false)}
                    formHeight={500}
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
              minHeight: 550,
              padding: "1.5%",
            }}
          >
            <div
              className="w-full"
              style={{ maxWidth: 600, margin: "0 auto", minHeight: 500 }}
            >
              <DialogHeader className="mt-8">
                <DialogTitle>Modifier un professeur</DialogTitle>
              </DialogHeader>
              <ProfesseursForm
                initialValues={editProfesseur}
                onSubmit={handleUpdate}
                onCancel={() => {
                  setEditDialogOpen(false);
                  setEditProfesseur(null);
                }}
                formHeight={500}
              />
            </div>
          </DialogContent>
        </Dialog>

        <div className="mt-8 bg-white rounded shadow p-6 mx-6">
          {loadingProfesseurs ? (
            <div>Chargement...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Département</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProfesseurs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Aucun professeur trouvé.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProfesseurs.map((prof) => (
                      <TableRow key={prof.id}>
                        <TableCell>{prof.nom}</TableCell>
                        <TableCell>{prof.prenom}</TableCell>
                        <TableCell>{prof.email}</TableCell>
                        <TableCell>{prof.departement}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Modifier"
                              onClick={() => handleEdit(prof)}
                            >
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Supprimer"
                              onClick={() => handleDelete(prof.id)}
                              disabled={deleteLoading === prof.id}
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
              {/* Pagination controls below the table */}
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
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                    }}
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

export default Professeurs;
