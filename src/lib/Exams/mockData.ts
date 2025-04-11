import { Classroom, Exam, Student, Teacher, Filiere } from "@/types";

export const mockStudents: Student[] = [
  {
    id: "2320382",
    studentId: "2320382",
    firstName: "Hatim",
    lastName: "ABAHRI",
    email: "abahri.hatim@uca.ac.ma",
    program: "Java",
    year: 4
  },
  {

    id: "S1040",
    studentId: "S1040",
    firstName: "Tony",
    lastName: "Sutton",
    email: "tony.sutton@etu.univ.com",
    program: "Java",
    year: 1,
  },
  {
    id: "2320383",
    studentId: "2320383",
    firstName: "Sohayb",
    lastName: "ABARDIY",
    email: "abardiy.sohayb@uca.ac.ma",
    program: "Java",
    year: 4
  },
  {
    id: "3",
    studentId: "2109058",
    firstName: "Amal",
    lastName: "AL KHYIA",
    email: "alkyia.amal@uca.ac.ma",
    program: "Java",
    year: 4
  },
  {
    id: "4",
    studentId: "2320396",
    firstName: "Mohamed",
    lastName: "BENIAICH",
    email: "beniaich.mohamed@uca.ac.ma",
    program: "Java",
    year: 4
  },
  {
    id: "5",
    studentId: "2001661",
    firstName: "Mehdi",
    lastName: "BENMARZOUK",
    email: "benmarzouk.mehdi@uca.ac.ma",
    program: "Java",
    year: 4
  },
  {
    id: "6",
    studentId: "2108831",
    firstName: "Omar",
    lastName: "BOUDADEN",
    email: "boudaden.omar@uca.ac.ma",
    program: "Java",
    year: 4
  },
  {
    id: "7",
    studentId: "2320388",
    firstName: "Ibrahima",
    lastName: "DIARRA",
    email: "diarra.ibrahima@uca.ac.ma",
    program: "Java",
    year: 4
  },
  {
    id: "8",
    studentId: "2109150",
    firstName: "Samah",
    lastName: "ELKHAL",
    email: "elkhal.samah@uca.ac.ma",
    program: "Java",
    year: 4
  },
  {
    id: "9",
    studentId: "2320390",
    firstName: "Khaoula",
    lastName: "GRIBIS",
    email: "gribis.khaoula@uca.ac.ma",
    program: "Java",
    year: 4
  },
  {
    id: "10",
    studentId: "2220247",
    firstName: "Aissam",
    lastName: "IDBENAHMED",
    email: "idbenahmed.aissam@uca.ac.ma",
    program: "Java",
    year: 4
  },
  {
    id: "11",
    studentId: "2320391",
    firstName: "Ayoub",
    lastName: "IZEM",
    email: "izem.ayoub@uca.ac.ma",
    program: "Java",
    year: 4
  },
    {
      "id": "12",
      "studentId": "2320392",
      "firstName": "Mohamed",
      "lastName": "LAHMAM",
      "email": "lahmam.mohamed@uca.ac.ma",
      "program": "Java",
      "year": 4
    },
    {
      "id": "13",
      "studentId": "2130107",
      "firstName": "Sara",
      "lastName": "LATIF",
      "email": "latif.sara@uca.ac.ma",
      "program": "Java",
      "year": 4
    },
    {
      "id": "14",
      "studentId": "2108525",
      "firstName": "Hafsa",
      "lastName": "MERZOUK",
      "email": "merzouk.hafsa@uca.ac.ma",
      "program": "Java",
      "year": 4
    },
    {
      "id": "15",
      "studentId": "2320395",
      "firstName": "Sofia",
      "lastName": "MGHARI",
      "email": "mghari.sofia@uca.ac.ma",
      "program": "Java",
      "year": 4
    },
    {
      "id": "16",
      "studentId": "2320397",
      "firstName": "Nouhaila",
      "lastName": "MOUHLY",
      "email": "mouhly.nouhaila@uca.ac.ma",
      "program": "Java",
      "year": 4
    },
    {
      "id": "17",
      "studentId": "2320398",
      "firstName": "Nourredine",
      "lastName": "MOULAY",
      "email": "moulay.nourredine@uca.ac.ma",
      "program": "Java",
      "year": 4
    },
    {
      "id": "18",
      "studentId": "2024126",
      "firstName": "Hasnae",
      "lastName": "MOULIM",
      "email": "moulim.hasnae@uca.ac.ma",
      "program": "Java",
      "year": 4
    },
    {
      "id": "19",
      "studentId": "2320400",
      "firstName": "Meryem",
      "lastName": "MOUSSATEF",
      "email": "moussatef.meryem@uca.ac.ma",
      "program": "Java",
      "year": 4
    },
    {
      "id": "20",
      "studentId": "2108968",
      "firstName": "Safia",
      "lastName": "ZITOUNI",
      "email": "zitouni.safia@uca.ac.ma",
      "program": "Java",
      "year": 4
    }
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
    date: new Date(2025, 3, 15),
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
    date: new Date(2025, 3, 17),
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
    date: new Date(2025, 3, 20),
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
    date: new Date(2025, 3, 22),
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
    module: "Chimie des Polymères",
    cycle: "Licence",
    filiere: "Chimie",
    date: new Date(2025, 3, 25),
    startTime: "15:00",
    duration: 180,
    classrooms: ["5"],
    supervisors: ["5"],
    students: ["1", "5"],
  },
  {
    id: "6",
    courseCode: "Java101",
    courseName: "Introduction à Java",
    module: "Programmation Avancée",
    cycle: "Licence",
    filiere: { id: "filiere1", name: "Java" },
    date: new Date(2025, 3, 30),
    startTime: "10:00",
    duration: 120,
    classrooms: ["6"],
    supervisors: ["6"],
    students: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"]
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