import nodemailer from "nodemailer";
import fs from "fs";

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendInvitationEmail = async (student, exam, pdfPath) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: student.email,
      subject: `Convocation à l'examen - ${exam.module}`,
      html: `
        <h2>Convocation à l'examen</h2>
        <p>Cher(e) ${student.firstName} ${student.lastName},</p>
        <p>Vous êtes convoqué(e) à l'examen de <strong>${
          exam.module
        }</strong> qui aura lieu le <strong>${new Date(
        exam.date_examen
      ).toLocaleDateString("fr-FR")}</strong>.</p>
        <p><strong>Détails de l'examen :</strong></p>
        <ul>
          <li>Date : ${new Date(exam.date_examen).toLocaleDateString(
            "fr-FR"
          )}</li>
          <li>Heure de début : ${exam.heure_debut}</li>
          <li>Heure de fin : ${exam.heure_fin}</li>
          <li>Salle : ${exam.locaux}</li>
        </ul>
        <p>Veuillez trouver votre convocation en pièce jointe. N'oubliez pas d'apporter cette convocation le jour de l'examen.</p>
        <p>Le QR code sur la convocation sera utilisé pour vérifier votre identité.</p>
        <p>Cordialement,<br>Le service des examens</p>
      `,
      attachments: [
        {
          filename: `convocation_${exam.module}.pdf`,
          path: pdfPath,
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export const sendInvitations = async (invitations, exam) => {
  const results = [];

  for (const invitation of invitations) {
    try {
      const info = await sendInvitationEmail(
        invitation,
        exam,
        invitation.pdfPath
      );
      results.push({
        studentId: invitation.studentId,
        email: invitation.email,
        success: true,
        messageId: info.messageId,
      });
    } catch (error) {
      results.push({
        studentId: invitation.studentId,
        email: invitation.email,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
};

export default {
  sendInvitations,
};
