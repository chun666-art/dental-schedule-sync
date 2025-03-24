
import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { th } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { loadLeaveData, saveLeaveData } from '@/lib/data-utils';
import { useToast } from '@/hooks/use-toast';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeaveRecorded: () => void;
  selectedDate: Date;
}

const LeaveModal: React.FC<LeaveModalProps> = ({ 
  isOpen, 
  onClose, 
  onLeaveRecorded,
  selectedDate
}) => {
  const [leaveDate, setLeaveDate] = useState<Date | undefined>(selectedDate);
  const [leaveType, setLeaveType] = useState('sick');
  const [leaveDentist, setLeaveDentist] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState<Date | undefined>(addDays(selectedDate, 1));
  const [leaveData, setLeaveData] = useState<Record<string, string[]>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadLeaveDataAsync();
    }
  }, [isOpen]);

  // Update the leave date when selectedDate prop changes
  useEffect(() => {
    setLeaveDate(selectedDate);
    setLeaveEndDate(addDays(selectedDate, 1));
  }, [selectedDate]);

  const loadLeaveDataAsync = async () => {
    try {
      const data = await loadLeaveData();
      setLeaveData(data);
    } catch (error) {
      console.error('Failed to load leave data:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลวันลาได้',
        variant: 'destructive',
      });
    }
  };

  const handleLeaveRecording = async () => {
    if (!leaveDate || !leaveDentist) {
      toast({
        title: 'ข้อมูลไม่ครบถ้วน',
        description: 'กรุณาเลือกวันที่และทันตแพทย์',
        variant: 'destructive',
      });
      return;
    }

    const startDate = leaveDate;
    const endDate = leaveEndDate || startDate;
    
    try {
      // Create a clone of the current leave data
      const updatedLeaveData = { ...leaveData };
      
      // Loop through each day in the leave period
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        const leaveInfo = `${leaveDentist}|${leaveType}|${leaveReason}`;
        
        // Add leave info for this date
        if (!updatedLeaveData[dateKey]) {
          updatedLeaveData[dateKey] = [];
        }
        updatedLeaveData[dateKey].push(leaveInfo);
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Save updated leave data
      await saveLeaveData(updatedLeaveData);
      
      // Update state with the new data
      setLeaveData(updatedLeaveData);
      
      // Reset form
      setLeaveReason('');
      
      toast({
        title: 'บันทึกวันลาสำเร็จ',
        description: `บันทึกวันลาสำหรับ ${leaveDentist} เรียบร้อยแล้ว`,
      });
      
      onLeaveRecorded();
      onClose();
    } catch (error) {
      console.error('Failed to record leave:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถบันทึกวันลาได้',
        variant: 'destructive',
      });
    }
  };

  const getDateRangeText = () => {
    if (!leaveDate) return '';
    if (!leaveEndDate || leaveDate.getTime() === leaveEndDate.getTime()) {
      return format(leaveDate, 'dd MMMM yyyy', { locale: th });
    }
    return `${format(leaveDate, 'dd MMMM yyyy', { locale: th })} - ${format(leaveEndDate, 'dd MMMM yyyy', { locale: th })}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>บันทึกวันลา</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">ทันตแพทย์</label>
            <Input
              placeholder="ชื่อทันตแพทย์"
              value={leaveDentist}
              onChange={(e) => setLeaveDentist(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">ประเภทการลา</label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกประเภทการลา" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sick">ลาป่วย</SelectItem>
                <SelectItem value="personal">ลากิจ</SelectItem>
                <SelectItem value="vacation">ลาพักร้อน</SelectItem>
                <SelectItem value="other">อื่นๆ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">ระยะเวลาการลา: {getDateRangeText()}</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium">วันเริ่มต้น</label>
                <Calendar
                  mode="single"
                  selected={leaveDate}
                  onSelect={setLeaveDate}
                  className="border rounded-md p-2"
                  locale={th}
                />
              </div>
              <div>
                <label className="text-xs font-medium">วันสิ้นสุด</label>
                <Calendar
                  mode="single"
                  selected={leaveEndDate}
                  onSelect={setLeaveEndDate}
                  className="border rounded-md p-2"
                  locale={th}
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">เหตุผลการลา</label>
            <Textarea
              placeholder="ระบุเหตุผลการลา (ถ้ามี)"
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
            <Button onClick={handleLeaveRecording}>บันทึกวันลา</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeaveModal;
