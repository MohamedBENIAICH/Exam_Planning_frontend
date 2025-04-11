import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, Users, Building, Upload } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  mockClassrooms,
  mockTeachers,
  mockStudents,
  mockFilieres,
} from "@/lib/mockData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ImportCSV from "../Students/ImportCSV";

const formSchema = z.object({
  cycle: z.string().min(1, "Le cycle est requis"),
  filiere: z.string().min(1, "La filière est requise"),
  module: z.string().min(1, "Le module est requis"),
  date: z.date({
    required_error: "La date d'examen est requise",
  }),
  startTime: z.string().min(1, "L'heure de début est requise"),
  duration: z.coerce
    .number()
    .min(30, "La durée doit être d'au moins 30 minutes"),
  classrooms: z.array(z.string()).min(1, "Au moins une salle est requise"),
  supervisors: z.array(z.string()).min(1, "Au moins un superviseur est requis"),
  students: z.array(z.string()),
});

const ExamForm = ({ exam, onSubmit, onCancel }) => {
  const [selectedStudents, setSelectedStudents] = useState(
    exam?.students || []
  );
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [showStudentDialog, setShowStudentDialog] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: exam
      ? {
          cycle: exam.cycle,
          filiere: exam.filiere,
          module: exam.module,
          date: exam.date ? new Date(exam.date) : new Date(),
          startTime: exam.startTime,
          duration: exam.duration,
          classrooms: exam.classrooms,
          supervisors: exam.supervisors,
          students: exam.students,
        }
      : {
          cycle: "",
          filiere: "",
          module: "",
          date: new Date(),
          startTime: "09:00",
          duration: 120,
          classrooms: [],
          supervisors: [],
          students: [],
        },
  });

  // Sync selectedStudents with form's students field
  useEffect(() => {
    form.setValue("students", selectedStudents);
  }, [selectedStudents, form]);

  const handleSubmit = (values) => {
    console.log("Form submitted with values:", values);

    // Validate required fields
    if (
      !values.cycle ||
      !values.filiere ||
      !values.module ||
      !values.date ||
      !values.startTime ||
      !values.duration ||
      !values.classrooms ||
      !values.supervisors ||
      !values.students
    ) {
      console.error("Missing required fields");
      return;
    }

    const completeExam = {
      id: exam?.id || `exam-${Date.now()}`,
      cycle: values.cycle,
      filiere: values.filiere,
      module: values.module,
      date: values.date,
      startTime: values.startTime,
      duration: values.duration,
      classrooms: values.classrooms,
      supervisors: values.supervisors,
      students: values.students,
    };

    onSubmit(completeExam);
  };

  const handleStudentSelection = (studentId) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const selectAllStudents = () => {
    setSelectedStudents(mockStudents.map((s) => s.id));
  };

  const clearStudentSelection = () => {
    setSelectedStudents([]);
  };

  const handleImportComplete = (importedStudents) => {
    setSelectedStudents(importedStudents.map((student) => student.id));
    setShowStudentDialog(false);
  };

  // Function to directly open CSV import when clicking on select students
  const handleSelectStudentsClick = () => {
    // We'll directly show the import dialog instead of the student selection dialog
    setShowStudentDialog(true);
  };

  return (
    <Form {...form}>
      <div className="flex flex-col h-full max-h-[85vh]">
        <div className="flex-1 overflow-y-auto pr-4 pb-6">
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Top section with basic exam info */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-lg font-medium mb-4">Informations de base</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cycle Field */}
                <FormField
                  control={form.control}
                  name="cycle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cycle</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Sélectionnez un cycle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tranc common">
                            Tranc Common
                          </SelectItem>
                          <SelectItem value="ingénieure">Ingénieure</SelectItem>
                          <SelectItem value="master">Master</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Filiere Field */}
                <FormField
                  control={form.control}
                  name="filiere"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Filière</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Sélectionnez une filière" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockFilieres.map((filiere) => (
                            <SelectItem key={filiere.id} value={filiere.id}>
                              {filiere.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Module Field */}
                <FormField
                  control={form.control}
                  name="module"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Module</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Entrez le module"
                          {...field}
                          className="bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Schedule section */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-lg font-medium mb-4">Planification</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date Field */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date d'examen</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal bg-white",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Choisissez une date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Start Time Field */}
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heure de début</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-slate-400" />
                          <Input type="time" {...field} className="bg-white" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Duration Field */}
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durée (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="30"
                          {...field}
                          className="bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Classrooms Field */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
              <FormField
                control={form.control}
                name="classrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1 text-lg font-medium mb-4">
                      <Building className="h-5 w-5" />
                      Les locaux
                    </FormLabel>
                    <div className="mt-2 space-y-2 max-h-60 overflow-y-auto pr-2 py-2">
                      {mockClassrooms
                        .filter((classroom) => classroom.isAvailable)
                        .map((classroom) => (
                          <div
                            key={classroom.id}
                            className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-slate-100"
                          >
                            <div className="flex items-start gap-2">
                              <Checkbox
                                id={`classroom-${classroom.id}`}
                                checked={field.value.includes(classroom.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([
                                      ...field.value,
                                      classroom.id,
                                    ]);
                                  } else {
                                    field.onChange(
                                      field.value.filter(
                                        (id) => id !== classroom.id
                                      )
                                    );
                                  }
                                }}
                              />
                              <label
                                htmlFor={`classroom-${classroom.id}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {classroom.name} ({classroom.building}) -
                                Capacité: {classroom.capacity}
                              </label>
                            </div>
                            <span className="text-green-600 font-medium text-sm px-2 py-1 bg-green-50 rounded-full">
                              Disponible
                            </span>
                          </div>
                        ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Supervisors Field */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
              <FormField
                control={form.control}
                name="supervisors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1 text-lg font-medium mb-4">
                      <Users className="h-5 w-5" />
                      Les superviseurs
                    </FormLabel>
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-slate-700">
                        Superviseurs administratifs
                      </h4>
                      <Select
                        onValueChange={(value) => {
                          if (field.value.includes(value)) {
                            field.onChange(
                              field.value.filter((id) => id !== value)
                            );
                          } else {
                            field.onChange([...field.value, value]);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full mt-2 bg-white">
                          <SelectValue placeholder="Sélectionnez un superviseur administratif" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockTeachers
                            .filter(
                              (teacher) => teacher.type === "administratif"
                            )
                            .map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.firstName} {teacher.lastName} (
                                {teacher.department})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-slate-700">
                        Superviseurs normaux
                      </h4>
                      <Select
                        onValueChange={(value) => setSelectedDepartment(value)}
                        value={selectedDepartment}
                      >
                        <SelectTrigger className="w-full mt-2 bg-white">
                          <SelectValue placeholder="Sélectionnez un département" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(
                            new Set(
                              mockTeachers.map((teacher) => teacher.department)
                            )
                          ).map((department) => (
                            <SelectItem key={department} value={department}>
                              {department}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedDepartment && (
                      <div className="mt-4">
                        <Select
                          onValueChange={(value) => {
                            if (field.value.includes(value)) {
                              field.onChange(
                                field.value.filter((id) => id !== value)
                              );
                            } else {
                              field.onChange([...field.value, value]);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full mt-2 bg-white">
                            <SelectValue placeholder="Sélectionnez un superviseur normal" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockTeachers
                              .filter(
                                (teacher) =>
                                  teacher.type === "normal" &&
                                  teacher.department === selectedDepartment
                              )
                              .map((teacher) => (
                                <SelectItem key={teacher.id} value={teacher.id}>
                                  {teacher.firstName} {teacher.lastName} (
                                  {teacher.department})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2">
                      <h4 className="text-sm font-medium text-slate-700 sticky top-0 bg-slate-50 py-1">
                        Superviseurs sélectionnés ({field.value.length})
                      </h4>
                      {mockTeachers
                        .filter((teacher) => field.value.includes(teacher.id))
                        .map((teacher) => (
                          <div
                            key={teacher.id}
                            className="flex items-start gap-2 p-2 rounded-md hover:bg-slate-100"
                          >
                            <Checkbox
                              id={`teacher-${teacher.id}`}
                              checked={field.value.includes(teacher.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, teacher.id]);
                                } else {
                                  field.onChange(
                                    field.value.filter(
                                      (id) => id !== teacher.id
                                    )
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={`teacher-${teacher.id}`}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {teacher.firstName} {teacher.lastName} (
                              {teacher.department})
                            </label>
                          </div>
                        ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Students Field */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
              <FormField
                control={form.control}
                name="students"
                render={() => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1 text-lg font-medium mb-4">
                      <Users className="h-5 w-5" />
                      Étudiants
                    </FormLabel>
                    <Button
                      variant="outline"
                      type="button"
                      className="w-full bg-white flex items-center justify-center gap-2"
                      onClick={handleSelectStudentsClick}
                    >
                      <Upload className="h-4 w-4" />
                      {selectedStudents.length === 0
                        ? "Importer la liste d'étudiants (CSV)"
                        : `${selectedStudents.length} Étudiants importés`}
                    </Button>

                    {/* Direct import dialog */}
                    <Dialog
                      open={showStudentDialog}
                      onOpenChange={setShowStudentDialog}
                    >
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                          <DialogTitle>
                            Importer la liste d'étudiants
                          </DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-auto">
                          <ImportCSV onImportComplete={handleImportComplete} />
                        </div>
                      </DialogContent>
                    </Dialog>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </div>

        {/* Form Footer - Fixed at bottom */}
        <div className="flex justify-end gap-2 mt-4 py-4 border-t bg-white sticky bottom-0">
          <Button variant="outline" type="button" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(handleSubmit)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {exam ? "Mettre à jour l'examen" : "Planifier l'examen"}
          </Button>
        </div>
      </div>
    </Form>
  );
};

export default ExamForm;
