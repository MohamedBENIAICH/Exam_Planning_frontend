import React, { useState, useEffect } from "react";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import {
  CalendarIcon,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  PieChart,
  Building,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const DonutChart = ({
  completed,
  upcoming,
}: {
  completed: number;
  upcoming: number;
}) => (
  <div className="flex flex-col items-center">
    <PieChart className="w-12 h-12 text-blue-400 mb-2" />
    <div className="text-xs text-gray-500">Statut des examens</div>
    <div className="flex gap-2 mt-1">
      <span className="text-green-600 font-bold">{completed} Terminés</span>
      <span className="text-blue-600 font-bold">{upcoming} À venir</span>
    </div>
  </div>
);

const ExamScheduling = () => {
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [classroomCount, setClassroomCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcomingExams = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/exams/upcoming"
        );
        const data = await response.json();
        setUpcomingExams(Array.isArray(data.data) ? data.data : []);
      } catch {
        setUpcomingExams([]);
      }
    };

    const fetchCompletedCount = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/exams/count-passed"
        );
        const data = await response.json();
        setCompletedCount(data.count || 0);
      } catch {
        setCompletedCount(0);
      }
    };

    const fetchClassroomCount = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/classrooms/count"
        );
        const data = await response.json();
        setClassroomCount(data.count || 0);
      } catch {
        setClassroomCount(0);
      }
    };

    fetchUpcomingExams();
    fetchCompletedCount();
    fetchClassroomCount();
    setLoading(false);
  }, []);

  const total = upcomingExams.length + completedCount;
  const upcomingCount = upcomingExams.length;
  const nextExam = upcomingExams.length > 0 ? upcomingExams[0] : null;

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          title="Tableau de bord des examens"
          subtitle="Bienvenue dans le Planificateur d'examens"
        />
        <div className="p-6 space-y-6">
          {/* Cartes d'aperçu */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex items-center gap-2">
                <BookOpen className="text-blue-500" />
                <CardTitle>Examens au total</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{total}</CardContent>
            </Card>
            <Card>
              <CardHeader className="flex items-center gap-2">
                <Clock className="text-yellow-500" />
                <CardTitle>À venir</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                {upcomingCount}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex items-center gap-2">
                <CheckCircle className="text-green-500" />
                <CardTitle>Terminés</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                {completedCount}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex items-center gap-2">
                <Building className="text-purple-500" />
                <CardTitle>Locaux</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                {classroomCount}
              </CardContent>
            </Card>
          </div>

          {/* Donut Chart & Next Exam */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-1 flex flex-col items-center justify-center">
              <CardHeader>
                <CardTitle>Répartition des examens</CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart
                  completed={completedCount}
                  upcoming={upcomingCount}
                />
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Prochain examen</CardTitle>
              </CardHeader>
              <CardContent>
                {nextExam ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="text-blue-500" />
                      <span className="font-semibold">
                        {nextExam.module_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="text-gray-500" />
                      <span>
                        {new Date(
                          `${nextExam.date_examen}T${nextExam.heure_debut}`
                        ).toLocaleString("fr-FR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="text-gray-500" />
                      <span>{nextExam.locaux}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="text-gray-500" />
                      <span>{nextExam.superviseurs}</span>
                    </div>
                  </div>
                ) : (
                  <div>Aucun examen à venir</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chronologie */}
          <Card>
            <CardHeader>
              <CardTitle>Chronologie des examens à venir</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative border-l border-gray-200">
                {upcomingExams
                  .sort(
                    (a, b) =>
                      new Date(a.date_examen).getTime() -
                      new Date(b.date_examen).getTime()
                  )
                  .map((exam) => (
                    <li key={exam.id} className="mb-8 ml-4">
                      <div className="absolute w-3 h-3 bg-blue-200 rounded-full mt-1.5 -left-1.5 border border-white"></div>
                      <time className="mb-1 text-xs font-normal leading-none text-gray-400">
                        {new Date(
                          `${exam.date_examen}T${exam.heure_debut}`
                        ).toLocaleDateString("fr-FR", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {exam.module_name}
                        </span>
                        <span className="text-gray-500">({exam.locaux})</span>
                        <span className="ml-2 px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                          À venir
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Surveillants: {exam.superviseurs}
                      </div>
                    </li>
                  ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExamScheduling;
