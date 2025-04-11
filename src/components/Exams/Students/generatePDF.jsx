// import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
// import { saveAs } from "file-saver";
// import { QRCodeCanvas } from "qrcode.react";

// // Fonction pour générer un QR code
// const generateQRCode = async (student) => {
//   try {
//     const qrData = JSON.stringify({
//       ID: student.studentId,
//       Nom: `${student.firstName} ${student.lastName}`,
//       Email: student.email,
//       Programme: student.program || "Non spécifié",
//     });

//     // Création d'un canvas temporaire pour générer le QR code
//     const canvas = document.createElement("canvas");
//     const qrCode = new QRCodeCanvas({
//       value: qrData,
//       size: 200,
//     });

//     // Rendu du QR code sur le canvas
//     await new Promise((resolve) => {
//       qrCode.renderTo(canvas, 0, 0);
//       resolve();
//     });

//     return canvas.toDataURL("image/png");
//   } catch (error) {
//     console.error("Erreur lors de la génération du QR code:", error);
//     throw error;
//   }
// };

// // 1. Modifiez la fonction fetchImageAsBase64 pour gérer les erreurs
// const fetchImageAsBase64 = async (imagePath) => {
//   try {
//     const response = await fetch(imagePath);
//     if (!response.ok) {
//       console.error(`Erreur lors du chargement de l'image: ${response.status}`);
//       // Retourne une image par défaut ou null
//       return null;
//     }
//     const blob = await response.blob();
//     return new Promise((resolve) => {
//       const reader = new FileReader();
//       reader.onloadend = () => resolve(reader.result);
//       reader.readAsDataURL(blob);
//     });
//   } catch (error) {
//     console.error("Erreur lors du chargement de l'image:", error);
//     return null;
//   }
// };

// // 2. Améliorez la fonction formatValue
// const formatValue = (value) => {
//   if (value === undefined || value === null || value === "") {
//     return "N/A";
//   }
//   return value;
// };

// // 3. Ajoutez une gestion des erreurs complète dans generatePDF
// export const generatePDF = async (student, examDetails) => {
//   try {
//     const pdfDoc = await PDFDocument.create();
//     const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
//     const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
//     const page = pdfDoc.addPage([595, 842]); // Format A4
//     const { width, height } = page.getSize();

//     // Déboguer les valeurs reçues
//     console.log("Données étudiant:", student);
//     console.log("Détails examen:", examDetails);

//     // Charger le logo avec un chemin corrigé et une gestion d'erreur
//     let logoImage = null;
//     try {
//       // Utilisez un chemin relatif ou une URL complète
//       // Assurez-vous que le logo est dans le dossier public
//       const logoBase64 = await fetchImageAsBase64("mnt/data/logo fst.jpeg");
//       if (logoBase64) {
//         logoImage = await pdfDoc.embedJpg(logoBase64);
//       }
//     } catch (logoError) {
//       console.error("Erreur lors du chargement du logo:", logoError);
//       // Continuez sans logo
//     }

//     // Générer le QR Code
//     let qrCodeImage = null;
//     try {
//       const qrCodeDataURL = await generateQRCode(student);
//       qrCodeImage = await pdfDoc.embedPng(qrCodeDataURL);
//     } catch (qrError) {
//       console.error("Erreur lors de la génération du QR code:", qrError);
//       // Continuez sans QR code
//     }

//     // Couleurs principales
//     const primaryColor = rgb(0.2, 0.4, 0.8); // Bleu FST
//     const secondaryColor = rgb(0.8, 0.4, 0.1); // Orange/marron FST

//     // Ajout du logo si disponible
//     if (logoImage) {
//       page.drawImage(logoImage, {
//         x: 50,
//         y: height - 120,
//         width: 150,
//         height: 80,
//       });
//     }

//     // Titre principal
//     page.drawText("Convocation d'Examen", {
//       x: 230,
//       y: height - 70,
//       size: 22,
//       font: helveticaBold,
//       color: primaryColor,
//     });

//     // Sous-titre
//     page.drawText("Faculté des Sciences et Techniques - Marrakech", {
//       x: 230,
//       y: height - 95,
//       size: 12,
//       font: helveticaFont,
//       color: secondaryColor,
//     });

//     // Ligne séparatrice
//     page.drawRectangle({
//       x: 50,
//       y: height - 130,
//       width: width - 100,
//       height: 2,
//       color: primaryColor,
//     });

//     // Section : Informations de l'examen
//     const tableStartY = height - 170;
//     const tableWidth = width - 100;
//     const rowHeight = 25;

//     // Titre de la section examen
//     page.drawRectangle({
//       x: 50,
//       y: tableStartY + 30,
//       width: tableWidth,
//       height: 30,
//       color: primaryColor,
//     });

//     page.drawText("INFORMATIONS DE L'EXAMEN", {
//       x: 230,
//       y: tableStartY + 12,
//       size: 14,
//       font: helveticaBold,
//       color: rgb(1, 1, 1), // Blanc
//     });

//     const examInfos = [
//       { label: "Examen", value: formatValue(examDetails.title) },
//       { label: "Code", value: formatValue(examDetails.code) },
//       { label: "Date", value: formatValue(examDetails.date) },
//       {
//         label: "Heure",
//         value: formatValue(`${examDetails.startTime} - ${examDetails.endTime}`),
//       },
//       { label: "Lieu", value: formatValue(examDetails.location) },
//     ];

//     let currentY = tableStartY;

