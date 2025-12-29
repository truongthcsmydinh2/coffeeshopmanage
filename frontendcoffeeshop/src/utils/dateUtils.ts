/**
 * Lấy ngày hiện tại theo múi giờ Việt Nam (UTC+7) dạng YYYY-MM-DD
 */
export function getTodayVietnam(): string {
  const now = new Date();
  
  // Lấy thời gian theo múi giờ Việt Nam (UTC+7)
  // Sử dụng Intl.DateTimeFormat để format theo timezone Asia/Ho_Chi_Minh
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  
  return `${year}-${month}-${day}`;
}

