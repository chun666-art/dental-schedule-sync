
import { dateToKey, isWeekend } from './date-utils';
import { Appointment, MeetingRecord, DentistRecord, CancelTarget } from '@/types/appointment';
import { supabase } from '@/integrations/supabase/client';

// ดึงข้อมูลการนัดหมายจาก Supabase
export async function loadAppointments(): Promise<Record<string, Record<string, Appointment[]>>> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*');
    
    if (error) {
      console.error('Error loading appointments from Supabase:', error);
      return JSON.parse(localStorage.getItem('appointments') || '{}');
    }

    // แปลงข้อมูลจาก Supabase ให้อยู่ในรูปแบบที่แอปใช้งาน
    const appointments: Record<string, Record<string, Appointment[]>> = {};
    
    if (data) {
      data.forEach(item => {
        if (!appointments[item.date]) {
          appointments[item.date] = {};
        }
        
        if (!appointments[item.date][item.time]) {
          appointments[item.date][item.time] = [];
        }
        
        appointments[item.date][item.time].push({
          dentist: item.dentist,
          patient: item.patient,
          phone: item.phone,
          treatment: item.treatment,
          duration: item.duration,
          status: item.status
        });
      });
    }
    
    return appointments;
  } catch (error) {
    console.error('Error loading appointments:', error);
    return JSON.parse(localStorage.getItem('appointments') || '{}');
  }
}

// บันทึกข้อมูลการนัดหมายลง Supabase
export async function saveAppointments(appointments: Record<string, Record<string, Appointment[]>>): Promise<void> {
  try {
    // บันทึกลงใน localStorage เป็น backup
    localStorage.setItem('appointments', JSON.stringify(appointments));
    
    // ไม่ได้ทำการ sync ทั้งหมดกับ Supabase เนื่องจากจะทำให้โค้ดซับซ้อนเกินไป
    // การ sync ทั้งหมดจะทำเมื่อมีการเพิ่ม/แก้ไข/ลบข้อมูลแต่ละรายการ
  } catch (error) {
    console.error('Error saving appointments:', error);
  }
}

// ดึงข้อมูลการลาจาก Supabase
export async function loadLeaveData(): Promise<Record<string, string[]>> {
  try {
    const { data, error } = await supabase
      .from('leave_records')
      .select('*');
    
    if (error) {
      console.error('Error loading leave records from Supabase:', error);
      return JSON.parse(localStorage.getItem('leaveData') || '{}');
    }

    // แปลงข้อมูลจาก Supabase ให้อยู่ในรูปแบบที่แอปใช้งาน
    const leaveData: Record<string, string[]> = {};
    
    if (data) {
      data.forEach(item => {
        if (!leaveData[item.date]) {
          leaveData[item.date] = [];
        }
        
        leaveData[item.date].push(item.dentist);
        
        if (item.reason) {
          leaveData[item.date].push(item.reason);
        }
      });
    }
    
    return leaveData;
  } catch (error) {
    console.error('Error loading leave data:', error);
    return JSON.parse(localStorage.getItem('leaveData') || '{}');
  }
}

// บันทึกข้อมูลการลาลง Supabase
export async function saveLeaveData(leaveData: Record<string, string[]>): Promise<void> {
  try {
    // บันทึกลงใน localStorage เป็น backup
    localStorage.setItem('leaveData', JSON.stringify(leaveData));
    
    // ไม่ได้ทำการ sync ทั้งหมดกับ Supabase เนื่องจากจะทำให้โค้ดซับซ้อนเกินไป
    // การ sync ทั้งหมดจะทำเมื่อมีการเพิ่ม/แก้ไข/ลบข้อมูลแต่ละรายการ
  } catch (error) {
    console.error('Error saving leave data:', error);
  }
}

// ดึงข้อมูลการประชุมจาก Supabase
export async function loadMeetingData(): Promise<Record<string, MeetingRecord[]>> {
  try {
    const { data, error } = await supabase
      .from('meeting_records')
      .select('*');
    
    if (error) {
      console.error('Error loading meeting records from Supabase:', error);
      return JSON.parse(localStorage.getItem('meetingData') || '{}');
    }

    // แปลงข้อมูลจาก Supabase ให้อยู่ในรูปแบบที่แอปใช้งาน
    const meetingData: Record<string, MeetingRecord[]> = {};
    
    if (data) {
      data.forEach(item => {
        if (!meetingData[item.date]) {
          meetingData[item.date] = [];
        }
        
        meetingData[item.date].push({
          dentist: item.dentist,
          period: item.period as "morning" | "afternoon"
        });
      });
    }
    
    return meetingData;
  } catch (error) {
    console.error('Error loading meeting data:', error);
    return JSON.parse(localStorage.getItem('meetingData') || '{}');
  }
}

