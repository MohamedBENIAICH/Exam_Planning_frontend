import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Building, Trash2 } from 'lucide-react';
import Header from '@/components/Layout/Header';
import Sidebar from '@/components/Layout/Sidebar';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import ClassroomForm from '@/components/Classrooms/ClassroomForm';
import { useToast } from '@/hooks/use-toast';
import { Classroom } from '@/types';
import { getAllClassrooms, deleteClassroom, updateClassroom } from '@/services/classroomService';

const Classrooms = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [classroomToDelete, setClassroomToDelete] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const data = await getAllClassrooms();
        setClassrooms(data);
      } catch (error) {
        console.error("Error fetching classrooms:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les salles de classe",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
  }, [toast]);

  const handleAddEditClassroom = async (classroom: Classroom) => {
    try {
      if (editingClassroom) {
        // Update existing classroom
        const updatedClassroom = await updateClassroom(editingClassroom.id, classroom);
        
        setClassrooms(prevClassrooms => 
          prevClassrooms.map(c => 
            c.id === updatedClassroom.id ? updatedClassroom : c
          )
        );
        
        toast({
          title: "Salle mise à jour",
          description: `${updatedClassroom.name} a été mise à jour avec succès`,
        });
      } else {
        // Add new classroom
        setClassrooms(prevClassrooms => [...prevClassrooms, classroom]);
        toast({
          title: "Salle ajoutée",
          description: `${classroom.name} a été ajoutée avec succès`,
        });
      }
      setEditingClassroom(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error handling classroom:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la gestion de la salle",
        variant: "destructive",
      });
    }
  };

  const handleEditClassroom = (classroom: Classroom) => {
    setEditingClassroom(classroom);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (classroom: Classroom) => {
    setClassroomToDelete(classroom);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteClassroom = async () => {
    if (!classroomToDelete) return;

    try {
      await deleteClassroom(classroomToDelete.id);
      setClassrooms(prevClassrooms => 
        prevClassrooms.filter(classroom => classroom.id !== classroomToDelete.id)
      );
      toast({
        title: "Salle supprimée",
        description: `${classroomToDelete.name} a été supprimée avec succès`,
      });
    } catch (error) {
      console.error("Error deleting classroom:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la salle",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setClassroomToDelete(null);
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header 
          title="Salles de classe" 
          subtitle="Gérer les salles de classe et leur équipement"
          actions={
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setEditingClassroom(null);
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une salle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingClassroom ? "Modifier la salle" : "Ajouter une nouvelle salle"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingClassroom 
                      ? "Modifiez les informations de la salle ci-dessous" 
                      : "Remplissez les informations de la nouvelle salle ci-dessous"}
                  </DialogDescription>
                </DialogHeader>
                <ClassroomForm 
                  classroom={editingClassroom || undefined}
                  onSubmit={handleAddEditClassroom}
                  onCancel={() => {
                    setIsDialogOpen(false);
                    setEditingClassroom(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          }
        />
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p>Chargement...</p>
          </div>
        ) : classrooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {classrooms.map((classroom) => (
              <Card key={classroom.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        <Building className="h-4 w-4 mr-2" />
                        {classroom.name}
                      </CardTitle>
                      <CardDescription>{classroom.building}</CardDescription>
                    </div>
                    <Badge 
                      variant={classroom.isAvailable ? "default" : "secondary"}
                    >
                      {classroom.isAvailable ? "Disponible" : "Indisponible"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">Capacité</p>
                      <p>{classroom.capacity} étudiants</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">Équipement</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {classroom.equipment.length > 0 ? (
                          classroom.equipment.map((item, i) => (
                            <Badge key={i} variant="outline">
                              {item}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Aucun équipement</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditClassroom(classroom)}
                      >
                        Modifier
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDeleteClick(classroom)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64">
            <Building className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="font-medium">Aucune salle trouvée</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par ajouter une salle au système
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une salle
            </Button>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer la salle "{classroomToDelete?.name}" ? Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleDeleteClassroom}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Classrooms;
