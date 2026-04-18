// Outfit, Map/region, Clothing color screens

function OutfitScreen() {
  const d = window.APP_DATA.outfit;
  const n = window.APP_DATA.now;
  return (
    <div className="screen">
      <div className="outfit-wrap">
        <div className="outfit-hero">
          <div className="eyebrow">Today's Outfit · {n.timeLabel.split('(')[0].trim()}</div>
          <h2>{d.headline}</h2>
          <div className="sub">{d.subline}。日向と日陰で体感が5°C以上違う一日です。</div>
          <div className="outfit-context">
            <div className="oc"><span className="k">日向</span><span className="v">{n.feelsLikeSun.toFixed(1)}°C</span></div>
            <div className="oc"><span className="k">日陰</span><span className="v">{n.feelsLikeShade.toFixed(1)}°C</span></div>
            <div className="oc"><span className="k">UV</span><span className="v">{n.uv}</span></div>
            <div className="oc"><span className="k">風</span><span className="v">{n.windMS} m/s</span></div>
          </div>
        </div>

        <div>
          <div className="outfit-list">
            {d.items.map((it, i) => (
              <div key={i} className="outfit-row">
                <div className="part">{it.part}</div>
                <div className="pick">{it.pick}</div>
                <div className="alt">
                  or {it.alt}
                  <em>{it.note}</em>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.7 }}>
            ※ 体感 <span className="mono">{n.feelsLikeShade.toFixed(0)}–{n.feelsLikeSun.toFixed(0)}°C</span> を基準に、屋外滞在20分以上を想定しています。
          </div>
        </div>
      </div>
    </div>
  );
}

function MapScreen() {
  const regions = window.APP_DATA.regions;

  return (
    <div className="screen">
      <div className="hourly-head">
        <h2>地域比較</h2>
        <div className="legend">
          <span><span className="swatch sw-sun"></span>現在地</span>
          <span><span className="swatch sw-shade"></span>主要都市</span>
        </div>
      </div>

      <div className="map-split">
        <div className="map-canvas">
          <div className="gridlines" />
          {/* stylised JP outline */}
          <svg viewBox="0 0 100 140" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none">
            <path d="M70 8 Q78 14 76 22 Q82 30 74 36 Q82 42 70 46 Q76 54 66 52 Q62 58 54 56 Q46 60 40 64 Q32 68 26 72 Q22 78 14 86 Q8 96 12 104" stroke="#0f0f0f" strokeWidth="0.6" fill="none" opacity="0.6" />
            <circle cx="10" cy="92" r="1.5" stroke="#0f0f0f" strokeWidth="0.4" fill="none" opacity="0.5" />
          </svg>
          {regions.map((r, i) => (
            <div key={i} className={`map-pin ${r.active ? 'active' : ''}`} style={{ left: `${r.x}%`, top: `${r.y}%` }}>
              <div className="dot" />
              <div className="label">{r.name}</div>
              <div className="temp">{r.feels.toFixed(1)}°</div>
            </div>
          ))}
        </div>

        <div>
          <div className="region-head">
            <div>都市</div>
            <div>気温</div>
            <div>体感</div>
            <div>差</div>
          </div>
          <div className="region-list">
            {regions.map((r, i) => (
              <div key={i} className={`region-row ${r.active ? 'active' : ''}`}>
                <div className="r-name">{r.name}</div>
                <div className="r-val">{r.air.toFixed(1)}°</div>
                <div className="r-val">{r.feels.toFixed(1)}°</div>
                <div className={`r-delta ${r.delta >= 0 ? 'up' : 'dn'}`}>
                  {r.delta > 0 ? '+' : ''}{r.delta.toFixed(1)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 28 }}>
            <div className="eyebrow">この瞬間</div>
            <p style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 20, lineHeight: 1.5, color: 'var(--ink-2)', margin: '10px 0 0', maxWidth: 380 }}>
              太平洋側は日差しで体感が気温を大きく上回り、北海道と東北北部は気温並みの体感です。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorScreen() {
  const colors = window.APP_DATA.clothingColors;

  return (
    <div className="screen">
      <div className="color-intro">
        <div>
          <div className="eyebrow">Clothing · Color & Heat</div>
          <h2>服の色で、<br />体感は<span style={{ fontStyle: 'italic' }}>5.6°C</span>変わる</h2>
        </div>
        <div className="blurb">
          直射日光下で測定した、素材と色による表面温度と体感差。
          <strong>白</strong>は日射の約70%を反射、<strong>黒</strong>は約90%を吸収します。
          気温 <span className="mono">24.8°C</span>・日射 <span className="mono">780 W/m²</span> の今、
          黒い服は白い服より約 <strong>5.6°C</strong> 暑く感じます。
        </div>
      </div>

      <div className="color-grid">
        {colors.map((c, i) => (
          <div key={i} className="color-cell" style={{ background: c.hex, color: c.textOn }}>
            <div className="c-name">{c.name}</div>
            <div className="c-bottom">
              <div className="c-delta">+{c.deltaC.toFixed(1)}°</div>
              <div className="c-surface">SURFACE · {c.surface}°C</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32, paddingTop: 20, borderTop: '1px solid var(--rule)' }}>
        <div>
          <div className="eyebrow">素材の影響</div>
          <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--ink-2)', margin: '8px 0 0' }}>
            綿・リネンなど通気性の高い素材では、色による差は約30%小さくなります。
          </p>
        </div>
        <div>
          <div className="eyebrow">おすすめ</div>
          <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--ink-2)', margin: '8px 0 0' }}>
            今日のような日射が強い日は、<strong style={{ color: 'var(--ink)' }}>白・ベージュ系</strong>を選ぶと体感が約3°C下がります。
          </p>
        </div>
        <div>
          <div className="eyebrow">冬の場合</div>
          <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--ink-2)', margin: '8px 0 0' }}>
            逆に気温10°C以下の晴天では、濃色を選ぶと日射を取り込み、体感は +2°C ほどに。
          </p>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { OutfitScreen, MapScreen, ColorScreen });
