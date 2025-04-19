const onFormSubmit = async (values) => {
  try {
    console.log("Form submission values:", values);

    // Map selected student IDs to their complete information
    const selectedStudents = values.students.map(studentId => {
      const student = students.find(s => s.id === studentId);
      return {
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        program: values.filiere
      };
    });

    // Map selected supervisor IDs to their complete information
    const selectedSupervisors = values.superviseurs.map(supervisorId => {
      const supervisor = supervisors.find(s => s.id === supervisorId);
      return {
        id: supervisor.id,
        firstName: supervisor.firstName,
        lastName: supervisor.lastName,
        email: supervisor.email
      };
    });

    // Validate required fields
    if (!values.classroom_ids || values.classroom_ids.length === 0) {
      toast.error("Please select at least one classroom");
      return;
    }

    if (!values.superviseurs || values.superviseurs.length === 0) {
      toast.error("Please select at least one supervisor");
      return;
    }

    // Format the exam date
    const examDate = new Date(values.date_examen);
    const formattedDate = examDate.toISOString().split('T')[0];

    // Prepare the exam data
    const examData = {
      cycle: values.cycle,
      filiere: values.filiere,
      module: values.module,
      date_examen: formattedDate,
      heure_debut: values.heure_debut,
      heure_fin: values.heure_fin,
      locaux: values.locaux,
      classroom_ids: values.classroom_ids.filter(id => id && id !== 0),
      superviseurs: values.superviseurs.filter(id => id && id !== 0),
      students: selectedStudents
    };

    console.log("Prepared exam data:", examData);

    if (examId) {
      // Update existing exam
      await examService.updateExam(examId, examData);
      toast.success("Exam updated successfully");
    } else {
      // Create new exam
      await examService.createExam(examData);
      toast.success("Exam created successfully");
    }

    // Reset form and close modal
    form.resetFields();
    onClose();
  } catch (error) {
    console.error("Error submitting exam:", error);
    toast.error(error.message || "Failed to submit exam");
  }
}; 