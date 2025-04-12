/**
 * Service to handle CRUD operations for exams
 */

// Use an environment variable if available, or default to localhost
// This approach works with various build systems
const API_URL =
  import.meta.env?.VITE_API_URL ||
  window.ENV_API_URL ||
  "http://localhost:8000/api";

/**
 * Get all exams
 * @returns {Promise<Array>} - Promise that resolves to an array of exams
 */
export const getAllExams = async () => {
  try {
    const response = await fetch(`${API_URL}/exams`);

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();

    // Convert backend data format to frontend format
    if (data.status === "success" && Array.isArray(data.data)) {
      const formattedExams = data.data.map((exam) => ({
        id: exam.id.toString(),
        cycle: exam.cycle,
        filiere: exam.filiere,
        module: exam.module,
        date: exam.date_examen,
        startTime: exam.heure_debut,
        endTime: exam.heure_fin,
        classrooms: exam.locaux ? exam.locaux.split(",") : [],
        supervisors: exam.superviseurs ? exam.superviseurs.split(",") : [],
        students: exam.students ? exam.students.split(",") : [],
      }));

      // Sort by ID in descending order and take last 5
      const sortedExams = formattedExams.sort(
        (a, b) => parseInt(b.id) - parseInt(a.id)
      );
      const lastFiveExams = sortedExams.slice(0, 5);

      return {
        ...data,
        data: lastFiveExams,
      };
    }

    return data;
  } catch (error) {
    console.error("Failed to fetch exams:", error);
    throw error;
  }
};

/**
 * Get a single exam by ID
 * @param {string} id - Exam ID
 * @returns {Promise<Object>} - Promise that resolves to an exam object
 */
export const getExamById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/exams/${id}`);

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();

    // Convert backend data format to frontend format
    if (data.status === "success" && data.data) {
      const exam = data.data;
      return {
        ...data,
        data: {
          id: exam.id.toString(),
          cycle: exam.cycle,
          filiere: exam.filiere,
          module: exam.module,
          date: exam.date_examen,
          startTime: exam.heure_debut,
          endTime: exam.heure_fin,
          classrooms: exam.locaux ? exam.locaux.split(",") : [],
          supervisors: exam.superviseurs ? exam.superviseurs.split(",") : [],
          students: exam.students ? exam.students.split(",") : [],
        },
      };
    }

    return data;
  } catch (error) {
    console.error(`Failed to fetch exam with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new exam
 * @param {Object} examData - Exam data to create
 * @returns {Promise<Object>} - Promise that resolves to the created exam
 */
export const createExam = async (examData) => {
  try {
    // Format the data according to the backend API requirements
    const formattedData = {
      cycle: examData.cycle,
      filiere: examData.filiere,
      module: examData.module,
      date_examen:
        examData.date instanceof Date
          ? examData.date.toISOString().split("T")[0]
          : examData.date,
      heure_debut: examData.startTime,
      heure_fin: examData.endTime,
      locaux: Array.isArray(examData.classrooms)
        ? examData.classrooms.join(",")
        : examData.classrooms,
      superviseurs: Array.isArray(examData.supervisors)
        ? examData.supervisors.join(",")
        : examData.supervisors,
      students: examData.students, // Send the complete student objects array
    };

    console.log("Sending formatted data to API:", formattedData);

    const response = await fetch(`${API_URL}/exams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formattedData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API error response:", errorData);
      throw new Error(errorData.message || `Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to create exam:", error);
    throw error;
  }
};

/**
 * Update an existing exam
 * @param {string} id - Exam ID
 * @param {Object} examData - Updated exam data
 * @returns {Promise<Object>} - Promise that resolves to the updated exam
 */
export const updateExam = async (id, examData) => {
  try {
    // Format the data according to the backend API requirements
    const formattedData = {
      cycle: examData.cycle,
      filiere: examData.filiere,
      module: examData.module,
      date_examen:
        examData.date instanceof Date
          ? examData.date.toISOString().split("T")[0]
          : examData.date,
      heure_debut: examData.startTime,
      heure_fin: examData.endTime,
      locaux: Array.isArray(examData.classrooms)
        ? examData.classrooms.join(",")
        : examData.classrooms,
      superviseurs: Array.isArray(examData.supervisors)
        ? examData.supervisors.join(",")
        : examData.supervisors,
      students: Array.isArray(examData.students)
        ? examData.students.join(",")
        : examData.students,
    };

    console.log("Sending formatted data to API for update:", formattedData);

    const response = await fetch(`${API_URL}/exams/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formattedData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API error response:", errorData);
      throw new Error(errorData.message || `Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to update exam with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete an exam
 * @param {string} id - Exam ID to delete
 * @returns {Promise<Object>} - Promise that resolves when the exam is deleted
 */
export const deleteExam = async (id) => {
  try {
    const response = await fetch(`${API_URL}/exams/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to delete exam with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Get the latest 5 exams
 * @returns {Promise<Array>} - Promise that resolves to an array of the 5 most recent exams
 */
export const getLatestExams = async () => {
  try {
    const response = await fetch(`${API_URL}/exams/latest`);

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();

    // Convert backend data format to frontend format
    if (data.status === "success" && Array.isArray(data.data)) {
      return {
        ...data,
        data: data.data.map((exam) => ({
          id: exam.id.toString(),
          cycle: exam.cycle,
          filiere: exam.filiere,
          module: exam.module,
          date: exam.date_examen,
          startTime: exam.heure_debut,
          endTime: exam.heure_fin,
          classrooms: exam.locaux ? exam.locaux.split(",") : [],
          supervisors: exam.superviseurs ? exam.superviseurs.split(",") : [],
          students: exam.students ? exam.students.split(",") : [],
        })),
      };
    }

    return data;
  } catch (error) {
    console.error("Failed to fetch latest exams:", error);
    throw error;
  }
};
