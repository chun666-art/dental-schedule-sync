
import { dateToKey } from './date-utils';
import { Appointment, LeaveRecord, MeetingRecord, DentistRecord } from '@/types/appointment';

// ดึงข้อมูลการนัดหมายจาก localStorage
export function loadAppointments(): Record<string, Record<string, Appointment[]>> {
  return JSON.parse(localStorage.getItem('appointments') || '{}');
}

// บันทึกข้อมูลการนัดหมายลง localStorage
export function saveAppointments(appointments: Record<string, Record<string, Appointment[]>>): void {
  localStorage.setItem('appointments', JSON.stringify(appointments));
}

// ดึงข้อมูลการลาจาก localStorage
export function loadLeaveData(): Record<string, string[]> {
  return JSON.parse(localStorage.getItem('leaveData') || '{}');
}

// บันทึกข้อมูลการลาลง localStorage
export function saveLeaveData(leaveData: Record<string, string[]>): void {
  localStorage.setItem('leaveData', JSON.stringify(leaveData));
}

// ดึงข้อมูลการประชุมจาก localStorage
export function loadMeetingData(): Record<string, MeetingRecord[]> {
  return JSON.parse(localStorage.getItem('meetingData') || '{}');
}

// บันทึกข้อมูลการประชุมลง localStorage
export function saveMeetingData(meetingData: Record<string, MeetingRecord[]>): void {
  localStorage.setItem('meetingData', JSON.stringify(meetingData));
}

// ดึงข้อมูลรายชื่อหมอจาก localStorage
export function loadDentists(): Record<string, string> {
  return JSON.parse(localStorage.getItem('dentists') || '{"DC": "#ff9999", "DD": "#99ff99", "DPa": "#9999ff", "DPu": "#ffcc99", "DT": "#cc99ff"}');
}

// บันทึกข้อมูลรายชื่อหมอลง localStorage
export function saveDentists(dentists: Record<string, string>): void {
  localStorage.setItem('dentists', JSON.stringify(dentists));
}

// ลบข้อมูลเก่า (เกิน 60 วัน)
export function deleteOldData(): void {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const twoMonthsAgo = new Date(today);
  twoMonthsAgo.setDate(today.getDate() - 60);

  // ลบข้อมูลการนัดหมายเก่า
  const appointments = loadAppointments();
  for (const dateKey in appointments) {
    const date = new Date(dateKey);
    date.setHours(0, 0, 0, 0);
    if (date < twoMonthsAgo) {
      delete appointments[dateKey];
    }
  }
  saveAppointments(appointments);

  // ลบข้อมูลการลาเก่า
  const leaveData = loadLeaveData();
  for (const dateKey in leaveData) {
    const date = new Date(dateKey);
    date.setHours(0, 0, 0, 0);
    if (date < twoMonthsAgo) {
      delete leaveData[dateKey];
    }
  }
  saveLeaveData(leaveData);

  // ลบข้อมูลการประชุมเก่า
  const meetingData = loadMeetingData();
  for (const dateKey in meetingData) {
    const date = new Date(dateKey);
    date.setHours(0, 0, 0, 0);
    if (date < twoMonthsAgo) {
      delete meetingData[dateKey];
    }
  }
  saveMeetingData(meetingData);

  localStorage.setItem('lastCleanupDate', dateToKey(today));
}

// ตรวจสอบและทำความสะอาดข้อมูลเก่า
export function checkAndCleanupData(): void {
  const today = new Date();
  const lastCleanupDate = localStorage.getItem('lastCleanupDate');
  const todayKey = dateToKey(today);

  if (lastCleanupDate !== todayKey) {
    deleteOldData();
  }
}

// ตรวจสอบว่า slot ว่างสำหรับการนัดหมายหรือไม่
export function findAvailableSlots(
  date: Date,
  duration: string,
  dentist: string,
  selectedTime?: string
): boolean {
  const dateKey = dateToKey(date);
  const dayOfWeek = date.getDay();
  const appointments = loadAppointments();
  const leaveData = loadLeaveData();
  const meetingData = loadMeetingData();

  // ตรวจสอบการลา
  if (leaveData[dateKey]) {
    if (leaveData[dateKey].includes("ทำเด็กนักเรียน")) {
      return false;
    }
    if (dentist !== "นัดทั่วไป" && dentist !== "เจ้าหน้าที่" && leaveData[dateKey].includes(dentist)) {
      return false;
    }
  }

  // ตรวจสอบการประชุม
  if (meetingData[dateKey] && dentist !== "นัดทั่วไป" && dentist !== "เจ้าหน้าที่") {
    for (const meeting of meetingData[dateKey]) {
      if (meeting.dentist === dentist) {
        return false;
      }
    }
  }

  let slots: string[] = [];
  if (duration === "30min") {
    slots = [
      "9:00-9:30", "9:30-10:00", "10:00-10:30", "10:30-11:00",
      "13:00-13:30", "13:30-14:00", "14:00-14:30", "14:30-15:00"
    ];
  } else if (duration === "1hour") {
    slots = [
      "9:00-10:00", "10:00-11:00",
      "13:00-14:00", "14:00-15:00"
    ];
  } else if (duration === "2hours") {
    slots = ["9:00-11:00", "13:00-15:00"];
  }

  // ตรวจสอบว่า selectedTime ว่างหรือไม่
  if (selectedTime && !slots.includes(selectedTime)) {
    return false; // ถ้า time ไม่ตรงกับ slots ที่ duration รองรับ
  }

  if (selectedTime && ["9:00-9:30", "9:30-10:00"].includes(selectedTime) && dayOfWeek >= 1 && dayOfWeek <= 4) {
    return false; // จำกัดช่วงเช้าวันจันทร์-พฤหัส
  }

  return !(appointments[dateKey] && 
           appointments[dateKey][selectedTime as string] && 
           appointments[dateKey][selectedTime as string].length > 0);
}
