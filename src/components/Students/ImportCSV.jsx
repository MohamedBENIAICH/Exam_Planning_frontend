import React, { useState, useRef, useContext } from "react";
import { Upload, Check, X, AlertCircle, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PropTypes from "prop-types";
import { StudentsContext } from "../context/StudentsProvider";

const ImportCSV = ({ onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [mappings, setMappings] = useState({});
  const [headers, setHeaders] = useState([]);
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const { addStudents } = useContext(StudentsContext);

  const resetState = () => {
    setFile(null);
    setPreviewing(false);
    setParseError(null);
    setParsedData([]);
    setHeaders([]);
    setMappings({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParseError(null);
    }
  };

  const parseCSV = async () => {
    if (!file) return;

    setPreviewing(true);
    try {
      const text = await file.text();
      const rows = text.split("\n");

      if (rows.length < 2) {
        throw new Error(
          "CSV file must have at least a header row and one data row"
        );
      }

      // Parse headers
      const csvHeaders = rows[0].split(";").map((h) => h.trim());
      setHeaders(csvHeaders);

      // Setup initial mappings
      const initialMappings = {};
      csvHeaders.forEach((header) => {
        // Try to match CSV headers to our expected fields
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes("id")) initialMappings[header] = "studentId";
        else if (lowerHeader.includes("first"))
          initialMappings[header] = "firstName";
        else if (lowerHeader.includes("last"))
          initialMappings[header] = "lastName";
        else if (lowerHeader.includes("email"))
          initialMappings[header] = "email";
        else if (lowerHeader.includes("program"))
          initialMappings[header] = "program";
        else if (lowerHeader.includes("year")) initialMappings[header] = "year";
        else initialMappings[header] = "";
      });
      setMappings(initialMappings);

      // Parse data rows
      const data = rows
        .slice(1)
        .filter((row) => row.trim() !== "")
        .map((row) => {
          const values = row.split(";").map((v) => v.trim());
          const rowData = {};
          csvHeaders.forEach((header, index) => {
            rowData[header] = values[index] || "";
          });
          return rowData;
        });

      setParsedData(data);
    } catch (error) {
      console.error("Error parsing CSV:", error);
      setParseError(
        error instanceof Error ? error.message : "Failed to parse CSV file"
      );
      setPreviewing(false);
    }
  };

  const handleImport = () => {
    if (!file || !previewing || parsedData.length === 0) {
      toast({
        title: "Import Error",
        description: "Please upload and preview a CSV file first",
        variant: "destructive",
      });
      return;
    }

    // Validate mappings
    const requiredFields = ["studentId", "firstName", "lastName"];
    const missingFields = requiredFields.filter(
      (field) => !Object.values(mappings).includes(field)
    );

    if (missingFields.length > 0) {
      setParseError(
        `Missing required field mappings: ${missingFields.join(", ")}`
      );
      return;
    }

    // Transform data according to mappings
    const students = parsedData.map((row, index) => {
      const student = { id: `import-${index}` };

      Object.entries(mappings).forEach(([csvHeader, fieldName]) => {
        if (fieldName && row[csvHeader] !== undefined) {
          if (fieldName === "year") {
            student[fieldName] = parseInt(row[csvHeader], 10);
          } else {
            student[fieldName] = row[csvHeader];
          }
        }
      });

      return student;
    });

    // Add students to global state
    addStudents(students);

    // Call onImportComplete
    if (typeof onImportComplete === "function") {
      onImportComplete(students);
    }

    toast({
      title: "Import Successful",
      description: `Imported ${students.length} student records`,
      variant: "default",
    });
    resetState();
  };

  const handleMappingChange = (header, value) => {
    setMappings((prev) => ({
      ...prev,
      [header]: value,
    }));
  };

  return (
    <div className="relative">
      {/* Persistent "Import Students" button positioned on the right side */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          onClick={handleImport}
          className="bg-primary text-white shadow-md hover:bg-primary/90"
        >
          <Check className="h-4 w-4 mr-2" />
          Import Students
        </Button>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importer le fichier CSV des etudiants
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!previewing ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-md p-6 text-center">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-1">Charger le fichier CSV </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  The file should include student information with headers
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
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">
                  Map CSV Columns to Student Fields
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {headers.map((header) => (
                    <div key={header} className="space-y-2">
                      <label className="text-sm font-medium">{header}</label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={mappings[header] || ""}
                        onChange={(e) =>
                          handleMappingChange(header, e.target.value)
                        }
                      >
                        <option value="">-- Skip this column --</option>
                        <option value="studentId">Student ID</option>
                        <option value="firstName">First Name</option>
                        <option value="lastName">Last Name</option>
                        <option value="email">Email</option>
                        <option value="program">Program</option>
                        <option value="year">Year</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Preview Data</h3>
                <div className="border rounded-md overflow-x-auto overflow-y-auto max-h-64 w-full">
                  <div className="min-w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {headers.map((header) => (
                            <TableHead key={header}>
                              {header}
                              {mappings[header] && (
                                <span className="ml-1 text-xs text-primary">
                                  → {mappings[header]}
                                </span>
                              )}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedData.slice(0, 5).map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {headers.map((header, cellIndex) => (
                              <TableCell key={`${rowIndex}-${cellIndex}`}>
                                {row[header]}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                {parsedData.length > 5 && (
                  <p className="text-sm text-muted-foreground">
                    Showing 5 of {parsedData.length} rows
                  </p>
                )}
              </div>

              {parseError && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={resetState}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>

          {!previewing ? (
            <Button onClick={parseCSV} disabled={!file}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Preview CSV
            </Button>
          ) : (
            <div className="invisible">
              {/* This is just a placeholder to maintain layout */}
              <Button>
                <Check className="h-4 w-4 mr-2" />
                Import Students
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

ImportCSV.propTypes = {
  onImportComplete: PropTypes.func,
};

export default ImportCSV;
