
// ฟังก์ชันสำหรับการจัดการวันที่

// หาวันจันทร์ของสัปดาห์
export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

// หาวันจันทร์ของสัปดาห์หน้า (สำหรับกรณีวันนี้เป็นเสาร์หรืออาทิตย์)
export function getNextMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  
  // ถ้าเป็นเสาร์หรืออาทิตย์ ให้หาวันจันทร์ถัดไป
  if (day === 0) { // อาทิตย์
    const diff = d.getDate() + 1;
    return new Date(d.setDate(diff));
  } else if (day === 6) { // เสาร์
    const diff = d.getDate() + 2;
    return new Date(d.setDate(diff));
  } else {
    // ถ้าเป็นวันธรรมดา ให้หาวันจันทร์ของสัปดาห์หน้า
    const diff = d.getDate() - day + 8;
    return new Date(d.setDate(diff));
  }
}

// จัดรูปแบบวันที่เป็นข้อความ
export function formatDate(date: Date): string {
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

// แปลงวันที่เป็น key format YYYY-MM-DD
export function dateToKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ตรวจสอบว่าเป็นวันที่ในอดีตหรือไม่
export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate < today;
}

// ตรวจสอบว่าเป็นวันหยุดสุดสัปดาห์หรือไม่
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = อาทิตย์, 6 = เสาร์
}

// แปลง hex color เป็น RGB
export function hexToRgb(hex: string): { r: number, g: number, b: number } {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}
