import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { fr } from "@/translations/fr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ExamForm from "@/components/Exams/ExamForm";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, actions }) => {
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);

  const handleNewExamCreated = () => {
    setIsExamDialogOpen(false);
  };

  return (
    <>
      <header className="py-6 px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setIsExamDialogOpen(true)}>
            Nouvel Examen
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={fr.common.notifications}
          >
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Créer un nouvel examen</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-4">
            <ExamForm
              onSubmit={handleNewExamCreated}
              onCancel={() => setIsExamDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;
