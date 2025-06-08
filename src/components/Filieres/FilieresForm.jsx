import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  filiere_intitule: z.string().min(1, "Le nom de la filière est requis"),
  id_formation: z.string().min(1, "La formation est requise"),
  id_departement: z.string().min(1, "Le département est requis"),
});

const FilieresForm = ({ onSubmit, onCancel, initialValues }) => {
  const { toast } = useToast();
  const [formations, setFormations] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [loadingFormations, setLoadingFormations] = useState(false);
  const [loadingDepartements, setLoadingDepartements] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues || {
      filiere_intitule: "",
      id_formation: "",
      id_departement: "",
    },
  });

  useEffect(() => {
    const fetchFormations = async () => {
      setLoadingFormations(true);
      try {
        const response = await fetch("http://127.0.0.1:8000/api/formations");
        const data = await response.json();
        if (Array.isArray(data)) {
          setFormations(data);
        } else if (data.data && Array.isArray(data.data)) {
          setFormations(data.data);
        }
      } catch {
        setFormations([]);
      } finally {
        setLoadingFormations(false);
      }
    };
    const fetchDepartements = async () => {
      setLoadingDepartements(true);
      try {
        const response = await fetch("http://127.0.0.1:8000/api/departements");
        const data = await response.json();
        if (Array.isArray(data)) {
          setDepartements(data);
        } else if (data.data && Array.isArray(data.data)) {
          setDepartements(data.data);
        }
      } catch {
        setDepartements([]);
      } finally {
        setLoadingDepartements(false);
      }
    };
    fetchFormations();
    fetchDepartements();
  }, []);

  const handleFormSubmit = async (values) => {
    try {
      let response;
      if (initialValues && initialValues.id_filiere) {
        // Update
        response = await fetch(
          `http://127.0.0.1:8000/api/filieres/${initialValues.id_filiere}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...values,
              id_formation: Number(values.id_formation),
              id_departement: Number(values.id_departement),
            }),
          }
        );
      } else {
        // Create
        response = await fetch("http://127.0.0.1:8000/api/filieres", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...values,
            id_formation: Number(values.id_formation),
            id_departement: Number(values.id_departement),
          }),
        });
      }

      const data = await response.json();

      // Only check response.ok
      if (!response.ok) {
        throw new Error(
          data.message ||
            (initialValues
              ? "Erreur lors de la modification de la filière"
              : "Erreur lors de la création de la filière")
        );
      }

      await onSubmit?.(data);
      toast({
        title: "Succès",
        description: initialValues
          ? "La filière a été modifiée avec succès."
          : "La filière a été ajoutée avec succès.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la soumission",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-6 w-full mx-auto bg-white rounded-lg shadow p-6"
        style={{ maxWidth: 600, minHeight: 200 }}
      >
        <FormField
          control={form.control}
          name="filiere_intitule"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la filière</FormLabel>
              <FormControl>
                <Input placeholder="Nom de la filière" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="id_formation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Formation</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={loadingFormations}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une formation" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loadingFormations ? (
                    <div className="p-2 text-center text-slate-500">
                      Chargement des formations...
                    </div>
                  ) : formations.length > 0 ? (
                    formations.map((formation) => (
                      <SelectItem
                        key={formation.id_formation || formation.id}
                        value={String(formation.id_formation || formation.id)}
                      >
                        {formation.formation_intitule}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-slate-500">
                      Aucune formation disponible
                    </div>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="id_departement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Département</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={loadingDepartements}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un département" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loadingDepartements ? (
                    <div className="p-2 text-center text-slate-500">
                      Chargement des départements...
                    </div>
                  ) : departements.length > 0 ? (
                    departements.map((dep) => (
                      <SelectItem
                        key={dep.id_departement || dep.id}
                        value={String(dep.id_departement || dep.id)}
                      >
                        {dep.nom_departement}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-slate-500">
                      Aucun département disponible
                    </div>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Enregistrer
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default FilieresForm;
