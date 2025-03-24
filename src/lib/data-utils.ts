
// ไฟล์นี้รวมฟังก์ชันต่างๆ จากไฟล์ที่แยกออกไป เพื่อความเข้ากันได้กับโค้ดเดิม
import { dateToKey as dateUtilToKey } from '@/lib/date-utils';
import { 
  loadAppointments,
  saveAppointments,
  saveAppointmentWithMultipleSlots,
  getRelatedTimeSlots,
  convertToDuration,
  convertToStatus
} from '@/lib/appointment-utils';

import {
  loadDentists,
  saveDentists,
  loadLeaveData,
  saveLeaveData,
  loadMeetingData,
  saveMeetingData,
  findAvailableSlots
} from '@/lib/schedule-utils';

// ส่งออกฟังก์ชันทั้งหมด
export {
  loadAppointments,
  saveAppointments,
  saveAppointmentWithMultipleSlots,
  getRelatedTimeSlots,
  convertToDuration,
  convertToStatus,
  loadDentists,
  saveDentists,
  loadLeaveData,
  saveLeaveData,
  loadMeetingData,
  saveMeetingData,
  findAvailableSlots
};

// ส่งออก dateToKey เพื่อความเข้ากันได้กับโค้ดเดิม
export const dateToKey = dateUtilToKey;
