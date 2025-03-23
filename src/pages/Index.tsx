
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import ScheduleWeeklyTable from '@/components/ScheduleWeeklyTable';
import ScheduleTodayTable from '@/components/ScheduleTodayTable';
import AddAppointmentModal from '@/components/modals/AddAppointmentModal';
import EditAppointmentModal from '@/components/modals/EditAppointmentModal';
import NextAppointmentModal from '@/components/modals/NextAppointmentModal';
import RebookModal from '@/components/modals/RebookModal';
import LeaveModal from '@/components/modals/LeaveModal';
import MeetingModal from '@/components/modals/MeetingModal';
import DentistsModal from '@/components/modals/DentistsModal';
import CancelModal from '@/components/modals/CancelModal';
import { getMonday, formatDate } from '@/lib/date-utils';
import { checkAndCleanupData } from '@/lib/data-utils';

const Index = () => {
  // State for current view and date
  const [currentView, setCurrentView] = useState<'week' | 'today'>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()));
  const [weekIndicator, setWeekIndicator] = useState<string>('');
  
  // State for modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNextAppointmentModalOpen, setIsNextAppointmentModalOpen] = useState(false);
  const [isRebookModalOpen, setIsRebookModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isDentistsModalOpen, setIsDentistsModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  
  // State for modal data
  const [modalData, setModalData] = useState<any>({});
  const [cancelTarget, setCancelTarget] = useState<any>(null);

  useEffect(() => {
    checkAndCleanupData();
    
    if (currentView === 'week') {
      updateWeekIndicator();
    } else {
      setWeekIndicator(formatDate(new Date()));
    }
  }, [currentView, currentWeekStart]);

  const updateWeekIndicator = () => {
    const monday = getMonday(currentWeekStart);
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const day = String(monday.getDate()).padStart(2, '0');
    setWeekIndicator(`${year}-${month}-${day}`);
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
    setCurrentView('week');
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
    setCurrentView('week');
  };

  const handleCurrentWeek = () => {
    setCurrentWeekStart(getMonday(new Date()));
    setCurrentView('week');
  };

  const handleTodaySchedule = () => {
    setCurrentView('today');
  };

  const handleWeekSelectorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentWeekStart(new Date(e.target.value));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-lg border border-gray-100">
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant={currentView === 'week' ? 'default' : 'outline'} 
            size="sm" 
            onClick={handleCurrentWeek}
          >
            สัปดาห์นี้
          </Button>
          <Button 
            variant={currentView === 'today' ? 'default' : 'outline'} 
            size="sm" 
            onClick={handleTodaySchedule}
          >
            วันนี้
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-lg font-medium text-gray-700">
          {currentView === 'week' ? (
            <input 
              type="date" 
              id="week-selector" 
              value={weekIndicator} 
              min="2024-01-01" 
              max="2025-12-31" 
              className="w-[130px]"
              onChange={handleWeekSelectorChange}
            />
          ) : (
            weekIndicator
          )}
        </div>
      </header>

      {/* Control Buttons */}
      <div className="flex justify-end items-center mb-6 space-x-2">
        <Button 
          variant="outline" 
          className="bg-purple-500 text-white hover:bg-purple-600"
          onClick={() => setIsDentistsModalOpen(true)}
        >
          รายชื่อหมอ
        </Button>
        <Button 
          variant="outline" 
          className="bg-red-500 text-white hover:bg-red-600"
          onClick={() => setIsLeaveModalOpen(true)}
        >
          <Plus className="h-4 w-4" />ลา
        </Button>
        <Button 
          variant="outline" 
          className="bg-blue-500 text-white hover:bg-blue-600"
          onClick={() => setIsMeetingModalOpen(true)}
        >
          <Plus className="h-4 w-4" />ประชุม
        </Button>
        <Button 
          variant="outline" 
          className="bg-green-500 text-white hover:bg-green-600"
          onClick={() => setIsNextAppointmentModalOpen(true)}
        >
          ค้นหาคิวนัดใหม่
        </Button>
      </div>

      {/* Schedule Container */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-xl border border-gray-100">
        {currentView === 'week' ? (
          <ScheduleWeeklyTable 
            currentWeekStart={currentWeekStart} 
            setIsAddModalOpen={setIsAddModalOpen}
            setIsEditModalOpen={setIsEditModalOpen}
            setIsRebookModalOpen={setIsRebookModalOpen}
            setIsCancelModalOpen={setIsCancelModalOpen}
            setIsLeaveModalOpen={setIsLeaveModalOpen}
            setIsMeetingModalOpen={setIsMeetingModalOpen}
            setModalData={setModalData}
            setCancelTarget={setCancelTarget}
          />
        ) : (
          <ScheduleTodayTable 
            setIsAddModalOpen={setIsAddModalOpen}
            setIsEditModalOpen={setIsEditModalOpen}
            setIsRebookModalOpen={setIsRebookModalOpen}
            setIsCancelModalOpen={setIsCancelModalOpen}
            setIsLeaveModalOpen={setIsLeaveModalOpen}
            setIsMeetingModalOpen={setIsMeetingModalOpen}
            setModalData={setModalData}
            setCancelTarget={setCancelTarget}
          />
        )}
      </div>

      {/* Modals */}
      <AddAppointmentModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        data={modalData}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
      
      <EditAppointmentModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        data={modalData}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
      
      <NextAppointmentModal 
        isOpen={isNextAppointmentModalOpen} 
        onClose={() => setIsNextAppointmentModalOpen(false)} 
      />
      
      <RebookModal 
        isOpen={isRebookModalOpen} 
        onClose={() => setIsRebookModalOpen(false)} 
        data={modalData}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
      
      <LeaveModal 
        isOpen={isLeaveModalOpen} 
        onClose={() => setIsLeaveModalOpen(false)} 
        data={modalData}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
      
      <MeetingModal 
        isOpen={isMeetingModalOpen} 
        onClose={() => setIsMeetingModalOpen(false)} 
        data={modalData}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
      
      <DentistsModal 
        isOpen={isDentistsModalOpen} 
        onClose={() => setIsDentistsModalOpen(false)} 
      />
      
      <CancelModal 
        isOpen={isCancelModalOpen} 
        onClose={() => setIsCancelModalOpen(false)} 
        cancelTarget={cancelTarget}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
    </div>
  );
};

export default Index;
