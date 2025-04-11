import React, { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import PropTypes from "prop-types";

const Convocation = ({ student, examDetails }) => {
  const convocationRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => convocationRef.current,
  });

  return (
    <div className="p-6 border rounded-md bg-white">
      <h2 className="text-xl font-bold mb-4">Convocation d'Examen</h2>

      <div ref={convocationRef} className="p-4 border rounded-md bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">
          Informations de l'Étudiant
        </h3>
        <p>
          <strong>ID :</strong> {student.studentId}
        </p>
        <p>
          <strong>Nom :</strong> {student.firstName} {student.lastName}
        </p>
        <p>
          <strong>Email :</strong> {student.email}
        </p>

        <h3 className="text-lg font-semibold mt-4 mb-2">Détails de l'Examen</h3>
        <p>
          <strong>Matière :</strong> {examDetails.subject}
        </p>
        <p>
          <strong>Date :</strong> {examDetails.date}
        </p>
        <p>
          <strong>Heure :</strong> {examDetails.time}
        </p>
        <p>
          <strong>Salle :</strong> {examDetails.room}
        </p>

        <div className="flex justify-center mt-4">
          <QRCodeCanvas value={JSON.stringify(student)} size={150} />
        </div>
        <p className="text-center text-sm text-gray-600 mt-2">
          Scannez pour afficher les détails
        </p>
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={handlePrint} className="bg-blue-500 text-white">
          Imprimer la Convocation
        </Button>
      </div>
    </div>
  );
};

Convocation.propTypes = {
  student: PropTypes.object.isRequired,
  examDetails: PropTypes.object.isRequired,
};

export default Convocation;
