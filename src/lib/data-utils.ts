import { supabase } from '@/integrations/supabase/client';
import { getAppointmentsFromSupabase, syncAppointmentsToSupabase } from '@/lib/supabase';
import { 
  Appointment, 
  TimeSlot, 
  MeetingRecord, 
  SupabaseAppointment 
} from '@/types/appointment';
import { dateToKey as dateUtilToKey } from '@/lib/date-utils';

// Helper function to safely convert string to allowed duration type
function convertToDuration(value: string): "30min" | "1hour" | "2hours" {
  if (value === "30min" || value === "1hour" || value === "2hours") {
    return value;
  }
  // Default value if conversion fails
  return "30min";
}

// Helper function to safely convert string to allowed status type
function convertToStatus(value: string): "รอการยืนยันนัด" | "ยืนยันนัด" | "นัดถูกยกเลิก" {
  if (value === "รอการยืนยันนัด" || value === "ยืนยันนัด" || value === "นัดถูกยกเลิก") {
    return value;
  }
  // Default value if conversion fails
  return "รอการยืนยันนัด";
}

// ใช้ localStorage เพื่อเก็บข้อมูลการนัดหมาย
export const loadAppointments = async (): Promise<Record<string, Record<string, Appointment[]>>> => {
  try {
    // ลองดึงข้อมูลจาก Supabase ก่อน
    const appointmentsFromSupabase = await getAppointmentsFromSupabase();
    
    if (appointmentsFromSupabase && appointmentsFromSupabase.length > 0) {
      // แปลงข้อมูลจาก Supabase เป็นรูปแบบที่ต้องการ
      const appointments: Record<string, Record<string, Appointment[]>> = {};
      
      appointmentsFromSupabase.forEach((appt: SupabaseAppointment) => {
        if (!appointments[appt.date]) {
          appointments[appt.date] = {};
        }
        if (!appointments[appt.date][appt.time]) {
          appointments[appt.date][appt.time] = [];
        }
        
        appointments[appt.date][appt.time].push({
          dentist: appt.dentist,
          duration: convertToDuration(appt.duration),
          patient: appt.patient,
          phone: appt.phone,
          treatment: appt.treatment,
          status: convertToStatus(appt.status)
        });
      });
      
      return appointments;
    }
    
    // ถ้าไม่มีข้อมูลใน Supabase หรือเกิดข้อผิดพลาด ให้ใช้ localStorage
    const savedData = localStorage.getItem('appointments');
    return savedData ? JSON.parse(savedData) : {};
  } catch (error) {
    console.error('Error loading appointments:', error);
    // ถ้าเกิดข้อผิดพลาดให้ใช้ localStorage
    const savedData = localStorage.getItem('appointments');
    return savedData ? JSON.parse(savedData) : {};
  }
};

