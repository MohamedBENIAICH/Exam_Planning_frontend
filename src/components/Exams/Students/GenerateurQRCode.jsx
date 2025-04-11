import React from "react";
import PropTypes from "prop-types";

const GenerateurQRCode = ({ student }) => {
  // Convertir les données de l'étudiant en JSON
  const data = JSON.stringify(student);
  const encodedData = encodeURIComponent(data);

  // Utilisation d'une API gratuite pour générer le QR code
  const urlQRCode = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodedData}`;

  return (
    <div className="flex flex-col items-center">
      <img
        src={urlQRCode}
        alt="Code QR"
        className="border rounded"
        width={150}
        height={150}
      />
      <span className="text-xs text-muted-foreground mt-1">
        Scanner pour voir les détails
      </span>
    </div>
  );
};

GenerateurQRCode.propTypes = {
  student: PropTypes.object.isRequired,
};

export default GenerateurQRCode;
