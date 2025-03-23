
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { loadAppointments, saveAppointments, findAvailableSlots, dateToKey } from '@/lib/data-utils';
import { CancelTarget } from '@/types/appointment';

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  cancelTarget: CancelTarget | null;
  currentView: 'week' | 'today';
  setCurrentView: (view: 'week' | 'today') => void;
}

const CancelModal: React.FC<CancelModalProps> = ({
  isOpen,
  onClose,
  cancelTarget,
  currentView,
  setCurrentView
}) => {
  const handleCancel = () => {
    onClose();
  };

  const handleConfirm = () => {
    if (cancelTarget) {
      const { date, time, index } = cancelTarget;
      const appointments = loadAppointments();
      
      if (appointments[date] && appointments[date][time] && appointments[date][time][index]) {
        const appt = appointments[date][time][index];
        appt.status = "นัดถูกยกเลิก";
        
        // ค้นหาคิวว่างถัดไป
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + 1);
        const availableSlots = findAvailableSlots(newDate, appt.duration, appt.dentist);
        
        if (availableSlots.length > 0) {
          const newDateKey = dateToKey(newDate);
          const newTimeSlot = availableSlots[0];
          
          appointments[newDateKey] = appointments[newDateKey] || {};
          appointments[newDateKey][newTimeSlot] = appointments[newDateKey][newTimeSlot] || [];
          appointments[newDateKey][newTimeSlot].push({ ...appt, status: "รอการยืนยันนัด" });
        }
        
        // ลบการนัดจากทุกช่องเวลาที่เกี่ยวข้อง
        const duration = appt.duration;
        const relatedSlots = getRelatedTimeSlots(time, duration);
        
        for (const slot of relatedSlots) {
          if (appointments[date] && appointments[date][slot]) {
            // ลบการนัดที่ตรงกับข้อมูลที่ระบุ
            appointments[date][slot] = appointments[date][slot].filter(a => 
              !(a.patient === appt.patient && 
                a.dentist === appt.dentist && 
                a.phone === appt.phone));
            
            // ลบช่องเวลาที่ว่างเปล่า
            if (appointments[date][slot].length === 0) {
              delete appointments[date][slot];
            }
          }
        }
        
        // ลบวันที่ที่ว่างเปล่า
        if (appointments[date] && Object.keys(appointments[date]).length === 0) {
          delete appointments[date];
        }
        
        saveAppointments(appointments);
      }
      
      onClose();
    }
  };

  // ฟังก์ชันรับช่องเวลาที่เกี่ยวข้องตามระยะเวลา
  function getRelatedTimeSlots(slot: string, duration: string): string[] {
    // สำหรับการนัด 30 นาที
    if (duration === "30min") {
      return [slot];
    }

    // สำหรับการนัด 1 ชั่วโมง
    if (duration === "1hour") {
      if (slot === "9:00-10:00") return ["9:00-9:30", "9:30-10:00"];
      if (slot === "10:00-11:00") return ["10:00-10:30", "10:30-11:00"];
      if (slot === "13:00-14:00") return ["13:00-13:30", "13:30-14:00"];
      if (slot === "14:00-15:00") return ["14:00-14:30", "14:30-15:00"];
      
      // กรณีเลือกช่วงเวลา 30 นาที แล้วต้องการนัด 1 ชั่วโมง
      if (slot === "9:00-9:30") return ["9:00-9:30", "9:30-10:00"];
      if (slot === "9:30-10:00") return ["9:00-9:30", "9:30-10:00"];
      if (slot === "10:00-10:30") return ["10:00-10:30", "10:30-11:00"];
      if (slot === "10:30-11:00") return ["10:00-10:30", "10:30-11:00"];
      if (slot === "13:00-13:30") return ["13:00-13:30", "13:30-14:00"];
      if (slot === "13:30-14:00") return ["13:00-13:30", "13:30-14:00"];
      if (slot === "14:00-14:30") return ["14:00-14:30", "14:30-15:00"];
      if (slot === "14:30-15:00") return ["14:00-14:30", "14:30-15:00"];
    }

    // สำหรับการนัด 2 ชั่วโมง
    if (duration === "2hours") {
      if (slot === "9:00-11:00") return ["9:00-9:30", "9:30-10:00", "10:00-10:30", "10:30-11:00"];
      if (slot === "13:00-15:00") return ["13:00-13:30", "13:30-14:00", "14:00-14:30", "14:30-15:00"];
      
      // กรณีเลือกช่วงเวลา 30 นาที แล้วต้องการนัด 2 ชั่วโมง
      if (slot.startsWith("9:") || slot === "10:00-10:30") {
        return ["9:00-9:30", "9:30-10:00", "10:00-10:30", "10:30-11:00"];
      }
      if (slot.startsWith("13:") || slot === "14:00-14:30") {
        return ["13:00-13:30", "13:30-14:00", "14:00-14:30", "14:30-15:00"];
      }
    }

    return [slot];
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ยืนยันการยกเลิก</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p>คุณต้องการยกเลิกการนัดหมายนี้ใช่หรือไม่?</p>
        </div>
        
        <DialogFooter className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="bg-gray-500 hover:bg-gray-600 text-white"
          >
            ยกเลิก
          </Button>
          <Button 
            variant="outline"
            onClick={handleConfirm}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            ยืนยัน
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelModal;
