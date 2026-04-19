// Shared data for 体感温度アプリ
// All values are synthetic / illustrative for a Tokyo-ish summer day.

window.APP_DATA = {
  now: {
    timeLabel: '2026年4月18日(土) 14:20',
    location: '東京・渋谷',
    airTemp: 24.8,          // 気温 °C
    feelsLikeSun: 31.2,     // 日向での体感
    feelsLikeShade: 25.6,   // 日陰での体感
    humidity: 58,           // %
    windMS: 2.3,            // m/s
    windDir: '南南西',
    uv: 7,
    solar: 780,             // W/m² 日射量
    pressure: 1012,
    sunrise: '05:02',
    sunset: '18:14',
  },

  // 1時間ごとの予報 (気温 / 日向体感 / 日陰体感 / 湿度 / 風速 / 日射)
  hourly: [
    { h: 6,  air: 15.2, sun: 16.0, shade: 15.0, hum: 78, wind: 1.1, solar: 40,  precipProb: 5,  precipMm: 0 },
    { h: 7,  air: 17.0, sun: 19.1, shade: 17.2, hum: 72, wind: 1.4, solar: 180, precipProb: 0,  precipMm: 0 },
    { h: 8,  air: 18.9, sun: 22.4, shade: 19.2, hum: 68, wind: 1.8, solar: 340, precipProb: 0,  precipMm: 0 },
    { h: 9,  air: 20.4, sun: 25.3, shade: 21.1, hum: 64, wind: 2.0, solar: 500, precipProb: 0,  precipMm: 0 },
    { h: 10, air: 21.8, sun: 27.4, shade: 22.4, hum: 62, wind: 2.1, solar: 620, precipProb: 0,  precipMm: 0 },
    { h: 11, air: 23.0, sun: 29.1, shade: 23.7, hum: 60, wind: 2.2, solar: 710, precipProb: 0,  precipMm: 0 },
    { h: 12, air: 24.0, sun: 30.2, shade: 24.8, hum: 59, wind: 2.3, solar: 760, precipProb: 0,  precipMm: 0 },
    { h: 13, air: 24.6, sun: 30.9, shade: 25.4, hum: 58, wind: 2.3, solar: 780, precipProb: 0,  precipMm: 0 },
    { h: 14, air: 24.8, sun: 31.2, shade: 25.6, hum: 58, wind: 2.3, solar: 780, precipProb: 10, precipMm: 0 },
    { h: 15, air: 24.5, sun: 30.6, shade: 25.2, hum: 59, wind: 2.4, solar: 700, precipProb: 25, precipMm: 0.1 },
    { h: 16, air: 23.6, sun: 28.9, shade: 24.2, hum: 61, wind: 2.4, solar: 550, precipProb: 45, precipMm: 0.3 },
    { h: 17, air: 22.1, sun: 25.8, shade: 22.6, hum: 64, wind: 2.2, solar: 350, precipProb: 55, precipMm: 0.8 },
    { h: 18, air: 20.3, sun: 21.6, shade: 20.5, hum: 68, wind: 2.0, solar: 120, precipProb: 40, precipMm: 0.4 },
    { h: 19, air: 18.8, sun: 19.0, shade: 18.8, hum: 71, wind: 1.8, solar: 10,  precipProb: 20, precipMm: 0.1 },
    { h: 20, air: 17.6, sun: 17.6, shade: 17.6, hum: 74, wind: 1.6, solar: 0,   precipProb: 10, precipMm: 0 },
    { h: 21, air: 16.9, sun: 16.9, shade: 16.9, hum: 76, wind: 1.4, solar: 0,   precipProb: 5,  precipMm: 0 },
  ],

  // 週間予報
  weekly: [
    { day: '土', date: '4/18', air: 24.8, sun: 31.2, shade: 25.6, min: 15.2, max: 25.0, cond: 'sun',   note: '晴れ・日差し強め' },
    { day: '日', date: '4/19', air: 22.4, sun: 28.1, shade: 23.0, min: 14.8, max: 22.9, cond: 'partly',note: '晴れ時々曇り' },
    { day: '月', date: '4/20', air: 19.2, sun: 21.0, shade: 19.5, min: 13.0, max: 20.1, cond: 'cloud', note: '曇り' },
    { day: '火', date: '4/21', air: 16.8, sun: 17.2, shade: 16.6, min: 11.4, max: 17.8, cond: 'rain',  note: '雨・肌寒い' },
    { day: '水', date: '4/22', air: 18.4, sun: 19.6, shade: 18.2, min: 12.2, max: 19.0, cond: 'rain',  note: '雨のち曇り' },
    { day: '木', date: '4/23', air: 21.5, sun: 26.4, shade: 22.1, min: 13.6, max: 22.2, cond: 'partly',note: '晴れ間あり' },
    { day: '金', date: '4/24', air: 24.0, sun: 30.2, shade: 24.8, min: 15.0, max: 24.6, cond: 'sun',   note: '初夏の陽気' },
  ],

  // 地域比較
  regions: [
    { name: '札幌',    lat: 43.06, lon: 141.35, air: 11.2, feels: 9.8,  delta: -1.4, x: 74, y: 14 },
    { name: '仙台',    lat: 38.27, lon: 140.87, air: 17.8, feels: 18.4, delta:  0.6, x: 72, y: 34 },
    { name: '東京',    lat: 35.68, lon: 139.69, air: 24.8, feels: 31.2, delta:  6.4, x: 68, y: 48, active: true },
    { name: '名古屋',  lat: 35.18, lon: 136.91, air: 25.1, feels: 30.4, delta:  5.3, x: 58, y: 52 },
    { name: '大阪',    lat: 34.69, lon: 135.50, air: 25.6, feels: 30.9, delta:  5.3, x: 50, y: 56 },
    { name: '広島',    lat: 34.39, lon: 132.46, air: 24.4, feels: 28.6, delta:  4.2, x: 38, y: 60 },
    { name: '福岡',    lat: 33.59, lon: 130.40, air: 25.8, feels: 31.8, delta:  6.0, x: 28, y: 68 },
    { name: '那覇',    lat: 26.21, lon: 127.68, air: 27.4, feels: 33.1, delta:  5.7, x: 10, y: 88 },
  ],

  // 服装提案 (current context: 24.8°C 日向31°C)
  outfit: {
    headline: '半袖 + 薄手の羽織り',
    subline: '日向は夏日、日陰・屋内は春の陽気',
    items: [
      { part: 'トップス', pick: '半袖 Tシャツ',       alt: '綿ブロードシャツ',  note: '通気性重視' },
      { part: '羽織り',   pick: '薄手カーディガン',   alt: 'リネンシャツ',       note: '室内・夕方用' },
      { part: 'ボトムス', pick: 'テーパードパンツ',   alt: 'ロングスカート',     note: '足首を出すと涼しい' },
      { part: '足元',     pick: 'スニーカー / ローファー', alt: 'スリッポン',     note: '通気の良い素材' },
      { part: '小物',     pick: 'キャップ・サングラス', alt: '日傘',              note: 'UV 7(強い)' },
    ],
  },

  // 服の色による日射吸収率(アルベドから計算)
  // absorb: 日射吸収率 (0=完全反射, 1=完全吸収)
  clothingColors: [
    { name: '白',     hex: '#f2f0ea', textOn: '#1a1a1a', absorb: 0.20, deltaC: 0.0, surface: 31 },
    { name: 'ベージュ', hex: '#d9c9ab', textOn: '#1a1a1a', absorb: 0.35, deltaC: 1.2, surface: 35 },
    { name: 'グレー', hex: '#8a8a8a', textOn: '#ffffff', absorb: 0.55, deltaC: 2.8, surface: 41 },
    { name: 'ネイビー', hex: '#2c3244', textOn: '#ffffff', absorb: 0.75, deltaC: 4.4, surface: 47 },
    { name: '赤',     hex: '#8a2a2a', textOn: '#ffffff', absorb: 0.78, deltaC: 4.6, surface: 48 },
    { name: '黒',     hex: '#161616', textOn: '#ffffff', absorb: 0.90, deltaC: 5.6, surface: 52 },
  ],

  // 素材ごとの通気性係数(大きいほど熱がこもりにくい → 色差を小さくする)
  materials: [
    { id: 'linen',  name: 'リネン',   vent: 0.55 },
    { id: 'cotton', name: '綿',        vent: 0.70 },
    { id: 'poly',   name: 'ポリ',      vent: 1.00 },
    { id: 'denim',  name: 'デニム',   vent: 1.15 },
  ],
};
