import { dateToKey } from './date-utils';
import { Appointment, MeetingRecord, DentistRecord, CancelTarget } from '@/types/appointment';

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

// ค้นหาช่องเวลาที่ว่าง
export function findAvailableSlots(
  date: Date,
  duration: string,
  dentist: string,
  selectedTime?: string,
  period: 'morning' | 'afternoon' | 'all' = 'all'
): string[] {
  const dateKey = dateToKey(date);
  const dayOfWeek = date.getDay();
  const appointments = loadAppointments();
  const leaveData = loadLeaveData();
  const meetingData = loadMeetingData();

  // ตรวจสอบการลา
  if (leaveData[dateKey]) {
    if (leaveData[dateKey].includes("ทำเด็กนักเรียน")) {
      return [];
    }
    if (dentist !== "นัดทั่วไป" && dentist !== "เจ้าหน้าที่" && leaveData[dateKey].includes(dentist)) {
      return [];
    }
  }

  // ตรวจสอบการประชุม
  if (meetingData[dateKey] && dentist !== "นัดทั่วไป" && dentist !== "เจ้าหน้าที่") {
    for (const meeting of meetingData[dateKey]) {
      if (meeting.dentist === dentist && 
          (period === 'all' || 
           (period === 'morning' && meeting.period === 'morning') || 
           (period === 'afternoon' && meeting.period === 'afternoon'))) {
        return [];
      }
    }
  }

  // ช่องเวลาที่สามารถนัดได้
  let slots: string[] = [];
  let morningSlots: string[] = [];
  let afternoonSlots: string[] = [];

  // กำหนดช่องเวลาตามระยะเวลาที่เลือก
  if (duration === "30min") {
    morningSlots = ["9:00-9:30", "9:30-10:00", "10:00-10:30", "10:30-11:00"];
    afternoonSlots = ["13:00-13:30", "13:30-14:00", "14:00-14:30", "14:30-15:00"];
  } else if (duration === "1hour") {
    morningSlots = ["9:00-9:30", "9:30-10:00", "10:00-10:30", "10:30-11:00"];
    afternoonSlots = ["13:00-13:30", "13:30-14:00", "14:00-14:30", "14:30-15:00"];
  } else if (duration === "2hours") {
    morningSlots = ["9:00-9:30", "9:30-10:00", "10:00-10:30", "10:30-11:00"];
    afternoonSlots = ["13:00-13:30", "13:30-14:00", "14:00-14:30", "14:30-15:00"];
  }

  // กรองช่องเวลาตามช่วงที่เลือก
  if (period === 'morning' || period === 'all') {
    // เฉพาะเช้าวันศุกร์และไม่ใช่ช่วงเช้าวันจันทร์-พฤหัส 9:00-10:00
    if (dayOfWeek === 5 || dayOfWeek === 0 || dayOfWeek === 6) {
      slots = [...slots, ...morningSlots];
    } else if (dayOfWeek >= 1 && dayOfWeek <= 4) {
      // วันจันทร์-พฤหัส ไม่รวม 9:00-10:00
      slots = [...slots, ...morningSlots.filter(slot => !["9:00-9:30", "9:30-10:00"].includes(slot))];
    }
  }

  if (period === 'afternoon' || period === 'all') {
    slots = [...slots, ...afternoonSlots];
  }

  // ถ้ามีการระบุเวลาที่ต้องการ
  if (selectedTime) {
    // ตรวจสอบว่า slot ว่างหรือไม่
    // ตรวจสอบเพิ่มเติมสำหรับระยะเวลาที่ยาวกว่า 30 นาที
    const relatedSlots = getRelatedTimeSlots(selectedTime, duration);
    console.log("Related slots:", relatedSlots);
    
    let allSlotsAvailable = true;
    
    for (const slot of relatedSlots) {
      if (!isSlotAvailable(dateKey, slot, appointments)) {
        allSlotsAvailable = false;
        break;
      }
    }
    
    if (allSlotsAvailable) {
      return [selectedTime];
    }
    
    return [];
  }

  // กรณีไม่ระบุเวลา จะค้นหาช่องว่างทั้งหมด
  const availableSlots = slots.filter(slot => {
    // สำหรับระยะเวลาที่ยาวกว่า 30 นาที
    if (duration === "1hour" || duration === "2hours") {
      const relatedSlots = getRelatedTimeSlots(slot, duration);
      let allSlotsAvailable = true;
      
      for (const relatedSlot of relatedSlots) {
        if (!isSlotAvailable(dateKey, relatedSlot, appointments)) {
          allSlotsAvailable = false;
          break;
        }
      }
      
      return allSlotsAvailable;
    }
    
    // สำหรับ 30 นาที ตรวจสอบเพียงช่องเดียว
    return isSlotAvailable(dateKey, slot, appointments);
  });

  return availableSlots;
}

