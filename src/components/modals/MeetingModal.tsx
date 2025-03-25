
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TimePickerDemo } from '@/components/ui/time-picker-demo';
import { loadMeetingData, saveMeetingData } from '@/lib/data-utils';
import { MeetingRecord } from '@/types/appointment';
import { useToast } from '@/hooks/use-toast';

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMeetingRecorded: () => void;
  selectedDate: Date;
}

const MeetingModal: React.FC<MeetingModalProps> = ({ 
  isOpen, 
  onClose,
  onMeetingRecorded,
  selectedDate
}) => {
  const [meetingDate, setMeetingDate] = useState<Date | undefined>(selectedDate);
  const [selectedDentist, setSelectedDentist] = useState<string>('');
  const [period, setPeriod] = useState<'morning' | 'afternoon'>('morning');
  const [meetingData, setMeetingData] = useState<Record<string, MeetingRecord[]>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadMeetingDataAsync();
      setMeetingDate(selectedDate);
    }
  }, [isOpen, selectedDate]);

  const loadMeetingDataAsync = async () => {
    try {
      const data = await loadMeetingData();
      setMeetingData(data);
    } catch (error) {
      console.error('Failed to load meeting data:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลการประชุมได้',
        variant: 'destructive',
      });
    }
  };

  const handleMeetingRecording = async () => {
    if (!meetingDate || !selectedDentist || !period) {
      toast({
        title: 'ข้อมูลไม่ครบถ้วน',
        description: 'กรุณากรอกข้อมูลการประชุมให้ครบถ้วน',
        variant: 'destructive',
      });
      return;
    }

    try {
      const dateKey = format(meetingDate, 'yyyy-MM-dd');
      const newMeeting: MeetingRecord = {
        dentist: selectedDentist,
        period: period
      };
      
      // Create a clone of the current meeting data
      const updatedMeetingData = { ...meetingData };
      
      // Add meeting for this date
      if (!updatedMeetingData[dateKey]) {
        updatedMeetingData[dateKey] = [];
      }
      updatedMeetingData[dateKey].push(newMeeting);
      
      // Save updated meeting data
      await saveMeetingData(updatedMeetingData);
      
      // Update state with the new data
      setMeetingData(updatedMeetingData);
      
      // Reset form
      setSelectedDentist('');
      
      toast({
        title: 'บันทึกการประชุมสำเร็จ',
        description: `บันทึกการประชุมของ ${selectedDentist} เรียบร้อยแล้ว`,
      });
      
      onMeetingRecorded();
      onClose();
    } catch (error) {
      console.error('Failed to record meeting:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถบันทึกการประชุมได้',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>บันทึกการประชุม</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">เลือกทันตแพทย์</label>
            <select
              value={selectedDentist}
              onChange={(e) => setSelectedDentist(e.target.value)}
              className="p-2 border rounded"
              required
            >
              <option value="">เลือกทันตแพทย์</option>
              <option value="DC">DC</option>
              <option value="DD">DD</option>
              <option value="DPa">DPa</option>
              <option value="DPu">DPu</option>
              <option value="DT">DT</option>
            </select>
          </div>
          
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">วันที่ประชุม: {meetingDate ? format(meetingDate, 'dd MMMM yyyy', { locale: th }) : ''}</label>
            <Calendar
              mode="single"
              selected={meetingDate}
              onSelect={setMeetingDate}
              className="border rounded-md p-2"
              locale={th}
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">ช่วงเวลา</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'morning' | 'afternoon')}
              className="p-2 border rounded"
              required
            >
              <option value="morning">ช่วงเช้า</option>
              <option value="afternoon">ช่วงบ่าย</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
            <Button onClick={handleMeetingRecording}>บันทึกการประชุม</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingModal;
