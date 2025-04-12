import { Classroom, Exam, Student, Teacher, Filiere } from "@/types";

export const mockStudents: Student[] = [
  {
    id: "1",
    studentId: "S2023001",
    firstName: "Jean",
    lastName: "Dupont",
    email: "jean.dupont@universite.fr",
    program: "Informatique",
    year: 3,
  },
  {
    id: "2",
    studentId: "S2023002",
    firstName: "Marie",
    lastName: "Martin",
    email: "marie.martin@universite.fr",
    program: "Mathématiques",
    year: 2,
  },
  {
    id: "3",
    studentId: "S2023003",
    firstName: "Pierre",
    lastName: "Leroy",
    email: "pierre.leroy@universite.fr",
    program: "Physique",
    year: 4,
  },
  {
    id: "4",
    studentId: "S2023004",
    firstName: "Sophie",
    lastName: "Dubois",
    email: "sophie.dubois@universite.fr",
    program: "Biologie",
    year: 1,
  },
  {
    id: "5",
    studentId: "S2023005",
    firstName: "Luc",
    lastName: "Moreau",
    email: "luc.moreau@universite.fr",
    program: "Chimie",
    year: 2,
  },
];

export const mockClassrooms: Classroom[] = [
  {
    id: "1",
    name: "i8",
    building: "Département Informatique",
    capacity: 30,
    equipment: ["Projecteur", "Tableau blanc", "Ordinateur"],
    isAvailable: true,
  },
  {
    id: "2",
    name: "i7",
    building: "Département Informatique",
    capacity: 25,
    equipment: ["Projecteur", "Tableau blanc"],
    isAvailable: true,
  },
  {
    id: "3",
    name: "C307",
    building: "Bâtiment des Arts",
    capacity: 60,
    equipment: ["Tableau blanc"],
    isAvailable: false,
  },
  {
    id: "4",
    name: "B202",
    building: "Bâtiment des Sciences",
    capacity: 50,
    equipment: ["Projecteur", "Tableau blanc", "Ordinateur"],
    isAvailable: true,
  },
  {
    id: "5",
    name: "A101",
    building: "Bâtiment Principal",
    capacity: 100,
    equipment: ["Projecteur", "Tableau blanc"],
    isAvailable: true,
  },
];

export const mockTeachers: Teacher[] = [
  {
    id: "1",
    firstName: "Ali",
    lastName: "AHMED",
    email: "ali.ahmed@uca.ma",
    department: "Informatique",
    type: "administratif", // Type de superviseur
  },
  {
    id: "2",
    firstName: "Omar",
    lastName: "BENCHAREF",
    email: "omar.bencharef@uca.ma",
    department: "Informatique",
    type: "normal", // Type de superviseur
  },
  {
    id: "3",
    firstName: "Aziz",
    lastName: "DAROUICHI",
    email: "aziz.darouichi@uca.ma",
    department: "Informatique",
    type: "normal", // Type de superviseur
  },
  {
    id: "4",
    firstName: "Miloud",
    lastName: "AITHIMAD",
    email: "miloud.aithimad@uca.ma",
    department: "Informatique",
    type: "normal", // Type de superviseur
  },
  {
    id: "5",
    firstName: "Fatima",
    lastName: "ELKORRI",
    email: "fatima.elkorri@uca.ma",
    department: "Mathématiques",
    type: "normal", // Type de superviseur
  },
];

export const mockExams: Exam[] = [
  {
    id: "1",
    courseCode: "CS101",
    courseName: "Introduction à la Programmation",
    module: "Algorithmes", // Added module
    cycle: "Ingénieure",
    filiere: "Informatique",
    date: new Date(2023, 11, 15),
    startTime: "09:00",
    duration: 120,
    classrooms: ["1"],
    supervisors: ["1"],
    students: ["1", "2"],
  },
  {
    id: "2",
    courseCode: "MATH202",
    courseName: "Calcul Avancé",
    module: "Analyse Mathématique", // Added module
    cycle: "Ingénieure",
    filiere: "Mathématiques",
    date: new Date(2023, 11, 17),
    startTime: "14:00",
    duration: 180,
    classrooms: ["2"],
    supervisors: ["2"],
    students: ["2", "3"],
  },
  {
    id: "3",
    courseCode: "PHY301",
    courseName: "Mécanique Quantique",
    module: "Physique Moderne", // Added module
    cycle: "Master",
    filiere: "Physique",
    date: new Date(2023, 11, 20),
    startTime: "10:00",
    duration: 150,
    classrooms: ["3"],
    supervisors: ["3"],
    students: ["3", "4"],
  },
  {
    id: "4",
    courseCode: "BIO101",
    courseName: "Introduction à la Biologie",
    module: "Biologie Cellulaire", // Added module
    cycle: "Licence",
    filiere: "Biologie",
    date: new Date(2023, 11, 22),
    startTime: "13:00",
    duration: 120,
    classrooms: ["4"],
    supervisors: ["4"],
    students: ["4", "5"],
  },
  {
    id: "5",
    courseCode: "CHEM201",
    courseName: "Chimie Organique",
    module: "Chimie des Polymères", // Added module
    cycle: "Licence",
    filiere: "Chimie",
    date: new Date(2023, 11, 25),
    startTime: "15:00",
    duration: 180,
    classrooms: ["5"],
    supervisors: ["5"],
    students: ["1", "5"],
  },
];

export const mockFilieres: Filiere[] = [
  { id: "filiere1", name: "IRISI" },
  { id: "filiere2", name: "SIT" },
  { id: "filiere3", name: "GMP" },
  { id: "filiere4", name: "GC" },
  { id: "filiere5", name: "Biotechnologie" },
  { id: "filiere6", name: "Génie Chimique" },
];