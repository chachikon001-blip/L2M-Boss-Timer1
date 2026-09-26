import { GuildActivity } from '../types';

export const DEFAULT_ACTIVITIES: GuildActivity[] = [
  {
    id: 'act-invasion',
    title: 'เซิร์ฟเวอร์รุกราน (Invasion Dungeon)',
    dayType: 'mwf',
    dayLabel: 'จันทร์, พุธ, ศุกร์',
    time: '08:00 - 00:00',
    location: 'เซิร์ฟเวอร์ Invasion',
    description: 'ดันเจี้ยนเปิดให้ล่าบอส Invasion พิเศษ บอสเกิดตามรอบ',
    enabled: true,
  },
  {
    id: 'act-clan-raid',
    title: 'รวมพลกิลด์เรด (Clan Raid)',
    dayType: 'all',
    dayLabel: 'ทุกๆวัน',
    time: '20:30 - 21:00',
    location: 'ห้องโถงแคลน',
    description: 'เปิดดันเจี้ยนกิลด์ระดับสูง ล่าบอสรับเหรียญเกียรติยศ',
    enabled: true,
  },
  {
    id: 'act-siege-war',
    title: 'ศึกตีปราสาท (Castle Siege)',
    dayType: 'sun',
    dayLabel: 'ทุกวันอาทิตย์',
    time: '20:00 - 21:00',
    location: 'ปราสาทดีออน / กีรัน',
    description: 'สงครามชิงปราสาท รวมสมาชิกทั้งกิลด์เข้าสมรภูมิ',
    enabled: true,
  },
  {
    id: 'act-world-boss',
    title: 'รวมพลล่าเวิลด์ดันเจี้ยน',
    dayType: 'sat',
    dayLabel: 'ทุกวันเสาร์',
    time: '21:00 - 22:30',
    location: 'เวิลด์ดันเจี้ยนข้ามเซิร์ฟ',
    description: 'ล่าบอสเวิลด์ข้ามเซิร์ฟเวอร์ รับไอเทมระดับตำนาน',
    enabled: true,
  },
];
