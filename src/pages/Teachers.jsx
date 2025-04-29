import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Header from '@/components/Layout/Header';
import Sidebar from '@/components/Layout/Sidebar';
import TeacherForm from '@/components/Teachers/TeacherForm';
import TeacherList from '@/components/Teachers/TeacherList';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { mockTeachers } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

const Teachers = () => {
  const [teachers, setTeachers] = useState(mockTeachers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const { toast } = useToast();

  const handleAddEditTeacher = (teacher) => {
    if (editingTeacher) {
      setTeachers(prevTeachers => 
        prevTeachers.map(t => t.id === teacher.id ? teacher : t)
      );
      toast({
        title: "Enseignant mis à jour",
        description: `Les informations de ${teacher.firstName} ${teacher.lastName} ont été mises à jour`
      });
    } else {
      setTeachers(prevTeachers => [...prevTeachers, teacher]);
      toast({
        title: "Enseignant ajouté",
        description: `${teacher.firstName} ${teacher.lastName} a été ajouté comme superviseur`
      });
    }
    setIsDialogOpen(false);
    setEditingTeacher(null);
  };

  const handleDeleteTeacher = (id) => {
    setTeachers(prevTeachers => prevTeachers.filter(teacher => teacher.id !== id));
    toast({
      title: "Enseignant supprimé",
      description: "L'enseignant a été supprimé du système",
      variant: "destructive"
    });
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header 
          title="Supervising Teachers" 
          subtitle="Manage supervising teachers"
          actions={
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setEditingTeacher(null);
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Teacher
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingTeacher ? "Edit Teacher" : "Add New Teacher"}
                  </DialogTitle>
                </DialogHeader>
                <TeacherForm
                  teacher={editingTeacher}
                  onSubmit={handleAddEditTeacher}
                  onCancel={() => {
                    setIsDialogOpen(false);
                    setEditingTeacher(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          }
        />
        <div className="flex-1 p-4 sm:p-6">
          <TeacherList 
            teachers={teachers}
            onEdit={(teacher) => {
              setEditingTeacher(teacher);
              setIsDialogOpen(true);
            }}
            onDelete={handleDeleteTeacher}
          />
        </div>
      </div>
    </div>
  );
};

export default Teachers;
