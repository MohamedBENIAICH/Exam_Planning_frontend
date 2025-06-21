// Use an environment variable if available, or default to localhost
const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000/api";

/**
 * Create a new classroom
 * @param {Object} classroomData - Classroom data to create
 * @returns {Promise<Object>} - Promise that resolves to the created classroom
 */
export const createClassroom = async (classroomData) => {
  try {
    // Ensure we have the required fields with proper fallbacks
    const formattedData = {
      nom_du_local: classroomData.nom_du_local || classroomData.name,
      // Map batiment to departement since that's what the form is sending
      departement: classroomData.departement || classroomData.batiment,
      capacite: parseInt(classroomData.capacite || classroomData.capacity, 10),
      // Handle equipment - ensure it's an array
      liste_des_equipements: Array.isArray(classroomData.equipements) 
        ? classroomData.equipements 
        : (classroomData.equipements ? [classroomData.equipements] : [])
    };
    
    // Log the data being sent for debugging
    console.log('Form data before sending:', {
      ...formattedData,
      // Log the original data for comparison
      originalData: {
        nom_du_local: classroomData.nom_du_local,
        name: classroomData.name,
        departement: classroomData.departement,
        batiment: classroomData.batiment,
        capacite: classroomData.capacite,
        capacity: classroomData.capacity,
        equipements: classroomData.equipements
      }
    });

    console.log("Sending data to API:", formattedData);
    console.log("API URL:", `${API_URL}/classrooms`);

    const response = await fetch(`${API_URL}/classrooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(formattedData),
    });

    let responseData;
    try {
      responseData = await response.json();
      console.log("API Response:", responseData);
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      throw new Error("Invalid response from server");
    }

    if (!response.ok) {
      // If the response has validation errors
      if (response.status === 422 && responseData.errors) {
        throw new Error(JSON.stringify(responseData.errors));
      }
      // For other errors
      const errorMessage =
        responseData.message ||
        responseData.error ||
        `Server error (${response.status})`;
      throw new Error(errorMessage);
    }

    return responseData;
  } catch (error) {
    console.error("Failed to create classroom:", error);
    // Re-throw the error with more context
    throw new Error(`Failed to create classroom: ${error.message}`);
  }
};

/**
 * Get all classrooms
 * @returns {Promise<Array>} - Promise that resolves to an array of classrooms
 */
export const getAllClassrooms = async () => {
  try {
    const response = await fetch(`${API_URL}/classrooms`);

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();

    // Convert backend data format to frontend format
    if (data.status === "success" && Array.isArray(data.data)) {
      return data.data.map((classroom) => ({
        id: classroom.id,
        name: classroom.nom_du_local,
        building: classroom.departement,
        capacity: classroom.capacite,
        equipment: classroom.liste_des_equipements || [],
        isAvailable: classroom.disponible_pour_planification,
      }));
    }

    return [];
  } catch (error) {
    console.error("Failed to fetch classrooms:", error);
    throw error;
  }
};

/**
 * Update an existing classroom
 * @param {string} id - Classroom ID
 * @param {Object} classroomData - Updated classroom data
 * @returns {Promise<Object>} - Promise that resolves to the updated classroom
 */
export const updateClassroom = async (id, classroomData) => {
  try {
    // Format the data according to the backend API requirements
    const formattedData = {
      nom_du_local: classroomData.name,
      departement: classroomData.building,
      capacite: classroomData.capacity,
      liste_des_equipements: classroomData.equipment,
      disponible_pour_planification: classroomData.isAvailable,
    };

    console.log("Sending update data:", formattedData);

    const response = await fetch(`${API_URL}/classrooms/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(formattedData),
    });

    const responseData = await response.json();
    console.log("Update response:", responseData);

    if (!response.ok) {
      // Handle validation errors
      if (response.status === 422 && responseData.errors) {
        throw new Error(JSON.stringify(responseData.errors));
      }
      // Handle other errors
      throw new Error(responseData.message || `Error: ${response.status}`);
    }

    // Convert backend response to frontend format
    return {
      id: responseData.id.toString(),
      name: responseData.nom_du_local,
      building: responseData.departement,
      capacity: responseData.capacite,
      equipment: responseData.liste_des_equipements || [],
      isAvailable: responseData.disponible_pour_planification,
    };
  } catch (error) {
    console.error(`Failed to update classroom with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a classroom
 * @param {string} id - Classroom ID to delete
 * @returns {Promise<Object>} - Promise that resolves when the classroom is deleted
 */
export const deleteClassroom = async (id) => {
  try {
    const response = await fetch(`${API_URL}/classrooms/${id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });

    if (response.status === 204) {
      // 204 No Content is a successful response for DELETE
      return { status: "success", message: "Classroom deleted successfully" };
    }

    if (!response.ok) {
      // For other error statuses, try to parse the error message
      const errorData = await response.json();
      throw new Error(errorData.message || `Error: ${response.status}`);
    }

    // For other successful statuses, return the parsed response
    return await response.json();
  } catch (error) {
    console.error(`Failed to delete classroom with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Get available classrooms
 * @returns {Promise<Array>} - Promise that resolves to an array of available classrooms
 */
export const getAvailableClassrooms = async () => {
  try {
    const response = await fetch(`${API_URL}/classrooms/available`);

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();

    // Convert backend data format to frontend format
    if (data.status === "success" && Array.isArray(data.data)) {
      return data.data.map((classroom) => ({
        id: classroom.id.toString(),
        name: classroom.nom_du_local,
        building: classroom.departement,
        capacity: classroom.capacite,
        equipment: classroom.liste_des_equipements || [],
        isAvailable: classroom.disponible_pour_planification,
      }));
    }

    return [];
  } catch (error) {
    console.error("Failed to fetch available classrooms:", error);
    throw error;
  }
};

/**
 * Schedule an exam in a classroom
 * @param {Object} scheduleData - Exam scheduling data
 * @param {number} scheduleData.classroom_id - Classroom ID
 * @param {number} scheduleData.exam_id - Exam ID
 * @param {string} scheduleData.date_examen - Exam date (YYYY-MM-DD)
 * @param {string} scheduleData.heure_debut - Start time (HH:MM)
 * @param {string} scheduleData.heure_fin - End time (HH:MM)
 * @returns {Promise<Object>} - Promise that resolves to the scheduling response
 */
export const scheduleExam = async (scheduleData) => {
  try {
    console.log("=== Starting Exam Scheduling Process ===");
    console.log(
      "Schedule data being sent:",
      JSON.stringify(scheduleData, null, 2)
    );
    console.log("API URL:", `${API_URL}/classrooms/schedule-exam`);
    console.log("Request method: POST");
    console.log("Request headers:", {
      "Content-Type": "application/json",
    });

    const response = await fetch(`${API_URL}/classrooms/schedule-exam`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(scheduleData),
    });

    console.log("=== API Response Details ===");
    console.log("Response status:", response.status);
    console.log("Response status text:", response.statusText);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    const responseData = await response.json();
    console.log("Response data:", JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      console.error("=== Schedule Exam Failed ===");
      console.error("Status code:", response.status);
      console.error("Error response:", responseData);
      throw new Error(responseData.message || `Error: ${response.status}`);
    }

    console.log("=== Schedule Exam Successful ===");
    console.log(
      "Exam scheduled successfully for classroom:",
      scheduleData.classroom_id
    );
    return responseData;
  } catch (error) {
    console.error("=== Schedule Exam Error ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error(
      "Schedule data that caused the error:",
      JSON.stringify(scheduleData, null, 2)
    );
    throw error;
  }
};
