import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Building,
  AlertCircle,
  BookOpen,
  School,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fr } from "date-fns/locale";

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
          setError("Échec du chargement des examens");
        }
      } catch (err) {
        setError("Une erreur s'est produite lors du chargement des examens");
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

  // Group exams by date for better organization
  const groupedExams = sortedExams.reduce((acc, exam) => {
    const dateKey = format(new Date(exam.date_examen), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(exam);
    return acc;
  }, {} as Record<string, ApiExam[]>);

  const renderLoadingState = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border rounded-md">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2 mt-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderErrorState = () => (
    <div className="text-center py-8 flex flex-col items-center gap-2">
      <AlertCircle className="h-10 w-10 text-red-500" />
      <p className="text-red-500 font-medium">{error}</p>
      <p className="text-muted-foreground text-sm">
        Veuillez vérifier votre connexion et réessayer plus tard
      </p>
    </div>
  );

  const renderExamGroups = () => {
    const today = new Date();

    return Object.entries(groupedExams).map(([dateKey, examsForDate]) => {
      const examDate = new Date(dateKey);
      const isToday = format(today, "yyyy-MM-dd") === dateKey;
      const daysUntil = Math.ceil(
        (examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      return (
        <div key={dateKey} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isToday
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">
                {format(new Date(dateKey), "EEEE d MMMM yyyy", { locale: fr })}
              </h3>
              {isToday ? (
                <Badge variant="default" className="mt-1">
                  Aujourd'hui
                </Badge>
              ) : daysUntil <= 7 ? (
                <Badge variant="outline" className="mt-1">
                  Dans {daysUntil} jour{daysUntil > 1 ? "s" : ""}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="space-y-3 pl-12">
            {examsForDate.map((examen) => (
              <Card
                key={examen.id}
                className="border border-gray-200 hover:shadow-md transition-all duration-300"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-gray-500" />
                        <h3 className="font-medium text-gray-900">
                          {examen.module}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <School className="h-3 w-3" />
                        <span>
                          {examen.filiere} • {examen.cycle}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        {examen.heure_debut} ({examen.duree} min)
                      </Badge>

                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <Building className="h-3 w-3" />
                        {examen.locaux}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    });
  };

  const renderEmptyState = () => (
    <div className="text-center py-12 flex flex-col items-center gap-2">
      <Calendar className="h-12 w-12 text-gray-300" />
      <p className="font-medium text-gray-500 mt-2">Aucun examen à venir</p>
      <p className="text-sm text-gray-400">
        Les examens planifiés apparaîtront ici
      </p>
    </div>
  );

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Examens à venir
            </CardTitle>
            <CardDescription className="mt-1">
              {!loading &&
                !error &&
                `${sortedExams.length} examen${
                  sortedExams.length > 1 ? "s" : ""
                } planifié${sortedExams.length > 1 ? "s" : ""}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {loading && renderLoadingState()}
        {error && renderErrorState()}
        {!loading && !error && sortedExams.length > 0 && renderExamGroups()}
        {!loading && !error && sortedExams.length === 0 && renderEmptyState()}
      </CardContent>
    </Card>
  );
};

export default UpcomingExams;
