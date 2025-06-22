import axios from "axios";

const API_URL = "http://localhost:8000/api";

export const getDepartments = async () => {
  try {
    const response = await axios.get(`${API_URL}/departements`);
    return response.data;
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw error;
  }
};
