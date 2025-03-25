
import React from 'react';
import { Button } from '@/components/ui/button';
import { loadAppointments, loadLeaveData, loadMeetingData, loadDentists } from '@/lib/data-utils';
import { dateToKey, isPastDate, hexToRgb, isWeekend, getNextMonday } from '@/lib/date-utils';
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

interface ScheduleTodayTableProps {
  currentDate?: Date;
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

const ScheduleTodayTable: React.FC<ScheduleTodayTableProps> = ({
  currentDate,
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
  
  // ตรวจสอบวันสุดสัปดาห์และปรับเป็นวันจันทร์ถัดไป
  const today = currentDate || new Date();
  const displayDate = isWeekend(today) ? getNextMonday(today) : today;
  const dateKey = dateToKey(displayDate);
  const isPast = isPastDate(displayDate);
  const dayOfWeek = displayDate.getDay();
  const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'];
  
  const timeSlots = [
    'สถานะการลา/ประชุม', '9:00-9:30', '9:30-10:00', '10:00-10:30', '10:30-11:00',
    '13:00-13:30', '13:30-14:00', '14:00-14:30', '14:30-15:00'
  ];

  // ตรวจสอบการลาของหมอในวันที่แสดง
  const leaveData = loadLeaveData();
  const leavingDentists = leaveData[dateKey] || [];

  const handleAddClick = (time: string) => {
    console.log('handleAddClick in today view:', { date: dateKey, time });
    setModalData({ date: dateKey, time });
    setIsAddModalOpen(true);
  };

  const handleEditClick = (appointment: Appointment, time: string) => {
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

  const handleCancelClick = (time: string, index: number) => {
    setCancelTarget({ date: dateKey, time, index });
    setIsCancelModalOpen(true);
  };

  const handleLeaveClick = () => {
    setModalData({ date: dateKey });
    setIsLeaveModalOpen(true);
  };

  const handleMeetingClick = () => {
    setModalData({ date: dateKey });
    setIsMeetingModalOpen(true);
  };

  // สร้าง component แสดงสถานะการนัด
  const StatusBadge = ({ status }: { status: "รอการยืนยันนัด" | "ยืนยันนัด" | "นัดถูกยกเลิก" }) => {
    let color = "";
    switch (status) {
      case "รอการยืนยันนัด":
        color = "border-yellow-400 text-yellow-500";
        break;
      case "ยืนยันนัด":
        color = "border-green-400 text-green-500";
        break;
      case "นัดถูกยกเลิก":
        color = "border-red-400 text-red-500";
        break;
    }
    
    return (
      <div className={`bg-white border rounded px-1 py-0.5 text-xs font-medium ${color}`}>
        {status}
      </div>
    );
  };

  const renderAppointmentCell = (time: string) => {
    const appointments = loadAppointments();
    const dentists = loadDentists();
    const isMorningSlot = ["9:00-9:30", "9:30-10:00", "10:00-10:30", "10:30-11:00"].includes(time);
    const isRestrictedMorning = ["9:00-9:30", "9:30-10:00"].includes(time) && dayOfWeek >= 1 && dayOfWeek <= 4;
    
    // กำหนดสีปุ่มเพิ่มตามข้อกำหนด
    const addButtonColor = isMorningSlot 
      ? (dayOfWeek === 5 ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600') 
      : 'bg-green-500 hover:bg-green-600';

    return (
      <TableCell className={`p-2 border-b ${isPast ? 'bg-gray-100' : ''} ${isMobile ? 'text-xs' : ''}`}>
        {appointments[dateKey] && appointments[dateKey][time] && appointments[dateKey][time].map((appt, index) => (
          <div 
            key={index}
            className={`appointment mb-2 p-2 rounded-lg shadow-sm ${isPast ? 'opacity-50' : ''}`}
            style={{
              background: dentists[appt.dentist] ? 
                `linear-gradient(135deg, rgba(${hexToRgb(dentists[appt.dentist]).r}, ${hexToRgb(dentists[appt.dentist]).g}, ${hexToRgb(dentists[appt.dentist]).b}, 0.95), rgba(${hexToRgb(dentists[appt.dentist]).r}, ${hexToRgb(dentists[appt.dentist]).g}, ${hexToRgb(dentists[appt.dentist]).b}, 0.85))` : 
                '#f3f4f6',
              color: dentists[appt.dentist] ? 'white' : 'black'
            }}
          >
            <div className="flex flex-col space-y-1">
              <div className={`${isMobile ? 'text-xs' : ''}`}>
                {appt.dentist} - {appt.patient} {!isMobile && `(${appt.phone})`} - {appt.treatment}
              </div>
              
              <div className="flex items-center justify-between">
                <StatusBadge status={appt.status} />
                
                {appt.patient !== 'ลา' && !isPast && (
                  <div className="flex space-x-1">
                    <Button 
                      variant="outline"
                      size="sm" 
                      className="bg-blue-500 hover:bg-blue-600 text-white text-xs p-1 h-6"
                      onClick={() => handleEditClick(appt, time)}
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
                      onClick={() => handleCancelClick(time, index)}
                    >
                      ยกเลิก
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {!isRestrictedMorning && !isPast && (
          <Button 
            variant="outline"
            size="sm"
            className={`${addButtonColor} text-white px-2 py-0.5 text-xs h-6`}
            onClick={() => handleAddClick(time)}
          >
            +เพิ่ม
          </Button>
        )}
      </TableCell>
    );
  };

  const renderLeaveCell = () => {
    const leaveData = loadLeaveData();
    const meetingData = loadMeetingData();
    const dentists = loadDentists();

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
              onClick={handleLeaveClick}
            >
              +ลา
            </Button>
            <Button 
              variant="outline"
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-0.5 text-xs h-6"
              onClick={handleMeetingClick}
            >
              +ประชุม
            </Button>
          </div>
        )}
      </TableCell>
    );
  };

  return (
    <Table className="w-full" id="today-appointment-table">
      <TableHeader>
        <TableRow>
          <TableHead className={`p-2 border-b text-left ${isMobile ? 'text-xs' : ''}`}>เวลา</TableHead>
          <TableHead className={`p-2 border-b text-left ${isMobile ? 'text-xs' : ''}`}>
            {dayNames[displayDate.getDay()]} {displayDate.toLocaleDateString('th-TH')}
            {isWeekend(today) && <span className="ml-1 text-red-500 text-xs">(แสดงวันทำการถัดไป)</span>}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {timeSlots.map((time, rowIndex) => (
          <TableRow key={rowIndex}>
            <TableCell className={`p-2 border-b font-medium text-gray-700 ${isMobile ? 'text-xs' : ''}`}>
              {time}
            </TableCell>
            {rowIndex === 0 ? renderLeaveCell() : renderAppointmentCell(time)}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ScheduleTodayTable;
