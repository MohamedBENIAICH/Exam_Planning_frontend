// src/context/StudentsContext.js
import React, { createContext, useState } from "react";

export const StudentsContext = createContext();

export const StudentsProvider = ({ children }) => {
  const [students, setStudents] = useState([]);

  // Function to add new students
  const addStudents = (newStudents) => {
    setStudents((prevStudents) => [...prevStudents, ...newStudents]);
  };

  return (
    <StudentsContext.Provider value={{ students, addStudents }}>
      {children}
    </StudentsContext.Provider>
  );
};
