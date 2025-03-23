
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { loadAppointments, saveAppointments, findAvailableSlots } from '@/lib/data-utils';
import { dateToKey } from '@/lib/date-utils';

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  cancelTarget: { date: string; time: string; index: number } | null;
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
        const isSlotAvailable = findAvailableSlots(newDate, appt.duration, appt.dentist);
        
        if (isSlotAvailable) {
          const newDateKey = dateToKey(newDate);
          appointments[newDateKey] = appointments[newDateKey] || {};
          appointments[newDateKey]["9:00-9:30"] = appointments[newDateKey]["9:00-9:30"] || [];
          appointments[newDateKey]["9:00-9:30"].push({ ...appt, status: "รอการยืนยันนัด" });
        }
        
        // ลบนัดเดิม
        appointments[date][time].splice(index, 1);
        if (appointments[date][time].length === 0) {
          delete appointments[date][time];
        }
        if (Object.keys(appointments[date]).length === 0) {
          delete appointments[date];
        }
        
        saveAppointments(appointments);
      }
      
      onClose();
    }
  };

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
