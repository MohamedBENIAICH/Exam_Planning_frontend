// import React, { useState, useContext } from "react";
// import { StudentsContext } from "../context/StudentsProvider";
// import StudentList from "./StudentList";
// import ConvocationExamen from "./ConvocationExamen";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
//   CardFooter,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { useToast } from "@/hooks/use-toast";
// import {
//   Calendar,
//   Clock,
//   Printer,
//   Send,
//   Check,
//   Plus,
//   Mail,
//   User,
//   FileText,
// } from "lucide-react";

// const GestionnaireConvocations = () => {
//   const { students } = useContext(StudentsContext);
//   const { toast } = useToast();
//   const [etudiantsSelectionnes, setEtudiantsSelectionnes] = useState([]);
//   const [donneesExamen, setDonneesExamen] = useState({
//     id: `exam-${Date.now()}`,
//     code: "",
//     titre: "",
//     date: "",
//     heureDebut: "",
//     heureFin: "",
//     lieu: "",
//     salle: "",
//     instructions: "",
//   });
//   const [afficherApercu, setAfficherApercu] = useState(false);
//   const [etudiantApercu, setEtudiantApercu] = useState(null);

//   // Gérer la sélection/désélection de tous les étudiants
//   const gererSelectionTousEtudiants = () => {
//     if (etudiantsSelectionnes.length === students.length) {
//       setEtudiantsSelectionnes([]);
//     } else {
//       setEtudiantsSelectionnes([...students]);
//     }
//   };

//   // Gérer la sélection/désélection d'un étudiant individuel
//   const gererSelectionEtudiant = (etudiant) => {
//     const estSelectionne = etudiantsSelectionnes.some(
//       (e) => e.id === etudiant.id
//     );

//     if (estSelectionne) {
//       setEtudiantsSelectionnes(
//         etudiantsSelectionnes.filter((e) => e.id !== etudiant.id)
//       );
//     } else {
//       setEtudiantsSelectionnes([...etudiantsSelectionnes, etudiant]);
//     }
//   };

//   // Mettre à jour les données de l'examen
//   const gererChangementDonneesExamen = (e) => {
//     const { name, value } = e.target;
//     setDonneesExamen({
//       ...donneesExamen,
//       [name]: value,
//     });
//   };

//   // Prévisualiser la convocation
//   const gererApercu = () => {
//     if (students.length === 0) {
//       toast({
//         title: "Aucun étudiant disponible",
//         description: "Veuillez d'abord importer des étudiants.",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!validerDonneesExamen()) {
//       return;
//     }

//     setEtudiantApercu(students[0]);
//     setAfficherApercu(true);
//   };

//   // Valider les données de l'examen
//   const validerDonneesExamen = () => {
//     const champsObligatoires = [
//       "code",
//       "titre",
//       "date",
//       "heureDebut",
//       "heureFin",
//       "lieu",
//     ];
//     const champsManquants = champsObligatoires.filter(
//       (champ) => !donneesExamen[champ]
//     );

//     if (champsManquants.length > 0) {
//       toast({
//         title: "Données incomplètes",
//         description: `Veuillez remplir tous les champs obligatoires: ${champsManquants.join(
//           ", "
//         )}`,
//         variant: "destructive",
//       });
//       return false;
//     }

//     return true;
//   };

//   // Envoyer les convocations par email
//   const gererEnvoiConvocations = () => {
//     if (etudiantsSelectionnes.length === 0) {
//       toast({
//         title: "Aucun étudiant sélectionné",
//         description: "Veuillez sélectionner au moins un étudiant.",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!validerDonneesExamen()) {
//       return;
//     }

//     // Simulation d'envoi d'emails
//     toast({
//       title: "Convocations envoyées",
//       description: `${etudiantsSelectionnes.length} convocations ont été envoyées avec succès.`,
//       variant: "default",
//     });
//   };

//   // Imprimer toutes les convocations
//   const gererImpressionConvocations = () => {
//     if (etudiantsSelectionnes.length === 0) {
//       toast({
//         title: "Aucun étudiant sélectionné",
//         description: "Veuillez sélectionner au moins un étudiant.",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!validerDonneesExamen()) {
//       return;
//     }

//     setAfficherApercu(false);
//     setTimeout(() => {
//       window.print();
//     }, 300);
//   };

