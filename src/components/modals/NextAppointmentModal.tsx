
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { findAvailableSlots } from '@/lib/data-utils';
import { formatDate } from '@/lib/date-utils';

interface NextAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NextAppointmentModal: React.FC<NextAppointmentModalProps> = ({
  isOpen,
  onClose
}) => {
  const [dentist, setDentist] = useState<string>('');
  const [duration, setDuration] = useState<"30min" | "1hour" | "2hours">("30min");
  const [delay, setDelay] = useState<number>(0);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [searchDate, setSearchDate] = useState<Date | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + delay);
    setSearchDate(startDate);
    
    const isSlotAvailable = findAvailableSlots(startDate, duration, dentist);
    
    if (isSlotAvailable) {
      setAvailableSlots(['9:00-9:30']);
    } else {
      setAvailableSlots([]);
    }
    
    setHasSearched(true);
  };

  const handleCloseWithReset = () => {
    setDentist('');
    setDuration("30min");
    setDelay(0);
    setAvailableSlots([]);
    setSearchDate(null);
    setHasSearched(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseWithReset}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ค้นหาคิวนัดคนไข้ใหม่</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid gap-2">
            <Label htmlFor="next-dentist">เลือกหมอฟัน:</Label>
            <select
              id="next-dentist"
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
            </select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="next-duration">ระยะเวลา:</Label>
            <select
              id="next-duration"
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
            <Label htmlFor="next-delay">จำนวนวันที่ต้องการรอ:</Label>
            <input
              type="number"
              id="next-delay"
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
              {searchDate && (
                <p>วันที่: {formatDate(searchDate)}</p>
              )}
              {availableSlots.length > 0 ? (
                <div>
                  <p className="text-green-600">พบคิวว่าง:</p>
                  <ul className="list-disc list-inside">
                    {availableSlots.map((slot, index) => (
                      <li key={index}>{slot}</li>
                    ))}
                  </ul>
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

export default NextAppointmentModal;
