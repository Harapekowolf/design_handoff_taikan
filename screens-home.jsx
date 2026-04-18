// Home screen + top bar
const { useState, useEffect, useMemo } = React;

function TopBar({ screen, setScreen }) {
  const items = [
    { id: 'home',    label: 'ホーム' },
    { id: 'hourly',  label: '1時間ごと' },
    { id: 'weekly',  label: '週間' },
    { id: 'outfit',  label: '服装' },
    { id: 'map',     label: '地域比較' },
    { id: 'colors',  label: '服の色' },
  ];
  return (
    <div className="topbar">
      <div className="brand">
        <span className="mark">taikan.</span>
        <span className="tag">Perceived Temperature</span>
      </div>
      <div className="nav">
        {items.map(it => (
          <button
            key={it.id}
            className={screen === it.id ? 'active' : ''}
            onClick={() => setScreen(it.id)}
          >{it.label}</button>
        ))}
      </div>
      <div className="loc">
        <span className="dot" />
        <span>{window.APP_DATA.now.location} · {window.APP_DATA.now.timeLabel.split(' ')[1]}</span>
      </div>
    </div>
  );
}

// Factor bar — shows how each input shifts feels-like from air temp
function FactorBar({ label, value, max, unit, delta, neg }) {
  const pct = Math.min(100, Math.abs(value) / max * 100);
  return (
    <div className="factor-row">
      <div className="f-k">{label}</div>
      <div className={`bar ${neg ? 'neg' : ''}`}>
        <div className="fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="f-v">{value}{unit}{delta != null ? ` · ${delta > 0 ? '+' : ''}${delta}°` : ''}</div>
    </div>
  );
}

function HomeScreen({ tweaks }) {
  const d = window.APP_DATA.now;
  const feelsSun = d.feelsLikeSun + (tweaks.solarBoost || 0);
  const feelsShade = d.feelsLikeShade;
  const primaryFeel = tweaks.inSun ? feelsSun : feelsShade;
  const fmt = (n) => n.toFixed(1);

  return (
    <div className="screen">
      <div className="home-grid">
        <div className="hero">
          <div className="stamp">Feels like · {tweaks.inSun ? '日向 in the sun' : '日陰 in the shade'}</div>
          <div className="bignum">
            <span className="accent">{fmt(primaryFeel)}</span>
            <span className="unit">°C</span>
          </div>
          <div className="caption">
            気温は <span className="mono">{fmt(d.airTemp)}°C</span>。
            日差しと弱い南南西の風で、{tweaks.inSun ? '体は夏日のように感じます。' : '過ごしやすい春の陽気です。'}
          </div>
          <div className="meta-row">
            <div className="meta"><span className="k">Air</span><span className="v">{fmt(d.airTemp)}°C</span></div>
            <div className="meta"><span className="k">Humidity</span><span className="v">{d.humidity}%</span></div>
            <div className="meta"><span className="k">Wind</span><span className="v">{d.windMS} m/s {d.windDir}</span></div>
            <div className="meta"><span className="k">UV</span><span className="v">{d.uv} / 強い</span></div>
            <div className="meta"><span className="k">Solar</span><span className="v">{d.solar} W/m²</span></div>
          </div>
        </div>

        <div className="sun-shade">
          <div className="ss-card sun">
            <div className="ss-top">
              <div className="lbl">
                <SunGlyph />
                <span>日向 · in the sun</span>
              </div>
              <span className="ss-delta mono">+{(feelsSun - d.airTemp).toFixed(1)}°C vs 気温</span>
            </div>
            <div className="ss-num">{fmt(feelsSun)}°</div>
            <div className="ss-delta">強い日射で肌表面が温まっています</div>
          </div>

          <div className="ss-card shade">
            <div className="ss-top">
              <div className="lbl">
                <ShadeGlyph />
                <span>日陰 · in the shade</span>
              </div>
              <span className="ss-delta mono">+{(feelsShade - d.airTemp).toFixed(1)}°C vs 気温</span>
            </div>
            <div className="ss-num">{fmt(feelsShade)}°</div>
            <div className="ss-delta">湿度が少し高め、風は穏やか</div>
          </div>

          <div>
            <div className="eyebrow">体感の内訳 · factors</div>
            <div className="factors">
              <FactorBar label="気温" value={d.airTemp} max={40} unit="°C" />
              <FactorBar label="日射" value={d.solar} max={1000} unit="W/m²" delta={+5.2} />
              <FactorBar label="湿度" value={d.humidity} max={100} unit="%" delta={+1.4} />
              <FactorBar label="風速" value={d.windMS} max={10} unit="m/s" delta={-0.3} neg />
              <FactorBar label="服装" value={tweaks.clothing === 'light' ? 1 : tweaks.clothing === 'medium' ? 2 : 3} max={3} unit=" lv" delta={tweaks.clothing === 'light' ? -0.4 : tweaks.clothing === 'heavy' ? +1.1 : +0.2} neg={tweaks.clothing === 'light'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SunGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="10" cy="10" r="3.2" />
      {[0,45,90,135,180,225,270,315].map(a => (
        <line key={a}
          x1={10 + Math.cos(a*Math.PI/180)*5.5}
          y1={10 + Math.sin(a*Math.PI/180)*5.5}
          x2={10 + Math.cos(a*Math.PI/180)*8}
          y2={10 + Math.sin(a*Math.PI/180)*8}
        />
      ))}
    </svg>
  );
}

function ShadeGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M6 10a4 4 0 108 0 3 3 0 01-8 0z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

Object.assign(window, { TopBar, HomeScreen, SunGlyph, ShadeGlyph });
