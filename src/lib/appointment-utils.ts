import { format, add, isWithinInterval } from 'date-fns';
import { th } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

// Function to load appointments from localStorage
export const loadAppointments = async () => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*');

    if (error) {
      console.error('Error fetching appointments from Supabase:', error);
      // Fallback to localStorage if Supabase fails
      const storedAppointments = localStorage.getItem('appointments');
      return storedAppointments ? JSON.parse(storedAppointments) : {};
    }

    // Convert the Supabase data to the format expected by the app
    const formattedAppointments: Record<string, any[]> = {};
    if (data && data.length > 0) {
      data.forEach(appointment => {
        const dateKey = format(new Date(appointment.start_time), 'yyyy-MM-dd');
        if (!formattedAppointments[dateKey]) {
          formattedAppointments[dateKey] = [];
        }
        formattedAppointments[dateKey].push({
          id: appointment.id,
          dentist: appointment.dentist,
          startTime: format(new Date(appointment.start_time), 'HH:mm'),
          endTime: format(new Date(appointment.end_time), 'HH:mm'),
          patientName: appointment.patient_name,
          details: appointment.details,
          status: appointment.status,
          duration: appointment.duration,
        });
      });
    }

    return formattedAppointments;
  } catch (error) {
    console.error('Error loading appointments:', error);
    // Fallback to localStorage if Supabase fails
    const storedAppointments = localStorage.getItem('appointments');
    return storedAppointments ? JSON.parse(storedAppointments) : {};
  }
};

// Function to save appointments to localStorage
export const saveAppointments = async (appointments: any) => {
  try {
    // Prepare appointments for Supabase
    const appointmentsToSave = Object.entries(appointments).flatMap(([dateKey, appointmentsForDate]) => {
      return (appointmentsForDate as any[]).map(appointment => ({
        id: appointment.id,
        dentist: appointment.dentist,
        start_time: format(new Date(`${dateKey} ${appointment.startTime}`), 'yyyy-MM-dd HH:mm:ss'),
        end_time: format(new Date(`${dateKey} ${appointment.endTime}`), 'yyyy-MM-dd HH:mm:ss'),
        patient_name: appointment.patientName,
        details: appointment.details,
        status: appointment.status,
        duration: appointment.duration,
      }));
    });

    // Save to Supabase
    const { error } = await supabase
      .from('appointments')
      .upsert(appointmentsToSave, { onConflict: 'id' });

    if (error) {
      console.error('Error saving appointments to Supabase:', error);
      // Fallback to localStorage if Supabase fails
      localStorage.setItem('appointments', JSON.stringify(appointments));
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saving appointments:', error);
    // Fallback to localStorage if Supabase fails
    localStorage.setItem('appointments', JSON.stringify(appointments));
    return false;
  }
};

// Function to save an appointment with multiple time slots
export const saveAppointmentWithMultipleSlots = async (
  startDate: Date,
  endDate: Date,
  dentist: string,
  startTime: string,
  endTime: string,
  patientName: string,
  details: string,
  status: string,
  duration: number
): Promise<boolean> => {
  try {
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const appointmentId = uuidv4();
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      const startDateTime = new Date(`${dateKey} ${startTime}`);
      const endDateTime = new Date(`${dateKey} ${endTime}`);

      // Prepare appointment data for Supabase
      const appointmentData = {
        id: appointmentId,
        dentist: dentist,
        start_time: format(startDateTime, 'yyyy-MM-dd HH:mm:ss'),
        end_time: format(endDateTime, 'yyyy-MM-dd HH:mm:ss'),
        patient_name: patientName,
        details: details,
        status: status,
        duration: duration,
      };

      // Save to Supabase
      const { error } = await supabase
        .from('appointments')
        .insert([appointmentData]);

      if (error) {
        console.error('Error saving appointment to Supabase:', error);
        return false;
      }

      // Move to the next day
      currentDate = add(currentDate, { days: 1 });
    }

    return true;
  } catch (error) {
    console.error('Error saving appointment with multiple slots:', error);
    return false;
  }
};

// Function to get related time slots for an appointment
export const getRelatedTimeSlots = async (appointment: any): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_name', appointment.patient_name)
      .eq('dentist', appointment.dentist);

    if (error) {
      console.error('Error fetching related time slots from Supabase:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting related time slots:', error);
    return [];
  }
};

// Function to convert duration to a readable format
export const convertToDuration = (duration: number): string => {
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return `${hours} ชม. ${minutes} นาที`;
};

// Function to convert status to a readable format
export const convertToStatus = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return 'ยืนยันแล้ว';
    case 'pending':
      return 'รอการยืนยัน';
    case 'cancelled':
      return 'ยกเลิก';
    default:
      return 'ไม่ทราบสถานะ';
  }
};

// Add the missing updateAppointmentInAllSlots function
export const updateAppointmentInAllSlots = async (appointmentId: string, updatedData: any) => {
  try {
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId);

    if (!appointments || appointments.length === 0) {
      throw new Error('Appointment not found');
    }

    const originalAppointment = appointments[0];
    const relatedSlots = await getRelatedTimeSlots(originalAppointment);

    // Update all related appointments
    for (const slot of relatedSlots) {
      await supabase
        .from('appointments')
        .update(updatedData)
        .eq('id', slot.id);
    }

    return true;
  } catch (error) {
    console.error('Error updating appointment in all slots:', error);
    
    // Fallback to localStorage if Supabase fails
    try {
      const storedAppointments = JSON.parse(localStorage.getItem('appointments') || '{}');
      Object.keys(storedAppointments).forEach(dateKey => {
        storedAppointments[dateKey] = storedAppointments[dateKey].map((apt: any) => {
          if (apt.id === appointmentId) {
            return { ...apt, ...updatedData };
          }
          return apt;
        });
      });
      localStorage.setItem('appointments', JSON.stringify(storedAppointments));
      return true;
    } catch (localError) {
      console.error('Local storage fallback failed:', localError);
      return false;
    }
  }
};
