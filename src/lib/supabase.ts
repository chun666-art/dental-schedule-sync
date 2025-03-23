
import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './data-utils';

// Initialize Supabase client
const { url, key } = getSupabaseConfig();
export const supabase = createClient(url, key);

// Function to sync appointments with Supabase
export async function syncAppointmentsToSupabase(appointments: any) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .upsert(appointments);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error syncing appointments:', error);
    throw error;
  }
}

// Function to get appointments from Supabase
export async function getAppointmentsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*');
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting appointments:', error);
    throw error;
  }
}

// Function to notify on leave
export async function notifyOnLeave(dentist: string, date: string, affectedAppointments: any[]) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          type: 'leave',
          dentist,
          date,
          affected_appointments: affectedAppointments
        }
      ]);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}
