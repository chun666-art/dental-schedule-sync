
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { loadLeaveData, saveLeaveData } from '@/lib/data-utils';
import { dateToKey } from '@/lib/date-utils';
import { getLeaveRecords, notifyOnLeave } from '@/lib/supabase';
import { SupabaseLeaveRecord } from '@/types/appointment';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: { date?: string };
  currentView: 'week' | 'today';
  setCurrentView: (view: 'week' | 'today') => void;
}

const LeaveModal: React.FC<LeaveModalProps> = ({
  isOpen,
  onClose,
  data,
  currentView,
  setCurrentView
}) => {
  const [dentist, setDentist] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [leaveRecords, setLeaveRecords] = useState<{date: string, dentists: string[]}[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const defaultDate = data?.date || dateToKey(today);
      setDate(defaultDate);
      loadLeaveRecords();
    }
  }, [isOpen, data]);

  const loadLeaveRecords = async () => {
    try {
      // ลองดึงข้อมูลจาก Supabase ก่อน
      const leaveRecordsFromSupabase = await getLeaveRecords();
      
      if (leaveRecordsFromSupabase && leaveRecordsFromSupabase.length > 0) {
        // แปลงข้อมูลจาก Supabase เป็นรูปแบบที่ต้องการ
        const leaveByDate: Record<string, string[]> = {};
        
        leaveRecordsFromSupabase.forEach((record: SupabaseLeaveRecord) => {
          if (!leaveByDate[record.date]) {
            leaveByDate[record.date] = [];
          }
          leaveByDate[record.date].push(record.dentist);
        });
        
        const records = Object.entries(leaveByDate).map(([date, dentists]) => ({
          date,
          dentists
        }));
        
        setLeaveRecords(records);
      } else {
        // ถ้าไม่มีข้อมูลใน Supabase ให้ใช้ localStorage
        const leaveData = loadLeaveData();
        const records = Object.entries(leaveData).map(([date, dentists]) => ({
          date,
          dentists: dentists as string[]
        }));
        setLeaveRecords(records);
      }
    } catch (error) {
      console.error('Error loading leave records:', error);
      // ถ้าเกิดข้อผิดพลาดให้ใช้ localStorage
      const leaveData = loadLeaveData();
      const records = Object.entries(leaveData).map(([date, dentists]) => ({
        date,
        dentists: dentists as string[]
      }));
      setLeaveRecords(records);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dentist || !date) return;
    
    try {
      // บันทึกข้อมูลการลาใน Supabase
      await notifyOnLeave(dentist, date, []);
      
      // บันทึกลงใน localStorage สำรอง
      const leaveData = loadLeaveData();
      leaveData[date] = leaveData[date] || [];
      
      if (!leaveData[date].includes(dentist)) {
        leaveData[date].push(dentist);
      }
      
      saveLeaveData(leaveData);
      await loadLeaveRecords();
      setDentist('');
    } catch (error) {
      console.error('Error submitting leave:', error);
      // ถ้าเกิดข้อผิดพลาดให้บันทึกลงใน localStorage อย่างเดียว
      const leaveData = loadLeaveData();
      leaveData[date] = leaveData[date] || [];
      
      if (!leaveData[date].includes(dentist)) {
        leaveData[date].push(dentist);
      }
      
      saveLeaveData(leaveData);
      await loadLeaveRecords();
      setDentist('');
    }
  };

  const handleDeleteLeave = async (date: string, dentistToDelete: string) => {
    const leaveData = loadLeaveData();
    
    if (leaveData[date]) {
      leaveData[date] = leaveData[date].filter(d => d !== dentistToDelete);
      
      if (leaveData[date].length === 0) {
        delete leaveData[date];
      }
      
      saveLeaveData(leaveData);
      await loadLeaveRecords();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>บันทึกการลา</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid gap-2">
            <Label htmlFor="leave-dentist">เลือกหมอฟัน:</Label>
            <select
              id="leave-dentist"
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
              <option value="ทำเด็กนักเรียน">ทำเด็กนักเรียน</option>
            </select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="leave-date">วันที่:</Label>
            <input
              type="date"
              id="leave-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="p-2 border rounded"
              required
            />
          </div>
          
          <DialogFooter>
            <Button type="submit">บันทึก</Button>
          </DialogFooter>
        </form>
        
        {/* แสดงรายการลาที่บันทึกไว้ */}
        <div className="mt-6">
          <h3 className="font-medium mb-2">รายการลาที่บันทึกไว้:</h3>
          {leaveRecords.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {leaveRecords.map((record, recordIndex) => (
                <div key={recordIndex} className="p-2 bg-gray-100 rounded">
                  <div className="font-medium">{record.date}</div>
                  <div className="space-y-1 mt-1">
                    {record.dentists.map((d, dIndex) => (
                      <div key={dIndex} className="flex justify-between items-center">
                        <span>{d}</span>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="bg-red-500 hover:bg-red-600 text-white p-1 text-xs"
                          onClick={() => handleDeleteLeave(record.date, d)}
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
            <p className="text-gray-500">ไม่มีรายการลา</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeaveModal;
