// export default StudentList;
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Send } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { generatePDF } from "@/utils/generatePDF";

const StudentList = ({ students }) => {
  // Générer le PDF
  const handleGeneratePDF = async (student) => {
    await generatePDF(student, {
      code: "EXAM001",
      title: "Mathématiques",
      date: "2025-04-10",
      startTime: "10:00",
      endTime: "12:00",
      location: "Amphi 1",
      room: "A101",
    });
  };

  // Bouton "Envoyer Convocation" (pour le futur envoi d'email)
  const handleSendConvocation = async (student) => {
    alert(
      `Convocation envoyée à ${student.email} (fonctionnalité d'envoi à activer plus tard)`
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Liste des Étudiants</h2>

      <div className="border rounded-md overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Étudiant</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>QR Code</TableHead>
              <TableHead>Télécharger PDF</TableHead>
              <TableHead>Envoyer Convocation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length > 0 ? (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.studentId}</TableCell>
                  <TableCell>{student.firstName}</TableCell>
                  <TableCell>{student.lastName}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <QRCodeCanvas
                        value={JSON.stringify(student)}
                        size={200}
                        className="border p-1 bg-white shadow-md"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleGeneratePDF(student)}
                      className="bg-green-500 text-white"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleSendConvocation(student)}
                      className="bg-blue-500 text-white"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Aucun étudiant trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default StudentList;
