
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import ScheduleTodayTable from '@/components/ScheduleTodayTable';
import ScheduleWeeklyTable from '@/components/ScheduleWeeklyTable';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import AddAppointmentModal from "@/components/modals/AddAppointmentModal";
import DentistsModal from "@/components/modals/DentistsModal";
import LeaveModal from "@/components/modals/LeaveModal";
import MeetingModal from "@/components/modals/MeetingModal";
import { loadDentists } from '@/lib/data-utils';
import AuthCheck from '@/components/auth/AuthCheck';
import NavBar from '@/components/NavBar';

const Index = () => {
  const [view, setView] = useState<'today' | 'week'>('today');
  const [date, setDate] = useState(new Date());
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [dentistsModalOpen, setDentistsModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [loadCounter, setLoadCounter] = useState(0);
  const [dentists, setDentists] = useState<Record<string, string>>({});

  // ดึงข้อมูลหมอเมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    const fetchDentists = async () => {
      const dentistsData = await loadDentists();
      setDentists(dentistsData);
    };
    
    fetchDentists();
  }, [loadCounter]);

  // ฟังก์ชันสำหรับรีเฟรชข้อมูล
  const refreshData = () => {
    setLoadCounter(prev => prev + 1);
  };
  
  return (
    <AuthCheck>
      <div className="container mx-auto p-4">
        <NavBar />
        
        <div className="flex flex-col md:flex-row gap-4 items-start mb-6 mt-4">
          <div className="flex-1">
            <Tabs defaultValue="today" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger 
                  value="today"
                  onClick={() => setView('today')}
                >
                  วันนี้
                </TabsTrigger>
                <TabsTrigger 
                  value="week"
                  onClick={() => setView('week')}
                >
                  รายสัปดาห์
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="today" className="mt-0">
                <div className="text-2xl font-bold mb-4">
                  ตารางนัดวันที่ {format(date, 'EEEE dd MMMM yyyy', { locale: th })}
                </div>
                <ScheduleTodayTable 
                  date={date} 
                  refreshTrigger={loadCounter} 
                />
              </TabsContent>
              
              <TabsContent value="week" className="mt-0">
                <div className="text-2xl font-bold mb-4">
                  ตารางนัดสัปดาห์
                </div>
                <ScheduleWeeklyTable 
                  startDate={date} 
                  refreshTrigger={loadCounter}
                />
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="w-full md:w-auto">
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h2 className="text-lg font-semibold mb-2">ปฏิทิน</h2>
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                locale={th}
                className="border rounded-md"
              />
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={() => setAddModalOpen(true)} 
                className="w-full text-white"
              >
                เพิ่มนัดหมาย
              </Button>
              
              <Button 
                onClick={() => setLeaveModalOpen(true)} 
                variant="outline" 
                className="w-full"
              >
                บันทึกการลา
              </Button>
              
              <Button 
                onClick={() => setMeetingModalOpen(true)} 
                variant="outline" 
                className="w-full"
              >
                บันทึกการประชุม
              </Button>
              
              <Button 
                onClick={() => setDentistsModalOpen(true)} 
                variant="outline" 
                className="w-full"
              >
                จัดการรายชื่อหมอ
              </Button>
            </div>
          </div>
        </div>
        
        {/* โมดัลต่างๆ */}
        <AddAppointmentModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          selectedDate={date}
          onAppointmentAdded={refreshData}
          dentists={Object.keys(dentists)}
          currentView={view}
          setCurrentView={setView}
        />
        
        <DentistsModal
          isOpen={dentistsModalOpen}
          onClose={() => setDentistsModalOpen(false)}
          onDentistsUpdated={refreshData}
        />
        
        <LeaveModal
          isOpen={leaveModalOpen}
          onClose={() => setLeaveModalOpen(false)}
          selectedDate={date}
          onLeaveRecorded={refreshData}
        />
        
        <MeetingModal
          isOpen={meetingModalOpen}
          onClose={() => setMeetingModalOpen(false)}
          selectedDate={date}
          onMeetingRecorded={refreshData}
        />
      </div>
    </AuthCheck>
  );
};

export default Index;
