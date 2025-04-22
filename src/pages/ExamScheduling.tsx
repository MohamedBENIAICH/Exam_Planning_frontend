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
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
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
  const [fetchedStudents, setFetchedStudents] = useState<
    Array<{
      id: number;
      nom: string;
      prenom: string;
      numero_etudiant: string;
      email: string;
      filiere: string;
      niveau: string;
    }>
  >([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

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

  const fetchStudentsForExam = async (examId: string) => {
    setIsLoadingStudents(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/students/by-exam/${examId}`
      );
      const data = await response.json();

      if (data.status === "success" && Array.isArray(data.data)) {
        console.log(
          `Fetched ${data.data.length} students for exam ID: ${examId}`
        );
        setFetchedStudents(data.data);
      } else {
        console.error("Failed to fetch students:", data);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleShowDetails = (exam: Exam) => {
    setSelectedExam(exam);
    fetchStudentsForExam(exam.id);
  };

  const getStudentNames = (studentIds: string[]) => {
    console.log("Processing student IDs:", studentIds);

    // If we have fetched students, use them to display names
    if (fetchedStudents.length > 0) {
      return studentIds.map((id) => {
        const student = fetchedStudents.find((s) => s.id.toString() === id);
        if (student) {
          return `${student.prenom} ${student.nom}`;
        }
        return `Student ${id}`;
      });
    }

    // Fallback to the original logic if we don't have fetched students
    return studentIds.map((id) => {
      console.log(`Looking for student with ID: ${id} (type: ${typeof id})`);

      // Find the student in the importedStudents array
      const student = importedStudents.find((s) => {
        console.log(
          `Comparing ${
            s.id
          } (type: ${typeof s.id}) with ${id} (type: ${typeof id})`
        );
        return s.id === id || s.id.toString() === id;
      });

      if (student) {
        console.log(
          `Found student in importedStudents: ${student.firstName} ${student.lastName}`
        );
        return `${student.firstName} ${student.lastName}`;
      }

      // If we still haven't found the student, try to generate a mock name based on the ID
      console.log(`No student found with ID: ${id}, generating mock name`);
      return `Student ${id}`;
    });
  };

  const handleAddEditExam = async (exam: Exam) => {
    try {
      if (editingExam) {
        // Format the date to YYYY-MM-DD
        const examDate = new Date(exam.date);
        const formattedDate = format(examDate, "yyyy-MM-dd");

        // Format time to H:i format (e.g., "09:00")
        const formatTimeToHMM = (timeString: string) => {
          if (!timeString) return "";
          // If it's already in HH:mm format, return as is
          if (/^\d{2}:\d{2}$/.test(timeString)) {
            return timeString;
          }
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

        // Get classroom names for the locaux field
        const classroomNames = exam.classrooms
          .map((id) => {
            const classroom = mockClassrooms.find((c) => c.id === id);
            return classroom ? classroom.name : id;
          })
          .join(", ");

        // Get supervisor names for the superviseurs field
        const supervisorNames = exam.supervisors
          .map((id) => {
            const supervisor = mockTeachers.find((t) => t.id === id);
            return supervisor
              ? `${supervisor.firstName} ${supervisor.lastName}`
              : id;
          })
          .join(", ");

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
          locaux: classroomNames,
          superviseurs: supervisorNames,
          classroom_ids: exam.classrooms.map((id) => parseInt(id, 10)),
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
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800",
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
      // Only show error toast if it's not a successful update
      if (
        !(
          error instanceof Error && error.message.includes("Invalid time value")
        )
      ) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to save exam",
          variant: "destructive",
        });
      }
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-lg">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Exam Details
            </DialogTitle>
            {selectedExam && (
              <p className="text-gray-500 font-medium">{selectedExam.module}</p>
            )}
          </DialogHeader>
          {selectedExam && (
            <div className="space-y-6 py-2">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm uppercase text-gray-500 font-medium mb-1">
                      Program Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cycle:</span>
                        <span className="font-medium">
                          {selectedExam.cycle}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Filière:</span>
                        <span className="font-medium">
                          {selectedExam.filiere}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm uppercase text-gray-500 font-medium mb-1">
                      Location
                    </h3>
                    <div className="space-y-1">
                      <p className="font-medium text-gray-800">
                        {getClassroomNames(selectedExam.classrooms)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm uppercase text-gray-500 font-medium mb-1">
                      Schedule
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-5 mr-2 text-gray-400">
                          <CalendarIcon className="h-4 w-4" />
                        </div>
                        <span className="text-gray-800">
                          {selectedExam.date &&
                            format(new Date(selectedExam.date), "PPP")}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-5 mr-2 text-gray-400">
                          <ClockIcon className="h-4 w-4" />
                        </div>
                        <span className="text-gray-800">
                          {selectedExam.startTime} ({selectedExam.duration}{" "}
                          minutes)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm uppercase text-gray-500 font-medium mb-1">
                      Supervision
                    </h3>
                    <div className="space-y-1">
                      <p className="font-medium text-gray-800">
                        {getTeacherNames(selectedExam.supervisors)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowStudents(!showStudents)}
                  className="w-full flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50"
                >
                  {showStudents ? (
                    <>
                      <ChevronUpIcon className="h-4 w-4" />
                      Hide Student List
                    </>
                  ) : (
                    <>
                      <ChevronDownIcon className="h-4 w-4" />
                      Show Student List ({selectedExam.students.length})
                    </>
                  )}
                </Button>

                {showStudents && (
                  <div className="mt-4 bg-gray-50 p-4 rounded-md">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm uppercase text-gray-500 font-medium">
                        Students
                      </h3>
                      <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                        {selectedExam.students.length} total
                      </span>
                    </div>
                    <div className="max-h-64 overflow-y-auto pr-2">
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {getStudentNames(selectedExam.students).map(
                          (student, index) => (
                            <li
                              key={index}
                              className="text-sm py-1 px-2 border-b border-gray-100 flex items-center"
                            >
                              <UserIcon className="h-3 w-3 text-gray-400 mr-2" />
                              {student}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
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
