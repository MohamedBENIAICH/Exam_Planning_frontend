import axios from "axios";

// Use Vite's environment variable format
const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000/api";

/**
 * Get all departments
 * @returns {Promise<Array>} - Promise that resolves to an array of department names
 */
export const getDepartments = async () => {
  try {
    const response = await axios.get(`${API_URL}/superviseurs/departements`);
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
    const response = await axios.get(`${API_URL}/superviseurs/by-departement`, {
      params: { departement: department },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching supervisors by department:", error);
    throw error;
  }
};
