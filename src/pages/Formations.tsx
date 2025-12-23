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
import FormationsForm from "@/components/Formations/FormationsForm";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";

const Formations = () => {
  const { toast } = useToast();

  const [formations, setFormations] = useState<
    Array<{
      id_formation: number;
      id?: number;
      formation_intitule: string;
    }>
  >([]);
  const [loadingFormations, setLoadingFormations] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormation, setEditFormation] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  useEffect(() => {
    const fetchFormations = async () => {
      setLoadingFormations(true);
      try {
        const response = await api.get("/formations");
        const data = response.data;
        if (Array.isArray(data)) {
          setFormations(data);
        } else if (data.data && Array.isArray(data.data)) {
          setFormations(data.data);
        } else {
          setFormations([]);
        }
      } catch {
        setFormations([]);
      } finally {
        setLoadingFormations(false);
      }
    };
    fetchFormations();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(formations.length / itemsPerPage);
  const paginatedFormations = formations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Delete handler
  const handleDelete = async (id_formation: number) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette formation ?"))
      return;
    setDeleteLoading(id_formation);
    try {
      const response = await api.delete(`/formations/${id_formation}`);
      const data = response.data;
      if (data.status !== "success") {
        throw new Error(
          data.message || "Erreur lors de la suppression de la formation"
        );
      }
      setFormations((prev) =>
        prev.filter((formation) => formation.id_formation !== id_formation)
      );
      toast({
        title: "Suppression rÃ©ussie",
        description: "La formation a bien Ã©tÃ© supprimÃ©e.",
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

  // Edit handler: open dialog with selected formation data
  const handleEdit = (formation) => {
    setEditFormation(formation);
    setEditDialogOpen(true);
  };

  // Update handler: sync local state after successful API update from the form
  const handleUpdate = (updatedFormation) => {
    if (!updatedFormation) return;

    const updatedId =
      updatedFormation.id_formation ??
      updatedFormation.id ??
      editFormation?.id_formation ??
      editFormation?.id;

    if (!updatedId) {
      setEditDialogOpen(false);
      setEditFormation(null);
      return;
    }

    setFormations((prev) =>
      prev.map((formation) =>
        formation.id_formation === updatedId || formation.id === updatedId
          ? { ...formation, ...updatedFormation, id_formation: updatedId }
          : formation
      )
    );
    toast({
      title: "Modification reussie",
      description: "La formation a bien ete modifiee.",
      variant: "default",
      className: "bg-blue-50 border-blue-200 text-blue-800",
      duration: 4000,
    });
    setEditDialogOpen(false);
    setEditFormation(null);
  };
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          title="Formations"
          subtitle="Gestion des formations"
          actions={
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une formation
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
                    <DialogTitle>Ajouter une formation</DialogTitle>
                  </DialogHeader>
                  <FormationsForm
                    onSubmit={(data) => {
                      setIsDialogOpen(false);
                      setFormations((prev) => [...prev, data]);
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
                <DialogTitle>Modifier une formation</DialogTitle>
              </DialogHeader>
              <FormationsForm
                initialValues={editFormation}
                onSubmit={handleUpdate}
                onCancel={() => {
                  setEditDialogOpen(false);
                  setEditFormation(null);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>

        <div className="mt-8 bg-white rounded shadow p-6 mx-6">
          {loadingFormations ? (
            <div>Chargement...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom de la formation</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedFormations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center">
                        Aucune formation trouvÃ©e.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedFormations.map((formation) => (
                      <TableRow key={formation.id_formation}>
                        <TableCell>{formation.formation_intitule}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Modifier"
                              onClick={() => handleEdit(formation)}
                            >
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Supprimer"
                              onClick={() =>
                                handleDelete(formation.id_formation)
                              }
                              disabled={
                                deleteLoading === formation.id_formation
                              }
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
                    PrÃ©cÃ©dent
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

export default Formations;




