
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Building } from 'lucide-react';
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
  DialogTrigger,
} from "@/components/ui/dialog";
import ClassroomForm from '@/components/Classrooms/ClassroomForm';
import { useToast } from '@/hooks/use-toast';
import { mockClassrooms } from '@/lib/mockData';
import { Classroom } from '@/types';

const Classrooms = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>(mockClassrooms);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleAddEditClassroom = (classroom: Classroom) => {
    if (editingClassroom) {
      // Update existing classroom
      setClassrooms(prevClassrooms => 
        prevClassrooms.map(c => 
          c.id === classroom.id ? classroom : c
        )
      );
      toast({
        title: "Classroom Updated",
        description: `${classroom.name} has been updated successfully`,
      });
    } else {
      // Add new classroom
      setClassrooms(prevClassrooms => [...prevClassrooms, classroom]);
      toast({
        title: "Classroom Added",
        description: `${classroom.name} has been added successfully`,
      });
    }
    setEditingClassroom(null);
    setIsDialogOpen(false);
  };

  const handleEditClassroom = (classroom: Classroom) => {
    setEditingClassroom(classroom);
    setIsDialogOpen(true);
  };

  const handleDeleteClassroom = (id: string) => {
    setClassrooms(prevClassrooms => 
      prevClassrooms.filter(classroom => classroom.id !== id)
    );
    toast({
      title: "Classroom Deleted",
      description: "The classroom has been removed",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header 
          title="Classrooms" 
          subtitle="Manage classrooms and equipment"
          actions={
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setEditingClassroom(null);
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Classroom
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingClassroom ? "Edit Classroom" : "Add New Classroom"}
                  </DialogTitle>
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
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      {classroom.isAvailable ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">Capacity</p>
                      <p>{classroom.capacity} students</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">Equipment</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {classroom.equipment.length > 0 ? (
                          classroom.equipment.map((item, i) => (
                            <Badge key={i} variant="outline">
                              {item}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No equipment</p>
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
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDeleteClassroom(classroom.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {classrooms.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64">
              <Building className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="font-medium">No classrooms found</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding a classroom to the system
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Classroom
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Classrooms;
