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

    // Return the data as-is from the backend for the edit form
    // The backend now returns the data in the correct format with all necessary IDs
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
    // The data should already be in the correct format from the form
    const response = await fetch(`${API_URL}/exams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(examData),
    });

    if (!response.ok) {
      // Only show/log error if the response is not ok
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error: ${response.status}`);
    }

    // Try to parse JSON, but if empty or invalid, just return a success object and do not log/throw
    try {
      return await response.json();
    } catch {
      return { success: true };
    }
  } catch (error) {
    // Only log/throw if it's a real error (not empty JSON)
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
    const formattedData = {
      formation: examData.formation,
      filiere: examData.filiere,
      module: examData.module,
      semestre: examData.semestre,
      date_examen: examData.date_examen,
      heure_debut: examData.heure_debut,
      heure_fin: examData.heure_fin,
      locaux: examData.locaux,
      superviseurs: examData.superviseurs,
      professeurs: examData.professeurs,
      classroom_ids: Array.isArray(examData.classroom_ids)
        ? examData.classroom_ids.map(Number)
        : [],
      students: Array.isArray(examData.students)
        ? examData.students.map((student) => ({
            studentId: student.studentId,
            firstName: student.firstName || student.prenom,
            lastName: student.lastName || student.nom,
            email:
              student.email || `${student.studentId || student.id}@example.com`,
            program: student.program || values.filiere,
            cne: student.cne,
          }))
        : [],
    };

    if (!formattedData.classroom_ids.length) {
      throw new Error("At least one classroom must be selected");
    }

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
        data: data.data.map((exam) => {
          // Traiter les superviseurs
          let supervisors = [];
          if (exam.superviseurs) {
            if (Array.isArray(exam.superviseurs)) {
              // Si c'est un tableau d'objets (relations)
              supervisors = exam.superviseurs.map((supervisor) =>
                `${supervisor.prenom || ""} ${supervisor.nom || ""}`.trim()
              );
            } else if (typeof exam.superviseurs === "string") {
              // Si c'est une chaîne
              supervisors = exam.superviseurs.split(",").map((s) => s.trim());
            }
          }

          // Traiter les professeurs
          let professors = [];
          if (exam.professeurs) {
            if (Array.isArray(exam.professeurs)) {
              // Si c'est un tableau d'objets (relations)
              professors = exam.professeurs.map((professeur) =>
                `${professeur.prenom || ""} ${professeur.nom || ""}`.trim()
              );
            } else if (typeof exam.professeurs === "string") {
              // Si c'est une chaîne
              professors = exam.professeurs.split(",").map((p) => p.trim());
            }
          }

          // Traiter les étudiants
          let students = [];
          if (exam.students) {
            if (Array.isArray(exam.students)) {
              // Si c'est un tableau d'objets (relations)
              students = exam.students.map((student) => student.id.toString());
            } else if (typeof exam.students === "string") {
              // Si c'est une chaîne
              students = exam.students.split(",").map((s) => s.trim());
            }
          }

          return {
            id: exam.id.toString(),
            cycle: exam.cycle,
            filiere: exam.filiere,
            module: exam.module,
            date: exam.date_examen,
            startTime: exam.heure_debut,
            endTime: exam.heure_fin,
            classrooms: exam.locaux ? exam.locaux.split(",") : [],
            supervisors: supervisors,
            students: students,
            // Ajouter les données brutes pour l'affichage des détails
            rawSuperviseurs: exam.superviseurs,
            rawProfesseurs: exam.professeurs,
            rawStudents: exam.students,
          };
        }),
      };
    }

    return data;
  } catch (error) {
    console.error("Failed to fetch latest exams:", error);
    throw error;
  }
};

/**
 * Download exam PDF with student list
 * @param {string} id - Exam ID
 * @returns {Promise<void>} - Promise that resolves when the PDF is downloaded
 */
export const downloadExamPdf = async (id) => {
  try {
    const response = await fetch(`${API_URL}/exams/${id}/download-pdf`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    // Get the filename from the Content-Disposition header
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = "convocation_examen.pdf";

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Convert response to blob
    const blob = await response.blob();

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(`Failed to download PDF for exam with ID ${id}:`, error);
    throw error;
  }
};
