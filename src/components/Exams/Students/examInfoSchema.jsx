import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, Building } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle } from "lucide-react";

// Schema de validation pour les informations d'examen
const examInfoSchema = z.object({
  code: z.string().min(1, "Le code de l'examen est requis"),
  title: z.string().min(1, "Le titre de l'examen est requis"),
  date: z.date({
    required_error: "La date d'examen est requise",
  }),
  startTime: z.string().min(1, "L'heure de début est requise"),
  endTime: z.string().min(1, "L'heure de fin est requise"),
  classrooms: z.array(z.string()).min(1, "Au moins une salle est requise"),
});

const ExamInfoForm = ({
  initialExamInfo = null,
  classrooms = [],
  onSubmit,
  onCancel,
}) => {
  const [selectedClassrooms, setSelectedClassrooms] = useState(
    initialExamInfo?.classrooms || []
  );

  const form = useForm({
    resolver: zodResolver(examInfoSchema),
    defaultValues: initialExamInfo || {
      code: "",
      title: "",
      date: new Date(),
      startTime: "09:00",
      endTime: "11:00",
      classrooms: [],
    },
  });

  // Synchroniser les salles sélectionnées avec le formulaire
  useEffect(() => {
    form.setValue("classrooms", selectedClassrooms);
  }, [selectedClassrooms, form]);

  const handleClassroomSelection = (classroomId) => {
    setSelectedClassrooms((prev) => {
      if (prev.includes(classroomId)) {
        return prev.filter((id) => id !== classroomId);
      } else {
        return [...prev, classroomId];
      }
    });
  };

  const handleSubmit = (values) => {
    // Vérification que tous les champs requis sont remplis
    if (
      !values.code ||
      !values.title ||
      !values.date ||
      !values.startTime ||
      !values.endTime ||
      values.classrooms.length === 0
    ) {
      console.error("Tous les champs sont obligatoires");
      return;
    }

    onSubmit(values);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Information de l'examen</CardTitle>
        <CardDescription>
          Définissez les détails principaux de l'examen à programmer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Code de l'examen */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code de l'examen *</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: MATH101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Titre de l'examen */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre de l'examen *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ex: Mathématiques Avancées"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date de l'examen */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date d'examen *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
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

            {/* Heure de début */}
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heure de début *</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Input type="time" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Heure de fin */}
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heure de fin *</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Input type="time" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sélection des salles */}
            <FormField
              control={form.control}
              name="classrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    Salles d'examen *
                  </FormLabel>

                  {classrooms.length > 0 ? (
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {classrooms
                        .filter((classroom) => classroom.isAvailable)
                        .map((classroom) => (
                          <div
                            key={classroom.id}
                            className={`flex items-center justify-between p-3 rounded-md border ${
                              field.value.includes(classroom.id)
                                ? "border-primary bg-primary-foreground/10"
                                : "border-gray-200"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <Checkbox
                                id={`classroom-${classroom.id}`}
                                checked={field.value.includes(classroom.id)}
                                onCheckedChange={() => {
                                  handleClassroomSelection(classroom.id);
                                }}
                              />
                              <div>
                                <label
                                  htmlFor={`classroom-${classroom.id}`}
                                  className="font-medium cursor-pointer"
                                >
                                  {classroom.name}
                                </label>
                                <p className="text-sm text-muted-foreground">
                                  Bâtiment: {classroom.building} | Capacité:{" "}
                                  {classroom.capacity}
                                </p>
                                <div className="flex mt-1 gap-1 flex-wrap">
                                  {classroom.equipment?.map((item, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs bg-secondary px-2 py-0.5 rounded-full"
                                    >
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="p-4 border rounded-md text-center text-muted-foreground">
                      Aucune salle disponible
                    </div>
                  )}

                  {field.value.length === 0 && (
                    <div className="mt-4 p-2 bg-yellow-50 text-yellow-800 rounded-md flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span className="text-sm">
                        Au moins une salle doit être sélectionnée
                      </span>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Boutons d'action */}
            <div className="flex justify-end gap-2 pt-4">
              {onCancel && (
                <Button variant="outline" type="button" onClick={onCancel}>
                  Annuler
                </Button>
              )}
              <Button type="submit">Continuer</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ExamInfoForm;
