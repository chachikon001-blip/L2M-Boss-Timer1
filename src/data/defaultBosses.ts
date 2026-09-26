import { Boss } from '../types';

interface RawBossDef {
  num: number;
  thaiName: string;
  engName: string;
  cooldownHours: number;
  location?: string;
}

export const BASE_BOSS_DEFINITIONS: RawBossDef[] = [
  { num: 22, thaiName: "บาซิลา", engName: "Basila", cooldownHours: 2.5, location: "เกาะรกร้าง" },
  { num: 24, thaiName: "เชอร์ทูบา", engName: "Chertuba", cooldownHours: 3, location: "ที่มั่นเชอร์ทูบา" },
  { num: 4, thaiName: "สตัน", engName: "Stun", cooldownHours: 4, location: "หุบผาชัน" },
  { num: 1, thaiName: "เฟลิส", engName: "Felis", cooldownHours: 2, location: "ทุ่งหญ้าเฟลิส" },
  { num: 19, thaiName: "เอนคูรา", engName: "Enkura", cooldownHours: 3.5, location: "ดินแดนเดียราน" },
  { num: 29, thaiName: "บัลโบ", engName: "BalBo", cooldownHours: 8, location: "รังบัลโบ" },
  { num: 7, thaiName: "ครูม่าหนองน้ำ", engName: "Mutated Cruma", cooldownHours: 8, location: "หนองน้ำครูม่า" },
  { num: 11, thaiName: "มด 3", engName: "Ant3", cooldownHours: 6, location: "รังมด ชั้น 3" },
  { num: 30, thaiName: "ทิมิเนล", engName: "Timiniel", cooldownHours: 8, location: "ป่าทิมิเนล" },
  { num: 37, thaiName: "กลากิ", engName: "Glaki", cooldownHours: 8, location: "หุบเขากลากิ" },
  { num: 26, thaiName: "ดราก้อนบีสต์", engName: "DB", cooldownHours: 12, location: "หุบเขามังกรฝั่งตะวันออก" },
  { num: 43, thaiName: "โอล์คุส", engName: "Olkuth", cooldownHours: 24, location: "วิหารแห่งความตาย" },
  { num: 31, thaiName: "ออร์เฟน", engName: "Orfen", cooldownHours: 24, location: "ดินแดนสปอร์แห่งออร์เฟน" },
  { num: 44, thaiName: "ทานาทอส", engName: "Tanatos", cooldownHours: 24, location: "หุบผาชันทานาทอส" },
  { num: 3, thaiName: "คอร์ซัสเซปเตอร์", engName: "Core", cooldownHours: 12, location: "หอคอยครูม่า ชั้น 7" },
  { num: 15, thaiName: "ครูม่าปนเปื้อน", engName: "Cruma4", cooldownHours: 8, location: "หอคอยครูม่า ชั้น 4" },
  { num: 9, thaiName: "คาทาน", engName: "Katan", cooldownHours: 8, location: "ทางเข้าคาทาน" },
  { num: 21, thaiName: "เมดูซ่า", engName: "Medusa", cooldownHours: 7, location: "สวนเมดูซ่า" },
  { num: 14, thaiName: "ซาร์ก้า", engName: "Sarka", cooldownHours: 7, location: "เนินเขาซาร์ก้า" },
  { num: 13, thaiName: "ทาลาคิน", engName: "Talakin", cooldownHours: 7, location: "ผาหินทาลาคิน" },
  { num: 23, thaiName: "พันนาโรด", engName: "Pannarod", cooldownHours: 3, location: "ป่าแห่งความเงียบ" },
  { num: 27, thaiName: "ทัลคิน", engName: "Talkin", cooldownHours: 5, location: "อ่าวทัลคิน" },
  { num: 28, thaiName: "เซลลู", engName: "Selu", cooldownHours: 7.5, location: "ทุ่งราบเซลลู" },
  { num: 32, thaiName: "เรปิโร", engName: "Repiro", cooldownHours: 5, location: "ป่าเรปิโร" },
  { num: 2, thaiName: "ทิมิทริส", engName: "Timitris", cooldownHours: 5, location: "ซากปรักหักพังทิมิทริส" },
  { num: 17, thaiName: "เบรก้า", engName: "Breka", cooldownHours: 4, location: "ฐานที่มั่นเบรก้า" },
  { num: 16, thaiName: "มาทูรา", engName: "Matura", cooldownHours: 4, location: "ทางลาดมาทูรา" },
  { num: 33, thaiName: "โครูน", engName: "Coroon", cooldownHours: 10, location: "หุบเขาโครูน" },
  { num: 12, thaiName: "พัน ดรายด์", engName: "Pan'Dra'eed", cooldownHours: 8, location: "ป่าพัน ดรายด์" },
  { num: 5, thaiName: "ซาบัน", engName: "Savan", cooldownHours: 12, location: "ถ้ำมังกรซาบัน" },
  { num: 8, thaiName: "เบฮีมอธ", engName: "Behemoth", cooldownHours: 6, location: "เหมืองเบฮีมอธ" },
  { num: 20, thaiName: "เคลซอส", engName: "Kelsus", cooldownHours: 6, location: "ด่านหน้าเคลซอส" },
  { num: 6, thaiName: "แกเร็ธ", engName: "Gahareth", cooldownHours: 6, location: "หุบเขาแกเร็ธ" },
  { num: 34, thaiName: "ฮิซิโลเม", engName: "Hisilrome", cooldownHours: 6, location: "ป่าฮิซิโลเม" },
  { num: 40, thaiName: "ฟลินท์", engName: "Flynt", cooldownHours: 8, location: "หอคอยฟลินท์" },
  { num: 36, thaiName: "แลนเดอร์", engName: "Landor", cooldownHours: 8, location: "ทุ่งแลนเดอร์" },
  { num: 10, thaiName: "ลิลลี่", engName: "Lily", cooldownHours: 12, location: "สวนลิลลี่" },
  { num: 35, thaiName: "กระจก", engName: "Mirror", cooldownHours: 12, location: "วิหารกระจก" },
  { num: 39, thaiName: "คาบริโอ", engName: "Cabrio", cooldownHours: 12, location: "สุสานคาบริโอ" },
  { num: 42, thaiName: "แอนดราส", engName: "Andras", cooldownHours: 12, location: "ลานประหารแอนดราส" },
  { num: 38, thaiName: "ซามูเอล", engName: "Samuel", cooldownHours: 12, location: "วิหารซามูเอล" },
  { num: 45, thaiName: "ลาฮา", engName: "Rahha", cooldownHours: 33, location: "แท่นบูชาลาฮา" },
  { num: 25, thaiName: "เทมเพสต์", engName: "Valefar", cooldownHours: 3.5, location: "ทุ่งสังหารเทมเพสต์" },
  { num: 41, thaiName: "ฮาร์ป", engName: "Haff", cooldownHours: 24, location: "ยอดเขาฮาร์ป" },
  { num: 18, thaiName: "ทรอมบา", engName: "Tromba", cooldownHours: 4.5, location: "ผาหินทรอมบา" },
  { num: 46, thaiName: "มัลลุค", engName: "Maluk (Event)", cooldownHours: 7, location: "หุบเขาเงา" },
  { num: 47, thaiName: "DB", engName: "Orfen (Invasion)", cooldownHours: 10, location: "ดินแดนแห่งเงา" },
];

