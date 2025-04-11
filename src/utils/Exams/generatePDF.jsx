import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { saveAs } from "file-saver";
import QRCode from "qrcode";

// ✅ Fonction pour éviter les valeurs `undefined`, `null` ou vides
const formatValue = (value) => (value ? value.toString().trim() : "N/A");

// ✅ Fonction pour générer un QR code
const generateQRCode = async (student) => {
  try {
    const qrData = `
    🎓 **INFORMATIONS ÉTUDIANT(E)** 🎓
    ───────────────────────────
    🆔 Code Apogée : ${formatValue(student.studentId)}
    👤 Nom - Prénom : ${formatValue(`${student.firstName} ${student.lastName}`)}
    📧 Email : ${formatValue(student.email)}
    📚 Module : ${formatValue(student.program)}
    ───────────────────────────
     © Service de scolarité
    `;

    return await QRCode.toDataURL(qrData.trim());
  } catch (error) {
    console.error("❌ Erreur lors de la génération du QR code:", error);
    return null;
  }
};

// ✅ Fonction pour charger une image en tant que Blob
const loadImageAsBlob = async (imagePath) => {
  try {
    console.log("🔍 Tentative de chargement du logo :", imagePath);
    const response = await fetch(imagePath);

    if (!response.ok) {
      console.error("❌ Erreur de chargement du logo :", response.statusText);
      return null;
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error("❌ Erreur lors du chargement de l'image:", error);
    return null;
  }
};

// ✅ Fonction pour dessiner un tableau dans le PDF
const drawTable = (
  page,
  title,
  data,
  startX,
  startY,
  width,
  rowHeight,
  font,
  boldFont
) => {
  let currentY = startY;
  const colWidth = width / 2;

  // Dessiner l'en-tête du tableau si un titre est fourni
  if (title) {
    // Augmenter l'espace pour le titre
    drawCenteredText(
      page,
      title,
      currentY + 25, // Plus d'espace pour le titre (augmenté de +15 à +25)
      width,
      startX,
      boldFont,
      14,
      rgb(0.2, 0.4, 0.8)
    );

    // Décaler le début du tableau pour laisser de l'espace au titre
    currentY = currentY - 10; // Ajout de ce décalage
  }

  // Dessiner les lignes du tableau
  data.forEach((row, index) => {
    // Alternance de couleur pour les lignes
    const fillColor = index % 2 === 0 ? rgb(1, 1, 1) : rgb(0.95, 0.95, 0.95);

    // Fond de la ligne
    page.drawRectangle({
      x: startX,
      y: currentY - rowHeight * (index + 1),
      width: width,
      height: rowHeight,
      color: fillColor,
      borderColor: rgb(0.5, 0.5, 0.5),
      borderWidth: 1,
    });

    // Ligne séparatrice entre les colonnes
    page.drawLine({
      start: { x: startX + colWidth, y: currentY - rowHeight * index },
      end: { x: startX + colWidth, y: currentY - rowHeight * (index + 1) },
      thickness: 1,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Écriture du label (première colonne)
    page.drawText(row.label, {
      x: startX + 10,
      y: currentY - rowHeight * index - rowHeight / 2 + 5,
      size: 10,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Écriture de la valeur (deuxième colonne)
    page.drawText(row.value, {
      x: startX + colWidth + 10,
      y: currentY - rowHeight * index - rowHeight / 2 + 5,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
  });

  return currentY - rowHeight * data.length;
};

// ✅ Fonction pour centrer un texte
const drawCenteredText = (page, text, y, width, startX, font, size, color) => {
  const textWidth = font.widthOfTextAtSize(text, size);
  const centerX = startX + width / 2 - textWidth / 2;

  page.drawText(text, {
    x: centerX,
    y: y,
    size: size,
    font: font,
    color: color,
  });
};

// ✅ Fonction principale pour générer le PDF
export const generatePDF = async (student, examDetails) => {
  if (!examDetails) {
    console.error("❌ Aucune information d'examen fournie !");
    return;
  }
  try {
    console.log("📄 Génération du PDF pour :", student);
    console.log("📌 Détails de l'examen :", examDetails);

    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.addPage([595, 842]); // Format A4
    const { width, height } = page.getSize();

    // ✅ Variables pour les couleurs principales
    const primaryColor = rgb(0.2, 0.4, 0.8);
    const secondaryColor = rgb(0.8, 0.4, 0.1);

    // ✅ CORRECTION: Chargement du logo intégré dans la fonction principale
    let logoImage = null;
    try {
      const logoPath = "/mnt/data/logo-fst.jpeg"; // Vérifie que le fichier est bien à cet emplacement
      const logoBlob = await loadImageAsBlob(logoPath);

      if (logoBlob) {
        const logoBytes = new Uint8Array(await logoBlob.arrayBuffer());
        // Utilisez embedJpg() pour un fichier JPEG ou embedPng() pour un PNG
        logoImage = await pdfDoc.embedJpg(logoBytes);
        console.log("✅ Logo chargé avec succès !");

        // ✅ Affichage du logo dans l'entête
        page.drawImage(logoImage, {
          x: 50, // Positionné à gauche
          y: height - 100, // Ajusté pour correspondre au placement correct
          width: 160, // Largeur ajustée pour bien afficher le logo
          height: 70, // Hauteur ajustée
        });
      } else {
        console.error("❌ Impossible de charger le logo : blob est null");
      }
    } catch (error) {
      console.error("❌ Erreur lors du chargement du logo:", error);
    }

    // ✅ Titre principal (ajusté pour tenir compte du logo)
    page.drawText("Convocation d'Examen", {
      x: 230,
      y: height - 70,
      size: 22,
      font: helveticaBold,
      color: primaryColor,
    });

    // ✅ Sous-titre
    page.drawText("Faculté des Sciences et Techniques - Marrakech", {
      x: 230,
      y: height - 95,
      size: 12,
      font: helveticaFont,
      color: secondaryColor,
    });

    // ✅ Ligne séparatrice
    page.drawRectangle({
      x: 50,
      y: height - 130,
      width: width - 100,
      height: 2,
      color: primaryColor,
    });

    // ✅ Générer le QR Code
    let qrCodeImage = null;
    try {
      const qrCodeDataURL = await generateQRCode(student);
      if (qrCodeDataURL) {
        qrCodeImage = await pdfDoc.embedPng(qrCodeDataURL);
      }
    } catch (error) {
      console.error("❌ Erreur lors de la génération du QR code:", error);
    }

    // ✅ Informations de l'examen en tableau
    const tableStartY = height - 150;
    const tableWidth = width - 100;
    const tableStartX = 50;
    const rowHeight = 30;

    const examInfos = [
      { label: "Examen", value: formatValue(examDetails.title) },
      { label: "Code", value: formatValue(examDetails.code) },
      { label: "Date", value: formatValue(examDetails.date) },
      {
        label: "Heure",
        value: `${formatValue(examDetails.startTime)} - ${formatValue(
          examDetails.endTime
        )}`,
      },
      { label: "Lieu", value: formatValue(examDetails.location) },
    ];

    const studentTableY = drawTable(
      page,
      "Informations sur l'examen",
      examInfos,
      tableStartX,
      tableStartY + 10, // Ajouter 10 points supplémentaires pour ce titre spécifique
      tableWidth,
      rowHeight,
      helveticaFont,
      helveticaBold
    );
    // ✅ Informations de l'étudiant en tableau
    const studentInfos = [
      { label: "Numéro d'étudiant", value: formatValue(student.studentId) },
      {
        label: "Nom Complet",
        value: `${formatValue(student.firstName)} ${formatValue(
          student.lastName
        )}`,
      },
      { label: "Email", value: formatValue(student.email) },
      { label: "Programme", value: formatValue(student.program) },
    ];

    // Pour "Informations sur l'étudiant"
    drawTable(
      page,
      "Informations sur l'étudiant",
      studentInfos,
      tableStartX,
      studentTableY - 50, // Augmenté de -20 à -30 pour plus d'espace
      tableWidth,
      rowHeight,
      helveticaFont,
      helveticaBold
    );

    // ✅ Ajout du QR Code en bas du PDF
    if (qrCodeImage) {
      page.drawImage(qrCodeImage, {
        x: width / 2 - 75,
        y: 80, // ✅ Positionné en bas
        width: 150,
        height: 150,
      });

      // Texte du QR code
      drawCenteredText(
        page,
        "Scannez ce QR code pour vérifier l'authenticité",
        60,
        width,
        0,
        helveticaFont,
        12,
        rgb(0.3, 0.3, 0.3)
      );

      // Dessiner une ligne horizontale
      page.drawLine({
        start: { x: 50, y: 45 },
        end: { x: width - 50, y: 45 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // Texte en gras
      drawCenteredText(
        page,
        "Ce document est officiel et doit être présenté le jour de l'examen",
        30,
        width,
        0,
        helveticaFont,
        14,
        rgb(0, 0, 0)
      );
    }

    // ✅ Sauvegarde du PDF
    const pdfBytes = await pdfDoc.save();
    const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
    saveAs(pdfBlob, `Convocation_${formatValue(student.studentId)}.pdf`);

    console.log("✅ PDF généré avec succès !");
    return true;
  } catch (error) {
    console.error("❌ Erreur lors de la génération du PDF:", error);
    throw error;
  }
};
