
// ฟังก์ชันสำหรับการจัดการวันที่

// หาวันจันทร์ของสัปดาห์
export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
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

// แปลง hex color เป็น RGB
export function hexToRgb(hex: string): { r: number, g: number, b: number } {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}
