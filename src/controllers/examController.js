import { generateInvitations } from "../services/pdfService";
import { sendInvitations } from "../services/emailService";
import { getExamById } from "../services/examService";

export const sendExamInvitations = async (req, res) => {
  try {
    const { examId } = req.params;
    const { students } = req.body;

    // Get exam details
    const exam = await getExamById(examId);
    if (!exam) {
      return res.status(404).json({
        status: "error",
        message: "Examen non trouvé",
      });
    }

    // Generate PDF invitations
    const invitations = await generateInvitations(students, exam);

    // Send emails with PDF attachments
    const results = await sendInvitations(invitations, exam);

    // Count successes and failures
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return res.json({
      status: "success",
      message: `Convocations envoyées : ${successCount} succès, ${failureCount} échecs`,
      data: {
        results,
      },
    });
  } catch (error) {
    console.error("Error sending invitations:", error);
    return res.status(500).json({
      status: "error",
      message: "Erreur lors de l'envoi des convocations",
      error: error.message,
    });
  }
};
