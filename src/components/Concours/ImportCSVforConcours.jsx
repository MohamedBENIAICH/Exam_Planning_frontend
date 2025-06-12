import React, { useState, useRef } from "react";
import { Upload, Check, AlertCircle, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import PropTypes from "prop-types";

const REQUIRED_HEADERS = ["cne", "cin", "nom", "prénom", "email"];

const ImportCSVforConcours = ({ onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const resetState = () => {
    setFile(null);
    setParseError(null);
    setParsedData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParseError(null);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = async (selectedFile) => {
    try {
      const text = await selectedFile.text();
      const rows = text
        .split("\n")
        .map((row) => row.trim())
        .filter(Boolean);

      if (rows.length < 2) {
        throw new Error(
          "Le fichier CSV doit contenir au moins une ligne d'en-tête et une ligne de données."
        );
      }

      // Parse headers (accept both ; and , as separator)
      let delimiter = ";";
      if (rows[0].split(",").length > rows[0].split(";").length)
        delimiter = ",";
      const csvHeaders = rows[0]
        .split(delimiter)
        .map((h) => h.trim().toLowerCase());

      // Validate headers (case-insensitive)
      const missingHeaders = REQUIRED_HEADERS.filter(
        (h) => !csvHeaders.includes(h)
      );
      if (missingHeaders.length > 0) {
        throw new Error(
          `En-têtes manquants dans le CSV: ${missingHeaders.join(", ")}`
        );
      }

      // Parse data rows
      const data = rows.slice(1).map((row, idx) => {
        const values = row.split(delimiter).map((v) => v.trim());
        const candidat = {};
        csvHeaders.forEach((header, i) => {
          if (REQUIRED_HEADERS.includes(header)) {
            if (header === "nom") candidat.nom = values[i] || "";
            else if (header === "prénom") candidat.prenom = values[i] || "";
            else if (header === "cne") candidat.CNE = values[i] || "";
            else if (header === "cin") candidat.CIN = values[i] || "";
            else if (header === "email") candidat.email = values[i] || "";
          }
        });
        candidat.id = idx + 1; // Temporary ID for frontend
        return candidat;
      });

      setParsedData(data);
      setParseError(null);
    } catch (error) {
      setParseError(
        error instanceof Error
          ? error.message
          : "Erreur lors de la lecture du fichier CSV"
      );
      setParsedData([]);
    }
  };

  const handleImport = () => {
    if (!file || parsedData.length === 0) {
      toast({
        title: "Erreur d'import",
        description: "Veuillez d'abord charger un fichier CSV valide.",
        variant: "destructive",
      });
      return;
    }

    if (typeof onImportComplete === "function") {
      onImportComplete(parsedData);
    }

    toast({
      title: "Import réussi",
      description: `Import de ${parsedData.length} candidats.`,
      variant: "default",
    });
    resetState();
  };

  return (
    <div className="relative">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importer le fichier CSV des candidats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-md p-6 text-center">
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-1">Charger le fichier CSV</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Le fichier doit contenir les colonnes : CNE, CIN, NOM, PRÉNOM,
                EMAIL
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="max-w-sm mx-auto"
              />
            </div>

            {parseError && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {parsedData.length > 0 && (
              <div className="overflow-x-auto border rounded mt-4">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="p-2">CNE</th>
                      <th className="p-2">CIN</th>
                      <th className="p-2">Nom</th>
                      <th className="p-2">Prénom</th>
                      <th className="p-2">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((c) => (
                      <tr key={c.id}>
                        <td className="p-2">{c.CNE}</td>
                        <td className="p-2">{c.CIN}</td>
                        <td className="p-2">{c.nom}</td>
                        <td className="p-2">{c.prenom}</td>
                        <td className="p-2">{c.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end mt-4">
              <Button
                onClick={handleImport}
                className="bg-primary text-white shadow-md hover:bg-primary/90"
                disabled={parsedData.length === 0}
              >
                <Check className="h-4 w-4 mr-2" />
                Importer les candidats
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

ImportCSVforConcours.propTypes = {
  onImportComplete: PropTypes.func,
};

export default ImportCSVforConcours;
