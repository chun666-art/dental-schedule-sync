
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { loadAppointments, saveAppointments, findAvailableSlots, saveAppointmentWithMultipleSlots } from '@/lib/data-utils';
import { dateToKey, formatDate } from '@/lib/date-utils';
import { Appointment } from '@/types/appointment';
import { useToast } from '@/hooks/use-toast';

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
  const [period, setPeriod] = useState<'morning' | 'afternoon' | 'all'>('all');
  const [availableSlot, setAvailableSlot] = useState<string | null>(null);
  const [availableDate, setAvailableDate] = useState<Date | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [confirmBooking, setConfirmBooking] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && data && data.appointment) {
      setDentist(data.appointment.dentist || '');
      setPatient(data.appointment.patient || '');
      setPhone(data.appointment.phone || '');
      setTreatment(data.appointment.treatment || '');
      setDuration(data.appointment.duration || "30min");
      setDelay(0);
      setPeriod('all');
      setAvailableSlot(null);
      setAvailableDate(null);
      setHasSearched(false);
      setConfirmBooking(false);
    }
  }, [isOpen, data]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // เริ่มค้นหาจากวันที่ปัจจุบัน + จำนวนวันที่ต้องการรอ
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + delay);
    
    // ค้นหาคิวว่างตามช่วงเวลาที่เลือก
    let foundSlot = false;
    let searchDate = new Date(startDate);
    let availableSlots: string[] = [];
    
    // ค้นหาไปเรื่อยๆ จนกว่าจะพบคิวว่าง หรือครบ 60 วัน
    for (let i = 0; i < 60; i++) {
      availableSlots = findAvailableSlots(searchDate, duration, dentist, undefined, period);
      
      if (availableSlots.length > 0) {
        foundSlot = true;
        setAvailableSlot(availableSlots[0]);
        setAvailableDate(searchDate);
        break;
      }
      
      // เลื่อนไปวันถัดไป
      searchDate = new Date(searchDate);
      searchDate.setDate(searchDate.getDate() + 1);
    }
    
    if (!foundSlot) {
      setAvailableSlot(null);
      setAvailableDate(null);
    }
    
    setHasSearched(true);
    setConfirmBooking(foundSlot);
  };

  const handleBook = () => {
    if (availableSlot && availableDate) {
      const dateKey = dateToKey(availableDate);
      
      const newAppointment: Appointment = {
        dentist,
        duration,
        patient,
        phone,
        treatment,
        status: "รอการยืนยันนัด"
      };
      
      try {
        // บันทึกการนัดหมายในทุกช่องเวลาที่เกี่ยวข้อง
        saveAppointmentWithMultipleSlots(dateKey, availableSlot, newAppointment);
        
        toast({
          title: "บันทึกนัดหมายสำเร็จ",
          description: `บันทึกนัดหมายวันที่ ${formatDate(availableDate)} เวลา ${availableSlot} เรียบร้อยแล้ว`,
          variant: "default",
        });
        
        onClose();
      } catch (error) {
        console.error('Error booking appointment:', error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถบันทึกนัดหมายได้ กรุณาลองใหม่อีกครั้ง",
          variant: "destructive",
        });
      }
    }
  };

  const handleCancelConfirm = () => {
    setConfirmBooking(false);
    // ค้นหาคิวว่างใหม่โดยเลื่อนวันไปอีก 1 วัน
    if (availableDate) {
      const nextDate = new Date(availableDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const availableSlots = findAvailableSlots(nextDate, duration, dentist, undefined, period);
      
      if (availableSlots.length > 0) {
        setAvailableSlot(availableSlots[0]);
        setAvailableDate(nextDate);
        setConfirmBooking(true);
      } else {
        setAvailableSlot(null);
        setAvailableDate(null);
        setHasSearched(true);
      }
    }
  };

  const handleCloseWithReset = () => {
    setDentist('');
    setPatient('');
    setPhone('');
    setTreatment('');
    setDuration("30min");
    setDelay(0);
    setPeriod('all');
    setAvailableSlot(null);
    setAvailableDate(null);
    setHasSearched(false);
    setConfirmBooking(false);
    onClose();
  };

  if (!isOpen || !data || !data.appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseWithReset}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>นัดต่อ</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <form onSubmit={handleSearch} className="space-y-4 mt-4 px-1">
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
              <Label htmlFor="rebook-period">ช่วงเวลา:</Label>
              <select
                id="rebook-period"
                value={period}
                onChange={(e) => setPeriod(e.target.value as 'morning' | 'afternoon' | 'all')}
                className="p-2 border rounded"
                required
              >
                <option value="all">ทั้งวัน</option>
                <option value="morning">ช่วงเช้า</option>
                <option value="afternoon">ช่วงบ่าย</option>
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
            
            {hasSearched && !confirmBooking && (
              <div className="mt-4 p-3 bg-gray-100 rounded-md">
                <h3 className="font-medium mb-2">ผลการค้นหา:</h3>
                {availableDate && availableSlot ? (
                  <div>
                    <p className="text-green-600">พบคิวว่าง:</p>
                    <p>วันที่: {formatDate(availableDate)}</p>
                    <p>เวลา: {availableSlot}</p>
                    <Button 
                      type="button" 
                      onClick={() => setConfirmBooking(true)} 
                      className="mt-2 w-full bg-green-500 hover:bg-green-600"
                    >
                      ยืนยันนัดคิวนี้
                    </Button>
                  </div>
                ) : (
                  <p className="text-red-600">ไม่พบคิวว่างในวันที่เลือก</p>
                )}
              </div>
            )}
            
            {confirmBooking && (
              <div className="mt-4 p-3 bg-gray-100 rounded-md">
                <h3 className="font-medium mb-2">ยืนยันการนัด:</h3>
                <p>วันที่: {availableDate ? formatDate(availableDate) : ''}</p>
                <p>เวลา: {availableSlot}</p>
                <div className="mt-2 flex space-x-2">
                  <Button 
                    type="button" 
                    onClick={handleCancelConfirm} 
                    className="flex-1 bg-red-500 hover:bg-red-600"
                  >
                    หาคิวอื่น
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleBook} 
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    ยืนยันนัด
                  </Button>
                </div>
              </div>
            )}
          </form>
        </ScrollArea>
        
        <DialogFooter>
          {!confirmBooking && (
            <Button type="button" onClick={handleSearch}>ค้นหา</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RebookModal;