// บันทึกข้อมูลการประชุมลง Supabase
export async function saveMeetingData(meetingData: Record<string, MeetingRecord[]>): Promise<void> {
  try {
    // บันทึกลงใน localStorage เป็น backup
    localStorage.setItem('meetingData', JSON.stringify(meetingData));
    
    // ไม่ได้ทำการ sync ทั้งหมดกับ Supabase เนื่องจากจะทำให้โค้ดซับซ้อนเกินไป
    // การ sync ทั้งหมดจะทำเมื่อมีการเพิ่ม/แก้ไข/ลบข้อมูลแต่ละรายการ
  } catch (error) {
    console.error('Error saving meeting data:', error);
  }
}

// ดึงข้อมูลรายชื่อหมอจาก Supabase
export async function loadDentists(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase
      .from('dentists')
      .select('*')
      .eq('active', true);
    
    if (error) {
      console.error('Error loading dentists from Supabase:', error);
      return JSON.parse(localStorage.getItem('dentists') || '{"DC": "#ff9999", "DD": "#99ff99", "DPa": "#9999ff", "DPu": "#ffcc99", "DT": "#cc99ff"}');
    }

    // แปลงข้อมูลจาก Supabase ให้อยู่ในรูปแบบที่แอปใช้งาน
    const dentists: Record<string, string> = {};
    
    if (data) {
      data.forEach(item => {
        dentists[item.name] = item.color;
      });
    }
    
    // ถ้าไม่มีข้อมูลจาก Supabase ให้ใช้ข้อมูลจาก localStorage
    if (Object.keys(dentists).length === 0) {
      return JSON.parse(localStorage.getItem('dentists') || '{"DC": "#ff9999", "DD": "#99ff99", "DPa": "#9999ff", "DPu": "#ffcc99", "DT": "#cc99ff"}');
    }
    
    return dentists;
  } catch (error) {
    console.error('Error loading dentists:', error);
    return JSON.parse(localStorage.getItem('dentists') || '{"DC": "#ff9999", "DD": "#99ff99", "DPa": "#9999ff", "DPu": "#ffcc99", "DT": "#cc99ff"}');
  }
}

