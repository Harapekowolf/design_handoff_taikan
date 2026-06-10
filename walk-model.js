// Ground-surface model for the dog-walk screen (pure functions, no DOM/React).
// Loaded as a plain <script> in the browser; require()-able from node for tests.

(function (root) {
  'use strict';

  // Asphalt surface temperature, clear-sky empirical fit.
  // delta = solar × 0.025 × windFactor, windFactor = 1.15 / (1 + 0.08·wind)
  // Calibrated against published field measurements:
  //   - JAF August test: air 35.5°C / solar ~950 / calm  → asphalt 58–63°C
  //   - May clear noon:  air 26°C  / solar ~800 / wind 2 → asphalt ~44°C
  //   - 環境省 heat-island: air 30°C / solar ~900        → asphalt 50–55°C
  //   - Cloudy (solar <200): surface ≈ air + 2–5°C
  function asphaltTemp(air, solar, wind) {
    const windFactor = 1.15 / (1 + 0.08 * Math.max(0, wind || 0));
    return air + (solar || 0) * 0.025 * windFactor;
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
  root.pawCategory = pawCategory;
  root.walkWindows = walkWindows;
})(typeof window !== 'undefined' ? window : globalThis);
