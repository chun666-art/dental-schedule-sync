
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { loadAppointments, saveAppointments, updateAppointmentInAllSlots } from '@/lib/data-utils';
import { Appointment } from '@/types/appointment';

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: { appointment: Appointment; date: string; time: string };
  currentView: 'week' | 'today';
  setCurrentView: (view: 'week' | 'today') => void;
}

const EditAppointmentModal: React.FC<EditAppointmentModalProps> = ({
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
  const [status, setStatus] = useState<"รอการยืนยันนัด" | "ยืนยันนัด" | "นัดถูกยกเลิก">("รอการยืนยันนัด");
  const [originalAppointment, setOriginalAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (isOpen && data && data.appointment) {
      setDentist(data.appointment.dentist || '');
      setDuration(data.appointment.duration || "30min");
      setPatient(data.appointment.patient || '');
      setPhone(data.appointment.phone || '');
      setTreatment(data.appointment.treatment || '');
      setStatus(data.appointment.status || "รอการยืนยันนัด");
      setOriginalAppointment(data.appointment);
    }
  }, [isOpen, data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (originalAppointment) {
      const newAppointment: Appointment = {
        dentist,
        duration,
        patient,
        phone,
        treatment,
        status
      };

      // อัพเดทข้อมูลในทุกช่องเวลาที่เกี่ยวข้อง
      updateAppointmentInAllSlots(
        data.date,
        data.time,
        originalAppointment,
        newAppointment
      );
      
      onClose();
    }
  };

  if (!isOpen || !data || !data.appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>แก้ไขนัดหมาย</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <input type="hidden" value={data.time} />
          <input type="hidden" value={data.date} />
          
          <div className="grid gap-2">
            <Label htmlFor="edit-dentist">เลือกหมอฟัน:</Label>
            <select
              id="edit-dentist"
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
            <Label htmlFor="edit-duration">ระยะเวลา:</Label>
            <select
              id="edit-duration"
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
            <Label htmlFor="edit-patient">ชื่อคนไข้:</Label>
            <input
              type="text"
              id="edit-patient"
              value={patient}
              onChange={(e) => setPatient(e.target.value)}
              className="p-2 border rounded"
              placeholder="ชื่อคนไข้"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="edit-phone">เบอร์โทร:</Label>
            <input
              type="tel"
              id="edit-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="p-2 border rounded"
              placeholder="เบอร์โทร"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="edit-treatment">การรักษา:</Label>
            <input
              type="text"
              id="edit-treatment"
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              className="p-2 border rounded"
              placeholder="การรักษา"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="edit-status">สถานะ:</Label>
            <select
              id="edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as "รอการยืนยันนัด" | "ยืนยันนัด" | "นัดถูกยกเลิก")}
              className="p-2 border rounded"
              required
            >
              <option value="รอการยืนยันนัด">รอการยืนยันนัด</option>
              <option value="ยืนยันนัด">ยืนยันนัด</option>
              <option value="นัดถูกยกเลิก">นัดถูกยกเลิก</option>
            </select>
          </div>
          
          <DialogFooter>
            <Button type="submit">บันทึก</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAppointmentModal;
