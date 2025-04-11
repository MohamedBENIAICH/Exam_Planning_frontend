import React, { useState } from "react";
import QrScanner from "react-qr-scanner";

const ScannerQRCode = () => {
  const [scannedData, setScannedData] = useState(null);

  const handleScan = (data) => {
    if (data) {
      try {
        const student = JSON.parse(decodeURIComponent(data.text));
        setScannedData(student);
      } catch (e) {
        console.error("QR Code invalide", e);
      }
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-center">Scanner un QR Code</h2>

      <div className="border rounded-md p-4">
        <QrScanner
          delay={300}
          style={{ width: "100%" }}
          onScan={handleScan}
          onError={handleError}
        />
      </div>

      {scannedData && (
        <div className="border rounded-md p-4 bg-gray-100">
          <h3 className="text-lg font-semibold">Informations de l'étudiant</h3>
          <p>
            <strong>ID :</strong> {scannedData.studentId}
          </p>
          <p>
            <strong>Nom :</strong> {scannedData.firstName}{" "}
            {scannedData.lastName}
          </p>
        </div>
      )}
    </div>
  );
};

export default ScannerQRCode;
