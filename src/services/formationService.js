import api from "./api";

/**
 * Get all formations
 * @returns {Promise<Array>} - Promise that resolves to an array of formations
 */
export const getFormations = async () => {
  try {
    const response = await api.get("/formations");
    const data = response.data;

    // Convert backend data format to frontend format
    if (data.status === "success" && Array.isArray(data.data)) {
      return data.data.map((formation) => ({
        id: formation.id_formation,
        name: formation.formation_intitule,
      }));
    }

    return [];
  } catch (error) {
    console.error("Failed to fetch formations:", error);
    throw error;
  }
};

/**
 * Get filieres by formation ID
 * @param {number} formationId - The ID of the formation
 * @returns {Promise<Array>} - Promise that resolves to an array of filieres
 */
export const getFilieresByFormation = async (formationId) => {
  try {
    const response = await api.get(`/formations/${formationId}/filieres`);
    const data = response.data;

    // Convert backend data format to frontend format
    if (data.status === "success" && Array.isArray(data.data)) {
      return data.data.map((filiere) => ({
        id: filiere.id_filiere,
        name: filiere.filiere_intitule,
        departmentId: filiere.id_departement,
        formationId: filiere.id_formation,
      }));
    }

    return [];
  } catch (error) {
    console.error("Failed to fetch filieres:", error);
    throw error;
  }
};

/**
 * Get modules by formation, filiere, and semester
 * @param {number} formationId - The ID of the formation
 * @param {number} filiereId - The ID of the filiere
 * @param {string} semester - The semester number
 * @returns {Promise<Array>} - Promise that resolves to an array of modules
 */
export const getModulesByFormationAndFiliere = async (
  formationId,
  filiereId,
  semester
) => {
  try {
    const response = await api.get(
      `/formations/${formationId}/filieres/${filiereId}/modules/${semester}`
    );
    const data = response.data;

    // Convert backend data format to frontend format
    if (data.status === "success" && Array.isArray(data.data)) {
      return data.data.map((module) => ({
        id: module.id_module,
        name: module.module_intitule,
        semester: module.semestre,
      }));
    }

    return [];
  } catch (error) {
    console.error("Failed to fetch modules:", error);
    throw error;
  }
};