// บันทึกข้อมูลรายชื่อหมอลง Supabase
export async function saveDentists(dentists: Record<string, string>): Promise<void> {
  try {
    // บันทึกลงใน localStorage เป็น backup
    localStorage.setItem('dentists', JSON.stringify(dentists));
    
    // ดึงข้อมูลหมอปัจจุบันจาก Supabase
    const { data, error } = await supabase
      .from('dentists')
      .select('name');
    
    if (error) {
      console.error('Error getting dentists from Supabase:', error);
      return;
    }
    
    const existingDentists = data ? data.map(d => d.name) : [];
    
    // อัปเดตหรือเพิ่มข้อมูลหมอใน Supabase
    for (const [name, color] of Object.entries(dentists)) {
      if (existingDentists.includes(name)) {
        // อัปเดตข้อมูลที่มีอยู่แล้ว
        const { error } = await supabase
          .from('dentists')
          .update({ color, active: true })
          .eq('name', name);
        
        if (error) {
          console.error(`Error updating dentist ${name}:`, error);
        }
      } else {
        // เพิ่มข้อมูลใหม่
        const { error } = await supabase
          .from('dentists')
          .insert([{ name, color, active: true }]);
        
        if (error) {
          console.error(`Error inserting dentist ${name}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error saving dentists:', error);
  }
}

// ลบข้อมูลเก่า (เกิน 60 วัน)
export async function deleteOldData(): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setDate(today.getDate() - 60);
    const cutoffDate = dateToKey(twoMonthsAgo);
    
    // ลบข้อมูลการนัดหมายเก่าใน Supabase
    const { error: appointmentsError } = await supabase
      .from('appointments')
      .delete()
      .lt('date', cutoffDate);
    
    if (appointmentsError) {
      console.error('Error deleting old appointments:', appointmentsError);
    }
    
    // ลบข้อมูลการลาเก่าใน Supabase
    const { error: leaveError } = await supabase
      .from('leave_records')
      .delete()
      .lt('date', cutoffDate);
    
    if (leaveError) {
      console.error('Error deleting old leave records:', leaveError);
    }
    
    // ลบข้อมูลการประชุมเก่าใน Supabase
    const { error: meetingError } = await supabase
      .from('meeting_records')
      .delete()
      .lt('date', cutoffDate);
    
    if (meetingError) {
      console.error('Error deleting old meeting records:', meetingError);
    }
    
    // ลบข้อมูลเก่าใน localStorage ด้วย (สำรอง)
    const appointments = JSON.parse(localStorage.getItem('appointments') || '{}');
    const leaveData = JSON.parse(localStorage.getItem('leaveData') || '{}');
    const meetingData = JSON.parse(localStorage.getItem('meetingData') || '{}');
    
    for (const dateKey in appointments) {
      const date = new Date(dateKey);
      date.setHours(0, 0, 0, 0);
      if (date < twoMonthsAgo) {
        delete appointments[dateKey];
      }
    }
    
    for (const dateKey in leaveData) {
      const date = new Date(dateKey);
      date.setHours(0, 0, 0, 0);
      if (date < twoMonthsAgo) {
        delete leaveData[dateKey];
      }
    }
    
    for (const dateKey in meetingData) {
      const date = new Date(dateKey);
      date.setHours(0, 0, 0, 0);
      if (date < twoMonthsAgo) {
        delete meetingData[dateKey];
      }
    }
    
    localStorage.setItem('appointments', JSON.stringify(appointments));
    localStorage.setItem('leaveData', JSON.stringify(leaveData));
    localStorage.setItem('meetingData', JSON.stringify(meetingData));
    
    localStorage.setItem('lastCleanupDate', dateToKey(today));
  } catch (error) {
    console.error('Error deleting old data:', error);
  }
}

// ตรวจสอบและทำความสะอาดข้อมูลเก่า
export async function checkAndCleanupData(): Promise<void> {
  const today = new Date();
  const lastCleanupDate = localStorage.getItem('lastCleanupDate');
  const todayKey = dateToKey(today);

  if (lastCleanupDate !== todayKey) {
    await deleteOldData();
  }
}

// ค้นหาช่องเวลาที่ว่าง
export async function findAvailableSlots(
  date: Date,
  duration: string,
  dentist: string,
  selectedTime?: string,
  period: 'morning' | 'afternoon' | 'all' = 'all'
): Promise<string[]> {
  const dateKey = dateToKey(date);
  const dayOfWeek = date.getDay();
  const appointments = await loadAppointments();
  const leaveData = await loadLeaveData();
  const meetingData = await loadMeetingData();

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

  // กำหนดช่วงเวลาตามตารางเวลาปกติ
  morningSlots = ["9:00-9:30", "9:30-10:00", "10:00-10:30", "10:30-11:00"];
  afternoonSlots = ["13:00-13:30", "13:30-14:00", "14:00-14:30", "14:30-15:00"];

  // กรองช่องเวลาตามช่วงที่เลือก
  if (period === 'morning' || period === 'all') {
    // วันศุกร์สามารถนัดได้ทั้งหมดในช่วงเช้า
    if (dayOfWeek === 5) {
      slots = [...slots, ...morningSlots];
    } else if (dayOfWeek >= 1 && dayOfWeek <= 4) {
      // วันจันทร์-พฤหัส ไม่รวม 9:00-10:00 ยกเว้นสำหรับหมอ
      if (dentist === "นัดทั่วไป" || dentist === "เจ้าหน้าที่") {
        slots = [...slots, ...morningSlots.filter(slot => !["9:00-9:30", "9:30-10:00"].includes(slot))];
      } else {
        slots = [...slots, ...morningSlots];
      }
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
  }

  // กรณีอื่นๆ ส่งคืนช่องเวลาเดิม
  return [slot];
}

// บันทึกการนัดหมายพร้อมตรวจสอบกรณีมีหลายช่องเวลา
export async function saveAppointmentWithMultipleSlots(
  dateKey: string, 
  timeSlot: string, 
  appointment: Appointment
): Promise<void> {
  const appointments = await loadAppointments();
  const relatedSlots = getRelatedTimeSlots(timeSlot, appointment.duration);
  
  console.log('Saving appointment for slots:', relatedSlots, 'duration:', appointment.duration);
  
  // บันทึกการนัดในทุกช่องเวลาที่เกี่ยวข้อง
  for (const slot of relatedSlots) {
    appointments[dateKey] = appointments[dateKey] || {};
    appointments[dateKey][slot] = appointments[dateKey][slot] || [];
    appointments[dateKey][slot].push({...appointment});
    
    // บันทึกลง Supabase
    try {
      const { error } = await supabase
        .from('appointments')
        .insert([{
          date: dateKey,
          time: slot,
          dentist: appointment.dentist,
          patient: appointment.patient,
          phone: appointment.phone,
          treatment: appointment.treatment,
          duration: appointment.duration,
          status: appointment.status
        }]);
      
      if (error) {
        console.error('Error saving appointment to Supabase:', error);
      }
    } catch (error) {
      console.error('Error saving appointment to Supabase:', error);
    }
  }
  
  await saveAppointments(appointments);
}

// แก้ไขการนัดหมายทุกช่องเวลาที่เกี่ยวข้อง
export async function updateAppointmentInAllSlots(
  dateKey: string,
  timeSlot: string,
  oldAppointment: Appointment,
  newAppointment: Appointment
): Promise<void> {
  // ลบข้อมูลเก่าจากทุกช่องเวลา
  await deleteAppointmentFromAllSlots(dateKey, timeSlot, oldAppointment);
  
  // บันทึกข้อมูลใหม่
  await saveAppointmentWithMultipleSlots(dateKey, timeSlot, newAppointment);
}

// ลบการนัดหมายจากทุกช่องเวลาที่เกี่ยวข้อง
export async function deleteAppointmentFromAllSlots(
  dateKey: string,
  timeSlot: string,
  appointment: Appointment
): Promise<void> {
  const appointments = await loadAppointments();
  const relatedSlots = getRelatedTimeSlots(timeSlot, appointment.duration);
  
  console.log('Deleting appointment from slots:', relatedSlots);
  
  // ลบการนัดในทุกช่องเวลาที่เกี่ยวข้อง
  for (const slot of relatedSlots) {
    if (appointments[dateKey] && appointments[dateKey][slot]) {
      // ลบการนัดที่ตรงกับข้อมูลที่ระบุ
      appointments[dateKey][slot] = appointments[dateKey][slot].filter(appt => 
        !(appt.patient === appointment.patient && 
          appt.dentist === appointment.dentist && 
          appt.treatment === appointment.treatment &&
          appt.phone === appointment.phone));
      
      // ลบข้อมูลจาก Supabase
      try {
        const { error } = await supabase
          .from('appointments')
          .delete()
          .eq('date', dateKey)
          .eq('time', slot)
          .eq('dentist', appointment.dentist)
          .eq('patient', appointment.patient)
          .eq('phone', appointment.phone)
          .eq('treatment', appointment.treatment);
        
        if (error) {
          console.error('Error deleting appointment from Supabase:', error);
        }
      } catch (error) {
        console.error('Error deleting appointment from Supabase:', error);
      }
      
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
  
  await saveAppointments(appointments);
}

// ตรวจสอบการนัดหมายที่ได้รับผลกระทบจากการลาของหมอ
export async function findAffectedAppointmentsByLeave(dateKey: string, dentistName: string): Promise<Appointment[]> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('date', dateKey)
      .eq('dentist', dentistName);
    
    if (error) {
      console.error('Error finding affected appointments:', error);
      
      // Fallback to localStorage
      const appointments = await loadAppointments();
      const affectedAppointments: Appointment[] = [];
      
      if (appointments[dateKey]) {
        for (const timeSlot in appointments[dateKey]) {
          for (const appt of appointments[dateKey][timeSlot]) {
            if (appt.dentist === dentistName && !affectedAppointments.some(
              a => a.patient === appt.patient && 
                  a.phone === appt.phone && 
                  a.treatment === appt.treatment)
            ) {
              affectedAppointments.push({...appt, time: timeSlot});
            }
          }
        }
      }
      
      return affectedAppointments;
    }
    
    // Convert Supabase data to Appointment array
    const affectedAppointments: Appointment[] = [];
    const processedPatients = new Set<string>();
    
    if (data) {
      for (const item of data) {
        const patientKey = `${item.patient}-${item.phone}-${item.treatment}`;
        
        if (!processedPatients.has(patientKey)) {
          processedPatients.add(patientKey);
          
          affectedAppointments.push({
            dentist: item.dentist,
            patient: item.patient,
            phone: item.phone,
            treatment: item.treatment,
            duration: item.duration,
            status: item.status,
            time: item.time
          });
        }
      }
    }
    
    return affectedAppointments;
  } catch (error) {
    console.error('Error finding affected appointments:', error);
    return [];
  }
}

// Re-export dateToKey from date-utils for use in other modules
export { dateToKey };
