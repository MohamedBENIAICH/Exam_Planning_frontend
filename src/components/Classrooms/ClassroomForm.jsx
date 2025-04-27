import React, { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { createClassroom } from "@/services/classroomService";
import { getDepartments } from "@/services/departmentService";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(1, "Le nom de la salle est requis"),
  building: z.string().min(1, "Le nom du bâtiment est requis"),
  capacity: z.coerce.number().min(1, "La capacité doit être au moins de 1"),
  equipment: z.array(z.string()),
  isAvailable: z.boolean().default(true),
});

const equipmentOptions = [
  { id: "projector", label: "Projecteur" },
  { id: "whiteboard", label: "Tableau blanc" },
  { id: "computer", label: "Ordinateur" },
  { id: "tv", label: "Television" },
  { id: "microphone", label: "Microphone" },
  { id: "speakers", label: "Haut-parleurs" },
];

const ClassroomForm = ({ classroom, onSubmit, onCancel }) => {
  const { toast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await getDepartments();
        if (response.status === "success") {
          setDepartments(response.data);
        }
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les départements",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartments();
  }, [toast]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: classroom
      ? {
          name: classroom.name,
          building: classroom.building,
          capacity: classroom.capacity,
          equipment: classroom.equipment,
          isAvailable: classroom.isAvailable,
        }
      : {
          name: "",
          building: "",
          capacity: 30,
          equipment: [],
          isAvailable: true,
        },
  });

  const handleSubmit = async (values) => {
    try {
      if (classroom) {
        // Handle update case
        onSubmit(values);
      } else {
        // Handle create case
        console.log("Submitting form with values:", values);
        const response = await createClassroom(values);
        console.log("Create classroom response:", response);

        if (response.status === "success") {
          toast({
            title: "Salle créée",
            description: "La salle a été créée avec succès",
          });
          onSubmit({
            id: response.data.id,
            name: values.name,
            building: values.building,
            capacity: values.capacity,
            equipment: values.equipment,
            isAvailable: values.isAvailable,
          });
        } else {
          // Handle validation errors from the backend
          if (response.errors) {
            const errorMessages = Object.entries(response.errors)
              .map(
                ([field, messages]) =>
                  `${field}: ${
                    Array.isArray(messages) ? messages.join(", ") : messages
                  }`
              )
              .join("\n");
            throw new Error(errorMessages);
          }
          throw new Error(
            response.message || "Erreur lors de la création de la salle"
          );
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        response: error.response,
      });

      // Try to parse the error message if it's a JSON string
      let errorMessage = error.message;
      try {
        const parsedError = JSON.parse(error.message);
        if (typeof parsedError === "object") {
          errorMessage = Object.entries(parsedError)
            .map(
              ([field, messages]) =>
                `${field}: ${
                  Array.isArray(messages) ? messages.join(", ") : messages
                }`
            )
            .join("\n");
        }
      } catch (e) {
        // If parsing fails, use the original error message
        console.log("Error message is not JSON:", e);
      }

      // Show error in toast
      toast({
        title: "Erreur",
        description:
          errorMessage ||
          "Une erreur est survenue lors de la soumission du formulaire",
        variant: "destructive",
        duration: 5000, // Show for 5 seconds
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom de la salle</FormLabel>
                <FormControl>
                  <Input placeholder="ex: A101" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="building"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bâtiment</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un département" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id_departement} value={dept.nom_departement}>
                        {dept.nom_departement}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacité</FormLabel>
              <FormControl>
                <Input type="number" min="1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="equipment"
          render={() => (
            <FormItem>
              <div className="mb-2">
                <FormLabel>Équipement</FormLabel>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {equipmentOptions.map((option) => (
                  <FormField
                    key={option.id}
                    control={form.control}
                    name="equipment"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={option.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(option.label)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([
                                      ...field.value,
                                      option.label,
                                    ])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== option.label
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            {option.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isAvailable"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Disponible pour réservation</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            {classroom ? "Mettre à jour" : "Ajouter la salle"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ClassroomForm;
