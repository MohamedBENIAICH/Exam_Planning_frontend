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
import ModulesForm from "@/components/Modules/ModulesForm";
import ModulesUpdateForm from "@/components/Modules/ModulesUpdateForm";
import { useToast } from "@/hooks/use-toast";

const Modules = () => {
  const { toast } = useToast();

  const [modules, setModules] = useState<
    Array<{
      id_module: number;
      module_intitule: string;
      semestre: string;
      filieres: Array<{
        id_filiere: number;
        filiere_intitule: string;
        formation_name: string;
      }>;
    }>
  >([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editModule, setEditModule] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
      setLoadingModules(true);
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/modules/modules-with-filieres-formation"
        );
        const data = await response.json();
        if (Array.isArray(data)) {
          setModules(data);
        } else if (data.data && Array.isArray(data.data)) {
          setModules(data.data);
        } else {
          setModules([]);
        }
      } catch {
        setModules([]);
      } finally {
        setLoadingModules(false);
      }
    };
    fetchModules();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(modules.length / itemsPerPage);
  const paginatedModules = modules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Delete handler
  const handleDelete = async (id_module: number) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce module ?")) return;
    setDeleteLoading(id_module);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/modules/${id_module}`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message || "Erreur lors de la suppression du module"
        );
      }
      setModules((prev) =>
        prev.filter((module) => module.id_module !== id_module)
      );
      toast({
        title: "Suppression réussie",
        description: "Le module a bien été supprimé.",
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

  // Edit handler: open dialog with selected module data
  const handleEdit = (module) => {
    setEditModule(module);
    setEditDialogOpen(true);
  };

  // Update handler: send PUT request to API
  const handleUpdate = async (values) => {
    if (!editModule) return;
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/modules/${editModule.id_module}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message || "Erreur lors de la modification du module"
        );
      }
      setModules((prev) =>
        prev.map((module) =>
          module.id_module === editModule.id_module
            ? { ...module, ...values }
            : module
        )
      );
      toast({
        title: "Modification réussie",
        description: "Le module a bien été modifié.",
        variant: "default",
        className: "bg-blue-50 border-blue-200 text-blue-800",
        duration: 4000,
      });
      setEditDialogOpen(false);
      setEditModule(null);
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
          title="Modules"
          subtitle="Gestion des modules"
          actions={
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un module
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
                    <DialogTitle>Ajouter un module</DialogTitle>
                  </DialogHeader>
                  <ModulesForm
                    onSubmit={(data) => {
                      setIsDialogOpen(false);
                      setModules((prev) => [...prev, data]);
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
                <DialogTitle>Modifier un module</DialogTitle>
              </DialogHeader>
              <ModulesUpdateForm
                initialValues={editModule}
                onSubmit={handleUpdate}
                onCancel={() => {
                  setEditDialogOpen(false);
                  setEditModule(null);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>

        <div className="mt-8 bg-white rounded shadow p-6 mx-6">
          {loadingModules ? (
            <div>Chargement...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom du module</TableHead>
                    <TableHead>Semestre</TableHead>
                    <TableHead>Formation</TableHead>
                    <TableHead>Filière</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedModules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Aucun module trouvé.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedModules.map((module) => (
                      <TableRow key={module.id_module}>
                        <TableCell>{module.module_intitule}</TableCell>
                        <TableCell>{module.semestre}</TableCell>
                        <TableCell>
                          {module.filieres && module.filieres.length > 0
                            ? module.filieres
                                .map((f) => f.formation_name)
                                .filter(Boolean)
                                .join(", ")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {module.filieres && module.filieres.length > 0
                            ? module.filieres
                                .map((f) => f.filiere_intitule)
                                .join(", ")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Modifier"
                              onClick={() => handleEdit(module)}
                            >
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Supprimer"
                              onClick={() => handleDelete(module.id_module)}
                              disabled={deleteLoading === module.id_module}
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

export default Modules;
