import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ImportCSV from "@/components/Students/ImportCSV";
import StudentList from "@/components/Students/StudentList";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleImportComplete = (importedStudents) => {
    // Add imported students to the existing list
    setStudents((prevStudents) => [...prevStudents, ...importedStudents]);
    setIsImportDialogOpen(false);
    toast({
      title: "Import Successful",
      description: `Imported ${importedStudents.length} students`,
    });
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          title="Étudiants"
          subtitle="Gérer les dossiers des étudiants"
          actions={
            <>
              <Dialog
                open={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Importer CSV
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Importer des étudiants</DialogTitle>
                  </DialogHeader>
                  <ImportCSV onImportComplete={handleImportComplete} />
                </DialogContent>
              </Dialog>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un étudiant
              </Button>
            </>
          }
        />
        <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-auto">
          <Card>
            <StudentList students={students} />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Students;
