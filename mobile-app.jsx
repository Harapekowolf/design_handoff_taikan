// Mobile screens — one file, all 6 screens

const { useState, useEffect, useMemo } = React;

function MobileApp() {
  const [screen, setScreen] = React.useState(
    () => localStorage.getItem('taikan.m.screen') || 'home'
  );
  const [inSun, setInSun] = React.useState(
    () => localStorage.getItem('taikan.m.inSun') !== '0'
  );
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  React.useEffect(() => {
    localStorage.setItem('taikan.m.screen', screen);
  }, [screen]);
  React.useEffect(() => {
    localStorage.setItem('taikan.m.inSun', inSun ? '1' : '0');
  }, [inSun]);

  React.useEffect(() => {
    const on = () => forceUpdate();
    window.addEventListener('weather:loading', on);
    window.addEventListener('weather:loaded', on);
    window.addEventListener('weather:updated', on);
    window.addEventListener('weather:error', on);
    return () => {
      window.removeEventListener('weather:loading', on);
      window.removeEventListener('weather:loaded', on);
      window.removeEventListener('weather:updated', on);
      window.removeEventListener('weather:error', on);
    };
  }, []);

  // Tweaks integration
  const [tweaks, setTweaks] = React.useState(DEFAULT_M_TWEAKS);
  const [tweaksOpen, setTweaksOpen] = React.useState(false);
  React.useEffect(() => {
    const onMsg = (e) => {
      if (!e.data) return;
      if (e.data.type === '__activate_edit_mode') setTweaksOpen(true);
      if (e.data.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  React.useEffect(() => {
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: tweaks }, '*');
  }, [tweaks]);

  // Apply theme
  React.useEffect(() => {
    const root = document.documentElement;
    if (tweaks.theme === 'snow') {
      root.style.setProperty('--paper', '#fbfaf7');
      root.style.setProperty('--paper-2', '#f2efe7');
    } else if (tweaks.theme === 'ink') {
      root.style.setProperty('--paper', '#1a1a1a');
      root.style.setProperty('--paper-2', '#242424');
      root.style.setProperty('--card', '#222222');
      root.style.setProperty('--ink', '#f2f0ea');
      root.style.setProperty('--ink-2', '#d0cec8');
      root.style.setProperty('--ink-3', '#9a988f');
      root.style.setProperty('--ink-4', '#6a6864');
      root.style.setProperty('--rule', '#333333');
      root.style.setProperty('--rule-2', '#2a2a2a');
    } else {
      root.style.setProperty('--paper', '#f7f5f0');
      root.style.setProperty('--paper-2', '#eeebe3');
      root.style.setProperty('--card', '#ffffff');
      root.style.setProperty('--ink', '#0f0f0f');
      root.style.setProperty('--ink-2', '#2b2b2b');
      root.style.setProperty('--ink-3', '#5a5a5a');
      root.style.setProperty('--ink-4', '#8a8a8a');
      root.style.setProperty('--rule', '#e4e2dd');
      root.style.setProperty('--rule-2', '#efede8');
    }
  }, [tweaks.theme]);

  const screens = {
    home:   <HomeM inSun={inSun} setInSun={setInSun} tweaks={tweaks} />,
    hourly: <HourlyM />,
    weekly: <WeeklyM />,
    outfit: <OutfitM />,
    map:    <MapM />,
    colors: <ColorsM />,
  };

  return (
    <div className="m-frame">
      <div className="m-app" data-screen-label={`mobile-${screen}`}>
        <MHeader title={screenTitle(screen)} />
        <WeatherErrorBanner />
        <div className="m-scroll">
          {screens[screen]}
        </div>
        <MTabBar screen={screen} setScreen={setScreen} />
      </div>
      <TweaksM open={tweaksOpen} tweaks={tweaks} setTweaks={setTweaks} />
    </div>
  );
}

function screenTitle(s) {
  return {
    home: window.APP_DATA.now.location, hourly: '1時間ごと', weekly: '週間予報',
    outfit: '今日の服装', map: '地域比較', colors: '服の色と体感',
  }[s];
}

function MHeader({ title }) {
  const ws = window.WEATHER_STATE || {};
  const updated = ws.lastUpdated
    ? new Date(ws.lastUpdated).toTimeString().slice(0, 5)
    : null;
  const onRefresh = () => {
    if (ws.loading) return;
    if (typeof window.refreshWeather === 'function') window.refreshWeather();
  };
  return (
    <div className="m-header">
      <div className="loc">
        <span className="name">{title}</span>
        <span className="time">{window.APP_DATA.now.timeLabel}</span>
      </div>
      <div className="meta">
        <span className="brand">taikan.</span>
        <button
          type="button"
          className={`refresh ${ws.loading ? 'loading' : ''} ${ws.error ? 'error' : ''}`}
          onClick={onRefresh}
          aria-label="天気を更新"
          disabled={ws.loading}
        >
          <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4v4h-4"/>
            <path d="M16 8A6 6 0 104 10"/>
          </svg>
          <span>{ws.loading ? '更新中' : (updated ? `${updated} 更新` : '未取得')}</span>
        </button>
      </div>
    </div>
  );
}

function WeatherErrorBanner() {
  const ws = window.WEATHER_STATE || {};
  if (!ws.error) return null;
  const onRetry = () => {
    if (typeof window.refreshWeather === 'function') window.refreshWeather();
  };
  const msg = ws.source === 'dummy'
    ? '天気データを取得できませんでした（ダミー値を表示中）'
    : '天気データを更新できませんでした';
  return (
    <div className="weather-error">
      <span>{msg}</span>
      <button type="button" onClick={onRetry} disabled={ws.loading}>
        {ws.loading ? '更新中…' : '再試行'}
      </button>
    </div>
  );
}

function MTabBar({ screen, setScreen }) {
  const tabs = [
    { id: 'home',   label: 'Now',    icon: <IconNow /> },
    { id: 'hourly', label: '1時間',   icon: <IconHour /> },
    { id: 'weekly', label: '週間',    icon: <IconWeek /> },
    { id: 'outfit', label: '服装',    icon: <IconShirt /> },
    { id: 'map',    label: '地域',    icon: <IconMap /> },
    { id: 'colors', label: '色',      icon: <IconPalette /> },
  ];
  return (
    <div className="m-tabs">
      {tabs.map(t => (
        <button key={t.id} className={`m-tab ${screen === t.id ? 'active' : ''}`} onClick={() => setScreen(t.id)}>
          {t.icon}
          <span>{t.label}</span>
          <span className="tdot" />
        </button>
      ))}
    </div>
  );
}

// Tiny line-icon set
const iw = 20, ih = 20, iprops = { width: iw, height: ih, viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round' };
function IconNow()     { return <svg {...iprops}><circle cx="10" cy="10" r="3"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4"/></svg>; }
function IconHour()    { return <svg {...iprops}><circle cx="10" cy="10" r="7.5"/><path d="M10 5.5V10l3 2"/></svg>; }
function IconWeek()    { return <svg {...iprops}><rect x="2.5" y="4" width="15" height="13" rx="1.5"/><path d="M2.5 8h15M7 2.5v3M13 2.5v3"/></svg>; }
function IconShirt()   { return <svg {...iprops}><path d="M6 3l-3.5 2 1.5 3 2-1v10h8V7l2 1 1.5-3L14 3l-2 2a2 2 0 01-4 0L6 3z"/></svg>; }
function IconMap()     { return <svg {...iprops}><path d="M2.5 5l5-2 5 2 5-2v12l-5 2-5-2-5 2V5z"/><path d="M7.5 3v12M12.5 5v12"/></svg>; }
function IconPalette() { return <svg {...iprops}><path d="M10 2.5C5.9 2.5 2.5 5.9 2.5 10c0 3 1.6 5 4.5 5 1.5 0 2-.8 2-1.8s-.5-1.5.2-2.2c.7-.7 1.5-.5 2.8-.5 2.8 0 5.5-1.2 5.5-4C17.5 4.7 14.1 2.5 10 2.5z"/><circle cx="6.5" cy="8" r="0.8" fill="currentColor"/><circle cx="10" cy="5.5" r="0.8" fill="currentColor"/><circle cx="13.5" cy="7" r="0.8" fill="currentColor"/></svg>; }

// ─── HOME ───
function HomeM({ inSun, setInSun, tweaks }) {
  const d = window.APP_DATA.now;
  const [color, setColor] = React.useState(
    () => localStorage.getItem('taikan.m.color') || 'black'
  );
  const [cover, setCover] = React.useState(
    () => localStorage.getItem('taikan.m.cover') || 'none'
  );
  React.useEffect(() => localStorage.setItem('taikan.m.color', color), [color]);
  React.useEffect(() => localStorage.setItem('taikan.m.cover', cover), [cover]);

  const isNight = (d.solar || 0) <= 50;
  const sunActive = inSun && !isNight;
  const colorDelta = sunActive ? (color === 'black' ? 5.6 : 0) : 0;
  const coverDelta = sunActive ? (cover === 'hat' ? -2 : cover === 'parasol' ? -3 : 0) : 0;
  const modDelta = colorDelta + coverDelta;

  const baseSun = d.feelsLikeSun + (tweaks.solarBoost || 0);
  const feels = (inSun ? baseSun : d.feelsLikeShade) + modDelta;
  const sunCardVal = baseSun + modDelta;

  return (
    <div>
      <div className="home-hero">
        <div className="stamp">Feels like · {inSun ? '日向' : '日陰'}</div>
        <div className="bignum">
          <span className="accent">{feels.toFixed(1)}</span>
          <span className="unit">°C</span>
        </div>
        <div className="caption">
          気温は <span className="mono">{d.airTemp.toFixed(1)}°C</span>。{isNight ? '日没後、気温と体感はほぼ同じ。' : inSun ? '日差しが強く、体は夏日のよう。' : '日陰では過ごしやすい春の陽気。'}
        </div>
        <div className="air">
          <span><span className="k">Air</span> <span className="v">{d.airTemp.toFixed(1)}°</span></span>
          <span><span className="k">湿度</span> <span className="v">{d.humidity}%</span></span>
          <span><span className="k">風</span> <span className="v">{d.windMS}m/s</span></span>
          <span><span className="k">UV</span> <span className="v">{d.uv}</span></span>
        </div>

        {isNight && (
          <div className="night-note">
            <span>☁ 日差しなし・色や日よけの効果はありません</span>
          </div>
        )}

        <div className="sun-shade-toggle">
          <button className={inSun ? 'active' : ''} onClick={() => setInSun(true)}>
            <SunGlyph /> 日向
          </button>
          <button className={!inSun ? 'active' : ''} onClick={() => setInSun(false)}>
            <ShadeGlyph /> 日陰
          </button>
        </div>

        <div className={`color-toggle ${!sunActive ? 'inactive' : ''}`}>
          <button className={color === 'black' ? 'active' : ''} onClick={() => setColor('black')}>
            <span className="sw" style={{ background: '#161616' }} /> 黒
            {sunActive && <span className="delta">+5.6°</span>}
          </button>
          <button className={color === 'white' ? 'active' : ''} onClick={() => setColor('white')}>
            <span className="sw" style={{ background: '#f2f0ea', border: '1px solid var(--rule)' }} /> 白
          </button>
        </div>

        <div className={`cover-toggle ${!sunActive ? 'inactive' : ''}`}>
          <button className={cover === 'none' ? 'active' : ''} onClick={() => setCover('none')}>
            <CoverNoneGlyph /> なし
          </button>
          <button className={cover === 'hat' ? 'active' : ''} onClick={() => setCover('hat')}>
            <HatGlyph /> 帽子
            {sunActive && <span className="delta">−2°</span>}
          </button>
          <button className={cover === 'parasol' ? 'active' : ''} onClick={() => setCover('parasol')}>
            <ParasolGlyph /> 日傘
            {sunActive && <span className="delta">−3°</span>}
          </button>
        </div>
      </div>

      <div className="ss-cards">
        <div className="ss-c sun">
          <span className="lbl"><SunGlyph /> 日向</span>
          <span className="n">{sunCardVal.toFixed(1)}°</span>
          <span className="d">
            +{(sunCardVal - d.airTemp).toFixed(1)}° 気温比
            {sunActive && modDelta !== 0 && (
              <span className="mod">{modDelta > 0 ? '+' : ''}{modDelta.toFixed(1)}° 服装</span>
            )}
          </span>
        </div>
        <div className="ss-c shade">
          <span className="lbl"><ShadeGlyph /> 日陰</span>
          <span className="n">{d.feelsLikeShade.toFixed(1)}°</span>
          <span className="d">+{(d.feelsLikeShade - d.airTemp).toFixed(1)}° 気温比</span>
        </div>
      </div>

      <div className="section-head">
        <h2>体感の内訳</h2>
        <span className="link">Factors</span>
      </div>
      <div className="m-factors">
        <FactorRow label="気温" value={d.airTemp} max={40} unit="°C" />
        <FactorRow label="日射" value={d.solar} max={1000} unit="W/m²" delta={+5.2} pos />
        <FactorRow label="湿度" value={d.humidity} max={100} unit="%" delta={+1.4} pos />
        <FactorRow label="風速" value={d.windMS} max={10} unit="m/s" delta={-0.3} neg />
        <FactorRow label="服装" value={tweaks.clothing === 'light' ? 1 : tweaks.clothing === 'medium' ? 2 : 3} max={3} unit="lv" delta={tweaks.clothing === 'light' ? -0.4 : tweaks.clothing === 'heavy' ? +1.1 : +0.2} />
        <FactorRow label="服の色" value={Math.abs(colorDelta)} max={5.6} unit="°" pos={colorDelta > 0} />
        <FactorRow label="日よけ" value={Math.abs(coverDelta)} max={3} unit="°" neg={coverDelta < 0} />
      </div>

      <div className="section-head">
        <h2>今日の一言</h2>
      </div>
      <div className="insight">
        <div className="eyebrow">Advice</div>
        <div className="t">日向は夏日、日陰は春の陽気</div>
        <div className="d">半袖に薄手の羽織りで両方に対応できます。帽子があると日向の体感が約2°C下がります。</div>
      </div>
    </div>
  );
}

function FactorRow({ label, value, max, unit, delta, pos, neg }) {
  const pct = Math.min(100, Math.abs(value) / max * 100);
  return (
    <div className="factor-row">
      <div className="f-k">{label}</div>
      <div className={`bar ${pos ? 'pos' : neg ? 'neg' : ''}`}>
        <div className="fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="f-v">{value}{unit}{delta != null ? ` ${delta > 0 ? '+' : ''}${delta}°` : ''}</div>
    </div>
  );
}

function SunGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="10" cy="10" r="3"/>
      {[0,45,90,135,180,225,270,315].map(a => (
        <line key={a} x1={10+Math.cos(a*Math.PI/180)*5} y1={10+Math.sin(a*Math.PI/180)*5} x2={10+Math.cos(a*Math.PI/180)*7.5} y2={10+Math.sin(a*Math.PI/180)*7.5}/>
      ))}
    </svg>
  );
}
function ShadeGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M7 10a3 3 0 106 0 2.5 2.5 0 01-6 0z" fill="currentColor"/>
    </svg>
  );
}
function CoverNoneGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <circle cx="10" cy="10" r="6"/>
      <line x1="6" y1="14" x2="14" y2="6"/>
    </svg>
  );
}
function HatGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14 Q10 6 16 14"/>
      <line x1="2.5" y1="14" x2="17.5" y2="14"/>
    </svg>
  );
}
function ParasolGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11 Q10 3 17 11"/>
      <line x1="3" y1="11" x2="17" y2="11"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <path d="M10 17 Q10 18.5 11.5 18"/>
    </svg>
  );
}

