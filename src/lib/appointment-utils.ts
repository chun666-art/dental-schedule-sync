
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
    const formattedAppointments: Record<string, Record<string, any[]>> = {};
    if (data && data.length > 0) {
      data.forEach(appointment => {
        const dateKey = appointment.date;
        const timeSlot = appointment.time;
        
        if (!formattedAppointments[dateKey]) {
          formattedAppointments[dateKey] = {};
        }
        
        if (!formattedAppointments[dateKey][timeSlot]) {
          formattedAppointments[dateKey][timeSlot] = [];
        }
        
        formattedAppointments[dateKey][timeSlot].push({
          id: appointment.id,
          dentist: appointment.dentist,
          duration: appointment.duration,
          patient: appointment.patient,
          phone: appointment.phone,
          treatment: appointment.treatment,
          status: appointment.status
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
    // First, create a flat array of all appointments to save to Supabase
    const appointmentsToSave: any[] = [];
    
    Object.entries(appointments).forEach(([dateKey, timeSlotsObj]) => {
      Object.entries(timeSlotsObj as Record<string, any[]>).forEach(([timeSlot, apptsArray]) => {
        apptsArray.forEach(appt => {
          appointmentsToSave.push({
            id: appt.id || uuidv4(),
            date: dateKey,
            time: timeSlot,
            dentist: appt.dentist,
            patient: appt.patient,
            phone: appt.phone,
            treatment: appt.treatment,
            status: appt.status,
            duration: appt.duration
          });
        });
      });
    });
    
    // Save to Supabase
    if (appointmentsToSave.length > 0) {
      const { error } = await supabase
        .from('appointments')
        .upsert(appointmentsToSave, { onConflict: 'id' });

      if (error) {
        console.error('Error saving appointments to Supabase:', error);
        // Fallback to localStorage if Supabase fails
        localStorage.setItem('appointments', JSON.stringify(appointments));
        return false;
      }
    }
    
    // Also save to localStorage as backup
    localStorage.setItem('appointments', JSON.stringify(appointments));
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
  dateKey: string,
  timeSlot: string,
  appointment: any
) => {
  try {
    const appointments = await loadAppointments();
    
    // Initialize the structure if it doesn't exist
    if (!appointments[dateKey]) {
      appointments[dateKey] = {};
    }
    
    if (!appointments[dateKey][timeSlot]) {
      appointments[dateKey][timeSlot] = [];
    }
    
    // Generate a unique ID for this appointment
    const appointmentWithId = {
      ...appointment,
      id: uuidv4()
    };
    
    // Add the appointment to the first time slot
    appointments[dateKey][timeSlot].push(appointmentWithId);
    
    // Calculate additional time slots based on duration
    const relatedSlots = getRelatedTimeSlots(timeSlot, appointment.duration);
    
    // Skip the first slot since we already added it
    for (let i = 1; i < relatedSlots.length; i++) {
      const slot = relatedSlots[i];
      
      if (!appointments[dateKey][slot]) {
        appointments[dateKey][slot] = [];
      }
      
      // Add the same appointment to the related slot
      appointments[dateKey][slot].push({...appointmentWithId});
    }
    
    // Save the updated appointments
    await saveAppointments(appointments);
    
    return true;
  } catch (error) {
    console.error('Error saving appointment with multiple slots:', error);
    return false;
  }
};

// Function to get related time slots for an appointment
export const getRelatedTimeSlots = (timeSlot: string, duration: string): string[] => {
  const slots = [
    "9:00-9:30", "9:30-10:00", "10:00-10:30", "10:30-11:00",
    "13:00-13:30", "13:30-14:00", "14:00-14:30", "14:30-15:00"
  ];
  
  // Find the index of the current time slot
  const index = slots.indexOf(timeSlot);
  if (index === -1) return [timeSlot];
  
  // Calculate how many slots we need based on duration
  let slotsNeeded = 1;
  if (duration === "1hour") slotsNeeded = 2;
  if (duration === "2hours") slotsNeeded = 4;
  
  // Return an array of consecutive slots
  const result: string[] = [];
  for (let i = 0; i < slotsNeeded; i++) {
    if (index + i < slots.length) {
      result.push(slots[index + i]);
    }
  }
  
  return result;
};

// Function to convert duration to a readable format
export const convertToDuration = (duration: string): string => {
  switch (duration) {
    case "30min":
      return "30 นาที";
    case "1hour":
      return "1 ชั่วโมง";
    case "2hours":
      return "2 ชั่วโมง";
    default:
      return duration;
  }
};

// Function to convert status to a readable format
export const convertToStatus = (status: string): string => {
  switch (status) {
    case "รอการยืนยันนัด":
      return "รอการยืนยันนัด";
    case "ยืนยันนัด":
      return "ยืนยันแล้ว";
    case "นัดถูกยกเลิก":
      return "ยกเลิก";
    default:
      return status;
  }
};

// Function to update appointment in all related time slots
export const updateAppointmentInAllSlots = async (
  dateKey: string,
  timeSlot: string,
  originalAppointment: any,
  newAppointment: any
) => {
  try {
    const appointments = await loadAppointments();
    
    if (!appointments[dateKey]) {
      throw new Error('Date not found');
    }
    
    // Find all related time slots for the original appointment
    let relatedTimeSlots: string[] = [];
    if (originalAppointment.duration) {
      relatedTimeSlots = getRelatedTimeSlots(timeSlot, originalAppointment.duration);
    } else {
      relatedTimeSlots = [timeSlot];
    }
    
    // Update the appointment in all related time slots
    for (const slot of relatedTimeSlots) {
      if (appointments[dateKey][slot]) {
        for (let i = 0; i < appointments[dateKey][slot].length; i++) {
          const appt = appointments[dateKey][slot][i];
          
          // Match the appointment based on patient, dentist, and phone
          if (appt.patient === originalAppointment.patient && 
              appt.dentist === originalAppointment.dentist && 
              appt.phone === originalAppointment.phone) {
            
            // Update the appointment with new data
            appointments[dateKey][slot][i] = {
              ...appt,
              ...newAppointment,
              id: appt.id // Keep the same ID
            };
          }
        }
      }
    }
    
    // Save the updated appointments
    await saveAppointments(appointments);
    
    return true;
  } catch (error) {
    console.error('Error updating appointment in all slots:', error);
    return false;
  }
};
