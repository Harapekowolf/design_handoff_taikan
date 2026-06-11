// Ground-surface model for the dog-walk screen (pure functions, no DOM/React).
// Loaded as a plain <script> in the browser; require()-able from node for tests.

(function (root) {
  'use strict';

  // Asphalt surface temperature — targets *typical urban (aged) asphalt*, i.e.
  // what real pet owners walk dogs on, not freshly-laid black asphalt that JAF
  // tests measure. Calibrated so a soil-anchored variant isn't needed — soil
  // mostly correlates with air anyway, and anchoring against it caused the
  // afternoon peak not to fall when the soil baseline rose with the air.
  //
  //   asphalt = air + solar × 0.020 × windFactor × humidityFactor
  //   windFactor    = 1.15 / (1 + 0.08·wind)
  //   humidityFactor = 1 − 0.005 · max(0, rh − 50)   (rh%, attenuates above 50)
  //
  // Anchors (asserted in tests/walk-model.test.js):
  //   - 真夏正午 (urban):  air 35.5 / solar 950 / wind 1 / rh 55 → 52–60°C
  //   - 5月晴天正午:       air 26   / solar 800 / wind 2 / rh 60 → 38–45°C
  //   - 夏30°C晴天:        air 30   / solar 900 / wind 2 / rh 55 → 45–52°C
  //   - 曇天:              air 25   / solar 150 / wind 2 / rh 70 → 26–30°C
  //   - 梅雨晴れ間:        air 26   / solar 600 / wind 2 / rh 80 → 33–38°C
  function asphaltTemp(air, solar, wind, rh) {
    const windFactor = 1.15 / (1 + 0.08 * Math.max(0, wind || 0));
    const humidFactor = 1 - 0.005 * Math.max(0, (rh == null ? 50 : rh) - 50);
    return air + (solar || 0) * 0.020 * windFactor * humidFactor;
  }

  // Concrete / light pavement — higher albedo (~0.35 vs asphalt ~0.07)
  // reflects more shortwave, so it heats ≈ 65% as much above air temp.
  // Published summer reference: concrete 45–50°C when asphalt hits 55–60°C.
  function concreteTemp(air, solar, wind, rh) {
    const windFactor = 1.15 / (1 + 0.08 * Math.max(0, wind || 0));
    const humidFactor = 1 - 0.005 * Math.max(0, (rh == null ? 50 : rh) - 50);
    return air + (solar || 0) * 0.013 * windFactor * humidFactor;
  }

  // 肉球セーフティ: 夏のやけど (アスファルト50°C+で数分で受傷) と
  // 冬の凍結・融雪剤の両方をカバーする5段階。
  function pawCategory(t) {
    if (t <= 0)  return { label: '凍結注意', level: 'freeze', note: 'ひび割れ・凍傷のおそれ' };
    if (t < 5)   return { label: '冷たい',   level: 'chill',  note: '短めに。融雪剤は拭き取りを' };
    if (t < 40)  return { label: '快適',     level: 'safe',   note: '肉球にやさしい路面' };
    if (t < 50)  return { label: '注意',     level: 'warn',   note: '長時間の歩行は避けて' };
    return          { label: '危険',     level: 'danger', note: '肉球やけどのおそれ' };
  }

  // Contiguous safe-hour runs → recommended walk windows.
  function walkWindows(ribbon) {
    const runs = [];
    let start = null;
    ribbon.forEach(function (r, i) {
      const ok = r.cat.level === 'safe';
      if (ok && start == null) start = r.h;
      if (!ok && start != null) { runs.push([start, ribbon[i - 1].h]); start = null; }
    });
    if (start != null) runs.push([start, ribbon[ribbon.length - 1].h]);
    return runs;
  }

  root.asphaltTemp = asphaltTemp;
  root.concreteTemp = concreteTemp;
  root.pawCategory = pawCategory;
  root.walkWindows = walkWindows;
})(typeof window !== 'undefined' ? window : globalThis);