//     // Dessiner les lignes du tableau des examens
//     examInfos.forEach((info, index) => {
//       const bgColor = index % 2 === 0 ? rgb(0.95, 0.95, 0.95) : rgb(1, 1, 1);
//       page.drawRectangle({
//         x: 50,
//         y: currentY,
//         width: tableWidth,
//         height: rowHeight,
//         color: bgColor,
//       });
//       page.drawText(info.label, {
//         x: 55,
//         y: currentY - 17,
//         size: 12,
//         font: helveticaBold,
//       });
//       page.drawText(info.value, {
//         x: 250,
//         y: currentY - 17,
//         size: 12,
//         font: helveticaFont,
//       });
//       currentY -= rowHeight;
//     });

//     // Section : Informations de l'étudiant
//     currentY -= 20;

//     // Titre de la section étudiant
//     page.drawRectangle({
//       x: 50,
//       y: currentY + 30,
//       width: tableWidth,
//       height: 30,
//       color: secondaryColor,
//     });

//     page.drawText("INFORMATIONS DE L'ÉTUDIANT", {
//       x: 230,
//       y: currentY + 12,
//       size: 14,
//       font: helveticaBold,
//       color: rgb(1, 1, 1), // Blanc
//     });

//     const studentInfos = [
//       { label: "Numéro d'étudiant", value: formatValue(student.studentId) },
//       {
//         label: "Nom Complet",
//         value: formatValue(`${student.firstName} ${student.lastName}`),
//       },
//       { label: "Email", value: formatValue(student.email) },
//       { label: "Programme", value: formatValue(student.program) },
//     ];

//     currentY -= 30; // Ajustement pour l'en-tête

//     // Dessiner les lignes du tableau des étudiants
//     studentInfos.forEach((info, index) => {
//       const bgColor = index % 2 === 0 ? rgb(0.95, 0.95, 0.95) : rgb(1, 1, 1);
//       page.drawRectangle({
//         x: 50,
//         y: currentY,
//         width: tableWidth,
//         height: rowHeight,
//         color: bgColor,
//       });
//       page.drawText(info.label, {
//         x: 55,
//         y: currentY - 17,
//         size: 12,
//         font: helveticaBold,
//       });
//       page.drawText(info.value, {
//         x: 250,
//         y: currentY - 17,
//         size: 12,
//         font: helveticaFont,
//       });
//       currentY -= rowHeight;
//     });

//     // Ajout du QR Code si disponible
//     if (qrCodeImage) {
//       page.drawImage(qrCodeImage, {
//         x: width / 2 - 75,
//         y: currentY - 180,
//         width: 150,
//         height: 150,
//       });

//       // Texte sous le QR code
//       page.drawText("Scannez ce QR code pour vérifier l'authenticité", {
//         x: width / 2 - 140,
//         y: currentY - 200,
//         size: 12,
//         font: helveticaFont,
//         color: rgb(0.3, 0.3, 0.3),
//       });
//     }

//     // Pied de page
//     page.drawRectangle({
//       x: 50,
//       y: 50,
//       width: width - 100,
//       height: 1,
//       color: rgb(0.7, 0.7, 0.7),
//     });

//     page.drawText(
//       "Ce document est officiel et doit être présenté le jour de l'examen",
//       {
//         x: 150,
//         y: 40,
//         size: 10,
//         font: helveticaBold,
//         color: rgb(0.4, 0.4, 0.4),
//       }
//     );

//     // Sauvegarde du PDF
//     const pdfBytes = await pdfDoc.save();
//     const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
//     saveAs(pdfBlob, `Convocation_${formatValue(student.studentId)}.pdf`);

//     console.log("PDF généré avec succès");
//     return true;
//   } catch (error) {
//     console.error("Erreur lors de la génération du PDF:", error);
//     throw error; // Propagez l'erreur pour la gérer dans le composant
//   }
// };
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { saveAs } from "file-saver";
import QRCode from "qrcode";

// ✅ Fonction pour éviter les valeurs `undefined`, `null` ou vides
const formatValue = (value) => (value ? value.toString().trim() : "N/A");

// ✅ Fonction pour générer un QR code
const generateQRCode = async (student) => {
  try {
    const qrData = JSON.stringify({
      ID: formatValue(student.studentId),
      Nom: formatValue(`${student.firstName} ${student.lastName}`),
      Email: formatValue(student.email),
      Programme: formatValue(student.program),
    });

    return await QRCode.toDataURL(qrData);
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

// ✅ Charger le logo avec le bon chemin
let logoImage = null;
try {
  const logoPath = "/mnt/data/logo-fst.jpeg"; // Vérifie que le fichier est bien à cet emplacement
  const logoBlob = await loadImageAsBlob(logoPath);

  if (logoBlob) {
    const logoBytes = new Uint8Array(await logoBlob.arrayBuffer());
    logoImage = await pdfDoc.embedPng(logoBytes); // Utiliser embedPng() si le fichier est en PNG
    console.log("✅ Logo chargé avec succès !");
  }
} catch (error) {
  console.error("❌ Erreur lors du chargement du logo:", error);
}

// ✅ Affichage du logo dans l'entête, aligné comme l'image donnée
if (logoImage) {
  page.drawImage(logoImage, {
    x: 50, // Positionné à gauche
    y: height - 100, // Ajusté pour correspondre au placement correct
    width: 180, // Largeur ajustée pour bien afficher le logo
    height: 80, // Hauteur ajustée
  });
}

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

    // ✅ Titre principal
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
