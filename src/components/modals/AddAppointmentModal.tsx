
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  loadAppointments, 
  saveAppointments, 
  findAvailableSlots, 
  saveAppointmentWithMultipleSlots 
} from '@/lib/data-utils';
import { Appointment } from '@/types/appointment';

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

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setDentist('');
    setDuration("30min");
    setPatient('');
    setPhone('');
    setTreatment('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dateObj = new Date(data.date);
    const availableSlots = findAvailableSlots(dateObj, duration, dentist, data.time);

    if (availableSlots.length > 0) {
      const newAppointment: Appointment = {
        dentist,
        duration,
        patient,
        phone,
        treatment,
        status: "รอการยืนยันนัด"
      };
      
      // ใช้ฟังก์ชันใหม่ที่บันทึกข้อมูลในทุกช่องเวลาที่เกี่ยวข้อง
      saveAppointmentWithMultipleSlots(data.date, data.time, newAppointment);
      
      resetForm();
      onClose();
    } else {
      alert('คิวนี้ไม่ว่างหรือไม่รองรับระยะเวลาที่เลือก กรุณาตรวจสอบ');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>เพิ่มนัดหมาย</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
              <option value="DC">DC</option>
              <option value="DD">DD</option>
              <option value="DPa">DPa</option>
              <option value="DPu">DPu</option>
              <option value="DT">DT</option>
              <option value="นัดทั่วไป">นัดทั่วไป</option>
              <option value="เจ้าหน้าที่">เจ้าหน้าที่</option>
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
              <option value="">เลือกระยะเวลา</option>
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
          
          <DialogFooter>
            <Button type="submit">บันทึก</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAppointmentModal;