//   return (
//     <div className="space-y-8">
//       {!afficherApercu ? (
//         <>
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <FileText className="h-5 w-5" />
//                 Informations sur l'Examen
//               </CardTitle>
//               <CardDescription>
//                 Remplissez les détails de l'examen pour générer les convocations
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="code">Code de l'examen*</Label>
//                   <Input
//                     id="code"
//                     name="code"
//                     value={donneesExamen.code}
//                     onChange={gererChangementDonneesExamen}
//                     placeholder="Ex: MATH101"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="titre">Titre de l'examen*</Label>
//                   <Input
//                     id="titre"
//                     name="titre"
//                     value={donneesExamen.titre}
//                     onChange={gererChangementDonneesExamen}
//                     placeholder="Ex: Mathématiques Fondamentales"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="date">Date de l'examen*</Label>
//                   <div className="flex items-center">
//                     <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
//                     <Input
//                       id="date"
//                       name="date"
//                       type="date"
//                       value={donneesExamen.date}
//                       onChange={gererChangementDonneesExamen}
//                     />
//                   </div>
//                 </div>
//                 <div className="grid grid-cols-2 gap-2">
//                   <div className="space-y-2">
//                     <Label htmlFor="heureDebut">Heure de début*</Label>
//                     <div className="flex items-center">
//                       <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
//                       <Input
//                         id="heureDebut"
//                         name="heureDebut"
//                         type="time"
//                         value={donneesExamen.heureDebut}
//                         onChange={gererChangementDonneesExamen}
//                       />
//                     </div>
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="heureFin">Heure de fin*</Label>
//                     <Input
//                       id="heureFin"
//                       name="heureFin"
//                       type="time"
//                       value={donneesExamen.heureFin}
//                       onChange={gererChangementDonneesExamen}
//                     />
//                   </div>
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="lieu">Lieu*</Label>
//                   <Input
//                     id="lieu"
//                     name="lieu"
//                     value={donneesExamen.lieu}
//                     onChange={gererChangementDonneesExamen}
//                     placeholder="Ex: Campus Principal"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="salle">Numéro de salle</Label>
//                   <Input
//                     id="salle"
//                     name="salle"
//                     value={donneesExamen.salle}
//                     onChange={gererChangementDonneesExamen}
//                     placeholder="Ex: A-101"
//                   />
//                 </div>
//               </div>
//               <div className="space-y-2 pt-2">
//                 <Label htmlFor="instructions">Instructions spéciales</Label>
//                 <Textarea
//                   id="instructions"
//                   name="instructions"
//                   value={donneesExamen.instructions}
//                   onChange={gererChangementDonneesExamen}
//                   placeholder="Informations supplémentaires pour les étudiants..."
//                   rows={3}
//                 />
//               </div>
//             </CardContent>
//             <CardFooter className="flex justify-end gap-2">
//               <Button variant="outline" onClick={gererApercu}>
//                 Aperçu
//               </Button>
//             </CardFooter>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <User className="h-5 w-5" />
//                 Sélection des Étudiants
//               </CardTitle>
//               <CardDescription>
//                 Sélectionnez les étudiants qui recevront une convocation
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 <div className="flex justify-between items-center">
//                   <div className="flex items-center space-x-2">
//                     <input
//                       type="checkbox"
//                       id="select-all"
//                       checked={
//                         etudiantsSelectionnes.length === students.length &&
//                         students.length > 0
//                       }
//                       onChange={gererSelectionTousEtudiants}
//                       className="h-4 w-4"
//                     />
//                     <Label htmlFor="select-all">
//                       Sélectionner tous ({students.length})
//                     </Label>
//                   </div>
//                   <div className="text-sm text-muted-foreground">
//                     {etudiantsSelectionnes.length} étudiants sélectionnés
//                   </div>
//                 </div>

//                 <div className="border rounded-md overflow-auto max-h-80">
//                   <table className="w-full">
//                     <thead className="bg-muted">
//                       <tr>
//                         <th className="p-2"></th>
//                         <th className="p-2 text-left">ID</th>
//                         <th className="p-2 text-left">Nom</th>
//                         <th className="p-2 text-left">Email</th>
//                         <th className="p-2 text-left">Programme</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {students.map((etudiant) => (
//                         <tr key={etudiant.id} className="border-t">
//                           <td className="p-2 text-center">
//                             <input
//                               type="checkbox"
//                               checked={etudiantsSelectionnes.some(
//                                 (e) => e.id === etudiant.id
//                               )}
//                               onChange={() => gererSelectionEtudiant(etudiant)}
//                               className="h-4 w-4"
//                             />
//                           </td>
//                           <td className="p-2">{etudiant.studentId}</td>
//                           <td className="p-2">
//                             {etudiant.firstName} {etudiant.lastName}
//                           </td>
//                           <td className="p-2">{etudiant.email}</td>
//                           <td className="p-2">{etudiant.program}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             </CardContent>
//             <CardFooter className="flex justify-between">
//               <div className="text-sm text-muted-foreground">
//                 * Champs obligatoires
//               </div>
//               <div className="flex gap-2">
//                 <Button
//                   variant="outline"
//                   onClick={gererImpressionConvocations}
//                   disabled={etudiantsSelectionnes.length === 0}
//                 >
//                   <Printer className="h-4 w-4 mr-2" />
//                   Imprimer
//                 </Button>
//                 <Button
//                   onClick={gererEnvoiConvocations}
//                   disabled={etudiantsSelectionnes.length === 0}
//                 >
//                   <Mail className="h-4 w-4 mr-2" />
//                   Envoyer
//                 </Button>
//               </div>
//             </CardFooter>
//           </Card>
//         </>
//       ) : (
//         <div className="space-y-4">
//           <div className="flex justify-between items-center">
//             <h2 className="text-2xl font-bold">Aperçu de la Convocation</h2>
//             <Button variant="outline" onClick={() => setAfficherApercu(false)}>
//               Retour à l'édition
//             </Button>
//           </div>

