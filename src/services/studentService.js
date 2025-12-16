import api from "./api";

/**
 * Get students by their IDs
 * @param {string[]} studentIds - Array of student IDs
 * @returns {Promise<Object[]>} - Promise that resolves to an array of student objects
 */
export const getStudentsByIds = async (studentIds) => {
  try {
    const response = await api.post("/students", { student_ids: studentIds });
    const data = response.data;

    if (data.status === "success") {
      return data.data;
    }

    throw new Error(data.message || "Failed to fetch students");
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
};
