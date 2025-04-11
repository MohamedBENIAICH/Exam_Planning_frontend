import React from "react";
import { Calendar, Users, Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockExams, mockStudents, mockClassrooms } from "@/lib/mockData";

const StatsCards = () => {
  const totalExamens = mockExams.length;
  const totalÉtudiants = mockStudents.length;
  const sallesDisponibles = mockClassrooms.filter((c) => c.isAvailable).length;

  const statistiques = [
    {
      title: "Total des Examens",
      value: totalExamens,
      icon: Calendar,
      description: "Planifiés pour cette session",
      color: "text-blue-500",
    },
    {
      title: "Total des Étudiants",
      value: totalÉtudiants,
      icon: Users,
      description: "Inscrits dans le système",
      color: "text-green-500",
    },
    {
      title: "Salles Disponibles",
      value: sallesDisponibles,
      icon: Building,
      description: "Prêtes pour la planification",
      color: "text-purple-500",
    },
  ];

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
