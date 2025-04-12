import React, { useEffect, useState } from "react";
import { Calendar, Users, Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsData {
  totalExams: number;
  totalStudents: number;
  availableClassrooms: number;
}

const StatsCards = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const endpoints = [
          "http://127.0.0.1:8000/api/exams/count",
          "http://127.0.0.1:8000/api/students/count",
          "http://127.0.0.1:8000/api/classrooms/available/count",
        ];

        const responses = await Promise.all(
          endpoints.map((url) => fetch(url).then((res) => res.json()))
        );

        // Extract counts from responses
        const counts = responses.map((response) => {
          if (response.status === "success") {
            return response.count || 0;
          }
          return 0;
        });

        setStats({
          totalExams: counts[0],
          totalStudents: counts[1],
          availableClassrooms: counts[2],
        });
      } catch (err) {
        console.error("Fetch error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while fetching statistics"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statistiques = [
    {
      title: "Total des Examens",
      value: stats?.totalExams ?? 0,
      icon: Calendar,
      description: "Planifiés pour cette session",
      color: "text-blue-500",
    },
    {
      title: "Total des Étudiants",
      value: stats?.totalStudents ?? 0,
      icon: Users,
      description: "Inscrits dans le système",
      color: "text-green-500",
    },
    {
      title: "Salles Disponibles",
      value: stats?.availableClassrooms ?? 0,
      icon: Building,
      description: "Prêtes pour la planification",
      color: "text-purple-500",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((item) => (
          <Card key={item} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Chargement...
              </CardTitle>
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold h-8 bg-gray-200 rounded animate-pulse" />
              <p className="text-xs text-muted-foreground h-4 bg-gray-200 rounded animate-pulse mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-3">
          <CardContent className="p-4 text-center text-red-500">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statistiques.map((stat, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
