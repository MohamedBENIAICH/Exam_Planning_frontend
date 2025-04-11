import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Calendar as CalendarIcon,
  Filter,
  Users,
  Building,
  Info,
  FileText,
  Send,
  ChevronLeft,
  Eye,
} from "lucide-react";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ExamForm from "@/components/Exams/ExamForm";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  mockExams,
  mockClassrooms,
  mockTeachers,
  mockStudents,
} from "@/lib/mockData";
import { Exam, Student } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QRCodeCanvas } from "qrcode.react";
// Import PDF generation function
import { generatePDF } from "../utils/generatePDF.jsx"; // Ensure this points to your pdf generator file

const ExamScheduling = () => {
  const [exams, setExams] = useState<Exam[]>(mockExams);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showStudents, setShowStudents] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { toast } = useToast();

  const handleAddEditExam = (exam: Exam) => {
    if (
      !exam.cycle ||
      !exam.filiere ||
      !exam.module ||
      !exam.date ||
      !exam.startTime ||
      !exam.duration ||
      !exam.classrooms ||
      !exam.supervisors
    ) {
      toast({
        title: "Erreur",
        description:
          "Données d'examen invalides. Veuillez remplir tous les champs requis.",
        variant: "destructive",
      });
      return;
    }

    // Filtrer les étudiants en fonction de la filière sélectionnée
    const filteredStudents = mockStudents
      .filter((student) => student.program === exam.module)
      .map((student) => student.id);

    const updatedExam = { ...exam, students: filteredStudents };

    if (editingExam) {
      setExams((prevExams) =>
        prevExams.map((e) => (e.id === updatedExam.id ? updatedExam : e))
      );
      toast({
        title: "Examen mis à jour",
        description: `L'examen a été mis à jour avec succès`,
      });
    } else {
      setExams((prevExams) => [...prevExams, updatedExam]);
      toast({
        title: "Examen programmé",
        description: `L'examen a été programmé avec succès`,
      });
    }
    setEditingExam(null);
    setIsDialogOpen(false);
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setIsDialogOpen(true);
  };

  const handleDeleteExam = (id: string) => {
    setExams((prevExams) => prevExams.filter((exam) => exam.id !== id));
    toast({
      title: "Examen supprimé",
      description: "L'examen a été supprimé du planning",
      variant: "destructive",
    });
  };

  const handleShowDetails = (exam: Exam) => {
    setSelectedExam(exam);
    setShowStudents(false);
    const studentNames = getStudentNames(exam.students);
    console.log("Liste des étudiants :", studentNames);
  };

  const getClassroomNames = (classroomIds: string[]): string => {
    return classroomIds
      .map((id) => mockClassrooms.find((c) => c.id === id)?.name || "")
      .filter(Boolean)
      .join(", ");
  };

  const getTeacherNames = (teacherIds: string[]): string => {
    return teacherIds
      .map((id) => {
        const teacher = mockTeachers.find((t) => t.id === id);
        return teacher ? `${teacher.firstName} ${teacher.lastName}` : "";
      })
      .filter(Boolean)
      .join(", ");
  };

  const getStudentCount = (studentIds: string[]): number => {
    return studentIds.length;
  };

  const getStudentNames = (studentIds: string[]): string[] => {
    return studentIds
      .map((id) => {
        const student = mockStudents.find((s) => s.id === id);
        return student ? `${student.firstName} ${student.lastName}` : "";
      })
      .filter(Boolean);
  };

  const getStudentObjects = (studentIds: string[]): Student[] => {
    return studentIds
      .map((id) => mockStudents.find((s) => s.id === id))
      .filter(Boolean) as Student[];
  };

  // UPDATED: Gérer la visualisation de la convocation
  const handleVisualizeConvocation = async (student: Student) => {
    if (!selectedExam) return;

    setIsGeneratingPdf(true);
    setPdfPreviewUrl(null);

    try {
      // Préparer les détails de l'examen pour le PDF
      const examDetails = {
        title: selectedExam.module,
        code: selectedExam.courseCode || "N/A",
        date: format(new Date(selectedExam.date), "yyyy-MM-dd"),
        startTime: selectedExam.startTime,
        endTime: calculateEndTime(
          selectedExam.startTime,
          selectedExam.duration
        ),
        location: getClassroomNames(selectedExam.classrooms),
      };

      // Générer le PDF et obtenir l'URL
      const pdfBlob = await generatePDFAndGetBlob(student, examDetails);
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Mettre à jour l'URL et afficher la boîte de dialogue
      setPdfPreviewUrl(pdfUrl);
      setIsPreviewDialogOpen(true);
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      toast({
        title: "Erreur de génération",
        description: "Impossible de générer la convocation PDF",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Fonction utilitaire pour calculer l'heure de fin
  const calculateEndTime = (startTime, durationMinutes) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0);

    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return `${endDate.getHours().toString().padStart(2, "0")}:${endDate
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  // Fonction pour générer le PDF et obtenir un Blob
  const generatePDFAndGetBlob = async (student, examDetails) => {
    try {
      // Importez PDFDocument dynamiquement pour éviter les problèmes côté serveur
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const { saveAs } = await import("file-saver");
      const QRCode = await import("qrcode");

      // Créer un nouveau document PDF
      const pdfDoc = await PDFDocument.create();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const page = pdfDoc.addPage([595, 842]); // Format A4
      const { width, height } = page.getSize();

      // ✅ Variables pour les couleurs principales
      const primaryColor = rgb(0.2, 0.4, 0.8);
      const secondaryColor = rgb(0.8, 0.4, 0.1);

      // ✅ Titre principal
      page.drawText("Convocation d'Examen", {
        x: 170,
        y: height - 70,
        size: 22,
        font: helveticaBold,
        color: primaryColor,
      });

      // ✅ Sous-titre
      page.drawText("Faculté des Sciences et Techniques - Marrakech", {
        x: 130,
        y: height - 95,
        size: 12,
        font: helveticaFont,
        color: secondaryColor,
      });

      // ✅ Ligne séparatrice
      page.drawRectangle({
        x: 50,
        y: height - 130,
        width: width - 100,
        height: 2,
        color: primaryColor,
      });

      // ✅ Générer le QR Code
      let qrCodeImage = null;
      try {
        const qrData = `
        🎓 **INFORMATIONS ÉTUDIANT(E)** 🎓
        ───────────────────────────
        🆔 Code Apogée : ${student.studentId || "N/A"}
        👤 Nom - Prénom : ${student.firstName || "N/A"} ${
          student.lastName || "N/A"
        }
        📧 Email : ${student.email || "N/A"}
        📚 Module : ${student.program || "N/A"}
        ───────────────────────────
         © Service de scolarité
        `;

        const qrCodeDataURL = await QRCode.toDataURL(qrData.trim());
        if (qrCodeDataURL) {
          qrCodeImage = await pdfDoc.embedPng(qrCodeDataURL);
        }
      } catch (error) {
        console.error("❌ Erreur lors de la génération du QR code:", error);
      }

      // ✅ Informations de l'examen en tableau
      const tableStartY = height - 150;
      const tableWidth = width - 100;
      const tableStartX = 50;
      const rowHeight = 30;
      const colWidth = tableWidth / 2;

      // Dessin du tableau des informations sur l'examen
      let currentY = tableStartY + 10;

      // Titre du tableau des examens
      const examTableTitle = "Informations sur l'examen";
      drawCenteredText(
        page,
        examTableTitle,
        currentY + 25,
        tableWidth,
        tableStartX,
        helveticaBold,
        14,
        primaryColor
      );

      currentY = currentY - 10;

      const examInfos = [
        { label: "Examen", value: examDetails.title || "N/A" },
        { label: "Code", value: examDetails.code || "N/A" },
        { label: "Date", value: examDetails.date || "N/A" },
        {
          label: "Heure",
          value: `${examDetails.startTime || "N/A"} - ${
            examDetails.endTime || "N/A"
          }`,
        },
        { label: "Lieu", value: examDetails.location || "N/A" },
      ];

      // Dessiner chaque ligne du tableau des examens
      examInfos.forEach((row, index) => {
        // Alternance de couleur pour les lignes
        const fillColor =
          index % 2 === 0 ? rgb(1, 1, 1) : rgb(0.95, 0.95, 0.95);

        // Fond de la ligne
        page.drawRectangle({
          x: tableStartX,
          y: currentY - rowHeight * (index + 1),
          width: tableWidth,
          height: rowHeight,
          color: fillColor,
          borderColor: rgb(0.5, 0.5, 0.5),
          borderWidth: 1,
        });

        // Ligne séparatrice entre les colonnes
        page.drawLine({
          start: { x: tableStartX + colWidth, y: currentY - rowHeight * index },
          end: {
            x: tableStartX + colWidth,
            y: currentY - rowHeight * (index + 1),
          },
          thickness: 1,
          color: rgb(0.5, 0.5, 0.5),
        });

        // Écriture du label (première colonne)
        page.drawText(row.label, {
          x: tableStartX + 10,
          y: currentY - rowHeight * index - rowHeight / 2 + 5,
          size: 10,
          font: helveticaBold,
          color: rgb(0.2, 0.2, 0.2),
        });

        // Écriture de la valeur (deuxième colonne)
        page.drawText(row.value, {
          x: tableStartX + colWidth + 10,
          y: currentY - rowHeight * index - rowHeight / 2 + 5,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      });

      const studentTableY = currentY - rowHeight * examInfos.length - 50;

      // Titre du tableau des étudiants
      const studentTableTitle = "Informations sur l'étudiant";
      drawCenteredText(
        page,
        studentTableTitle,
        studentTableY + 25,
        tableWidth,
        tableStartX,
        helveticaBold,
        14,
        primaryColor
      );

      currentY = studentTableY - 10;

      const studentInfos = [
        { label: "Numéro d'étudiant", value: student.studentId || "N/A" },
        {
          label: "Nom Complet",
          value: `${student.firstName || "N/A"} ${student.lastName || "N/A"}`,
        },
        { label: "Email", value: student.email || "N/A" },
        { label: "Programme", value: student.program || "N/A" },
      ];

      // Dessiner chaque ligne du tableau des étudiants
      studentInfos.forEach((row, index) => {
        // Alternance de couleur pour les lignes
        const fillColor =
          index % 2 === 0 ? rgb(1, 1, 1) : rgb(0.95, 0.95, 0.95);

        // Fond de la ligne
        page.drawRectangle({
          x: tableStartX,
          y: currentY - rowHeight * (index + 1),
          width: tableWidth,
          height: rowHeight,
          color: fillColor,
          borderColor: rgb(0.5, 0.5, 0.5),
          borderWidth: 1,
        });

        // Ligne séparatrice entre les colonnes
        page.drawLine({
          start: { x: tableStartX + colWidth, y: currentY - rowHeight * index },
          end: {
            x: tableStartX + colWidth,
            y: currentY - rowHeight * (index + 1),
          },
          thickness: 1,
          color: rgb(0.5, 0.5, 0.5),
        });

        // Écriture du label (première colonne)
        page.drawText(row.label, {
          x: tableStartX + 10,
          y: currentY - rowHeight * index - rowHeight / 2 + 5,
          size: 10,
          font: helveticaBold,
          color: rgb(0.2, 0.2, 0.2),
        });

        // Écriture de la valeur (deuxième colonne)
        page.drawText(row.value, {
          x: tableStartX + colWidth + 10,
          y: currentY - rowHeight * index - rowHeight / 2 + 5,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      });

      // ✅ Ajout du QR Code en bas du PDF
      if (qrCodeImage) {
        page.drawImage(qrCodeImage, {
          x: width / 2 - 75,
          y: 80, // ✅ Positionné en bas
          width: 150,
          height: 150,
        });

        // Texte du QR code
        drawCenteredText(
          page,
          "Scannez ce QR code pour vérifier l'authenticité",
          60,
          width,
          0,
          helveticaFont,
          12,
          rgb(0.3, 0.3, 0.3)
        );

        // Dessiner une ligne horizontale
        page.drawLine({
          start: { x: 50, y: 45 },
          end: { x: width - 50, y: 45 },
          thickness: 1,
          color: rgb(0, 0, 0),
        });

        // Texte en gras
        drawCenteredText(
          page,
          "Ce document est officiel et doit être présenté le jour de l'examen",
          30,
          width,
          0,
          helveticaBold,
          14,
          rgb(0, 0, 0)
        );
      }

      // Fonction pour centrer un texte
      function drawCenteredText(
        page,
        text,
        y,
        width,
        startX,
        font,
        size,
        color
      ) {
        const textWidth = font.widthOfTextAtSize(text, size);
        const centerX = startX + width / 2 - textWidth / 2;

        page.drawText(text, {
          x: centerX,
          y: y,
          size: size,
          font: font,
          color: color,
        });
      }

      // ✅ Sauvegarde du PDF
      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: "application/pdf" });
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      throw error;
    }
  };

  // Gérer l'envoi de la convocation
  const handleSendConvocation = async (student: Student) => {
    toast({
      title: "Convocation envoyée",
      description: `Convocation envoyée à ${student.email}`,
    });
  };

  // Gérer l'envoi de toutes les convocations
  const handleSendAllConvocations = async () => {
    if (!selectedExam) return;

    setIsSendingAll(true);

    try {
      // Simuler un processus d'envoi
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const students = getStudentObjects(selectedExam.students);

      toast({
        title: "Convocations envoyées",
        description: `${students.length} convocations ont été envoyées avec succès`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description:
          "Une erreur s'est produite lors de l'envoi des convocations",
        variant: "destructive",
      });
    } finally {
      setIsSendingAll(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          title="Planification des Examens"
          subtitle="Planifiez et gérez les examens"
          actions={
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) setEditingExam(null);
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Planifier un examen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingExam
                      ? "Modifier l'examen"
                      : "Planifier un nouvel examen"}
                  </DialogTitle>
                </DialogHeader>
                <ExamForm
                  exam={editingExam || undefined}
                  onSubmit={handleAddEditExam}
                  onCancel={() => {
                    setIsDialogOpen(false);
                    setEditingExam(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          }
        />
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          <Tabs defaultValue="grid">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="grid">Vue en grille</TabsTrigger>
                <TabsTrigger value="calendar">Vue calendrier</TabsTrigger>
              </TabsList>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrer
              </Button>
            </div>

            <TabsContent value="grid" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {exams.map((exam) => (
                  <Card key={exam.id}>
                    <CardHeader>
                      <div className="flex justify-between">
                        <div>
                          <CardTitle>Examen de {exam.module}</CardTitle>
                          <CardDescription>{exam.courseCode}</CardDescription>
                        </div>
                        <Badge>
                          {exam.date
                            ? format(new Date(exam.date), "MMM d, yyyy")
                            : "Date invalide"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            Heure et durée
                          </p>
                          <p className="text-sm">
                            {exam.startTime} ({exam.duration} min)
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            Salles
                          </p>
                          <p className="text-sm">
                            {getClassroomNames(exam.classrooms)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Superviseurs
                          </p>
                          <p className="text-sm">
                            {getTeacherNames(exam.supervisors)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Étudiants
                          </p>
                          <p className="text-sm">
                            {getStudentCount(exam.students)} étudiants
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditExam(exam)}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteExam(exam.id)}
                      >
                        Supprimer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShowDetails(exam)}
                      >
                        <Info className="h-4 w-4 mr-2" />
                        Détails
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {exams.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64">
                  <CalendarIcon className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="font-medium">Aucun examen programmé</h3>
                  <p className="text-muted-foreground mb-4">
                    Commencez par planifier un examen pour cette session
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Planifier un examen
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="calendar">
              <Card>
                <CardHeader>
                  <CardTitle>Vue Calendrier</CardTitle>
                  <CardDescription>
                    Cette vue affichera un calendrier avec tous les examens
                    programmés
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96 flex items-center justify-center border rounded-md">
                    <p className="text-muted-foreground">
                      La vue calendrier sera implémentée dans une future mise à
                      jour
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal des détails amélioré */}
      <Dialog
        open={!!selectedExam}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedExam(null);
            setShowStudents(false);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center">
              {showStudents && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStudents(false)}
                  className="mr-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              {showStudents ? "Liste des Étudiants" : "Détails de l'Examen"}
            </DialogTitle>
          </DialogHeader>

          {selectedExam && !showStudents && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="bg-slate-50">
                  <CardTitle>Informations Générales</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Module</p>
                      <p className="font-medium">{selectedExam.module}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cycle</p>
                      <p className="font-medium">{selectedExam.cycle}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Filière</p>
                      <p className="font-medium">{selectedExam.filiere.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">
                        {format(new Date(selectedExam.date), "PPP")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="bg-slate-50">
                  <CardTitle>Horaire & Lieu</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Début</p>
                      <p className="font-medium">{selectedExam.startTime}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Durée</p>
                      <p className="font-medium">
                        {selectedExam.duration} minutes
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Salles</p>
                      <p className="font-medium">
                        {getClassroomNames(selectedExam.classrooms)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="bg-slate-50">
                  <CardTitle>Personnel</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Superviseurs
                      </p>
                      <p className="font-medium">
                        {getTeacherNames(selectedExam.supervisors)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Nombre d'Étudiants
                      </p>
                      <p className="font-medium">
                        {getStudentCount(selectedExam.students)} étudiants
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center mt-6">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setShowStudents(true)}
                >
                  <Users className="h-5 w-5 mr-2" />
                  Afficher les étudiants
                </Button>
              </div>
            </div>
          )}

          {selectedExam && showStudents && (
            <div className="space-y-4">
              <div className="mb-2">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-medium">
                      {selectedExam.module}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedExam.date), "PPP")} •{" "}
                      {selectedExam.startTime} •{" "}
                      {getClassroomNames(selectedExam.classrooms)}
                    </p>
                  </div>
                  <Badge className="text-sm">
                    {getStudentCount(selectedExam.students)} étudiants
                  </Badge>
                </div>

                {/* Add "Send All Convocations" button */}
                <div className="flex justify-end mb-4">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleSendAllConvocations}
                    disabled={isSendingAll}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSendingAll
                      ? "Envoi en cours..."
                      : "Envoyer toutes les convocations"}
                  </Button>
                </div>
              </div>

              <div className="border rounded-md overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Étudiant</TableHead>
                      <TableHead>Prénom</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>QR Code</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getStudentObjects(selectedExam.students).length > 0 ? (
                      getStudentObjects(selectedExam.students).map(
                        (student) => (
                          <TableRow key={student.id}>
                            <TableCell>{student.studentId}</TableCell>
                            <TableCell>{student.firstName}</TableCell>
                            <TableCell>{student.lastName}</TableCell>
                            <TableCell>{student.email}</TableCell>
                            <TableCell>
                              <div className="flex justify-center">
                                <QRCodeCanvas
                                  value={JSON.stringify({
                                    id: student.id,
                                    name: `${student.firstName} ${student.lastName}`,
                                    exam: selectedExam.module,
                                    date: selectedExam.date,
                                  })}
                                  size={100}
                                  className="border p-1 bg-white shadow-sm"
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center gap-2">
                                <Button
                                  onClick={() =>
                                    handleVisualizeConvocation(student)
                                  }
                                  className="bg-green-500 hover:bg-green-600 text-white"
                                  size="sm"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Visualiser
                                </Button>
                                <Button
                                  onClick={() => handleSendConvocation(student)}
                                  className="bg-blue-500 hover:bg-blue-600 text-white"
                                  size="sm"
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Envoyer
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      )
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          Aucun étudiant trouvé.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog */}
      {pdfPreviewUrl && (
        <Dialog
          open={isPreviewDialogOpen}
          onOpenChange={(open) => {
            setIsPreviewDialogOpen(open);
            if (!open) setPdfPreviewUrl(null);
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Aperçu de la convocation</DialogTitle>
            </DialogHeader>
            <div className="w-full h-[70vh]">
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full border-none"
                title="PDF Preview"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ExamScheduling;
