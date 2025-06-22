import { API_URL } from "./api";

/**
 * Get students by their IDs
 * @param {string[]} studentIds - Array of student IDs
 * @returns {Promise<Object[]>} - Promise that resolves to an array of student objects
 */
export const getStudentsByIds = async (studentIds) => {
  try {
    const response = await fetch(`${API_URL}/students`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ student_ids: studentIds }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "success") {
      return data.data;
    }

    throw new Error(data.message || "Failed to fetch students");
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
};
