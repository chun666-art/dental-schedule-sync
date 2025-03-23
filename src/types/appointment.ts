
export interface Appointment {
  dentist: string;
  duration: "30min" | "1hour" | "2hours";
  patient: string;
  phone: string;
  treatment: string;
  status: "รอการยืนยันนัด" | "ยืนยันนัด" | "นัดถูกยกเลิก";
  time?: string; // Optional field for some operations
}

export interface MeetingRecord {
  dentist: string;
  period: "morning" | "afternoon";
}

export interface DentistRecord {
  name: string;
  color: string;
}

export interface CancelTarget {
  date: string;
  time: string;
  index: number;
}

export type TimeSlot = 
  | "9:00-9:30" | "9:30-10:00" | "10:00-10:30" | "10:30-11:00"
  | "13:00-13:30" | "13:30-14:00" | "14:00-14:30" | "14:30-15:00"
  | "9:00-10:00" | "10:00-11:00" | "13:00-14:00" | "14:00-15:00"
  | "9:00-11:00" | "13:00-15:00"
  | "สถานะการลา/ประชุม";
