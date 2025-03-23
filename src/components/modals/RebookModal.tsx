
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { loadAppointments, saveAppointments, findAvailableSlots } from '@/lib/data-utils';
import { dateToKey, formatDate } from '@/lib/date-utils';
import { Appointment } from '@/types/appointment';

interface RebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: { appointment: Appointment };
  currentView: 'week' | 'today';
  setCurrentView: (view: 'week' | 'today') => void;
}

const RebookModal: React.FC<RebookModalProps> = ({
  isOpen,
  onClose,
  data,
  currentView,
  setCurrentView
}) => {
  const [dentist, setDentist] = useState<string>('');
  const [patient, setPatient] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [treatment, setTreatment] = useState<string>('');
  const [duration, setDuration] = useState<"30min" | "1hour" | "2hours">("30min");
  const [delay, setDelay] = useState<number>(0);
  const [availableSlot, setAvailableSlot] = useState<string | null>(null);
  const [availableDate, setAvailableDate] = useState<Date | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && data && data.appointment) {
      setDentist(data.appointment.dentist || '');
      setPatient(data.appointment.patient || '');
      setPhone(data.appointment.phone || '');
      setTreatment(data.appointment.treatment || '');
      setDuration(data.appointment.duration || "30min");
      setDelay(0);
      setAvailableSlot(null);
      setAvailableDate(null);
      setHasSearched(false);
    }
  }, [isOpen, data]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // เริ่มค้นหาจากวันที่ปัจจุบัน + จำนวนวันที่ต้องการรอ
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + delay);
    
    // ค้นหาคิวว่าง
    const isSlotAvailable = findAvailableSlots(startDate, duration, dentist);
    
    if (isSlotAvailable) {
      setAvailableSlot('9:00-9:30'); // สมมติว่าเป็นช่วงเวลาแรกที่ว่าง
      setAvailableDate(startDate);
    } else {
      setAvailableSlot(null);
      setAvailableDate(null);
    }
    
    setHasSearched(true);
  };

  const handleBook = () => {
    if (availableSlot && availableDate) {
      const appointments = loadAppointments();
      const dateKey = dateToKey(availableDate);
      
      appointments[dateKey] = appointments[dateKey] || {};
      appointments[dateKey][availableSlot] = appointments[dateKey][availableSlot] || [];
      
      const newAppointment: Appointment = {
        dentist,
        duration,
        patient,
        phone,
        treatment,
        status: "รอการยืนยันนัด"
      };
      
      appointments[dateKey][availableSlot].push(newAppointment);
      saveAppointments(appointments);
      
      onClose();
    }
  };

  const handleCloseWithReset = () => {
    setDentist('');
    setPatient('');
    setPhone('');
    setTreatment('');
    setDuration("30min");
    setDelay(0);
    setAvailableSlot(null);
    setAvailableDate(null);
    setHasSearched(false);
    onClose();
  };

  if (!isOpen || !data || !data.appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseWithReset}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>นัดต่อ</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSearch} className="space-y-4 mt-4">
          <div className="grid gap-2">
            <Label htmlFor="rebook-dentist">หมอฟัน:</Label>
            <input
              type="text"
              id="rebook-dentist"
              value={dentist}
              className="p-2 border rounded bg-gray-100"
              readOnly
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="rebook-patient">ชื่อคนไข้:</Label>
            <input
              type="text"
              id="rebook-patient"
              value={patient}
              className="p-2 border rounded bg-gray-100"
              readOnly
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="rebook-phone">เบอร์โทร:</Label>
            <input
              type="tel"
              id="rebook-phone"
              value={phone}
              className="p-2 border rounded bg-gray-100"
              readOnly
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="rebook-treatment">การรักษา:</Label>
            <input
              type="text"
              id="rebook-treatment"
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              className="p-2 border rounded"
              placeholder="การรักษา"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="rebook-duration">ระยะเวลา:</Label>
            <select
              id="rebook-duration"
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
            <Label htmlFor="rebook-delay">จำนวนวันที่ต้องการรอ:</Label>
            <input
              type="number"
              id="rebook-delay"
              value={delay}
              onChange={(e) => setDelay(parseInt(e.target.value))}
              className="p-2 border rounded"
              placeholder="จำนวนวันที่ต้องการรอ"
              min="0"
            />
          </div>
          
          {hasSearched && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md">
              <h3 className="font-medium mb-2">ผลการค้นหา:</h3>
              {availableDate && availableSlot ? (
                <div>
                  <p className="text-green-600">พบคิวว่าง:</p>
                  <p>วันที่: {formatDate(availableDate)}</p>
                  <p>เวลา: {availableSlot}</p>
                  <Button 
                    type="button" 
                    onClick={handleBook} 
                    className="mt-2 w-full bg-green-500 hover:bg-green-600"
                  >
                    นัดคิวนี้
                  </Button>
                </div>
              ) : (
                <p className="text-red-600">ไม่พบคิวว่างในวันที่เลือก</p>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button type="submit">ค้นหา</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RebookModal;
