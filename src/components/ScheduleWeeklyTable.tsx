
import React from 'react';
import { Button } from '@/components/ui/button';
import { loadAppointments, loadLeaveData, loadMeetingData, loadDentists } from '@/lib/data-utils';
import { getMonday, formatDate, dateToKey, isPastDate, hexToRgb } from '@/lib/date-utils';
import { Appointment } from '@/types/appointment';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table';

interface ScheduleWeeklyTableProps {
  currentWeekStart: Date;
  refreshTrigger?: number;
  setIsAddModalOpen: (isOpen: boolean) => void;
  setIsEditModalOpen: (isOpen: boolean) => void;
  setIsRebookModalOpen: (isOpen: boolean) => void;
  setIsCancelModalOpen: (isOpen: boolean) => void;
  setIsLeaveModalOpen: (isOpen: boolean) => void;
  setIsMeetingModalOpen: (isOpen: boolean) => void;
  setModalData: (data: any) => void;
  setCancelTarget: (target: any) => void;
}

const ScheduleWeeklyTable: React.FC<ScheduleWeeklyTableProps> = ({
  currentWeekStart,
  refreshTrigger,
  setIsAddModalOpen,
  setIsEditModalOpen,
  setIsRebookModalOpen,
  setIsCancelModalOpen,
  setIsLeaveModalOpen,
  setIsMeetingModalOpen,
  setModalData,
  setCancelTarget
}) => {
  const isMobile = useIsMobile();
  
  const timeSlots = [
    'สถานะการลา/ประชุม', '9:00-9:30', '9:30-10:00', '10:00-10:30', '10:30-11:00',
    '13:00-13:30', '13:30-14:00', '14:00-14:30', '14:30-15:00'
  ];

  const handleAddClick = (dateKey: string, time: string) => {
    console.log('handleAddClick:', { dateKey, time });
    setModalData({ date: dateKey, time });
    setIsAddModalOpen(true);
  };

  const handleEditClick = (appointment: Appointment, dateKey: string, time: string) => {
    setModalData({ 
      appointment,
      date: dateKey,
      time
    });
    setIsEditModalOpen(true);
  };

  const handleRebookClick = (appointment: Appointment) => {
    setModalData({ appointment });
    setIsRebookModalOpen(true);
  };

  const handleCancelClick = (dateKey: string, time: string, index: number) => {
    setCancelTarget({ date: dateKey, time, index });
    setIsCancelModalOpen(true);
  };

  const handleLeaveClick = (dateKey: string) => {
    setModalData({ date: dateKey });
    setIsLeaveModalOpen(true);
  };

  const handleMeetingClick = (dateKey: string) => {
    setModalData({ date: dateKey });
    setIsMeetingModalOpen(true);
  };

  const renderAppointmentCell = (date: Date, time: string) => {
    const dateKey = dateToKey(date);
    const appointments = loadAppointments();
    const dentists = loadDentists();
    const isPast = isPastDate(date);
    const dayOfWeek = date.getDay();
    const isMorningSlot = ["9:00-9:30", "9:30-10:00", "10:00-10:30", "10:30-11:00"].includes(time);
    const isRestrictedMorning = ["9:00-9:30", "9:30-10:00"].includes(time) && dayOfWeek >= 1 && dayOfWeek <= 4;
    
    // ตรวจสอบการลาของหมอในวันนี้
    const leaveData = loadLeaveData();
    const leavingDentists = leaveData[dateKey] || [];
    
    // กำหนดสีปุ่มเพิ่มตามข้อกำหนด
    const addButtonColor = isMorningSlot 
      ? (dayOfWeek === 5 ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600') 
      : 'bg-green-500 hover:bg-green-600';

    return (
      <TableCell className={`p-2 border-b ${isPast ? 'bg-gray-100' : ''} ${isMobile ? 'text-xs' : ''}`}>
        {appointments[dateKey] && appointments[dateKey][time] && appointments[dateKey][time].map((appt, index) => (
          <div 
            key={index}
            className={`appointment mb-2 p-2 rounded-lg shadow-sm flex flex-col space-y-1 ${isPast ? 'opacity-50' : ''}`}
            style={{
              background: dentists[appt.dentist] ? 
                `linear-gradient(135deg, rgba(${hexToRgb(dentists[appt.dentist]).r}, ${hexToRgb(dentists[appt.dentist]).g}, ${hexToRgb(dentists[appt.dentist]).b}, 0.95), rgba(${hexToRgb(dentists[appt.dentist]).r}, ${hexToRgb(dentists[appt.dentist]).g}, ${hexToRgb(dentists[appt.dentist]).b}, 0.85))` : 
                '#f3f4f6',
              color: dentists[appt.dentist] ? 'white' : 'black'
            }}
          >
            <div className={`${isMobile ? 'text-xs' : ''}`}>
              {appt.dentist} - {appt.patient} {!isMobile && `(${appt.phone})`} - {appt.treatment}
            </div>
            
            {appt.patient !== 'ลา' && !isPast && (
              <div className="flex space-x-1">
                <Button 
                  variant="outline"
                  size="sm" 
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs p-1 h-6"
                  onClick={() => handleEditClick(appt, dateKey, time)}
                >
                  แก้ไข
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  className="bg-green-500 hover:bg-green-600 text-white text-xs p-1 h-6"
                  onClick={() => handleRebookClick(appt)}
                >
                  นัดต่อ
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  className="bg-red-500 hover:bg-red-600 text-white text-xs p-1 h-6"
                  onClick={() => handleCancelClick(dateKey, time, index)}
                >
                  ยกเลิก
                </Button>
              </div>
            )}
          </div>
        ))}
        
        {!isRestrictedMorning && !isPast && leavingDentists.length === 0 && (
          <Button 
            variant="outline"
            size="sm"
            className={`${addButtonColor} text-white px-2 py-0.5 text-xs h-6`}
            onClick={() => handleAddClick(dateKey, time)}
          >
            +เพิ่ม
          </Button>
        )}
      </TableCell>
    );
  };

  const renderLeaveCell = (date: Date) => {
    const dateKey = dateToKey(date);
    const leaveData = loadLeaveData();
    const meetingData = loadMeetingData();
    const dentists = loadDentists();
    const isPast = isPastDate(date);

    return (
      <TableCell className={`p-2 border-b ${isPast ? 'bg-gray-100' : ''} ${isMobile ? 'text-xs' : ''}`}>
        {/* แสดงข้อมูลการลา */}
        {leaveData[dateKey] && leaveData[dateKey].map((dentistName, idx) => (
          <div 
            key={`leave-${idx}`}
            className={`appointment mb-2 p-2 rounded-lg shadow-sm ${isPast ? 'opacity-50' : ''}`}
            style={{
              backgroundColor: dentists[dentistName] ? 
                `rgba(${hexToRgb(dentists[dentistName]).r}, ${hexToRgb(dentists[dentistName]).g}, ${hexToRgb(dentists[dentistName]).b}, 0.9)` : 
                '#f3f4f6',
              color: dentists[dentistName] ? 'white' : 'black'
            }}
          >
            {dentistName}-ลา
          </div>
        ))}

        {/* แสดงข้อมูลการประชุม */}
        {meetingData[dateKey] && meetingData[dateKey].map((meeting, idx) => (
          <div 
            key={`meeting-${idx}`}
            className={`appointment mb-2 p-2 rounded-lg shadow-sm ${isPast ? 'opacity-50' : ''}`}
            style={{
              backgroundColor: dentists[meeting.dentist] ? 
                `rgba(${hexToRgb(dentists[meeting.dentist]).r}, ${hexToRgb(dentists[meeting.dentist]).g}, ${hexToRgb(dentists[meeting.dentist]).b}, 0.9)` : 
                '#f3f4f6',
              color: dentists[meeting.dentist] ? 'white' : 'black'
            }}
          >
            {meeting.dentist}-ประชุม ({meeting.period === 'morning' ? 'เช้า' : 'บ่าย'})
          </div>
        ))}

        {!isPast && (
          <div className="flex space-x-1">
            <Button 
              variant="outline"
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 text-xs h-6"
              onClick={() => handleLeaveClick(dateKey)}
            >
              +ลา
            </Button>
            <Button 
              variant="outline"
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-0.5 text-xs h-6"
              onClick={() => handleMeetingClick(dateKey)}
            >
              +ประชุม
            </Button>
          </div>
        )}
      </TableCell>
    );
  };

  return (
    <Table className="w-full" id="appointment-table">
      <TableHeader>
        <TableRow>
          <TableHead className={`p-2 border-b text-left ${isMobile ? 'text-xs' : ''}`}>เวลา</TableHead>
          {[0, 1, 2, 3, 4].map((dayOffset) => {
            const date = new Date(getMonday(currentWeekStart));
            date.setDate(date.getDate() + dayOffset);
            return (
              <TableHead key={dayOffset} className={`p-2 border-b text-left ${isMobile ? 'text-xs' : ''}`}>
                {['จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์'][dayOffset]} {formatDate(date)}
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {timeSlots.map((time, rowIndex) => (
          <TableRow key={rowIndex}>
            <TableCell className={`p-2 border-b font-medium text-gray-700 ${isMobile ? 'text-xs' : ''}`}>
              {time}
            </TableCell>
            {[0, 1, 2, 3, 4].map((dayOffset) => {
              const date = new Date(getMonday(currentWeekStart));
              date.setDate(date.getDate() + dayOffset);
              
              if (rowIndex === 0) {
                return <React.Fragment key={dayOffset}>{renderLeaveCell(date)}</React.Fragment>;
              } else {
                return <React.Fragment key={dayOffset}>{renderAppointmentCell(date, time)}</React.Fragment>;
              }
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ScheduleWeeklyTable;
