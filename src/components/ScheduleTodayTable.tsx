
import React from 'react';
import { Button } from '@/components/ui/button';
import { loadAppointments, loadLeaveData, loadMeetingData, loadDentists } from '@/lib/data-utils';
import { dateToKey, isPastDate, hexToRgb } from '@/lib/date-utils';
import { Appointment } from '@/types/appointment';

interface ScheduleTodayTableProps {
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
  setIsAddModalOpen,
  setIsEditModalOpen,
  setIsRebookModalOpen,
  setIsCancelModalOpen,
  setIsLeaveModalOpen,
  setIsMeetingModalOpen,
  setModalData,
  setCancelTarget
}) => {
  const today = new Date();
  const dateKey = dateToKey(today);
  const isPast = isPastDate(today);
  const dayOfWeek = today.getDay();
  const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'];
  
  const timeSlots = [
    'สถานะการลา/ประชุม', '9:00-9:30', '9:30-10:00', '10:00-10:30', '10:30-11:00',
    '13:00-13:30', '13:30-14:00', '14:00-14:30', '14:30-15:00'
  ];

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

  const renderAppointmentCell = (time: string) => {
    const appointments = loadAppointments();
    const dentists = loadDentists();
    const isMorningSlot = ["9:00-9:30", "9:30-10:00", "10:00-10:30", "10:30-11:00"].includes(time);
    const isRestrictedMorning = ["9:00-9:30", "9:30-10:00"].includes(time) && dayOfWeek >= 1 && dayOfWeek <= 4;

    return (
      <td className={`p-3 border-b ${isPast ? 'bg-gray-100' : ''}`}>
        {appointments[dateKey] && appointments[dateKey][time] && appointments[dateKey][time].map((appt, index) => (
          <div 
            key={index}
            className={`appointment mb-2 p-3 rounded-lg shadow-sm flex justify-between items-center ${isPast ? 'opacity-50' : ''}`}
            style={{
              background: dentists[appt.dentist] ? 
                `linear-gradient(135deg, rgba(${hexToRgb(dentists[appt.dentist]).r}, ${hexToRgb(dentists[appt.dentist]).g}, ${hexToRgb(dentists[appt.dentist]).b}, 0.95), rgba(${hexToRgb(dentists[appt.dentist]).r}, ${hexToRgb(dentists[appt.dentist]).g}, ${hexToRgb(dentists[appt.dentist]).b}, 0.85))` : 
                '#f3f4f6',
              color: dentists[appt.dentist] ? 'white' : 'black'
            }}
          >
            <div>
              {appt.dentist} - {appt.patient} ({appt.phone}) - {appt.treatment} ({appt.status})
            </div>
            
            {appt.patient !== 'ลา' && !isPast && (
              <div className="flex space-x-1">
                <Button 
                  variant="outline"
                  size="sm" 
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs p-1"
                  onClick={() => handleEditClick(appt, time)}
                >
                  แก้ไข
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  className="bg-green-500 hover:bg-green-600 text-white text-xs p-1"
                  onClick={() => handleRebookClick(appt)}
                >
                  นัดต่อ
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  className="bg-red-500 hover:bg-red-600 text-white text-xs p-1"
                  onClick={() => handleCancelClick(time, index)}
                >
                  ยกเลิก
                </Button>
              </div>
            )}
          </div>
        ))}
        
        {!isRestrictedMorning && !isPast && (
          <Button 
            variant="outline"
            size="sm"
            className={isMorningSlot 
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 text-xs' 
              : 'bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-xs'
            }
            onClick={() => handleAddClick(time)}
          >
            +เพิ่ม
          </Button>
        )}
      </td>
    );
  };

  const renderLeaveCell = () => {
    const leaveData = loadLeaveData();
    const meetingData = loadMeetingData();
    const dentists = loadDentists();

    return (
      <td className={`p-3 border-b ${isPast ? 'bg-gray-100' : ''}`}>
        {/* แสดงข้อมูลการลา */}
        {leaveData[dateKey] && leaveData[dateKey].map((dentistName, idx) => (
          <div 
            key={`leave-${idx}`}
            className={`appointment mb-2 p-3 rounded-lg shadow-sm ${isPast ? 'opacity-50' : ''}`}
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
            className={`appointment mb-2 p-3 rounded-lg shadow-sm ${isPast ? 'opacity-50' : ''}`}
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
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs"
              onClick={handleLeaveClick}
            >
              +ลา
            </Button>
            <Button 
              variant="outline"
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs"
              onClick={handleMeetingClick}
            >
              +ประชุม
            </Button>
          </div>
        )}
      </td>
    );
  };

  return (
    <table className="w-full" id="today-appointment-table">
      <thead>
        <tr>
          <th className="p-3 border-b text-left">เวลา</th>
          <th className="p-3 border-b text-left">{dayNames[dayOfWeek]} {new Date().toLocaleDateString('th-TH')}</th>
        </tr>
      </thead>
      <tbody>
        {timeSlots.map((time, rowIndex) => (
          <tr key={rowIndex}>
            <td className="p-3 border-b font-medium text-gray-700">{time}</td>
            {rowIndex === 0 ? renderLeaveCell() : renderAppointmentCell(time)}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ScheduleTodayTable;
