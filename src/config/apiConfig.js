/**
 * Configuration centralisée de l'API
 *
 * Ce fichier contient tous les endpoints de l'API en un seul endroit.
 * Cela facilite la maintenance et évite la répétition des URLs.
 */

// URL de base de l'API (configurée via les variables d'environnement)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

/**
 * Endpoints de l'API organisés par ressource
 */
export const API_ENDPOINTS = {
  // Endpoints pour les examens
  exams: {
    base: "/exams",
    getAll: "/exams",
    getById: (id) => `/exams/${id}`,
    create: "/exams",
    update: (id) => `/exams/${id}`,
    delete: (id) => `/exams/${id}`,
    latest: "/exams/latest",
    upcoming: "/exams/upcoming",
    countPassed: "/exams/count-passed",
    downloadPdf: (id) => `/exams/${id}/download-pdf`,
  },

  // Endpoints pour les salles de classe
  classrooms: {
    base: "/classrooms",
    getAll: "/classrooms",
    getById: (id) => `/classrooms/${id}`,
    create: "/classrooms",
    update: (id) => `/classrooms/${id}`,
    delete: (id) => `/classrooms/${id}`,
    available: "/classrooms/available",
    scheduleExam: "/classrooms/schedule-exam",
  },

  // Endpoints pour les formations
  formations: {
    base: "/formations",
    getAll: "/formations",
    getFilieres: (formationId) => `/formations/${formationId}/filieres`,
    getModules: (formationId, filiereId, semester) =>
      `/formations/${formationId}/filieres/${filiereId}/modules/${semester}`,
  },

  // Endpoints pour les superviseurs
  supervisors: {
    getDepartments: "/superviseurs/departements",
    getByDepartment: "/superviseurs/by-departement",
  },

  // Endpoints pour les étudiants
  students: {
    getByIds: "/students",
  },

  // Endpoints pour les départements
  departments: {
    getAll: "/departements",
  },
};

/**
 * Configuration des headers par défaut
 */
export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "Accept": "application/json",
};

/**
 * Configuration du timeout des requêtes (en millisecondes)
 */
export const REQUEST_TIMEOUT = 30000; // 30 secondes
