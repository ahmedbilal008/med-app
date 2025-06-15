export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_history: string;
  allergies: string;
  current_medications: string;
  department: string;
  created_at: string;
  updated_at: string;
  doctor_id: string;
}

export interface MedicalStaff {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  license_number: string;
  created_at: string;
  updated_at: string;
}

export interface Visit {
  id: string;
  patient_id: string;
  staff_id: string;
  visit_date: string;
  symptoms: string;
  diagnosis: string;
  treatment_plan: string;
  prescription: string;
  notes: string;
  voice_recording_url: string;
  follow_up_date: string;
  created_at: string;
  updated_at: string;
}

export const DEPARTMENTS = [
  'Cardiology',
  'Dermatology',
  'Emergency Medicine',
  'Endocrinology',
  'Family Medicine',
  'Gastroenterology',
  'General Surgery',
  'Hematology',
  'Internal Medicine',
  'Neurology',
  'Obstetrics & Gynecology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Otolaryngology',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
  'Rheumatology',
  'Urology'
] as const;
