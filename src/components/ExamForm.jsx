import { scheduleExam } from "@/services/classroomService";

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

    // Get classroom names for the locaux field
    const classroomNames = values.classroom_ids
      .map(id => availableClassrooms.find(c => c.id === id)?.nom_du_local || id)
      .join(", ");

    // Prepare the exam data
    const examData = {
      cycle: values.cycle,
      filiere: values.filiere,
      module: values.module,
      date_examen: formattedDate,
      heure_debut: values.heure_debut,
      heure_fin: values.heure_fin,
      locaux: classroomNames,
      classroom_ids: values.classroom_ids.filter(id => id && id !== 0),
      superviseurs: values.superviseurs.filter(id => id && id !== 0),
      students: selectedStudents
    };

    console.log("Prepared exam data:", examData);

    let createdExam;
    if (examId) {
      // Update existing exam
      createdExam = await examService.updateExam(examId, examData);
      toast.success("Exam updated successfully");
    } else {
      // Create new exam
      const response = await examService.createExam(examData);
      console.log("Exam creation response:", response);
      // Extract the exam ID from the response
      createdExam = {
        id: response.data.id || response.data.exam_id || response.data.examId || response.id
      };
      console.log("Extracted exam ID:", createdExam.id);
      toast.success("Exam created successfully");
    }

    // Schedule the exam for each selected classroom
    if (createdExam && createdExam.id) {
      console.log("Starting exam scheduling process for exam ID:", createdExam.id);
      const schedulePromises = examData.classroom_ids.map(async (classroomId) => {
        const scheduleData = {
          classroom_id: classroomId,
          exam_id: createdExam.id,
          date_examen: formattedDate,
          heure_debut: values.heure_debut,
          heure_fin: values.heure_fin
        };
        
        console.log(`Scheduling exam for classroom ${classroomId} with data:`, scheduleData);
        try {
          await scheduleExam(scheduleData);
          console.log(`Successfully scheduled exam in classroom ${classroomId}`);
          toast.success(`Successfully scheduled exam in classroom ${classroomId}`);
        } catch (error) {
          console.error(`Failed to schedule exam in classroom ${classroomId}:`, error);
          toast.error(`Failed to schedule exam in classroom ${classroomId}: ${error.message}`);
        }
      });

      await Promise.all(schedulePromises);
      console.log("Completed scheduling process for all classrooms");
    } else {
      console.error("Failed to get exam ID from creation response:", createdExam);
      toast.error("Failed to schedule exam: Could not get exam ID");
    }

    // Reset form and close modal
    form.resetFields();
    onClose();
  } catch (error) {
    console.error("Error submitting exam:", error);
    toast.error(error.message || "Failed to submit exam");
  }
}; 