// ─── HOURLY ───
function HourlyM() {
  const hours = window.APP_DATA.hourly;
  const nowH = window.APP_DATA.now;
  const nowHour = parseInt((nowH.timeLabel.split(') ')[1] || '').slice(0, 2), 10) || 14;

  const width = 340, height = 160;
  const padL = 26, padR = 8, padT = 12, padB = 22;
  const innerW = width - padL - padR, innerH = height - padT - padB;
  const yMin = 12, yMax = 34;
  const x = (i) => padL + (i / (hours.length - 1)) * innerW;
  const y = (v) => padT + (1 - (v - yMin) / (yMax - yMin)) * innerH;
  const mk = (k) => hours.map((h, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(h[k])}`).join(' ');

  const svgRef = React.useRef(null);
  const trackingRef = React.useRef(false);
  const [selIdx, setSelIdx] = React.useState(null);

  function pickIdx(clientX) {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) return null;
    const vbX = ((clientX - rect.left) / rect.width) * width;
    const t = (vbX - padL) / innerW;
    const i = Math.round(t * (hours.length - 1));
    return Math.max(0, Math.min(hours.length - 1, i));
  }
  function onDown(e) {
    trackingRef.current = true;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    const i = pickIdx(e.clientX);
    if (i != null) setSelIdx(i);
  }
  function onMove(e) {
    if (!trackingRef.current) return;
    const i = pickIdx(e.clientX);
    if (i != null) setSelIdx(i);
  }
  function onUp(e) {
    trackingRef.current = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
  }

  const sel = selIdx != null ? hours[selIdx] : null;
  const selX = sel ? x(selIdx) : 0;
  const labelW = 86, labelH = 50;
  const labelX = Math.max(padL - 2, Math.min(width - padR - labelW, selX - labelW / 2));
  const labelY = padT + 2;

  return (
    <div>
      <div className="m-chart">
        <div className="legend">
          <span><span className="swatch sw-sun"></span>日向</span>
          <span><span className="swatch sw-shade"></span>日陰</span>
          <span><span className="swatch sw-air"></span>気温</span>
          <span className="chart-hint">タップで値表示</span>
        </div>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          style={{ display: 'block', touchAction: 'none' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          {[15, 20, 25, 30].map(v => (
            <g key={v}>
              <line x1={padL} x2={width - padR} y1={y(v)} y2={y(v)} stroke="#efede8"/>
              <text x={padL - 4} y={y(v) + 3} textAnchor="end" fontSize="8" fill="#8a8a8a" fontFamily="JetBrains Mono">{v}°</text>
            </g>
          ))}
          <line x1={x(nowHour - 6)} x2={x(nowHour - 6)} y1={padT} y2={padT + innerH} stroke="#d94b1a" strokeDasharray="2 2" strokeWidth="0.8"/>
          <text x={x(nowHour - 6) + 3} y={padT + 7} fontSize="7" fill="#d94b1a" fontFamily="JetBrains Mono" letterSpacing="0.08em">NOW</text>
          <path d={mk('air')} fill="none" stroke="#8a8a8a" strokeWidth="0.8" strokeDasharray="2 2"/>
          <path d={mk('shade')} fill="none" stroke="#0f0f0f" strokeWidth="1.3"/>
          <path d={mk('sun')} fill="none" stroke="#d94b1a" strokeWidth="1.7"/>
          <circle cx={x(nowHour - 6)} cy={y(nowH.feelsLikeSun)} r="3" fill="#d94b1a"/>
          <circle cx={x(nowHour - 6)} cy={y(nowH.feelsLikeShade)} r="2.2" fill="#0f0f0f"/>
          {hours.map((h, i) => i % 3 === 0 && (
            <text key={i} x={x(i)} y={height - 6} textAnchor="middle" fontSize="8" fill="#8a8a8a" fontFamily="JetBrains Mono">{String(h.h).padStart(2,'0')}</text>
          ))}
          {sel && (
            <g pointerEvents="none">
              <line x1={selX} x2={selX} y1={padT} y2={padT + innerH} stroke="#0f0f0f" strokeWidth="0.6"/>
              <circle cx={selX} cy={y(sel.sun)} r="3.2" fill="#d94b1a" stroke="#f7f5f0" strokeWidth="1"/>
              <circle cx={selX} cy={y(sel.shade)} r="2.6" fill="#0f0f0f" stroke="#f7f5f0" strokeWidth="1"/>
              <circle cx={selX} cy={y(sel.air)} r="2" fill="#8a8a8a" stroke="#f7f5f0" strokeWidth="1"/>
              <g transform={`translate(${labelX}, ${labelY})`}>
                <rect width={labelW} height={labelH} fill="#f7f5f0" stroke="#0f0f0f" strokeWidth="0.6"/>
                <text x={6} y={11} fontSize="7" fill="#8a8a8a" fontFamily="JetBrains Mono" letterSpacing="0.08em">{String(sel.h).padStart(2,'0')}:00</text>
                <text x={6} y={23} fontSize="9" fill="#d94b1a" fontFamily="JetBrains Mono">日向 {sel.sun.toFixed(1)}°</text>
                <text x={6} y={34} fontSize="9" fill="#0f0f0f" fontFamily="JetBrains Mono">日陰 {sel.shade.toFixed(1)}°</text>
                <text x={6} y={45} fontSize="8" fill="#8a8a8a" fontFamily="JetBrains Mono">気温 {sel.air.toFixed(1)}°</text>
              </g>
            </g>
          )}
        </svg>
      </div>

      <div className="section-head">
        <h2>時刻別</h2>
        <span className="link">Scroll →</span>
      </div>
      <div className="hourly-scroll">
        {hours.map((h, i) => (
          <div key={i} className={`hourly-col ${h.h === nowHour ? 'now' : ''}`}>
            <span className="hh">{String(h.h).padStart(2,'0')}</span>
            <span className="sunv">{h.sun.toFixed(0)}°</span>
            <span className="shv">{h.shade.toFixed(0)}°</span>
          </div>
        ))}
      </div>

      <div className="section-head">
        <h2>今日のポイント</h2>
      </div>
      <div className="insights">
        <div className="insight">
          <div className="eyebrow">日差しのピーク</div>
          <div className="t">13:00 – 14:00</div>
          <div className="d">日向と日陰で最大 +6.3°C の差。帽子や日傘で体感は約2°C下がります。</div>
        </div>
        <div className="insight">
          <div className="eyebrow">涼しくなる時間</div>
          <div className="t">18:00 以降</div>
          <div className="d">日没とともに日射がゼロに。気温と体感がほぼ一致します。</div>
        </div>
        <div className="insight">
          <div className="eyebrow">風の影響</div>
          <div className="t">南南西 2–3 m/s</div>
          <div className="d">弱い風のため冷却効果は限定的。−0.3°Cほど。</div>
        </div>
      </div>
    </div>
  );
}

// ─── WEEKLY ───
function WeeklyM() {
  const week = window.APP_DATA.weekly;
  const allMax = Math.max(...week.map(w => w.sun));
  const allMin = Math.min(...week.map(w => w.min));

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Next 7 days</div>
      <div className="week-list-m">
        {week.map((w, i) => {
          const cls = w.day === '土' ? 'sat' : w.day === '日' ? 'sun-d' : '';
          const rng = allMax - allMin;
          const airLeft = ((w.min - allMin) / rng) * 100;
          const airWidth = ((w.max - w.min) / rng) * 100;
          const sunWidth = ((w.sun - w.min) / rng) * 100;
          return (
            <div key={i} className={`week-row-m ${cls}`}>
              <div className="wd">{w.day}</div>
              <div className="dt">{w.date}</div>
              <div className="mid">
                <div className="cond-row">
                  <CondGlyphM cond={w.cond}/>
                  <span>{w.note}</span>
                </div>
                <div className="feels-bar">
                  <div className="fb-air" style={{ left: `${airLeft}%`, width: `${airWidth}%` }}/>
                  <div className="fb-sun" style={{ left: `${airLeft}%`, width: `${sunWidth}%` }}/>
                </div>
              </div>
              <div className="num">
                {w.sun.toFixed(0)}<span className="u">°</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 22, fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 16, color: 'var(--ink-2)', lineHeight: 1.5 }}>
        火曜・水曜にぐっと冷え込みますが、金曜からは再び初夏の陽気。
      </div>
      <div style={{ marginTop: 14, fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.7 }}>
        日中の気温と体感の差が大きい日が続きます。屋外に長時間いる場合は帽子・水分を。
      </div>
    </div>
  );
}
function CondGlyphM({ cond }) {
  const p = { width: 14, height: 14, viewBox: '0 0 20 20', fill: 'none', stroke: '#2b2b2b', strokeWidth: 1.2 };
  if (cond === 'sun')    return <svg {...p}><circle cx="10" cy="10" r="3"/>{[0,90,180,270].map(a=><line key={a} x1={10+Math.cos(a*Math.PI/180)*5} y1={10+Math.sin(a*Math.PI/180)*5} x2={10+Math.cos(a*Math.PI/180)*7.5} y2={10+Math.sin(a*Math.PI/180)*7.5}/>)}</svg>;
  if (cond === 'partly') return <svg {...p}><circle cx="7" cy="7" r="2.5"/><path d="M9 14a3.5 3.5 0 117 0h-7z"/></svg>;
  if (cond === 'cloud')  return <svg {...p}><path d="M5 13a3 3 0 010-6 4 4 0 017-1.5 3 3 0 013 7H5z"/></svg>;
  if (cond === 'rain')   return <svg {...p}><path d="M5 11a3 3 0 010-6 4 4 0 017-1.5 3 3 0 013 7H5z"/><line x1="7" y1="14" x2="6" y2="17"/><line x1="11" y1="14" x2="10" y2="17"/><line x1="14" y1="14" x2="13" y2="17"/></svg>;
  return null;
}

// ─── OUTFIT ───
function OutfitM() {
  const d = window.APP_DATA.outfit;
  const n = window.APP_DATA.now;
  return (
    <div>
      <div className="outfit-hero-m">
        <div className="eyebrow">Today's Outfit · {n.timeLabel.split('(')[0].trim()}</div>
        <h2>{d.headline}</h2>
        <div className="sub">{d.subline}。日向と日陰で体感が5°C以上違う一日です。</div>
        <div className="outfit-ctx">
          <div className="oc"><span className="k">日向</span><span className="v">{n.feelsLikeSun.toFixed(1)}°</span></div>
          <div className="oc"><span className="k">日陰</span><span className="v">{n.feelsLikeShade.toFixed(1)}°</span></div>
          <div className="oc"><span className="k">UV</span><span className="v">{n.uv}</span></div>
          <div className="oc"><span className="k">風</span><span className="v">{n.windMS} m/s</span></div>
        </div>
      </div>
      <div className="outfit-list-m">
        {d.items.map((it, i) => (
          <div key={i} className="outfit-row-m">
            <div className="part">{it.part}</div>
            <div>
              <div className="pick">{it.pick}</div>
              <div className="alt">
                or {it.alt}
                <em>{it.note}</em>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18, fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.7 }}>
        ※ 体感 <span className="mono">{n.feelsLikeShade.toFixed(0)}–{n.feelsLikeSun.toFixed(0)}°C</span> を基準に、屋外滞在20分以上を想定しています。
      </div>
    </div>
  );
}

// ─── MAP ───
function MapM() {
  const regions = window.APP_DATA.regions;
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>Japan · Feels-like map</div>
      <div className="m-map">
        <div className="gridlines" />
        <svg viewBox="0 0 100 140" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none">
          <path d="M70 8 Q78 14 76 22 Q82 30 74 36 Q82 42 70 46 Q76 54 66 52 Q62 58 54 56 Q46 60 40 64 Q32 68 26 72 Q22 78 14 86 Q8 96 12 104" stroke="#0f0f0f" strokeWidth="0.6" fill="none" opacity="0.5"/>
          <circle cx="10" cy="92" r="1.5" stroke="#0f0f0f" strokeWidth="0.4" fill="none" opacity="0.5"/>
        </svg>
        {regions.map((r, i) => (
          <div key={i} className={`map-pin-m ${r.active ? 'active' : ''}`} style={{ left: `${r.x}%`, top: `${r.y}%` }}>
            <div className="dot" />
            <div className="label">{r.name}</div>
            <div className="temp">{r.feels.toFixed(1)}°</div>
          </div>
        ))}
      </div>

      <div className="section-head">
        <h2>主要都市</h2>
        <span className="link">Feels-like</span>
      </div>
      <div className="region-head-m">
        <div>都市</div><div>気温</div><div>体感</div><div>差</div>
      </div>
      <div className="region-list-m">
        {regions.map((r, i) => (
          <div key={i} className={`region-row-m ${r.active ? 'active' : ''}`}>
            <div className="r-name">{r.name}</div>
            <div className="r-val">{r.air.toFixed(1)}°</div>
            <div className="r-val">{r.feels.toFixed(1)}°</div>
            <div className={`r-delta ${r.delta >= 0 ? 'up' : 'dn'}`}>
              {r.delta > 0 ? '+' : ''}{r.delta.toFixed(1)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.5 }}>
        太平洋側は日差しで体感が気温を大きく上回っています。
      </div>
    </div>
  );
}

// ─── COLORS ───
function ColorsM() {
  const colors = window.APP_DATA.clothingColors;
  return (
    <div>
      <div className="c-intro">
        <div className="eyebrow">Clothing · Color & Heat</div>
        <h2>服の色で、<br/>体感は<span style={{ fontStyle: 'italic' }}>5.6°C</span>変わる</h2>
        <div className="blurb">
          直射日光下の表面温度と体感差。<strong>白</strong>は約70%反射、<strong>黒</strong>は約90%吸収。今日の気温 <span className="mono">24.8°C</span>・日射 <span className="mono">780 W/m²</span> では、黒は白より約 <strong>5.6°C</strong> 暑く感じます。
        </div>
      </div>
      <div className="color-grid-m">
        {colors.map((c, i) => (
          <div key={i} className="color-cell-m" style={{ background: c.hex, color: c.textOn }}>
            <div className="c-name">{c.name}</div>
            <div>
              <div className="c-delta">+{c.deltaC.toFixed(1)}°</div>
              <div className="c-surface">SURFACE · {c.surface}°C</div>
            </div>
          </div>
        ))}
      </div>
      <div className="c-notes">
        <div className="n">
          <div className="eyebrow">素材の影響</div>
          <div className="d">綿・リネンなど通気性の高い素材では、色による差は約30%小さくなります。</div>
        </div>
        <div className="n">
          <div className="eyebrow">今日のおすすめ</div>
          <div className="d">日射が強い日は、<strong>白・ベージュ系</strong>を選ぶと体感が約3°C下がります。</div>
        </div>
        <div className="n">
          <div className="eyebrow">冬の場合</div>
          <div className="d">気温10°C以下の晴天では、濃色を選ぶと日射を取り込み体感は +2°C ほどに。</div>
        </div>
      </div>
    </div>
  );
}

// Tweaks panel (floats outside phone frame)
const DEFAULT_M_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "paper",
  "clothing": "medium",
  "solarBoost": 0
}/*EDITMODE-END*/;

function TweaksM({ open, tweaks, setTweaks }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, width: 240,
      background: '#0f0f0f', color: '#f2f0ea',
      padding: '14px 16px 16px', fontSize: 12, zIndex: 200,
      boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
    }}>
      <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 400, fontStyle: 'italic', margin: '0 0 12px', fontSize: 16 }}>Tweaks</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
        <label style={{ color: '#b8b8b8', fontSize: 11 }}>Theme</label>
        <select style={tSel} value={tweaks.theme} onChange={e => setTweaks({ ...tweaks, theme: e.target.value })}>
          <option value="paper">Paper</option><option value="snow">Snow</option><option value="ink">Ink</option>
        </select>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
        <label style={{ color: '#b8b8b8', fontSize: 11 }}>服装</label>
        <select style={tSel} value={tweaks.clothing} onChange={e => setTweaks({ ...tweaks, clothing: e.target.value })}>
          <option value="light">軽装</option><option value="medium">通常</option><option value="heavy">厚着</option>
        </select>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0', gap: 8 }}>
        <label style={{ color: '#b8b8b8', fontSize: 11 }}>日射ブースト</label>
        <input type="range" min="-3" max="3" step="0.5" value={tweaks.solarBoost}
          onChange={e => setTweaks({ ...tweaks, solarBoost: parseFloat(e.target.value) })}
          style={{ width: 120, accentColor: '#d94b1a' }} />
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>{tweaks.solarBoost > 0 ? '+' : ''}{tweaks.solarBoost}°</span>
      </div>
    </div>
  );
}
const tSel = {
  background: 'transparent', color: '#f2f0ea',
  border: '1px solid #444', padding: '2px 6px',
  fontFamily: 'JetBrains Mono', fontSize: 11,
};

ReactDOM.createRoot(document.getElementById('root')).render(<MobileApp />);
