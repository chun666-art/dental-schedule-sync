import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  findAvailableSlots, 
  saveAppointmentWithMultipleSlots, 
  dateToKey, 
  loadLeaveData
} from '@/lib/data-utils';
import { formatDate } from '@/lib/date-utils';
import { Appointment } from '@/types/appointment';
import { useToast } from '@/hooks/use-toast';

interface NextAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NextAppointmentModal: React.FC<NextAppointmentModalProps> = ({
  isOpen,
  onClose
}) => {
  const [dentist, setDentist] = useState<string>('');
  const [patient, setPatient] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [treatment, setTreatment] = useState<string>('');
  const [duration, setDuration] = useState<"30min" | "1hour" | "2hours">("30min");
  const [delay, setDelay] = useState<number>(0);
  const [period, setPeriod] = useState<'morning' | 'afternoon'>('morning');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [availableDate, setAvailableDate] = useState<Date | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [confirmBooking, setConfirmBooking] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dentist) {
      toast({
        title: "กรุณาเลือกหมอฟัน",
        description: "กรุณาเลือกหมอฟันก่อนค้นหาคิว",
        variant: "destructive",
      });
      return;
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + delay);
    
    let foundSlot = false;
    let searchDate = new Date(startDate);
    let foundSlots: string[] = [];
    
    for (let i = 0; i < 60; i++) {
      try {
        const leaveData = await loadLeaveData();
        const dateKey = dateToKey(searchDate);
        
        if (leaveData[dateKey] && leaveData[dateKey].includes(dentist)) {
          searchDate = new Date(searchDate);
          searchDate.setDate(searchDate.getDate() + 1);
          continue;
        }
        
        const dayOfWeek = searchDate.getDay();
        
        if (period === 'morning') {
          if (dayOfWeek >= 1 && dayOfWeek <= 4) {
            const slots = await findAvailableSlots(searchDate, duration, dentist, 'morning');
            foundSlots = slots;
          } else if (dayOfWeek === 5) {
            const slots = await findAvailableSlots(searchDate, duration, dentist, 'morning');
            foundSlots = slots;
          }
        } else if (period === 'afternoon') {
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            const slots = await findAvailableSlots(searchDate, duration, dentist, 'afternoon');
            foundSlots = slots;
          }
        }
        
        if (foundSlots.length > 0) {
          foundSlot = true;
          setAvailableSlots(foundSlots);
          setAvailableDate(searchDate);
          setSelectedSlot(foundSlots[0]);
          break;
        }
      } catch (error) {
        console.error('Error finding available slots:', error);
      }
      
      searchDate = new Date(searchDate);
      searchDate.setDate(searchDate.getDate() + 1);
    }
    
    if (!foundSlot) {
      toast({
        title: "ไม่พบคิวว่าง",
        description: "ไม่พบคิวว่างในช่วงเวลาที่ต้องการภายใน 60 วัน",
        variant: "destructive",
      });
      setAvailableSlots([]);
      setAvailableDate(null);
      setSelectedSlot(null);
    }
    
    setHasSearched(true);
    setConfirmBooking(foundSlot);
  };

  const handleBook = async () => {
    if (availableDate && selectedSlot) {
      const dateKey = dateToKey(availableDate);
      
      const newAppointment: Appointment = {
        dentist,
        duration,
        patient: patient || 'ชื่อคนไข้รอการระบุ',
        phone: phone || 'รอการระบุ',
        treatment: treatment || 'รอการระบุ',
        status: "รอการยืนยันนัด"
      };
      
      try {
        await saveAppointmentWithMultipleSlots(dateKey, selectedSlot, newAppointment);
        
        toast({
          title: "บันทึกนัดหมายสำเร็จ",
          description: `บันทึกนัดหมายวันที่ ${formatDate(availableDate)} เวลา ${selectedSlot} เรียบร้อยแล้ว`,
          variant: "default",
        });
        
        const appointmentWeekStart = new Date(availableDate);
        const day = appointmentWeekStart.getDay();
        const diff = appointmentWeekStart.getDate() - day + (day === 0 ? -6 : 1);
        appointmentWeekStart.setDate(diff);
        
        localStorage.setItem('currentWeekStart', appointmentWeekStart.toISOString());
        localStorage.setItem('currentView', 'week');
        
        onClose();
        window.location.reload();
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

  const handleCloseWithReset = () => {
    setDentist('');
    setDuration("30min");
    setDelay(0);
    setPeriod('morning');
    setPatient('');
    setPhone('');
    setTreatment('');
    setAvailableSlots([]);
    setAvailableDate(null);
    setSelectedSlot(null);
    setHasSearched(false);
    setConfirmBooking(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseWithReset}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>ค้นหาคิวนัดคนไข้ใหม่</DialogTitle>
          <DialogDescription>
            กรอกข้อมูลเพื่อค้นหาคิวนัดหมายที่ว่าง
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <form onSubmit={handleSubmit} className="space-y-4 mt-4 px-1">
            <div className="grid gap-2">
              <Label htmlFor="next-dentist">เลือกหมอฟัน:</Label>
              <select
                id="next-dentist"
                value={dentist}
                onChange={(e) => setDentist(e.target.value)}
                className="p-2 border rounded"
                required
                disabled={confirmBooking}
              >
                <option value="">เลือกหมอฟัน</option>
                <option value="DC">DC</option>
                <option value="DD">DD</option>
                <option value="DPa">DPa</option>
                <option value="DPu">DPu</option>
                <option value="DT">DT</option>
              </select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="next-patient">ชื่อคนไข้:</Label>
              <input
                type="text"
                id="next-patient"
                value={patient}
                onChange={(e) => setPatient(e.target.value)}
                className="p-2 border rounded"
                placeholder="ชื่อคนไข้"
                disabled={confirmBooking}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="next-phone">เบอร์โทร:</Label>
              <input
                type="tel"
                id="next-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="p-2 border rounded"
                placeholder="เบอร์โทร"
                disabled={confirmBooking}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="next-treatment">การรักษา:</Label>
              <input
                type="text"
                id="next-treatment"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                className="p-2 border rounded"
                placeholder="การรักษา"
                disabled={confirmBooking}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="next-duration">ระยะเวลา:</Label>
              <select
                id="next-duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value as "30min" | "1hour" | "2hours")}
                className="p-2 border rounded"
                required
                disabled={confirmBooking}
              >
                <option value="30min">30 นาที</option>
                <option value="1hour">1 ชั่วโมง</option>
                <option value="2hours">2 ชั่วโมง</option>
              </select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="next-period">ช่วงเวลา:</Label>
              <select
                id="next-period"
                value={period}
                onChange={(e) => setPeriod(e.target.value as 'morning' | 'afternoon')}
                className="p-2 border rounded"
                required
                disabled={confirmBooking}
              >
                <option value="morning">ช่วงเช้า</option>
                <option value="afternoon">ช่วงบ่าย</option>
              </select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="next-delay">จำนวนวันที่ต้องการรอ:</Label>
              <input
                type="number"
                id="next-delay"
                value={delay}
                onChange={(e) => setDelay(parseInt(e.target.value))}
                className="p-2 border rounded"
                placeholder="จำนวนวันที่ต้องการรอ"
                min="0"
                disabled={confirmBooking}
              />
            </div>
            
            {hasSearched && !confirmBooking && (
              <div className="mt-4 p-3 bg-gray-100 rounded-md">
                <h3 className="font-medium mb-2">ผลการค้นหา:</h3>
                {availableDate && availableSlots.length > 0 ? (
                  <div>
                    <p className="text-green-600">พบคิวว่าง:</p>
                    <p>วันที่: {availableDate ? formatDate(availableDate) : ''}</p>
                    <div className="mt-2">
                      <Label htmlFor="available-slots">เลือกเวลา:</Label>
                      <select
                        id="available-slots"
                        value={selectedSlot || ''}
                        onChange={(e) => setSelectedSlot(e.target.value)}
                        className="w-full p-2 border rounded mt-1"
                      >
                        {availableSlots.map((slot, index) => (
                          <option key={index} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
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
                <p>เวลา: {selectedSlot}</p>
                <p>ระยะเวลา: {
                  duration === "30min" ? "30 นาที" : 
                  duration === "1hour" ? "1 ชั่วโมง" : 
                  "2 ชั่วโมง"
                }</p>
                <p>ช่วงเวลา: {period === "morning" ? "ช่วงเช้า" : "ช่วงบ่าย"}</p>
                <div className="mt-2 flex space-x-2">
                  <Button 
                    type="button" 
                    onClick={() => setConfirmBooking(false)} 
                    className="flex-1 bg-red-500 hover:bg-red-600"
                  >
                    ยกเลิก
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
            <Button type="button" onClick={handleSubmit}>ค้นหา</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NextAppointmentModal;
