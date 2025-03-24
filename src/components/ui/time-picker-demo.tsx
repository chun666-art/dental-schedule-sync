
import * as React from "react";
import { Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TimePickerDemoProps {
  date?: Date;
  setDate: (date: Date) => void;
}

export function TimePickerDemo({
  date = new Date(),
  setDate,
}: TimePickerDemoProps) {
  const minuteRef = React.useRef<HTMLInputElement>(null);
  const hourRef = React.useRef<HTMLInputElement>(null);
  const [hour, setHour] = React.useState<number>(date ? date.getHours() : 0);
  const [minute, setMinute] = React.useState<number>(date ? date.getMinutes() : 0);

  // update the date when the hour or minute changes
  React.useEffect(() => {
    const newDate = new Date(date);
    newDate.setHours(hour);
    newDate.setMinutes(minute);
    setDate(newDate);
  }, [hour, minute, setDate, date]);

  const handleHourChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (Number.isNaN(value)) {
      setHour(0);
      return;
    }
    if (value > 23) {
      setHour(23);
      return;
    }
    if (value < 0) {
      setHour(0);
      return;
    }
    setHour(value);
    if (value > 9) {
      minuteRef.current?.focus();
    }
  };

  const handleMinuteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (Number.isNaN(value)) {
      setMinute(0);
      return;
    }
    if (value > 59) {
      setMinute(59);
      return;
    }
    if (value < 0) {
      setMinute(0);
      return;
    }
    setMinute(value);
  };

  const formatNumber = (value: number) => {
    return value.toString().padStart(2, "0");
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center border border-input rounded-md focus-within:ring-1 focus-within:ring-ring">
        <div className="px-2 py-1">
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
        <Input
          ref={hourRef}
          className="w-10 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          value={formatNumber(hour)}
          onChange={handleHourChange}
          type="text"
          inputMode="numeric"
        />
        <div className="text-center">:</div>
        <Input
          ref={minuteRef}
          className="w-10 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          value={formatNumber(minute)}
          onChange={handleMinuteChange}
          type="text"
          inputMode="numeric"
        />
      </div>
    </div>
  );
}