// ตรวจสอบว่า slot ว่างหรือไม่
function isSlotAvailable(dateKey: string, slot: string, appointments: Record<string, Record<string, Appointment[]>>): boolean {
  return !(appointments[dateKey] && appointments[dateKey][slot] && appointments[dateKey][slot].length > 0);
}

// รับช่องเวลาที่เกี่ยวข้องตามระยะเวลา
export function getRelatedTimeSlots(slot: string, duration: string): string[] {
  // สำหรับการนัด 30 นาที
  if (duration === "30min") {
    return [slot];
  }

  // สำหรับการนัด 1 ชั่วโมง
  if (duration === "1hour") {
    // กรณีเลือกช่วงเวลา 30 นาที แล้วต้องการนัด 1 ชั่วโมง
    if (slot === "9:00-9:30") return ["9:00-9:30", "9:30-10:00"];
    if (slot === "9:30-10:00") return ["9:30-10:00", "10:00-10:30"];
    if (slot === "10:00-10:30") return ["10:00-10:30", "10:30-11:00"];
    if (slot === "13:00-13:30") return ["13:00-13:30", "13:30-14:00"];
    if (slot === "13:30-14:00") return ["13:30-14:00", "14:00-14:30"];
    if (slot === "14:00-14:30") return ["14:00-14:30", "14:30-15:00"];
  }

  // สำหรับการนัด 2 ชั่วโมง
  if (duration === "2hours") {
    // กรณีเลือกช่วงเวลา 30 นาที แล้วต้องการนัด 2 ชั่วโมง
    if (slot === "9:00-9:30") return ["9:00-9:30", "9:30-10:00", "10:00-10:30", "10:30-11:00"];
    if (slot === "13:00-13:30") return ["13:00-13:30", "13:30-14:00", "14:00-14:30", "14:30-15:00"];
    if (slot === "13:30-14:00") return ["13:30-14:00", "14:00-14:30", "14:30-15:00", "15:00-15:30"];
  }

  // กรณีอื่นๆ ส่งคืนช่องเวลาเดิม
  return [slot];
}

// บันทึกการนัดหมายพร้อมตรวจสอบกรณีมีหลายช่องเวลา
export function saveAppointmentWithMultipleSlots(
  dateKey: string, 
  timeSlot: string, 
  appointment: Appointment
): void {
  const appointments = loadAppointments();
  const relatedSlots = getRelatedTimeSlots(timeSlot, appointment.duration);
  
  console.log('Saving appointment for slots:', relatedSlots, 'duration:', appointment.duration);
  
  // บันทึกการนัดในทุกช่องเวลาที่เกี่ยวข้อง
  for (const slot of relatedSlots) {
    appointments[dateKey] = appointments[dateKey] || {};
    appointments[dateKey][slot] = appointments[dateKey][slot] || [];
    appointments[dateKey][slot].push({...appointment});
  }
  
  saveAppointments(appointments);
}

// แก้ไขการนัดหมายทุกช่องเวลาที่เกี่ยวข้อง
export function updateAppointmentInAllSlots(
  dateKey: string,
  timeSlot: string,
  oldAppointment: Appointment,
  newAppointment: Appointment
): void {
  const appointments = loadAppointments();
  
  // ลบข้อมูลเก่าจากทุกช่องเวลา
  deleteAppointmentFromAllSlots(dateKey, timeSlot, oldAppointment);
  
  // บันทึกข้อมูลใหม่
  saveAppointmentWithMultipleSlots(dateKey, timeSlot, newAppointment);
  
  saveAppointments(appointments);
}

// ลบการนัดหมายจากทุกช่องเวลาที่เกี่ยวข้อง
export function deleteAppointmentFromAllSlots(
  dateKey: string,
  timeSlot: string,
  appointment: Appointment
): void {
  const appointments = loadAppointments();
  const relatedSlots = getRelatedTimeSlots(timeSlot, appointment.duration);
  
  console.log('Deleting appointment from slots:', relatedSlots);
  
  // ลบการนัดในทุกช่องเวลาที่เกี่ยวข้อง
  for (const slot of relatedSlots) {
    if (appointments[dateKey] && appointments[dateKey][slot]) {
      // ลบการนัดที่ตรงกับข้อมูลที่ระบุ
      appointments[dateKey][slot] = appointments[dateKey][slot].filter(appt => 
        !(appt.patient === appointment.patient && 
          appt.dentist === appointment.dentist && 
          appt.phone === appointment.phone));
      
      // ลบช่องเวลาที่ว่างเปล่า
      if (appointments[dateKey][slot].length === 0) {
        delete appointments[dateKey][slot];
      }
    }
  }
  
  // ลบวันที่ที่ว่างเปล่า
  if (appointments[dateKey] && Object.keys(appointments[dateKey]).length === 0) {
    delete appointments[dateKey];
  }
  
  saveAppointments(appointments);
}

// Re-export dateToKey from date-utils for use in other modules
export { dateToKey };
