
import { supabase } from '@/integrations/supabase/client';
import { 
  Appointment, 
  TimeSlot, 
  SupabaseAppointment 
} from '@/types/appointment';
import { dateToKey } from '@/lib/date-utils';

// Helper function to safely convert string to allowed duration type
export function convertToDuration(value: string): "30min" | "1hour" | "2hours" {
  if (value === "30min" || value === "1hour" || value === "2hours") {
    return value;
  }
  // Default value if conversion fails
  return "30min";
}

// Helper function to safely convert string to allowed status type
export function convertToStatus(value: string): "รอการยืนยันนัด" | "ยืนยันนัด" | "นัดถูกยกเลิก" {
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
    const { data: appointmentsFromSupabase, error } = await supabase
      .from('appointments')
      .select('*');
    
    if (error) {
      throw error;
    }
    
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
    
    // บันทึกลงใน Supabase โดยลบข้อมูลเก่าและเพิ่มข้อมูลใหม่ทั้งหมด
    if (appointmentsForSupabase.length > 0) {
      // ลบข้อมูลทั้งหมดก่อน (ถ้ามีหลายรายการอาจต้องใช้การจัดการที่ซับซ้อนขึ้น)
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .gte('id', '0'); // ลบทุกรายการ
      
      if (deleteError) {
        console.error('Error deleting appointments:', deleteError);
      }
      
      // เพิ่มข้อมูลใหม่
      const { error: insertError } = await supabase
        .from('appointments')
        .insert(appointmentsForSupabase);
      
      if (insertError) {
        console.error('Error inserting appointments:', insertError);
        throw insertError;
      }
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
  try {
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
    
    // ช่วงเวลาที่เกี่ยวข้องตามระยะเวลา
    const relatedSlots = getRelatedTimeSlots(timeSlot, appointment.duration);
    
    // เพิ่มการนัดหมายในช่วงเวลาอื่น ๆ ที่เกี่ยวข้อง
    for (let i = 1; i < relatedSlots.length; i++) {
      const slot = relatedSlots[i];
      
      if (!appointments[date][slot]) {
        appointments[date][slot] = [];
      }
      
      appointments[date][slot].push(appointment);
    }
    
    // บันทึกข้อมูลทั้งหมด
    await saveAppointments(appointments);
    
    // บันทึกไปยัง Supabase เฉพาะรายการที่เพิ่มใหม่
    const supabaseAppointments = relatedSlots.map(slot => ({
      date,
      time: slot,
      dentist: appointment.dentist,
      duration: appointment.duration,
      patient: appointment.patient,
      phone: appointment.phone,
      treatment: appointment.treatment,
      status: appointment.status
    }));
    
    const { error } = await supabase
      .from('appointments')
      .insert(supabaseAppointments);
    
    if (error) {
      console.error('Error inserting to Supabase:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving appointment:', error);
    return false;
  }
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
