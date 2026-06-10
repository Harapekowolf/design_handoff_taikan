// Tests for the dog-walk ground model. No framework — run with:
//   node tests/walk-model.test.js
// Asphalt anchors come from published field measurements (see walk-model.js).

require('../walk-model.js');
const { asphaltTemp, pawCategory, walkWindows } = globalThis;

let failed = 0;
function check(name, cond, detail) {
  if (cond) { console.log('  ok    ' + name); }
  else { failed++; console.error('  FAIL  ' + name + (detail ? '  → ' + detail : '')); }
}
function inRange(name, v, lo, hi) {
  check(name, v >= lo && v <= hi, `${v.toFixed(1)}°C not in ${lo}–${hi}°C`);
}

console.log('asphaltTemp — typical urban asphalt anchors (air, solar, wind, rh)');
// Anchors target *aged* urban asphalt (what pet owners actually walk on),
// not freshly-laid black asphalt that JAF tests measure. All assume clear
// sky unless noted.
inRange('真夏正午 (urban)',  asphaltTemp(35.5, 950, 1.0, 55), 52, 60);
inRange('5月晴天正午',       asphaltTemp(26,   800, 2.0, 60), 38, 45);
inRange('夏30°C晴天',        asphaltTemp(30,   900, 2.0, 55), 45, 52);
inRange('曇天',              asphaltTemp(25,   150, 2.0, 70), 26, 30);
inRange('梅雨晴れ間',         asphaltTemp(26,   600, 2.0, 80), 33, 38);
// Live snapshot anchor: Amagasaki June clear-ish day. With the old
// soil-anchored model this scene reported ~48°C — clearly too high for
// early-summer humid conditions on aged urban asphalt.
inRange('Amagasaki 6月正午 (live)', asphaltTemp(27, 750, 3.0, 75), 37, 42);
check('夜間 solar=0 で気温と一致', asphaltTemp(18, 0, 2, 60) === 18);
check('風が強いほど低温',
  asphaltTemp(30, 800, 6, 55) < asphaltTemp(30, 800, 2, 55) &&
  asphaltTemp(30, 800, 2, 55) < asphaltTemp(30, 800, 0, 55));
check('湿度が高いほど低温',
  asphaltTemp(28, 800, 2, 85) < asphaltTemp(28, 800, 2, 60));
check('rh<=50 では湿度補正なし',
  Math.abs(asphaltTemp(28, 800, 2, 40) - asphaltTemp(28, 800, 2, 50)) < 1e-9);
check('wind/rh未指定でもNaNにならない', !isNaN(asphaltTemp(25, 500)));

console.log('pawCategory — boundaries (0 / 5 / 40 / 50)');
check('-3°C → freeze', pawCategory(-3).level === 'freeze');
check(' 0°C → freeze (境界含む)', pawCategory(0).level === 'freeze');
check(' 0.1°C → chill', pawCategory(0.1).level === 'chill');
check(' 4.9°C → chill', pawCategory(4.9).level === 'chill');
check(' 5°C → safe', pawCategory(5).level === 'safe');
check('39.9°C → safe', pawCategory(39.9).level === 'safe');
check('40°C → warn', pawCategory(40).level === 'warn');
check('49.9°C → warn', pawCategory(49.9).level === 'warn');
check('50°C → danger', pawCategory(50).level === 'danger');

console.log('walkWindows — recommended-hours derivation');
const mk = (defs) => defs.map(([h, level]) => ({ h, cat: { level } }));
check('全時間safe → 1本の全域run',
  JSON.stringify(walkWindows(mk([[6,'safe'],[7,'safe'],[8,'safe']]))) === '[[6,8]]');
check('safeなし → 空',
  JSON.stringify(walkWindows(mk([[12,'warn'],[13,'danger']]))) === '[]');
check('朝夕の2窓を検出',
  JSON.stringify(walkWindows(mk([[6,'safe'],[7,'safe'],[8,'warn'],[9,'warn'],[10,'safe'],[11,'safe']]))) === '[[6,7],[10,11]]');
check('末尾までsafeが続く窓',
  JSON.stringify(walkWindows(mk([[19,'warn'],[20,'safe'],[21,'safe']]))) === '[[20,21]]');

console.log('integration — data.js dummy day (Tokyo spring, clear)');
// (h, air, solar, wind, hum) — soil is irrelevant for the model now.
const dummy = [
  [6,15.2,40,1.1,78],[7,17,180,1.4,72],[8,18.9,340,1.8,68],[9,20.4,500,2.0,64],
  [10,21.8,620,2.1,62],[11,23,710,2.2,60],[12,24,760,2.3,59],[13,24.6,780,2.3,58],
  [14,24.8,780,2.3,58],[15,24.5,700,2.4,59],[16,23.6,550,2.4,61],[17,22.1,350,2.2,64],
  [18,20.3,120,2.0,68],[19,18.8,10,1.8,71],[20,17.6,0,1.6,74],[21,16.9,0,1.4,76],
];
const ribbon = dummy.map(([h, air, solar, wind, rh]) => {
  const t = asphaltTemp(air, solar, wind, rh);
  return { h, t, cat: pawCategory(t) };
});
const noon = ribbon.find(r => r.h === 14);
inRange('春晴天14時のアスファルト', noon.t, 37, 42);
check('14時は快適カテゴリ', noon.cat.level === 'safe', noon.cat.level + ' @' + noon.t.toFixed(1));
check('日中50°C超 (危険) は出ない', ribbon.every(r => r.cat.level !== 'danger'),
  ribbon.filter(r => r.cat.level === 'danger').map(r => r.h).join(','));
const windows = walkWindows(ribbon);
check('全時間safeの一日 → 1窓',
  windows.length === 1 && windows[0][0] === 6 && windows[0][1] === 21,
  JSON.stringify(windows));

console.log('integration — winter scenarios');
check('厳冬の朝 (air -2, 無日射) → 凍結注意',
  pawCategory(asphaltTemp(-2, 0, 2, 60)).level === 'freeze');
check('冬の弱い日差し (air 3, solar 100, rh50) → 冷たいまま',
  pawCategory(asphaltTemp(3, 100, 2, 50)).level === 'chill',
  asphaltTemp(3, 100, 2, 50).toFixed(1));
check('冬晴れの日なた (air 3, solar 300, rh40) → 快適',
  pawCategory(asphaltTemp(3, 300, 2, 40)).level === 'safe',
  asphaltTemp(3, 300, 2, 40).toFixed(1));

if (failed) { console.error(`\n${failed} test(s) failed`); process.exit(1); }
console.log('\nall tests passed');
