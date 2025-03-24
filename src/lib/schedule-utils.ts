
import { dateToKey } from '@/lib/date-utils';
import { supabase } from '@/integrations/supabase/client';
import { TimeSlot, MeetingRecord } from '@/types/appointment';
import { getRelatedTimeSlots } from '@/lib/appointment-utils';
import { loadAppointments } from '@/lib/appointment-utils';

// ดึงข้อมูลหมอทั้งหมด
export const loadDentists = async (): Promise<Record<string, string>> => {
  try {
    // ลองดึงข้อมูลจาก Supabase ก่อน
    const { data: dentistsFromSupabase, error } = await supabase
      .from('dentists')
      .select('*')
      .eq('active', true);
      
    if (error) {
      throw error;
    }
    
    if (dentistsFromSupabase && dentistsFromSupabase.length > 0) {
      // แปลงข้อมูลจาก Supabase เป็น Record<string, string>
      const dentists: Record<string, string> = {};
      
      dentistsFromSupabase.forEach((dentist) => {
        dentists[dentist.name] = dentist.color;
      });
      
      return dentists;
    }
    
    // ถ้าไม่มีข้อมูลใน Supabase ให้ใช้ localStorage
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
  } catch (error) {
    console.error('Error loading dentists:', error);
    
    // ถ้าเกิดข้อผิดพลาดให้ใช้ localStorage
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
  }
};

