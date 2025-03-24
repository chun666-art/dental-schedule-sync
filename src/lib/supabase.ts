
import { supabase } from '@/integrations/supabase/client';
import { 
  SupabaseAppointment, 
  SupabaseDentist,
  SupabaseLeaveRecord,
  SupabaseMeetingRecord,
  SupabaseNotification 
} from '@/types/appointment';

// Function to sync appointments with Supabase
export async function syncAppointmentsToSupabase(appointments: any[]) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .upsert(appointments, { onConflict: 'date,time,dentist,patient' });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error syncing appointments:', error);
    throw error;
  }
}

// Function to get appointments from Supabase
export async function getAppointmentsFromSupabase(): Promise<SupabaseAppointment[]> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting appointments:', error);
    return [];
  }
}

// Function to notify on leave
export async function notifyOnLeave(dentist: string, date: string, affectedAppointments: any[]) {
  try {
    // เพิ่มข้อมูลการลาใน leave_records
    const { data: leaveData, error: leaveError } = await supabase
      .from('leave_records')
      .insert([
        {
          dentist,
          date,
          reason: 'ลาประจำวัน'
        }
      ]);
      
    if (leaveError) throw leaveError;
    
    // ถ้ายังไม่มีตาราง notifications ให้สร้างและตั้งค่า RLS
    try {
      await supabase.rpc('create_notifications_if_not_exists');
    } catch (error) {
      console.error('Could not create notifications table:', error);
    }
    
    // บันทึกข้อมูลการแจ้งเตือนสำหรับคนไข้ที่ได้รับผลกระทบ
    if (affectedAppointments.length > 0) {
      const notificationData = affectedAppointments.map(appointment => ({
        type: 'leave',
        dentist,
        date,
        affected_appointment_id: appointment.id,
        patient: appointment.patient,
        phone: appointment.phone
      }));
      
      const { data, error } = await supabase
        .from('leave_notifications')
        .insert(notificationData);
        
      if (error) throw error;
      return data;
    }
    
    return [];
  } catch (error) {
    console.error('Error recording leave notification:', error);
    throw error;
  }
}

// บันทึกการประชุม
export async function recordMeeting(dentist: string, date: string, period: 'morning' | 'afternoon') {
  try {
    const { data, error } = await supabase
      .from('meeting_records')
      .insert([
        {
          dentist,
          date,
          period
        }
      ]);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error recording meeting:', error);
    throw error;
  }
}

// ดึงข้อมูลหมอทั้งหมด
export async function getAllDentists(): Promise<SupabaseDentist[]> {
  try {
    const { data, error } = await supabase
      .from('dentists')
      .select('*')
      .eq('active', true);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting dentists:', error);
    return [];
  }
}

// เพิ่มหรืออัปเดตข้อมูลหมอ
export async function upsertDentist(name: string, color: string) {
  try {
    const { data, error } = await supabase
      .from('dentists')
      .upsert(
        [
          {
            name,
            color,
            active: true
          }
        ],
        { onConflict: 'name' }
      );
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting dentist:', error);
    throw error;
  }
}

// ลบข้อมูลหมอ (soft delete)
export async function deleteDentist(name: string) {
  try {
    const { data, error } = await supabase
      .from('dentists')
      .update({ active: false })
      .eq('name', name);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error deleting dentist:', error);
    throw error;
  }
}

// ดึงข้อมูลการลา
export async function getLeaveRecords(): Promise<SupabaseLeaveRecord[]> {
  try {
    const { data, error } = await supabase
      .from('leave_records')
      .select('*');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting leave records:', error);
    return [];
  }
}

// ดึงข้อมูลการประชุม
export async function getMeetingRecords(): Promise<SupabaseMeetingRecord[]> {
  try {
    const { data, error } = await supabase
      .from('meeting_records')
      .select('*');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting meeting records:', error);
    return [];
  }
}
