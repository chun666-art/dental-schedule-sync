
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { loadAppointments, saveAppointments, findAvailableSlots, dateToKey, getRelatedTimeSlots } from '@/lib/data-utils';
import { CancelTarget } from '@/types/appointment';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const handleCancel = () => {
    onClose();
  };

  const handleConfirm = () => {
    if (cancelTarget) {
      const { date, time, index } = cancelTarget;
      const appointments = loadAppointments();
      
      if (appointments[date] && appointments[date][time] && appointments[date][time][index]) {
        const appt = appointments[date][time][index];
        
        try {
          // ลบการนัดจากทุกช่องเวลาที่เกี่ยวข้อง
          const duration = appt.duration;
          const relatedSlots = getRelatedTimeSlots(time, duration);
          
          console.log('Attempting to cancel appointment:', { date, time, duration, relatedSlots });
          
          for (const slot of relatedSlots) {
            if (appointments[date] && appointments[date][slot]) {
              // หาตำแหน่งที่ตรงกับข้อมูลที่ต้องการลบ
              const slotIndex = appointments[date][slot].findIndex(a => 
                a.patient === appt.patient && 
                a.dentist === appt.dentist && 
                a.phone === appt.phone);
              
              if (slotIndex !== -1) {
                console.log(`Found match in slot ${slot} at index ${slotIndex}`);
                appointments[date][slot].splice(slotIndex, 1);
                
                // ลบช่องเวลาที่ว่างเปล่า
                if (appointments[date][slot].length === 0) {
                  delete appointments[date][slot];
                }
              }
            }
          }
          
          // ลบวันที่ที่ว่างเปล่า
          if (appointments[date] && Object.keys(appointments[date]).length === 0) {
            delete appointments[date];
          }
          
          // บันทึกข้อมูลที่อัปเดต
          saveAppointments(appointments);
          
          toast({
            title: "ยกเลิกนัดหมายสำเร็จ",
            description: "รายการนัดหมายถูกยกเลิกเรียบร้อยแล้ว",
            variant: "default",
          });
        } catch (error) {
          console.error('Error canceling appointment:', error);
          toast({
            title: "เกิดข้อผิดพลาด",
            description: "ไม่สามารถยกเลิกนัดหมายได้ กรุณาลองใหม่อีกครั้ง",
            variant: "destructive",
          });
        }
      }
      
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ยืนยันการยกเลิก</DialogTitle>
          <DialogDescription>
            คุณต้องการยกเลิกการนัดหมายนี้ใช่หรือไม่?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p>คุณกำลังจะยกเลิกการนัดหมาย หากยืนยัน ข้อมูลจะถูกลบออกจากระบบ</p>
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
