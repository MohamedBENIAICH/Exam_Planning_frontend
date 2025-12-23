import React, { useState, useEffect } from "react";
import { z } from "zod";
import api from "@/services/api";
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
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  formation_intitule: z.string().min(1, "Le nom de la formation est requis"),
});

const FormationsForm = ({ onSubmit, onCancel, initialValues }) => {
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues || {
      formation_intitule: "",
    },
  });

  // Keep form in sync when editing different formations
  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    }
  }, [initialValues, form]);

  const handleFormSubmit = async (values) => {
    try {
      let response;
      const targetId =
        initialValues?.id_formation || initialValues?.id || undefined;

      if (targetId) {
        // Update existing formation (accept both id_formation and id)
        response = await api.put(`/formations/${targetId}`, values);
      } else {
        // Create
        response = await api.post("/formations", values);
      }

      const data = response.data;

      if (data.status !== "success") {
        throw new Error(
          data.message ||
            (initialValues
              ? "Erreur lors de la modification de la formation"
              : "Erreur lors de la création de la formation")
        );
      }

      // Ensure we always send back a usable formation object
      const returnedFormation =
        data.data ||
        (targetId
          ? { ...initialValues, ...values, id_formation: targetId }
          : { ...values });

      await onSubmit?.(returnedFormation);
      toast({
        title: "Succès",
        description: initialValues
          ? "La formation a été modifiée avec succès."
          : "La formation a été ajoutée avec succès.",
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
          name="formation_intitule"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la formation</FormLabel>
              <FormControl>
                <Input placeholder="Nom de la formation" {...field} />
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

export default FormationsForm;
