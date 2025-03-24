
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  loadAppointments, 
  saveAppointments, 
  findAvailableSlots, 
  saveAppointmentWithMultipleSlots,
  loadLeaveData
} from '@/lib/data-utils';
import { Appointment } from '@/types/appointment';
import { useToast } from '@/hooks/use-toast';

interface AddAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: { date: string; time: string };
  currentView: 'week' | 'today';
  setCurrentView: (view: 'week' | 'today') => void;
}

const AddAppointmentModal: React.FC<AddAppointmentModalProps> = ({
  isOpen,
  onClose,
  data,
  currentView,
  setCurrentView
}) => {
  const [dentist, setDentist] = useState<string>('');
  const [duration, setDuration] = useState<"30min" | "1hour" | "2hours">("30min");
  const [patient, setPatient] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [treatment, setTreatment] = useState<string>('');
  const [availableDentists, setAvailableDentists] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      resetForm();
      
      // ตรวจสอบว่าเป็นช่วงเช้าของวันจันทร์ถึงพฤหัสบดีหรือไม่
      if (data.date && data.time) {
        const date = new Date(data.date);
        const dayOfWeek = date.getDay();
        const timeSlot = data.time;
        const isMorningSlot = ["9:00-9:30", "9:30-10:00", "10:00-10:30", "10:30-11:00"].includes(timeSlot);
        const isMonToThu = dayOfWeek >= 1 && dayOfWeek <= 4;
        
        // ตรวจสอบว่าเป็นช่วงเช้าวันจันทร์-พฤหัสหรือไม่
        if (isMorningSlot && isMonToThu) {
          setAvailableDentists(["DC", "DD", "DPa", "DPu", "DT"]);
          
          // ถ้าเป็นช่วง 9:00-10:00 วันจันทร์-พฤหัส ต้องไม่มี "นัดทั่วไป" และ "เจ้าหน้าที่"
          if (["9:00-9:30", "9:30-10:00"].includes(timeSlot)) {
            setAvailableDentists(["DC", "DD", "DPa", "DPu", "DT"]);
          } else {
            setAvailableDentists(["DC", "DD", "DPa", "DPu", "DT", "นัดทั่วไป", "เจ้าหน้าที่"]);
          }
        } else if (isMorningSlot && dayOfWeek === 5) {
          // ช่วงเช้าวันศุกร์
          setAvailableDentists(["DC", "DD", "DPa", "DPu", "DT"]);
        } else {
          // ช่วงบ่ายทุกวัน
          setAvailableDentists(["DC", "DD", "DPa", "DPu", "DT"]);
        }
        
        // ตรวจสอบการลาของหมอ
        const loadLeavesAndFilter = async () => {
          try {
            const leaveData = await loadLeaveData();
            if (leaveData[data.date]) {
              const leavingDentists = leaveData[data.date];
              setAvailableDentists(prev => prev.filter(d => !leavingDentists.includes(d)));
            }
          } catch (error) {
            console.error('Error loading leave data:', error);
          }
        };
        
        loadLeavesAndFilter();
      }
    }
  }, [isOpen, data]);

  const resetForm = () => {
    setDentist('');
    setDuration("30min");
    setPatient('');
    setPhone('');
    setTreatment('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!data.date || !data.time) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาระบุวันและเวลาที่ต้องการนัด",
        variant: "destructive",
      });
      return;
    }
    
    const dateObj = new Date(data.date);
    const availableSlotsPromise = findAvailableSlots(dateObj, duration, dentist, data.time);
    
    try {
      const availableSlots = await availableSlotsPromise;
      console.log("Available slots:", availableSlots, "for time:", data.time, "duration:", duration);
      
      if (availableSlots.length > 0) {
        const newAppointment: Appointment = {
          dentist,
          duration,
          patient,
          phone,
          treatment,
          status: "รอการยืนยันนัด"
        };
        
        try {
          // บันทึกข้อมูลในทุกช่องเวลาที่เกี่ยวข้อง
          await saveAppointmentWithMultipleSlots(data.date, data.time, newAppointment);
          
          toast({
            title: "บันทึกนัดหมายสำเร็จ",
            description: `บันทึกนัดหมาย ${patient} กับ ${dentist} เรียบร้อยแล้ว`,
            variant: "default",
          });
          
          resetForm();
          onClose();
        } catch (error) {
          console.error('Error saving appointment:', error);
          toast({
            title: "เกิดข้อผิดพลาด",
            description: "ไม่สามารถบันทึกนัดหมายได้ กรุณาลองใหม่อีกครั้ง",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "ไม่สามารถนัดได้",
          description: "คิวนี้ไม่ว่างหรือไม่รองรับระยะเวลาที่เลือก กรุณาตรวจสอบ",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking available slots:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถตรวจสอบคิวว่างได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>เพิ่มนัดหมาย {data.date ? `วันที่ ${data.date}` : ''} {data.time ? `เวลา ${data.time}` : ''}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <form onSubmit={handleSubmit} className="space-y-4 mt-4 px-1">
            <input type="hidden" value={data.time} />
            <input type="hidden" value={data.date} />
            
            <div className="grid gap-2">
              <Label htmlFor="add-dentist">เลือกหมอฟัน:</Label>
              <select
                id="add-dentist"
                value={dentist}
                onChange={(e) => setDentist(e.target.value)}
                className="p-2 border rounded"
                required
              >
                <option value="">เลือกหมอฟัน</option>
                {availableDentists.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="add-duration">ระยะเวลา:</Label>
              <select
                id="add-duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value as "30min" | "1hour" | "2hours")}
                className="p-2 border rounded"
                required
              >
                <option value="30min">30 นาที</option>
                <option value="1hour">1 ชั่วโมง</option>
                <option value="2hours">2 ชั่วโมง</option>
              </select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="add-patient">ชื่อคนไข้:</Label>
              <input
                type="text"
                id="add-patient"
                value={patient}
                onChange={(e) => setPatient(e.target.value)}
                className="p-2 border rounded"
                placeholder="ชื่อคนไข้"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="add-phone">เบอร์โทร:</Label>
              <input
                type="tel"
                id="add-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="p-2 border rounded"
                placeholder="เบอร์โทร"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="add-treatment">การรักษา:</Label>
              <input
                type="text"
                id="add-treatment"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                className="p-2 border rounded"
                placeholder="การรักษา"
                required
              />
            </div>
          </form>
        </ScrollArea>
        
        <DialogFooter>
          <Button type="button" onClick={handleSubmit}>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddAppointmentModal;
