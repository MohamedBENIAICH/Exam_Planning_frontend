// Student model
export const studentModel = {
  id: '',
  studentId: '',
  firstName: '',
  lastName: '',
  email: '',
  program: '',
  year: 0
};

// Classroom model
export const classroomModel = {
  id: '',
  name: '',
  building: '',
  capacity: 0,
  equipment: [],
  isAvailable: true
};

// Teacher model
export const teacherModel = {
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  department: '',
  type: '' // Type de superviseur (administratif ou normal)
};

// Exam model 
export const examModel = {
  id: '',
  courseCode: '',
  courseName: '',
  date: new Date(),
  startTime: '',
  duration: 0,
  classrooms: [],
  supervisors: [],
  students: []
};

// ExamSchedule model
export const examScheduleModel = {
  examId: '',
  classroomId: '',
  studentIds: [],
  supervisorIds: []
};

// Filiere model
export const filiereModel = {
  id: '',
  name: ''
};

// CSV record model
export const csvRecordModel = {};