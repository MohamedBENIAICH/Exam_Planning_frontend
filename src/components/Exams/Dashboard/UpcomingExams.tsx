import React from "react";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockExams, mockClassrooms } from "@/lib/mockData";
import { Classroom, Exam } from "@/types";

const UpcomingExams = () => {
  // Trier les examens par date
  const examensTries = [...mockExams].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const obtenirNomsSalles = (examen: Exam): string => {
    return examen.classrooms
      .map((id) => {
        const salle = mockClassrooms.find((c) => c.id === id) as Classroom;
        return salle ? salle.name : "";
      })
      .filter(Boolean)
      .join(", ");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Examens à venir
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {examensTries.length > 0 ? (
            examensTries.map((examen) => (
              <div
                key={examen.id}
                className="flex flex-col sm:flex-row justify-between gap-4 p-4 border rounded-md hover:bg-accent/50 transition-colors"
              >
                <div>
                  <h3 className="font-medium">{examen.courseName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {examen.courseCode}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 w-fit"
                  >
                    <Calendar className="h-3 w-3" />
                    {format(new Date(examen.date), "d MMM yyyy")}
                  </Badge>

                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 w-fit"
                  >
                    <Clock className="h-3 w-3" />
                    {examen.startTime} ({examen.duration} min)
                  </Badge>

                  <Badge variant="secondary" className="w-fit">
                    {obtenirNomsSalles(examen)}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucun examen à venir prévu
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingExams;
