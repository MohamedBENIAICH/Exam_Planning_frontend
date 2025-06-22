import React, { useRef, useState } from "react";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import PropTypes from "prop-types";

const REQUIRED_HEADERS = ["cne", "cin", "nom", "prenom", "email"];

const ImportCSVforConcours = ({ onImportComplete, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const text = await selectedFile.text();
      const rows = text
        .split("\n")
        .map((row) => row.trim())
        .filter(Boolean);

      if (rows.length < 2) {
        throw new Error(
          "Le fichier doit contenir au moins une ligne d'en-tête et une ligne de données"
        );
      }

      // Parse headers (accept both ; and , as separator)
      let delimiter = ";";
      if (rows[0].split(",").length > rows[0].split(";").length)
        delimiter = ",";

      const headers = rows[0]
        .split(delimiter)
        .map((h) => h.trim().toLowerCase());

      // Validate headers
      const missingHeaders = REQUIRED_HEADERS.filter(
        (h) => !headers.includes(h)
      );
      if (missingHeaders.length > 0) {
        throw new Error(`En-têtes manquants : ${missingHeaders.join(", ")}`);
      }

      // Parse data rows
      const candidates = [];
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(delimiter).map((v) => v.trim());
        const candidate = {};

        headers.forEach((header, index) => {
          if (header && values[index] !== undefined) {
            candidate[header] = values[index];
          }
        });

        // Only add if required fields are present
        if (candidate.cne && candidate.nom && candidate.prenom) {
          candidates.push({
            CNE: candidate.cne,
            CIN: candidate.cin || "",
            nom: candidate.nom,
            prenom: candidate.prenom,
            email: candidate.email || "",
          });
        }
      }

      if (candidates.length === 0) {
        throw new Error("Aucun candidat valide trouvé dans le fichier");
      }

      // Auto-import the candidates
      onImportComplete(candidates);

      toast({
        title: "Import réussi",
        description: `${candidates.length} candidat(s) importé(s) avec succès`,
      });

      // Close the dialog after a short delay
      setTimeout(() => {
        if (onClose) onClose();
      }, 1000);
    } catch (error) {
      console.error("Error parsing CSV:", error);
      setError(
        error.message ||
          "Une erreur est survenue lors de l'importation du fichier"
      );
      toast({
        title: "Erreur d'importation",
        description:
          error.message ||
          "Une erreur est survenue lors de l'importation du fichier",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Importer des candidats</h2>

      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
          {isLoading ? (
            <Loader2 className="w-10 h-10 mb-3 text-blue-500 animate-spin" />
          ) : (
            <Upload className="w-10 h-10 mb-3 text-gray-400" />
          )}
          <p className="mb-2 text-sm text-gray-600 text-center">
            {isLoading ? (
              "Traitement en cours..."
            ) : (
              <span className="font-medium">
                Glissez-déposez votre fichier CSV ici
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500 mb-4 text-center">
            {isLoading
              ? "Veuillez patienter..."
              : "ou cliquez pour sélectionner un fichier"}
          </p>

          <Button
            variant="outline"
            size="sm"
            className="relative"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Import en cours...
              </>
            ) : (
              "Sélectionner un fichier"
            )}
            <Input
              type="file"
              accept=".csv"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              ref={fileInputRef}
              disabled={isLoading}
            />
          </Button>

          <p className="mt-3 text-xs text-gray-500 text-center">
            Format requis: CNE, CIN, Nom, Prénom, Email
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

ImportCSVforConcours.propTypes = {
  onImportComplete: PropTypes.func.isRequired,
  onClose: PropTypes.func,
};

export default ImportCSVforConcours;
