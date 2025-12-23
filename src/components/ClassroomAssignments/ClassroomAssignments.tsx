import React, { useEffect, useState } from "react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import api from "@/services/api";

interface Candidat {
  candidat_id: number;
  cne: string;
  cin: string;
  nom: string;
  prenom: string;
  email: string;
  seat_number: number;
}

// More flexible interface to handle different response formats
interface ClassroomAssignment {
  classroom_id: number;
  classroom_name: any; // Will be handled in the component
  departement: string;
  capacity: number;
  assigned: number;
  available: number;
  candidats: Candidat[];
}

interface ClassroomAssignmentsProps {
  concoursId: number;
  onClose: () => void;
}

// Helper function to safely get classroom name
const getClassroomName = (classroom: any): string => {
  if (!classroom) return 'Salle inconnue';
  
  // Handle object case
  if (typeof classroom === 'object') {
    if (classroom.nom_local) return String(classroom.nom_local);
    if (classroom.name) return String(classroom.name);
    if (classroom.classroom_name) return String(classroom.classroom_name);
    return 'Salle sans nom';
  }
  
  // Handle string case
  return String(classroom);
};

// Helper function to safely get classroom capacity
const getClassroomCapacity = (classroom: any): number => {
  if (!classroom) return 0;
  
  // Handle object case
  if (typeof classroom === 'object') {
    if (typeof classroom.capacity === 'number') return classroom.capacity;
    if (typeof classroom.capacite === 'number') return classroom.capacite;
    return 0;
  }
  
  // Handle number case
  if (typeof classroom === 'number') return classroom;
  
  return 0;
};

const ClassroomAssignments: React.FC<ClassroomAssignmentsProps> = ({ concoursId, onClose }) => {
  const [assignments, setAssignments] = useState<ClassroomAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching assignments for concoursId:', concoursId);
        const response = await api.get(
          `/concours/${concoursId}/classroom-assignments`
        );

        const data = response.data;
        console.log('API Response:', data);
        
        if (data?.status === "success" && data?.data?.assignments) {
          // Process assignments to ensure consistent data structure
          const processedAssignments = data.data.assignments.map((item: any) => {
            const assignment = { ...item };
            
            // Ensure classroom_name is a string
            assignment.classroom_name = getClassroomName(item.classroom_name || item);
            
            // Ensure capacity is a number
            assignment.capacity = getClassroomCapacity(item.classroom_name || item);
            
            // Ensure candidats is an array
            if (!Array.isArray(assignment.candidats)) {
              assignment.candidats = [];
            }
            
            return assignment;
          });
          
          console.log('Processed Assignments:', processedAssignments);
          setAssignments(processedAssignments);
        } else {
          throw new Error("Format de données inattendu");
        }
      } catch (err: any) {
        console.error("Error in fetchAssignments:", err);
        const errorMessage = err.message || "Une erreur est survenue lors du chargement des affectations";
        setError(errorMessage);
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (concoursId) {
      fetchAssignments();
    } else {
      setError("ID de concours manquant");
      setLoading(false);
    }
  }, [concoursId, toast]);

  // Calculate total number of candidates across all classrooms
  const totalCandidates = assignments.reduce(
    (total, classroom) => total + (classroom.candidats?.length || 0),
    0
  );

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Chargement des affectations...</h2>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Erreur</h2>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
        <div className="text-red-500 p-4 bg-red-50 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  // Safely render classroom assignments
  const renderClassroom = (classroom: ClassroomAssignment) => {
    const name = getClassroomName(classroom.classroom_name || classroom);
    const capacity = getClassroomCapacity(classroom.classroom_name || classroom);
    const assigned = typeof classroom.assigned === 'number' ? classroom.assigned : 0;
    
    return (
      <div key={classroom.classroom_id || Math.random()} className="border rounded-lg overflow-hidden mb-6">
        <div className="bg-gray-50 px-6 py-3 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">
              {name} (Capacité : {capacity})
            </h3>
            <span className="text-sm text-gray-500">
              {assigned} / {capacity} places occupées
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.isArray(classroom.candidats) && classroom.candidats.length > 0 ? (
              classroom.candidats.map((candidat, index) => {
                if (!candidat) return null;
                
                return (
                  <div 
                    key={`${classroom.classroom_id}-${candidat.candidat_id || index}`} 
                    className={`flex items-center p-3 rounded-md ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {candidat.prenom} {candidat.nom}
                      </p>
                      <p className="text-xs text-gray-500">
                        Place : {candidat.seat_number || 'N/A'}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 text-center py-4 text-gray-500">
                Aucun candidat affecté à cette salle
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ÉTUDIANTS & PLACES</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm bg-gray-100 px-3 py-1.5 rounded-full">
            {totalCandidates} au total
          </span>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.isArray(assignments) && assignments.length > 0 ? (
            assignments.map(renderClassroom)
          ) : (
            <div className="text-center py-8 text-gray-500">
              Aucune salle d'examen trouvée
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClassroomAssignments;
