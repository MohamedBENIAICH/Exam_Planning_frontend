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
  email: z.string().email("Email invalide"),
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  service: z.string().min(1, "Le service est requis"),
  poste: z.string().min(1, "Le poste est requis"),
});

const SuperviseursForm = ({ onSubmit, onCancel, initialValues }) => {
  const { toast } = useToast();
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues || {
      email: "",
      nom: "",
      prenom: "",
      service: "",
      poste: "",
    },
  });

  useEffect(() => {
    const loadServices = async () => {
      setLoadingServices(true);
      try {
        const response = await fetch(
          "http://localhost:8000/api/superviseurs/service"
        );
        const data = await response.json();
        if (data.status === "success") {
          setServices(data.data);
        } else {
          toast({
            title: "Erreur",
            description: "Impossible de charger les services",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les services",
          variant: "destructive",
        });
      } finally {
        setLoadingServices(false);
      }
    };
    loadServices();
  }, [toast]);

  const handleFormSubmit = async (values) => {
    try {
      let response;
      if (initialValues && initialValues.id) {
        // Mode édition : PUT
        response = await fetch(
          `http://localhost:8000/api/superviseurs/${initialValues.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          }
        );
      } else {
        // Mode création : POST
        response = await fetch("http://localhost:8000/api/superviseurs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            (initialValues
              ? "Erreur lors de la modification du superviseur"
              : "Erreur lors de la création du superviseur")
        );
      }

      await onSubmit?.(values);
      toast({
        title: "Succès",
        description: initialValues
          ? "Le superviseur a été modifié avec succès."
          : "Le superviseur a été ajouté avec succès.",
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
        style={{ maxWidth: 600, minHeight: 500 }}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="exemple@domaine.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input placeholder="Nom" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="prenom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prénom</FormLabel>
              <FormControl>
                <Input placeholder="Prénom" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="service"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={loadingServices}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un service" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loadingServices ? (
                    <div className="p-2 text-center text-slate-500">
                      Chargement des services...
                    </div>
                  ) : services.length > 0 ? (
                    services.map((srv) => (
                      <SelectItem key={srv} value={srv}>
                        {srv}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-slate-500">
                      Aucun service disponible
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
          name="poste"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Poste</FormLabel>
              <FormControl>
                <Input placeholder="Poste" {...field} />
              </FormControl>
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

export default SuperviseursForm;
