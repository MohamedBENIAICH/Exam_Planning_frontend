import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import {
  Plus,
  Calendar as CalendarIcon,
  Filter,
  Users,
  Building,
  Info,
} from "lucide-react";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import ExamForm from "@/components/Exams/ExamForm";
import { useToast } from "@/hooks/use-toast";
import {
  mockExams,
  mockClassrooms,
  mockTeachers,
  mockStudents,
} from "@/lib/mockData";
import { Exam } from "@/types";

const ExamScheduling = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showStudents, setShowStudents] = useState(false);
  const { toast } = useToast();
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [importedStudents, setImportedStudents] = useState(mockStudents);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);

  interface ApiExam {
    id: number;
    module: string;
    module_code?: string;
    cycle: string;
    filiere: string;
    date_examen: string;
    heure_debut: string;
    heure_fin: string;
    locaux?: string;
    superviseurs?: string;
    students?: Array<{
      id: number;
      nom: string;
      prenom: string;
      numero_etudiant: string;
      email: string;
      filiere: string;
      niveau: string;
      created_at: string;
      updated_at: string;
      pivot: {
        exam_id: number;
        student_id: number;
      };
    }>;
  }

  const formatTime = (dateTimeString: string): string => {
    if (!dateTimeString) return "";
    try {
      // Remove the 'T' and everything after '.' to handle different datetime formats
      const cleanDateTime = dateTimeString.split(".")[0].replace("T", " ");
      const date = new Date(cleanDateTime);
      return format(date, "H:mm");
    } catch (e) {
      console.error("Error formatting time:", e);
      return "";
    }
  };

  // Define the API response type
  interface ApiResponse {
    status: string;
    data: ApiExam[];
  }

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/exams/latest");
        const data: ApiResponse = await response.json();

        if (data.status === "success") {
          const formattedExams = data.data.slice(0, 5).map((apiExam) => ({
            id: apiExam.id.toString(),
            courseCode: apiExam.module_code || "",
            courseName: apiExam.module || "",
            module: apiExam.module || "",
            cycle: apiExam.cycle || "",
            filiere: apiExam.filiere || "",
            date: apiExam.date_examen || "",
            startTime: apiExam.heure_debut || "",
            endTime: apiExam.heure_fin || 0,
            classrooms: apiExam.locaux ? [apiExam.locaux] : [],
            supervisors: apiExam.superviseurs ? [apiExam.superviseurs] : [],
            students: apiExam.students
              ? apiExam.students.map((student) => student.id.toString())
              : [],
          }));

          setExams(formattedExams);
        } else {
          throw new Error("Failed to fetch exams");
        }
      } catch (err) {
        console.error("Error fetching exams:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setExams(mockExams.slice(0, 5));
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const getStudentNames = (studentIds: string[]) => {
    return studentIds.map((id) => {
      // Find the student in the importedStudents array
      const student = importedStudents.find((s) => s.id === id);
      if (student) {
        return `${student.firstName} ${student.lastName}`;
      }

      // If not found in importedStudents, try to find in the exam's students array
      const examStudent = exams
        .find((exam) => exam.students && exam.students.includes(id))
        ?.students?.find((s) => s.id.toString() === id);

      if (examStudent) {
        return `${examStudent.prenom} ${examStudent.nom}`;
      }

      return "Unknown Student";
    });
  };

  const handleAddEditExam = async (exam: Exam) => {
    try {
      if (editingExam) {
        // Format the date to YYYY-MM-DD
        const formattedDate = format(new Date(exam.date), "yyyy-MM-dd");

        // Format time to H:i format (e.g., "09:00")
        const formatTimeToHMM = (timeString: string) => {
          try {
            // Handle ISO format
            if (timeString.includes("T")) {
              return format(new Date(timeString), "HH:mm");
            }
            // Handle simple time format
            return timeString;
          } catch (e) {
            console.error("Error formatting time:", e);
            return timeString;
          }
        };

        const formattedStartTime = formatTimeToHMM(exam.startTime);
        const formattedEndTime = formatTimeToHMM(exam.endTime);

        // Format students data according to backend requirements
        const formattedStudents = exam.students.map((student) => {
          if (typeof student === "string") {
            // If student is just an ID, find the full student data from importedStudents
            const studentData = importedStudents.find((s) => s.id === student);
            if (!studentData) {
              throw new Error(`Student with ID ${student} not found`);
            }
            return {
              studentId: studentData.id,
              firstName: studentData.firstName,
              lastName: studentData.lastName,
              email: studentData.email,
              program: studentData.program || "Default Program", // Provide a default if not available
            };
          }
          // If student is already an object with the required format
          return {
            studentId: student.studentId || student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            program: student.program || "Default Program",
          };
        });

        // Prepare the exam data for the API - exactly matching the Postman format
        const examData = {
          cycle: exam.cycle,
          filiere: exam.filiere,
          module: exam.module,
          date_examen: formattedDate,
          heure_debut: formattedStartTime,
          heure_fin: formattedEndTime,
          locaux: exam.classrooms.join(","),
          superviseurs: exam.supervisors.flatMap((s) => s.split(",")).join(","),
          students: formattedStudents,
        };

        console.log("Sending data to API:", JSON.stringify(examData, null, 2));

        const response = await fetch(
          `http://127.0.0.1:8000/api/exams/${exam.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(examData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error("API error response:", errorData);
          throw new Error(errorData.message || "Failed to update exam");
        }

        const updatedExam = await response.json();

        // Update the exams state with the response from the API
        setExams((prevExams) =>
          prevExams.map((e) =>
            e.id === exam.id
              ? {
                  ...e,
                  cycle: exam.cycle,
                  filiere: exam.filiere,
                  module: exam.module,
                  date: formattedDate,
                  startTime: formattedStartTime,
                  endTime: formattedEndTime,
                  classrooms: exam.classrooms,
                  supervisors: exam.supervisors,
                  students: exam.students,
                }
              : e
          )
        );

        toast({
          title: "Exam Updated",
          description: `Exam has been updated successfully`,
        });
      } else {
        // Handle creating new exam (existing code)
        const newExam = { ...exam, id: Date.now().toString() };
        setExams((prevExams) => [...prevExams, newExam]);
        toast({
          title: "Success",
          description: "Exam has been scheduled successfully",
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800",
        });
      }
    } catch (error) {
      console.error("Error saving exam:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save exam",
        variant: "destructive",
      });
      return;
    }

    setEditingExam(null);
    setIsDialogOpen(false);
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setIsDialogOpen(true);
  };

  const handleDeleteExam = async (id: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/exams/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Only update the UI if the API call was successful
        setExams((prevExams) => prevExams.filter((exam) => exam.id !== id));
        toast({
          title: "Exam Deleted",
          description: "The exam has been removed from the schedule",
          variant: "destructive",
        });
      } else {
        // Handle API error
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete the exam",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the exam",
        variant: "destructive",
      });
    } finally {
      // Close the delete confirmation dialog
      setIsDeleteDialogOpen(false);
      setExamToDelete(null);
    }
  };

  const handleDeleteClick = (exam: Exam) => {
    setExamToDelete(exam);
    setIsDeleteDialogOpen(true);
  };

  const handleShowDetails = (exam: Exam) => {
    setSelectedExam(exam);
  };

  const getClassroomNames = (classroomIds: string[] | undefined): string => {
    if (!classroomIds || !Array.isArray(classroomIds)) {
      return "No classrooms assigned";
    }

    return classroomIds
      .map((id) => {
        const classroom = mockClassrooms.find((c) => c.id === id);
        return classroom ? classroom.name : id;
      })
      .filter(Boolean)
      .join(", ");
  };

  const getTeacherNames = (teacherIds: string[] | undefined): string => {
    if (!teacherIds || !Array.isArray(teacherIds)) {
      return "No supervisors assigned";
    }

    return teacherIds
      .map((id) => {
        const teacher = mockTeachers.find((t) => t.id === id);
        return teacher ? `${teacher.firstName} ${teacher.lastName}` : id;
      })
      .filter(Boolean)
      .join(", ");
  };

  const getStudentCount = (studentIds: string[] | undefined): number => {
    if (!studentIds || !Array.isArray(studentIds)) {
      return 0;
    }

    return studentIds.length;
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          title="Exam Scheduling"
          subtitle="Schedule and manage exams"
          actions={
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) setEditingExam(null);
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Exam
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingExam ? "Edit Exam" : "Schedule New Exam"}
                  </DialogTitle>
                </DialogHeader>
                <ExamForm
                  exam={editingExam || undefined}
                  onSubmit={handleAddEditExam}
                  onCancel={() => {
                    setIsDialogOpen(false);
                    setEditingExam(null);
                  }}
                  setSelectedStudents={setSelectedStudents}
                />
              </DialogContent>
            </Dialog>
          }
        />
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          <h1 className="text-2xl font-bold mb-6">Les 5 dernières examens</h1>
          <Tabs defaultValue="grid">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="grid">Grid View</TabsTrigger>
                <TabsTrigger value="calendar">Calendar View</TabsTrigger>
              </TabsList>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            <TabsContent value="grid" className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <p>Loading exams...</p>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64 text-red-500">
                  <p>{error}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {exams.map((exam) => (
                      <Card key={exam.id}>
                        <CardHeader>
                          <div className="flex justify-between">
                            <div>
                              <CardTitle>Exam de {exam.module}</CardTitle>
                              <CardDescription>
                                {exam.courseCode}
                              </CardDescription>
                            </div>
                            <Badge>
                              {exam.date
                                ? format(new Date(exam.date), "MMM d, yyyy")
                                : "Invalid Date"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4" />
                                Time & Duration
                              </p>
                              <p className="text-sm">
                                {formatTime(exam.startTime)} -{" "}
                                {formatTime(exam.endTime)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium flex items-center gap-1">
                                <Building className="h-4 w-4" />
                                Classrooms
                              </p>
                              <p className="text-sm">
                                {getClassroomNames(exam.classrooms)}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                Supervisors
                              </p>
                              <p className="text-sm">
                                {getTeacherNames(exam.supervisors)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                Students
                              </p>
                              <p className="text-sm">
                                {getStudentCount(exam.students)} students
                              </p>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditExam(exam)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(exam)}
                          >
                            Delete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShowDetails(exam)}
                          >
                            <Info className="h-4 w-4 mr-2" />
                            Detail
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>

                  {exams.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-64">
                      <CalendarIcon className="h-10 w-10 text-muted-foreground mb-4" />
                      <h3 className="font-medium">No exams scheduled</h3>
                      <p className="text-muted-foreground mb-4">
                        Start by scheduling an exam for this session
                      </p>
                      <Button onClick={() => setIsDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule Exam
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="calendar">
              <Card>
                <CardHeader>
                  <CardTitle>Calendar View</CardTitle>
                  <CardDescription>
                    This view will show a calendar with all scheduled exams
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96 flex items-center justify-center border rounded-md">
                    <p className="text-muted-foreground">
                      Calendar view will be implemented in a future update
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Details Modal */}
      <Dialog
        open={!!selectedExam}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedExam(null);
            setShowStudents(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exam Details</DialogTitle>
          </DialogHeader>
          {selectedExam && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Module: {selectedExam.module}</h3>
                <p>Cycle: {selectedExam.cycle}</p>
                <p>Filière: {selectedExam.filiere}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Date:</p>
                  <p>
                    {selectedExam.date &&
                      format(new Date(selectedExam.date), "PPP")}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Time:</p>
                  <p>
                    {selectedExam.startTime} ({selectedExam.duration} minutes)
                  </p>
                </div>
              </div>
              <div>
                <p className="font-medium">Classrooms:</p>
                <p>{getClassroomNames(selectedExam.classrooms)}</p>
              </div>
              <div>
                <p className="font-medium">Supervisors:</p>
                <p>{getTeacherNames(selectedExam.supervisors)}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowStudents(!showStudents)}
              >
                {showStudents ? "Hide Students" : "Show Students"}
              </Button>
              {showStudents && (
                <div className="space-y-2">
                  <p className="font-medium">
                    Students ({selectedExam.students.length}):
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {getStudentNames(selectedExam.students).map(
                      (student, index) => (
                        <li key={index} className="text-sm">
                          {student}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the exam for{" "}
              {examToDelete?.module}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => examToDelete && handleDeleteExam(examToDelete.id)}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamScheduling;
