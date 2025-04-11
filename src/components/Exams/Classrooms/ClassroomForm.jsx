import React from "react";
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

const formSchema = z.object({
  name: z.string().min(1, "Le nom de la salle est requis"),
  building: z.string().min(1, "Le nom du bâtiment est requis"),
  capacity: z.coerce.number().min(1, "La capacité doit être d'au moins 1"),
  equipment: z.array(z.string()),
  isAvailable: z.boolean().default(true),
});

const equipmentOptions = [
  { id: "projector", label: "Projecteur" },
  { id: "whiteboard", label: "Tableau blanc" },
  { id: "computer", label: "Ordinateur" },
  { id: "tv", label: "Télévision" },
  { id: "microphone", label: "Microphone" },
  { id: "speakers", label: "Haut-parleurs" },
];

const ClassroomForm = ({ classroom, onSubmit, onCancel }) => {
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

  const handleSubmit = (values) => {
    // Ensure all required properties are present
    const completeClassroom = {
      id: classroom?.id || `classroom-${Date.now()}`,
      name: values.name,
      building: values.building,
      capacity: values.capacity,
      equipment: values.equipment,
      isAvailable: values.isAvailable,
    };

    onSubmit(completeClassroom);
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
                  <Input placeholder="ex. A101" {...field} />
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
                <FormControl>
                  <Input placeholder="ex. Bâtiment des Sciences" {...field} />
                </FormControl>
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
            {classroom ? "Mettre à jour la salle" : "Ajouter une salle"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ClassroomForm;
