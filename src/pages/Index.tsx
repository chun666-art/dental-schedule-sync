
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarDays, Plus, UserPlus, Calendar as CalendarIcon, Coffee, Users } from 'lucide-react';
import { th } from 'date-fns/locale';
import NavBar from '@/components/NavBar';
import AuthCheck from '@/components/auth/AuthCheck';
import ScheduleTodayTable from '@/components/ScheduleTodayTable';
import ScheduleWeeklyTable from '@/components/ScheduleWeeklyTable';
import AddAppointmentModal from '@/components/modals/AddAppointmentModal';
import DentistsModal from '@/components/modals/DentistsModal';
import LeaveModal from '@/components/modals/LeaveModal';
import MeetingModal from '@/components/modals/MeetingModal';
import { loadDentists } from '@/lib/data-utils';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<'today' | 'week'>('today');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [dentistsModalOpen, setDentistsModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [modalData, setModalData] = useState<any>({ date: '', time: '' });
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [dentists, setDentists] = useState<Record<string, string>>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDentists = async () => {
      try {
        const dentistsData = await loadDentists();
        setDentists(dentistsData);
      } catch (error) {
        console.error('Failed to load dentists:', error);
      }
    };

    fetchDentists();
  }, []);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAddClick = () => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    setModalData({ date: dateKey, time: '9:00-9:30' });
    setAddModalOpen(true);
  };

  // Render content
  return (
    <AuthCheck>
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <div className="container mx-auto p-4 flex-1">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 lg:w-1/4">
              <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                <h2 className="text-xl font-semibold mb-4">ปฏิทิน</h2>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="border rounded-md p-2"
                  locale={th}
                />
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-xl font-semibold mb-4">เครื่องมือ</h2>
                <div className="flex flex-col space-y-2">
                  <Button 
                    onClick={handleAddClick} 
                    className="w-full justify-start"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    เพิ่มนัดหมาย
                  </Button>
                  <Button 
                    onClick={() => setDentistsModalOpen(true)} 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    จัดการทันตแพทย์
                  </Button>
                  <Button 
                    onClick={() => setLeaveModalOpen(true)} 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Coffee className="mr-2 h-4 w-4" />
                    บันทึกวันลา
                  </Button>
                  <Button 
                    onClick={() => setMeetingModalOpen(true)} 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    บันทึกการประชุม
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-2/3 lg:w-3/4">
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">ตารางเวลา</h2>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => setCurrentView('today')} 
                      variant={currentView === 'today' ? 'default' : 'outline'}
                      size="sm"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      วันนี้
                    </Button>
                    <Button 
                      onClick={() => setCurrentView('week')} 
                      variant={currentView === 'week' ? 'default' : 'outline'}
                      size="sm"
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      สัปดาห์
                    </Button>
                  </div>
                </div>
                
                {currentView === 'today' ? (
                  <ScheduleTodayTable 
                    currentDate={selectedDate} 
                    refreshTrigger={refreshTrigger}
                    setIsAddModalOpen={setAddModalOpen}
                    setIsEditModalOpen={() => {}} 
                    setIsRebookModalOpen={() => {}}
                    setIsCancelModalOpen={() => {}}
                    setModalData={setModalData}
                    setCancelTarget={setCancelTarget}
                  />
                ) : (
                  <ScheduleWeeklyTable 
                    currentWeekStart={selectedDate} 
                    refreshTrigger={refreshTrigger}
                    setIsAddModalOpen={setAddModalOpen}
                    setIsEditModalOpen={() => {}} 
                    setIsRebookModalOpen={() => {}}
                    setIsCancelModalOpen={() => {}}
                    setIsLeaveModalOpen={setLeaveModalOpen}
                    setIsMeetingModalOpen={setMeetingModalOpen}
                    setModalData={setModalData}
                    setCancelTarget={setCancelTarget}
                  />
                )}
              </div>
            </div>
          </div>
          
          {/* Modals */}
          <AddAppointmentModal 
            isOpen={addModalOpen} 
            onClose={() => setAddModalOpen(false)} 
            data={modalData}
            currentView={currentView}
            setCurrentView={setCurrentView}
          />
          
          <DentistsModal 
            isOpen={dentistsModalOpen} 
            onClose={() => setDentistsModalOpen(false)} 
            onDentistsUpdated={handleRefresh}
          />
          
          <LeaveModal 
            isOpen={leaveModalOpen} 
            onClose={() => setLeaveModalOpen(false)} 
            onLeaveRecorded={handleRefresh}
            selectedDate={selectedDate}
          />
          
          <MeetingModal 
            isOpen={meetingModalOpen} 
            onClose={() => setMeetingModalOpen(false)} 
            onMeetingRecorded={handleRefresh}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    </AuthCheck>
  );
};

export default Index;
