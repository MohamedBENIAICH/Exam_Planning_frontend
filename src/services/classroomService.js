import api from "./api";

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

    console.log("Sending data to API:", formattedData);

    const response = await api.post("/classrooms", formattedData);
    return response.data;
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
    const response = await api.get("/classrooms");
    const data = response.data;

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

    const response = await api.put(`/classrooms/${id}`, formattedData);
    const responseData = response.data;

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
    const response = await api.delete(`/classrooms/${id}`);

    if (response.status === 204) {
      return { status: "success", message: "Classroom deleted successfully" };
    }

    return response.data;
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
    const response = await api.get("/classrooms/available");
    const data = response.data;

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

    const response = await api.post("/classrooms/schedule-exam", scheduleData);
    const responseData = response.data;

    console.log("=== Schedule Exam Successful ===");
    return responseData;
  } catch (error) {
    console.error("=== Schedule Exam Error ===");
    console.error("Error message:", error.message);
    throw error;
  }
};
