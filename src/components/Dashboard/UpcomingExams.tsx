import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ApiExam {
  id: number;
  cycle: string;
  filiere: string;
  module: string;
  date_examen: string;
  heure_debut: string;
  duree: number;
  locaux: string;
  superviseurs: string;
  created_at: string;
  updated_at: string;
}

const UpcomingExams = () => {
  const [exams, setExams] = useState<ApiExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/exams");
        const data = await response.json();

        if (data.status === "success") {
          setExams(data.data);
        } else {
          setError("Failed to fetch exams");
        }
      } catch (err) {
        setError("An error occurred while fetching exams");
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  // Sort exams by date
  const sortedExams = [...exams].sort(
    (a, b) =>
      new Date(a.date_examen).getTime() - new Date(b.date_examen).getTime()
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Examens à venir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Chargement en cours...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Examens à venir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

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
          {sortedExams.length > 0 ? (
            sortedExams.map((examen) => (
              <div
                key={examen.id}
                className="flex flex-col sm:flex-row justify-between gap-4 p-4 border rounded-md hover:bg-accent/50 transition-colors"
              >
                <div>
                  <h3 className="font-medium">{examen.module}</h3>
                  <p className="text-sm text-muted-foreground">
                    {examen.filiere} • {examen.cycle}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 w-fit"
                  >
                    <Calendar className="h-3 w-3" />
                    {format(new Date(examen.date_examen), "d MMM yyyy")}
                  </Badge>

                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 w-fit"
                  >
                    <Clock className="h-3 w-3" />
                    {examen.heure_debut} ({examen.duree} min)
                  </Badge>

                  <Badge variant="secondary" className="w-fit">
                    {examen.locaux}
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
