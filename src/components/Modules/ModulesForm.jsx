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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  module_intitule: z.string().min(1, "Le nom du module est requis"),
  semestre: z.string().min(1, "Le semestre est requis"),
  id_formation: z.string().min(1, "La formation est requise"),
  id_filiere: z.string().min(1, "La filière est requise"),
});

const ModulesForm = ({ onSubmit, onCancel, initialValues }) => {
  const { toast } = useToast();
  const [formations, setFormations] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [loadingFormations, setLoadingFormations] = useState(false);
  const [loadingFilieres, setLoadingFilieres] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues || {
      module_intitule: "",
      semestre: "",
      id_formation: "",
      id_filiere: "",
    },
  });

  // Fetch formations on mount
  useEffect(() => {
    const fetchFormations = async () => {
      setLoadingFormations(true);
      try {
        const response = await fetch("http://127.0.0.1:8000/api/formations/");
        const data = await response.json();
        if (Array.isArray(data)) {
          setFormations(data);
        } else if (data.data && Array.isArray(data.data)) {
          setFormations(data.data);
        } else {
          setFormations([]);
        }
      } catch {
        setFormations([]);
      } finally {
        setLoadingFormations(false);
      }
    };
    fetchFormations();
  }, []);

  // Fetch filieres when id_formation changes
  useEffect(() => {
    const id_formation = form.watch("id_formation");
    if (!id_formation) {
      setFilieres([]);
      return;
    }
    setLoadingFilieres(true);
    fetch(`http://127.0.0.1:8000/api/formations/${id_formation}/filieres`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFilieres(data);
        } else if (data.data && Array.isArray(data.data)) {
          setFilieres(data.data);
        } else {
          setFilieres([]);
        }
      })
      .catch(() => setFilieres([]))
      .finally(() => setLoadingFilieres(false));
  }, [form.watch("id_formation")]);

  const handleFormSubmit = async (values) => {
    try {
      const payload = {
        module_intitule: values.module_intitule,
        semestre: values.semestre,
        filieres: [Number(values.id_filiere)],
      };
      console.log("Données envoyées au backend :", payload); // <-- Ajout du log

      const response = await fetch("http://127.0.0.1:8000/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de la création du module");
      }

      await onSubmit?.(data);
      toast({
        title: "Succès",
        description: "Le module a été ajouté avec succès.",
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
          name="module_intitule"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du module</FormLabel>
              <FormControl>
                <Input placeholder="Nom du module" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="semestre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Semestre</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un semestre" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <SelectItem key={num} value={`${num}`}>
                      Semestre {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue("id_filiere", ""); // reset filiere when formation changes
                }}
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
                        key={formation.id_formation}
                        value={String(formation.id_formation)}
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
          name="id_filiere"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Filière</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={loadingFilieres || !form.watch("id_formation")}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une filière" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loadingFilieres ? (
                    <div className="p-2 text-center text-slate-500">
                      Chargement des filières...
                    </div>
                  ) : filieres.length > 0 ? (
                    filieres.map((filiere) => (
                      <SelectItem
                        key={filiere.id_filiere}
                        value={String(filiere.id_filiere)}
                      >
                        {filiere.filiere_intitule}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-slate-500">
                      Aucune filière disponible
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

export default ModulesForm;
