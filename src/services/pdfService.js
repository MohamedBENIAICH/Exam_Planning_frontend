import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

const generateInvitationPDF = async (student, exam, outputPath) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });

      // Create write stream
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Add university logo
      const logoPath = path.join(process.cwd(), "public", "images", "logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 50, { width: 100 });
      }

      // Add header
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("CONVOCATION À L'EXAMEN", { align: "center" })
        .moveDown();

      // Add student information
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("INFORMATIONS DE L'ÉTUDIANT")
        .moveDown(0.5)
        .font("Helvetica")
        .text(`CNE: ${student.studentId}`)
        .text(`Nom: ${student.lastName}`)
        .text(`Prénom: ${student.firstName}`)
        .text(`Email: ${student.email}`)
        .moveDown();

      // Add exam information
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("INFORMATIONS DE L'EXAMEN")
        .moveDown(0.5)
        .font("Helvetica")
        .text(`Module: ${exam.module}`)
        .text(`Date: ${new Date(exam.date_examen).toLocaleDateString("fr-FR")}`)
        .text(`Heure de début: ${exam.heure_debut}`)
        .text(`Heure de fin: ${exam.heure_fin}`)
        .text(`Salle: ${exam.locaux}`)
        .moveDown();

      // Generate QR code
      const qrData = JSON.stringify({
        cne: student.studentId,
        nom: student.lastName,
        prenom: student.firstName,
      });

      const qrCodeDataUrl = await QRCode.toDataURL(qrData);
      const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(",")[1], "base64");

      // Add QR code at the bottom
      doc.image(qrCodeBuffer, {
        fit: [100, 100],
        align: "center",
      });

      // Add footer
      doc
        .fontSize(10)
        .text(
          "Ce QR code contient vos informations d'identification pour l'examen",
          {
            align: "center",
          }
        );

      // Finalize PDF
      doc.end();

      stream.on("finish", () => {
        resolve(outputPath);
      });

      stream.on("error", (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

export const generateInvitations = async (students, exam) => {
  const invitations = [];
  const outputDir = path.join(process.cwd(), "temp", "invitations");

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const student of students) {
    const outputPath = path.join(
      outputDir,
      `invitation_${student.studentId}.pdf`
    );
    try {
      const pdfPath = await generateInvitationPDF(student, exam, outputPath);
      invitations.push({
        studentId: student.studentId,
        email: student.email,
        pdfPath,
      });
    } catch (error) {
      console.error(
        `Error generating PDF for student ${student.studentId}:`,
        error
      );
    }
  }

  return invitations;
};

export default {
  generateInvitations,
};
