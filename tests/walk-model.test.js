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

console.log('asphaltTemp — published measurement anchors');
// JAF August field test: clear, air 35.5°C, solar ~950 W/m², light wind → 58–63°C
inRange('真夏晴天正午 (JAF)', asphaltTemp(35.5, 950, 1.0), 58, 64);
// Dog-walk study, May clear noon: air 26°C, solar ~800, wind 2 → ~44°C
inRange('5月晴天正午', asphaltTemp(26, 800, 2.0), 42, 47);
// 環境省 heat-island: air 30°C, solar ~900 → asphalt 50–55°C
inRange('夏30°C晴天', asphaltTemp(30, 900, 2.0), 50, 55);
// Cloudy: solar 150 → surface ≈ air + 2–5°C
inRange('曇天', asphaltTemp(25, 150, 2.0), 27, 30);
// No sun → surface equals air temp exactly
check('夜間 solar=0 で気温と一致', asphaltTemp(18, 0, 2) === 18);
// Wind monotonically cools the surface
check('風が強いほど低温', asphaltTemp(30, 800, 6) < asphaltTemp(30, 800, 2) &&
                          asphaltTemp(30, 800, 2) < asphaltTemp(30, 800, 0));
// Missing wind argument must not produce NaN (defaults to calm)
check('wind未指定でもNaNにならない', !isNaN(asphaltTemp(25, 500)));

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
const dummy = [
  [6,15.2,40,1.1],[7,17,180,1.4],[8,18.9,340,1.8],[9,20.4,500,2.0],
  [10,21.8,620,2.1],[11,23,710,2.2],[12,24,760,2.3],[13,24.6,780,2.3],
  [14,24.8,780,2.3],[15,24.5,700,2.4],[16,23.6,550,2.4],[17,22.1,350,2.2],
  [18,20.3,120,2.0],[19,18.8,10,1.8],[20,17.6,0,1.6],[21,16.9,0,1.4],
];
const ribbon = dummy.map(([h, air, solar, wind]) => {
  const t = asphaltTemp(air, solar, wind);
  return { h, t, cat: pawCategory(t) };
});
const noon = ribbon.find(r => r.h === 14);
inRange('春晴天14時のアスファルト', noon.t, 41, 46);
check('14時は注意カテゴリ', noon.cat.level === 'warn', noon.cat.level);
check('日中50°C超 (危険) は出ない', ribbon.every(r => r.cat.level !== 'danger'),
  ribbon.filter(r => r.cat.level === 'danger').map(r => r.h).join(','));
const windows = walkWindows(ribbon);
check('朝夕の散歩窓が出る', windows.length === 2 &&
  windows[0][0] === 6 && windows[1][1] === 21, JSON.stringify(windows));

console.log('integration — winter scenarios');
check('厳冬の朝 (air -2, 無日射) → 凍結注意',
  pawCategory(asphaltTemp(-2, 0, 2)).level === 'freeze');
check('冬の弱い日差し (air 3, solar 50) → 冷たいまま',
  pawCategory(asphaltTemp(3, 50, 2)).level === 'chill',
  asphaltTemp(3, 50, 2).toFixed(1));
check('冬晴れの日なた (air 3, solar 100) は5°C超え → 快適',
  pawCategory(asphaltTemp(3, 100, 2)).level === 'safe',
  asphaltTemp(3, 100, 2).toFixed(1));

if (failed) { console.error(`\n${failed} test(s) failed`); process.exit(1); }
console.log('\nall tests passed');
