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
import SuperviseursForm from "@/components/Superviseurs/SuperviseursForm";
import { useToast } from "@/hooks/use-toast";

const Superviseurs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [superviseurs, setSuperviseurs] = useState<
    Array<{
      id: number;
      email: string;
      nom: string;
      prenom: string;
      service: string;
      poste: string;
    }>
  >([]);
  const [loadingSuperviseurs, setLoadingSuperviseurs] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSuperviseur, setEditSuperviseur] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  useEffect(() => {
    const fetchSuperviseurs = async () => {
      setLoadingSuperviseurs(true);
      try {
        const response = await fetch("http://localhost:8000/api/superviseurs");
        const data = await response.json();
        if (Array.isArray(data)) {
          setSuperviseurs(data);
        } else if (data.data && Array.isArray(data.data)) {
          setSuperviseurs(data.data);
        } else {
          setSuperviseurs([]);
        }
      } catch {
        setSuperviseurs([]);
      } finally {
        setLoadingSuperviseurs(false);
      }
    };
    fetchSuperviseurs();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(superviseurs.length / itemsPerPage);
  const paginatedSuperviseurs = superviseurs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Delete handler
  const handleDelete = async (id: number) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce superviseur ?"))
      return;
    setDeleteLoading(id);
    try {
      const response = await fetch(
        `http://localhost:8000/api/superviseurs/${id}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du superviseur");
      }
      setSuperviseurs((prev) => prev.filter((sup) => sup.id !== id));
      toast({
        title: "Suppression réussie",
        description: "Le superviseur a bien été supprimé.",
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

  // Edit handler: open dialog with selected superviseur data
  const handleEdit = (sup) => {
    setEditSuperviseur(sup);
    setEditDialogOpen(true);
  };

  // Update handler: send PUT request to API
  const handleUpdate = async (values) => {
    if (!editSuperviseur) return;
    try {
      const response = await fetch(
        `http://localhost:8000/api/superviseurs/${editSuperviseur.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors de la modification du superviseur"
        );
      }
      setSuperviseurs((prev) =>
        prev.map((sup) =>
          sup.id === editSuperviseur.id ? { ...sup, ...values } : sup
        )
      );
      toast({
        title: "Modification réussie",
        description: "Le superviseur a bien été modifié.",
        variant: "default",
        className: "bg-blue-50 border-blue-200 text-blue-800",
        duration: 4000,
      });
      setEditDialogOpen(false);
      setEditSuperviseur(null);
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
          title="Superviseurs"
          subtitle="Gestion des superviseurs"
          actions={
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un superviseur
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
                    <DialogTitle>Ajouter un superviseur</DialogTitle>
                  </DialogHeader>
                  <SuperviseursForm
                    onSubmit={() => {
                      setIsDialogOpen(false);
                    }}
                    onCancel={() => setIsDialogOpen(false)}
                    formHeight={500}
                    // Vous pouvez adapter le formulaire pour les superviseurs si besoin
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
                <DialogTitle>Modifier un superviseur</DialogTitle>
              </DialogHeader>
              <SuperviseursForm
                initialValues={editSuperviseur}
                onSubmit={handleUpdate}
                onCancel={() => {
                  setEditDialogOpen(false);
                  setEditSuperviseur(null);
                }}
                formHeight={500}
                // Vous pouvez adapter le formulaire pour les superviseurs si besoin
              />
            </div>
          </DialogContent>
        </Dialog>

        <div className="mt-8 bg-white rounded shadow p-6 mx-6">
          {loadingSuperviseurs ? (
            <div>Chargement...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Poste</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSuperviseurs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Aucun superviseur trouvé.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSuperviseurs.map((sup) => (
                      <TableRow key={sup.id}>
                        <TableCell>{sup.nom}</TableCell>
                        <TableCell>{sup.prenom}</TableCell>
                        <TableCell>{sup.email}</TableCell>
                        <TableCell>{sup.service}</TableCell>
                        <TableCell>{sup.poste}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Modifier"
                              onClick={() => handleEdit(sup)}
                            >
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Supprimer"
                              onClick={() => handleDelete(sup.id)}
                              disabled={deleteLoading === sup.id}
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

export default Superviseurs;