// บันทึกข้อมูลหมอ
export const saveDentists = async (dentists: Record<string, string>) => {
  try {
    // บันทึกลงใน localStorage
    localStorage.setItem('dentists', JSON.stringify(dentists));
    
    // แปลงข้อมูลเป็นรูปแบบสำหรับบันทึกไปยัง Supabase
    const dentistsForSupabase = Object.entries(dentists).map(([name, color]) => ({
      name,
      color,
      active: true
    }));
    
    // อัพเดทหรือเพิ่มข้อมูลใน Supabase
    const { error } = await supabase
      .from('dentists')
      .upsert(dentistsForSupabase, { onConflict: 'name' });
      
    if (error) {
      console.error('Error upserting dentists to Supabase:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving dentists:', error);
    // ถ้าเกิดข้อผิดพลาด ให้บันทึกลงใน localStorage อย่างเดียว
    localStorage.setItem('dentists', JSON.stringify(dentists));
    return false;
  }
};

// ดึงข้อมูลการลา
export const loadLeaveData = async (): Promise<Record<string, string[]>> => {
  try {
    // ลองดึงข้อมูลจาก Supabase ก่อน
    const { data: leaveRecordsFromSupabase, error } = await supabase
      .from('leave_records')
      .select('*');
      
    if (error) {
      throw error;
    }
    
    if (leaveRecordsFromSupabase && leaveRecordsFromSupabase.length > 0) {
      // แปลงข้อมูลจาก Supabase เป็น Record<string, string[]>
      const leaveData: Record<string, string[]> = {};
      
      leaveRecordsFromSupabase.forEach((record) => {
        if (!leaveData[record.date]) {
          leaveData[record.date] = [];
        }
        
        if (!leaveData[record.date].includes(record.dentist)) {
          leaveData[record.date].push(record.dentist);
        }
      });
      
      return leaveData;
    }
    
    // ถ้าไม่มีข้อมูลใน Supabase ให้ใช้ localStorage
    const savedData = localStorage.getItem('leaveData');
    return savedData ? JSON.parse(savedData) : {};
  } catch (error) {
    console.error('Error loading leave data:', error);
    // ถ้าเกิดข้อผิดพลาดให้ใช้ localStorage
    const savedData = localStorage.getItem('leaveData');
    return savedData ? JSON.parse(savedData) : {};
  }
};

// บันทึกข้อมูลการลา
export const saveLeaveData = async (leaveData: Record<string, string[]>) => {
  try {
    // บันทึกลงใน localStorage
    localStorage.setItem('leaveData', JSON.stringify(leaveData));
    
    // แปลงข้อมูลเป็นรูปแบบสำหรับบันทึกไปยัง Supabase
    const leaveRecordsForSupabase: any[] = [];
    
    Object.entries(leaveData).forEach(([date, dentists]) => {
      dentists.forEach((dentist) => {
        leaveRecordsForSupabase.push({
          date,
          dentist,
          reason: 'ลาประจำวัน'
        });
      });
    });
    
    // ลบข้อมูลเดิมและเพิ่มข้อมูลใหม่
    if (leaveRecordsForSupabase.length > 0) {
      // ลบข้อมูลเดิม
      const { error: deleteError } = await supabase
        .from('leave_records')
        .delete()
        .gte('id', '0'); // ลบทุกรายการ
      
      if (deleteError) {
        console.error('Error deleting leave records:', deleteError);
      }
      
      // เพิ่มข้อมูลใหม่
      const { error: insertError } = await supabase
        .from('leave_records')
        .insert(leaveRecordsForSupabase);
      
      if (insertError) {
        console.error('Error inserting leave records:', insertError);
        throw insertError;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error saving leave data:', error);
    // ถ้าเกิดข้อผิดพลาด ให้บันทึกลงใน localStorage อย่างเดียว
    localStorage.setItem('leaveData', JSON.stringify(leaveData));
    return false;
  }
};

// ดึงข้อมูลการประชุม
export const loadMeetingData = async (): Promise<Record<string, MeetingRecord[]>> => {
  try {
    // ลองดึงข้อมูลจาก Supabase ก่อน
    const { data: meetingRecordsFromSupabase, error } = await supabase
      .from('meeting_records')
      .select('*');
      
    if (error) {
      throw error;
    }
    
    if (meetingRecordsFromSupabase && meetingRecordsFromSupabase.length > 0) {
      // แปลงข้อมูลจาก Supabase เป็น Record<string, MeetingRecord[]>
      const meetingData: Record<string, MeetingRecord[]> = {};
      
      meetingRecordsFromSupabase.forEach((record) => {
        if (!meetingData[record.date]) {
          meetingData[record.date] = [];
        }
        
        meetingData[record.date].push({
          dentist: record.dentist,
          period: record.period as 'morning' | 'afternoon'
        });
      });
      
      return meetingData;
    }
    
    // ถ้าไม่มีข้อมูลใน Supabase ให้ใช้ localStorage
    const savedData = localStorage.getItem('meetingData');
    return savedData ? JSON.parse(savedData) : {};
  } catch (error) {
    console.error('Error loading meeting data:', error);
    // ถ้าเกิดข้อผิดพลาดให้ใช้ localStorage
    const savedData = localStorage.getItem('meetingData');
    return savedData ? JSON.parse(savedData) : {};
  }
};

// บันทึกข้อมูลการประชุม
export const saveMeetingData = async (meetingData: Record<string, MeetingRecord[]>) => {
  try {
    // บันทึกลงใน localStorage
    localStorage.setItem('meetingData', JSON.stringify(meetingData));
    
    // แปลงข้อมูลเป็นรูปแบบสำหรับบันทึกไปยัง Supabase
    const meetingRecordsForSupabase: any[] = [];
    
    Object.entries(meetingData).forEach(([date, records]) => {
      records.forEach((record) => {
        meetingRecordsForSupabase.push({
          date,
          dentist: record.dentist,
          period: record.period
        });
      });
    });
    
    // ลบข้อมูลเดิมและเพิ่มข้อมูลใหม่
    if (meetingRecordsForSupabase.length > 0) {
      // ลบข้อมูลเดิม
      const { error: deleteError } = await supabase
        .from('meeting_records')
        .delete()
        .gte('id', '0'); // ลบทุกรายการ
      
      if (deleteError) {
        console.error('Error deleting meeting records:', deleteError);
      }
      
      // เพิ่มข้อมูลใหม่
      const { error: insertError } = await supabase
        .from('meeting_records')
        .insert(meetingRecordsForSupabase);
      
      if (insertError) {
        console.error('Error inserting meeting records:', insertError);
        throw insertError;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error saving meeting data:', error);
    // ถ้าเกิดข้อผิดพลาด ให้บันทึกลงใน localStorage อย่างเดียว
    localStorage.setItem('meetingData', JSON.stringify(meetingData));
    return false;
  }
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
    const dateKey = dateToKey(date);
    
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
