import api from "./api";

/**
 * Get all departments
 * @returns {Promise<Array>} - Promise that resolves to an array of department names
 */
export const getDepartments = async () => {
  try {
    const response = await api.get("/superviseurs/departements");
    return response.data;
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw error;
  }
};

/**
 * Get supervisors by department
 * @param {string} department - The department name
 * @returns {Promise} - Promise with the supervisors data
 */
export const getSupervisorsByDepartment = async (department) => {
  try {
    const response = await api.get("/superviseurs/by-departement", {
      params: { departement: department },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching supervisors by department:", error);
    throw error;
  }
};
