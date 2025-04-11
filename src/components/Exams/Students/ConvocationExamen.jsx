import React from "react";
import PropTypes from "prop-types";
import GenerateurQRCode from "./GenerateurQRCode";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarDays, Clock, MapPin, BookOpen, User } from "lucide-react";

const ConvocationExamen = ({ etudiant, examen }) => {
  // Générer un identifiant unique pour la convocation
  const idConvocation = `${etudiant.studentId}-${examen.id}-${Date.now()}`;

  // Données pour le QR code (identifiant étudiant, examen et horodatage)
  const donneesQR = JSON.stringify({
    idEtudiant: etudiant.studentId,
    idExamen: examen.id,
    horodatage: Date.now(),
  });

  return (
    <Card className="w-full max-w-3xl mx-auto my-4 print:shadow-none">
      <CardHeader className="border-b pb-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              CONVOCATION OFFICIELLE
            </p>
            <CardTitle className="text-xl">Examen {examen.titre}</CardTitle>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Référence: {idConvocation}</p>
            <p className="text-sm text-muted-foreground">
              Date d'émission: {new Date().toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Informations Étudiant</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Numéro Étudiant
                    </p>
                    <p className="font-medium">{etudiant.studentId}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nom Complet</p>
                  <p className="font-medium">
                    {etudiant.firstName} {etudiant.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Programme</p>
                  <p className="font-medium">{etudiant.program}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Année</p>
                  <p className="font-medium">{etudiant.year}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <h3 className="font-semibold text-lg">Détails de l'Examen</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{examen.titre}</p>
                    <p className="text-sm text-muted-foreground">
                      {examen.code}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CalendarDays className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-sm">
                      {new Date(examen.date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Heure</p>
                    <p className="text-sm">
                      {examen.heureDebut} - {examen.heureFin}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Lieu</p>
                    <p className="text-sm">{examen.lieu}</p>
                    {examen.salle && (
                      <p className="text-sm">Salle: {examen.salle}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center">
            <GenerateurQRCode valeur={donneesQR} taille={150} />
            <p className="text-xs text-center mt-2 text-muted-foreground">
              Ce QR code sert à vérifier votre identité le jour de l'examen
            </p>
          </div>
        </div>

        {examen.instructions && (
          <div className="mt-6 p-4 bg-muted rounded-md">
            <h4 className="font-medium mb-2">Instructions Importantes</h4>
            <p className="text-sm">{examen.instructions}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4 text-sm text-muted-foreground">
        <p>
          Veuillez vous présenter 30 minutes avant le début de l'examen muni(e)
          de cette convocation et d'une pièce d'identité.
        </p>
      </CardFooter>
    </Card>
  );
};

ConvocationExamen.propTypes = {
  etudiant: PropTypes.shape({
    id: PropTypes.string,
    studentId: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    email: PropTypes.string,
    program: PropTypes.string,
    year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  examen: PropTypes.shape({
    id: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    titre: PropTypes.string.isRequired,
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
      .isRequired,
    heureDebut: PropTypes.string.isRequired,
    heureFin: PropTypes.string.isRequired,
    lieu: PropTypes.string.isRequired,
    salle: PropTypes.string,
    instructions: PropTypes.string,
  }).isRequired,
};

export default ConvocationExamen;