// บันทึกข้อมูลการนัดหมายลงใน localStorage และ Supabase
export const saveAppointments = async (appointments: Record<string, Record<string, Appointment[]>>) => {
  try {
    // บันทึกลงใน localStorage
    localStorage.setItem('appointments', JSON.stringify(appointments));
    
    // แปลงข้อมูลเป็นรูปแบบสำหรับบันทึกไปยัง Supabase
    const appointmentsForSupabase: any[] = [];
    
    Object.entries(appointments).forEach(([date, timeSlots]) => {
      Object.entries(timeSlots).forEach(([time, appts]) => {
        appts.forEach(appt => {
          appointmentsForSupabase.push({
            date,
            time,
            dentist: appt.dentist,
            duration: appt.duration,
            patient: appt.patient,
            phone: appt.phone,
            treatment: appt.treatment,
            status: appt.status
          });
        });
      });
    });
    
    // บันทึกลงใน Supabase
    if (appointmentsForSupabase.length > 0) {
      await syncAppointmentsToSupabase(appointmentsForSupabase);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving appointments:', error);
    // ถ้าเกิดข้อผิดพลาด ให้บันทึกลงใน localStorage อย่างเดียว
    localStorage.setItem('appointments', JSON.stringify(appointments));
    return false;
  }
};

// บันทึกการนัดในหลายช่วงเวลา
export const saveAppointmentWithMultipleSlots = async (date: string, timeSlot: string, appointment: Appointment) => {
  let appointments = await loadAppointments();
  
  // ตรวจสอบว่าวันที่นี้มีการนัดหมายหรือไม่
  if (!appointments[date]) {
    appointments[date] = {};
  }
  
  // ตรวจสอบว่าช่วงเวลานี้มีการนัดหมายหรือไม่
  if (!appointments[date][timeSlot]) {
    appointments[date][timeSlot] = [];
  }
  
  // เพิ่มการนัดหมายใหม่ลงในรายการ
  appointments[date][timeSlot].push(appointment);
  
  // บันทึกข้อมูลลงใน localStorage
  localStorage.setItem('appointments', JSON.stringify(appointments));
  
  try {
    // บันทึกไปยัง Supabase
    if (appointment.duration === '30min') {
      await syncAppointmentsToSupabase([
        {
          date,
          time: timeSlot,
          dentist: appointment.dentist,
          duration: appointment.duration,
          patient: appointment.patient,
          phone: appointment.phone,
          treatment: appointment.treatment,
          status: appointment.status
        }
      ]);
    } else if (appointment.duration === '1hour') {
      // บันทึกสองช่วงเวลา
      const relatedSlots = getRelatedTimeSlots(timeSlot, '1hour');
      await syncAppointmentsToSupabase(
        relatedSlots.map(slot => ({
          date,
          time: slot,
          dentist: appointment.dentist,
          duration: appointment.duration,
          patient: appointment.patient,
          phone: appointment.phone,
          treatment: appointment.treatment,
          status: appointment.status
        }))
      );
    } else if (appointment.duration === '2hours') {
      // บันทึกสี่ช่วงเวลา
      const relatedSlots = getRelatedTimeSlots(timeSlot, '2hours');
      await syncAppointmentsToSupabase(
        relatedSlots.map(slot => ({
          date,
          time: slot,
          dentist: appointment.dentist,
          duration: appointment.duration,
          patient: appointment.patient,
          phone: appointment.phone,
          treatment: appointment.treatment,
          status: appointment.status
        }))
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error syncing appointment with Supabase:', error);
    return false;
  }
};

// ดึงข้อมูลหมอทั้งหมด
export const loadDentists = (): Record<string, string> => {
  const savedData = localStorage.getItem('dentists');
  if (savedData) {
    return JSON.parse(savedData);
  }
  
  // ถ้าไม่มีข้อมูล ให้สร้างข้อมูลเริ่มต้น
  const defaultDentists: Record<string, string> = {
    'DC': '#FF5733',
    'DD': '#33FF57',
    'DPa': '#3357FF',
    'DPu': '#F033FF',
    'DT': '#FF33A8',
    'นัดทั่วไป': '#808080',
    'เจ้าหน้าที่': '#FFC300',
    'ทำเด็กนักเรียน': '#FFC0CB'
  };
  
  saveDentists(defaultDentists);
  return defaultDentists;
};

// บันทึกข้อมูลหมอ
export const saveDentists = (dentists: Record<string, string>) => {
  localStorage.setItem('dentists', JSON.stringify(dentists));
};

// ดึงข้อมูลการลา
export const loadLeaveData = async (): Promise<Record<string, string[]>> => {
  const savedData = localStorage.getItem('leaveData');
  return savedData ? JSON.parse(savedData) : {};
};

// บันทึกข้อมูลการลา
export const saveLeaveData = (leaveData: Record<string, string[]>) => {
  localStorage.setItem('leaveData', JSON.stringify(leaveData));
};

// ดึงข้อมูลการประชุม
export const loadMeetingData = async (): Promise<Record<string, MeetingRecord[]>> => {
  const savedData = localStorage.getItem('meetingData');
  return savedData ? JSON.parse(savedData) : {};
};

// บันทึกข้อมูลการประชุม
export const saveMeetingData = (meetingData: Record<string, MeetingRecord[]>) => {
  localStorage.setItem('meetingData', JSON.stringify(meetingData));
};

// ช่วงเวลาที่เกี่ยวข้องกับช่วงเวลาที่กำหนด ตามระยะเวลา
export const getRelatedTimeSlots = (timeSlot: string, duration: string): string[] => {
  if (duration === "30min") {
    return [timeSlot];
  }
  
  const timeParts = timeSlot.split(':');
  let hour = parseInt(timeParts[0]);
  let minute = parseInt(timeParts[1].substring(0, 2));
  
  const relatedSlots: string[] = [timeSlot];
  
  if (duration === "1hour") {
    minute += 30;
    if (minute === 60) {
      minute = 0;
      hour += 1;
    }
    relatedSlots.push(`${hour}:${minute === 0 ? '00' : minute}-${hour}:${minute + 30 === 60 ? '00' : minute + 30}`);
  } else if (duration === "2hours") {
    for (let i = 0; i < 3; i++) {
      minute += 30;
      if (minute === 60) {
        minute = 0;
        hour += 1;
      }
      relatedSlots.push(`${hour}:${minute === 0 ? '00' : minute}-${hour}:${minute + 30 === 60 ? '00' : minute + 30}`);
    }
  }
  
  return relatedSlots;
};

// หาคิวว่างสำหรับวันที่กำหนด
export const findAvailableSlots = async (
  date: Date, 
  duration: "30min" | "1hour" | "2hours", 
  dentist: string, 
  preferredTime?: string,
  period?: 'morning' | 'afternoon'
): Promise<string[]> => {
  try {
    const appointments = await loadAppointments();
    const leaveData = await loadLeaveData();
    const meetingData = await loadMeetingData();
    const dateKey = dateUtilToKey(date);
    
    // ตรวจสอบว่าหมอลาในวันนี้หรือไม่
    if (leaveData[dateKey] && leaveData[dateKey].includes(dentist)) {
      return [];
    }
    
    // กำหนดช่วงเวลาที่สามารถนัดได้ตามวันของสัปดาห์
    const dayOfWeek = date.getDay();
    
    // ถ้าเป็นวันเสาร์หรืออาทิตย์ ไม่มีคิวว่าง
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return [];
    }
    
    // กำหนดช่วงเวลาทั้งหมดที่สามารถนัดได้
    let allTimeSlots: TimeSlot[] = [];
    
    if (!period || period === 'morning') {
      allTimeSlots = allTimeSlots.concat([
        "9:00-9:30", "9:30-10:00", "10:00-10:30", "10:30-11:00"
      ] as TimeSlot[]);
    }
    
    if (!period || period === 'afternoon') {
      allTimeSlots = allTimeSlots.concat([
        "13:00-13:30", "13:30-14:00", "14:00-14:30", "14:30-15:00"
      ] as TimeSlot[]);
    }
    
    // ตรวจสอบการประชุม
    if (meetingData[dateKey]) {
      const dentistMeetings = meetingData[dateKey].filter(m => m.dentist === dentist);
      
      for (const meeting of dentistMeetings) {
        if (meeting.period === 'morning') {
          // ถ้ามีประชุมช่วงเช้า ให้ลบช่วงเวลาเช้าทั้งหมด
          allTimeSlots = allTimeSlots.filter(slot => 
            !["9:00-9:30", "9:30-10:00", "10:00-10:30", "10:30-11:00"].includes(slot)
          );
        } else if (meeting.period === 'afternoon') {
          // ถ้ามีประชุมช่วงบ่าย ให้ลบช่วงเวลาบ่ายทั้งหมด
          allTimeSlots = allTimeSlots.filter(slot => 
            !["13:00-13:30", "13:30-14:00", "14:00-14:30", "14:30-15:00"].includes(slot)
          );
        }
      }
    }
    
    // ตรวจสอบช่วงเวลาที่มีคนนัดแล้ว
    const occupiedSlots: Set<string> = new Set();
    
    if (appointments[dateKey]) {
      Object.entries(appointments[dateKey]).forEach(([timeSlot, appts]) => {
        // ถ้ามีการนัดของหมอนี้ในช่วงเวลานี้
        if (appts.some(appt => appt.dentist === dentist)) {
          occupiedSlots.add(timeSlot);
          
          // ถ้าเป็นการนัดที่มีระยะเวลามากกว่า 30 นาที ให้เพิ่มช่วงเวลาที่เกี่ยวข้อง
          const matchingAppt = appts.find(appt => appt.dentist === dentist);
          if (matchingAppt && (matchingAppt.duration === '1hour' || matchingAppt.duration === '2hours')) {
            const relatedSlots = getRelatedTimeSlots(timeSlot, matchingAppt.duration);
            relatedSlots.forEach(slot => occupiedSlots.add(slot));
          }
        }
      });
    }
    
    // กรองเอาเฉพาะช่วงเวลาที่ว่าง
    let availableSlots = allTimeSlots.filter(slot => !occupiedSlots.has(slot));
    
    // ถ้าต้องการใช้เวลานานกว่า 30 นาที จะต้องมีช่วงเวลาติดกันที่ว่างด้วย
    if (duration === '1hour' || duration === '2hours') {
      availableSlots = availableSlots.filter(slot => {
        const relatedSlots = getRelatedTimeSlots(slot, duration);
        // ตรวจสอบว่าทุกช่วงเวลาที่เกี่ยวข้องว่างหรือไม่
        return relatedSlots.every(relatedSlot => 
          availableSlots.includes(relatedSlot as TimeSlot) || relatedSlot === slot
        );
      });
    }
    
    // ถ้ามีช่วงเวลาที่ต้องการ ให้เริ่มจากช่วงเวลานั้น
    if (preferredTime && availableSlots.includes(preferredTime as TimeSlot)) {
      // ย้ายช่วงเวลาที่ต้องการมาเป็นลำดับแรก
      availableSlots = [
        preferredTime as TimeSlot,
        ...availableSlots.filter(slot => slot !== preferredTime)
      ];
    }
    
    return availableSlots;
  } catch (error) {
    console.error('Error finding available slots:', error);
    return [];
  }
};

export const dateToKey = dateUtilToKey;