//           <ConvocationExamen etudiant={etudiantApercu} examen={donneesExamen} />
//         </div>
//       )}

//       {/* Section d'impression cachée - visible uniquement lors de l'impression */}
//       <div className="hidden print:block">
//         {etudiantsSelectionnes.map((etudiant) => (
//           <div key={etudiant.id} className="page-break-after">
//             <ConvocationExamen etudiant={etudiant} examen={donneesExamen} />
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default GestionnaireConvocations;
import React, { useState, useContext } from "react";
import { StudentsContext } from "../context/StudentsProvider";
import { generatePDF } from "@/utils/generatePDF";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, AlertTriangle } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "@/components/ui/use-toast";

const GestionnaireConvocations = () => {
  const { students } = useContext(StudentsContext);
  const [examDetails, setExamDetails] = useState({
    code: "",
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
  });
  const [loading, setLoading] = useState({});

  // Modifier les détails de l'examen
  const handleExamChange = (e) => {
    setExamDetails({ ...examDetails, [e.target.name]: e.target.value });
  };

  // Vérifier si tous les champs de l'examen sont remplis
  const isExamFormValid = () => {
    return (
      examDetails.code &&
      examDetails.title &&
      examDetails.date &&
      examDetails.startTime &&
      examDetails.endTime &&
      examDetails.location
    );
  };

  // Générer le PDF pour un étudiant
  const handleGeneratePDF = async (student) => {
    console.log(
      "📄 Début de la génération du PDF pour :",
      student,
      examDetails
    );

    if (!isExamFormValid()) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs de l'examen.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, [student.id]: true }));

      await generatePDF(student, examDetails);

      console.log("✅ PDF généré avec succès !");
      toast({
        title: "PDF généré avec succès",
        description: `Convocation téléchargée pour ${student.firstName} ${student.lastName}.`,
      });
    } catch (error) {
      console.error("❌ Erreur lors de la génération du PDF:", error);
      toast({
        title: "Erreur",
        description: `Impossible de générer le PDF: ${
          error.message || "Erreur inconnue"
        }`,
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, [student.id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulaire pour les détails de l'examen */}
      <div className="border rounded-md p-4">
        <h2 className="text-xl font-bold">📌 Informations sur l'examen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label>Code de l'examen *</Label>
            <Input
              name="code"
              value={examDetails.code}
              onChange={handleExamChange}
              placeholder="EXAM123"
              required
            />
          </div>
          <div>
            <Label>Titre *</Label>
            <Input
              name="title"
              value={examDetails.title}
              onChange={handleExamChange}
              placeholder="Mathématiques Avancées"
              required
            />
          </div>
          <div>
            <Label>Date *</Label>
            <Input
              type="date"
              name="date"
              value={examDetails.date}
              onChange={handleExamChange}
              required
            />
          </div>
          <div>
            <Label>Heure de début *</Label>
            <Input
              type="time"
              name="startTime"
              value={examDetails.startTime}
              onChange={handleExamChange}
              required
            />
          </div>
          <div>
            <Label>Heure de fin *</Label>
            <Input
              type="time"
              name="endTime"
              value={examDetails.endTime}
              onChange={handleExamChange}
              required
            />
          </div>
          <div>
            <Label>Lieu *</Label>
            <Input
              name="location"
              value={examDetails.location}
              onChange={handleExamChange}
              placeholder="Amphithéâtre A"
              required
            />
          </div>
        </div>

        {!isExamFormValid() && (
          <div className="mt-4 p-2 bg-yellow-50 text-yellow-800 rounded-md flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span className="text-sm">
              Tous les champs marqués d'un * sont obligatoires
            </span>
          </div>
        )}
      </div>

      {/* Liste des étudiants */}
      <div className="border rounded-md p-4">
        <h2 className="text-xl font-bold">📋 Liste des étudiants</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>QR Code</TableHead>
                <TableHead>📄 Générer PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length > 0 ? (
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      <div
                        id={`qr-${student.id}`}
                        className="flex justify-center"
                      >
                        <QRCodeCanvas
                          value={JSON.stringify({
                            ID: student.studentId,
                            Nom: `${student.firstName} ${student.lastName}`,
                            Email: student.email,
                            Programme: student.program || "Non spécifié",
                          })}
                          size={140} // QR Code plus grand
                          className="border p-2 bg-white shadow-md"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleGeneratePDF(student)}
                        className="bg-green-500 hover:bg-green-600 text-white"
                        disabled={loading[student.id] || !isExamFormValid()}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {loading[student.id]
                          ? "Génération..."
                          : "📄 Générer PDF"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    Aucun étudiant trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default GestionnaireConvocations;
