
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { loadMeetingData, saveMeetingData } from '@/lib/data-utils';
import { dateToKey } from '@/lib/date-utils';
import { MeetingRecord } from '@/types/appointment';

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: { date?: string };
  currentView: 'week' | 'today';
  setCurrentView: (view: 'week' | 'today') => void;
}

const MeetingModal: React.FC<MeetingModalProps> = ({
  isOpen,
  onClose,
  data,
  currentView,
  setCurrentView
}) => {
  const [dentist, setDentist] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [period, setPeriod] = useState<"morning" | "afternoon">("morning");
  const [meetingRecords, setMeetingRecords] = useState<{date: string, meetings: MeetingRecord[]}[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const defaultDate = data?.date || dateToKey(today);
      setDate(defaultDate);
      loadMeetingRecords();
    }
  }, [isOpen, data]);

  const loadMeetingRecords = () => {
    const meetingData = loadMeetingData();
    const records = Object.entries(meetingData).map(([date, meetings]) => ({
      date,
      meetings: meetings as MeetingRecord[]
    }));
    setMeetingRecords(records);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dentist || !date || !period) return;
    
    const meetingData = loadMeetingData();
    meetingData[date] = meetingData[date] || [];
    
    meetingData[date].push({
      dentist,
      period
    });
    
    saveMeetingData(meetingData);
    loadMeetingRecords();
    setDentist('');
    setPeriod("morning");
  };

  const handleDeleteMeeting = (date: string, index: number) => {
    const meetingData = loadMeetingData();
    
    if (meetingData[date] && meetingData[date].length > index) {
      meetingData[date].splice(index, 1);
      
      if (meetingData[date].length === 0) {
        delete meetingData[date];
      }
      
      saveMeetingData(meetingData);
      loadMeetingRecords();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>บันทึกการประชุม</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid gap-2">
            <Label htmlFor="meeting-dentist">เลือกหมอฟัน:</Label>
            <select
              id="meeting-dentist"
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
            <Label htmlFor="meeting-date">วันที่:</Label>
            <input
              type="date"
              id="meeting-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="p-2 border rounded"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="meeting-period">ช่วงเวลา:</Label>
            <select
              id="meeting-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value as "morning" | "afternoon")}
              className="p-2 border rounded"
              required
            >
              <option value="">เลือกช่วงเวลา</option>
              <option value="morning">ช่วงเช้า</option>
              <option value="afternoon">ช่วงบ่าย</option>
            </select>
          </div>
          
          <DialogFooter>
            <Button type="submit">บันทึก</Button>
          </DialogFooter>
        </form>
        
        {/* แสดงรายการประชุมที่บันทึกไว้ */}
        <div className="mt-6">
          <h3 className="font-medium mb-2">รายการประชุมที่บันทึกไว้:</h3>
          {meetingRecords.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {meetingRecords.map((record, recordIndex) => (
                <div key={recordIndex} className="p-2 bg-gray-100 rounded">
                  <div className="font-medium">{record.date}</div>
                  <div className="space-y-1 mt-1">
                    {record.meetings.map((meeting, mIndex) => (
                      <div key={mIndex} className="flex justify-between items-center">
                        <span>
                          {meeting.dentist} ({meeting.period === 'morning' ? 'เช้า' : 'บ่าย'})
                        </span>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="bg-red-500 hover:bg-red-600 text-white p-1 text-xs"
                          onClick={() => handleDeleteMeeting(record.date, mIndex)}
                        >
                          ลบ
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">ไม่มีรายการประชุม</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingModal;
