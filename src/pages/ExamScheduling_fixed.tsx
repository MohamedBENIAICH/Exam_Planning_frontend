// This is a temporary file to fix the getStudentNames function
// The issue is that in the exams array, students are just IDs, not objects with id properties

// Here's the fixed version of the getStudentNames function:
const getStudentNames = (studentIds: string[]) => {
  return studentIds.map((id) => {
    // Find the student in the importedStudents array
    const student = importedStudents.find((s) => s.id === id);
    if (student) {
      return `${student.firstName} ${student.lastName}`;
    }

    // If not found in importedStudents, try to find in the exam's students array
    // Since students in exams are just IDs, we need to check if the ID exists in the array
    const examWithStudent = exams.find(
      (exam) => exam.students && exam.students.includes(id)
    );

    if (examWithStudent) {
      // We found an exam with this student ID, but we need to get the student details
      // Try to find the student in importedStudents again
      const studentDetails = importedStudents.find((s) => s.id === id);
      if (studentDetails) {
        return `${studentDetails.firstName} ${studentDetails.lastName}`;
      }
      return `Student ${id}`;
    }

    return "Unknown Student";
  });
};