export function createInitialBosses(): Boss[] {
  const mainBosses: Boss[] = BASE_BOSS_DEFINITIONS.map((def, idx) => ({
    id: `main-${def.num}`,
    num: def.num,
    name: `${def.thaiName} - ${def.engName}`,
    thaiName: def.thaiName,
    engName: def.engName,
    cooldownHours: def.cooldownHours,
    lastKilledAt: null,
    respawnAt: null,
    pinned: idx < 4,
    lastAlertCycleRespawnAt: null,
    notifiedStages: {},
    server: 'main',
    serverTag: 'เซิร์ฟหลัก',
    location: def.location,
  }));

  const invasionBosses: Boss[] = BASE_BOSS_DEFINITIONS.map((def, idx) => ({
    id: `invasion-${def.num}`,
    num: def.num,
    name: `${def.thaiName} - ${def.engName}`,
    thaiName: def.thaiName,
    engName: def.engName,
    cooldownHours: def.cooldownHours,
    lastKilledAt: null,
    respawnAt: null,
    pinned: idx < 4,
    lastAlertCycleRespawnAt: null,
    notifiedStages: {},
    server: 'invasion',
    serverTag: 'เซิร์ฟ Invasion',
    location: def.location,
  }));

  return [...mainBosses, ...invasionBosses];
}

export const INITIAL_BOSSES: Boss[] = createInitialBosses();
