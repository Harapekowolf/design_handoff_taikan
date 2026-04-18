// Hourly + Weekly screens

function HourlyScreen({ tweaks }) {
  const hours = window.APP_DATA.hourly;
  const nowH = window.APP_DATA.now;
  const nowHour = 14;

  const width = 880;
  const height = 280;
  const padL = 40, padR = 10, padT = 20, padB = 30;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const yMin = 12, yMax = 34;
  const x = (i) => padL + (i / (hours.length - 1)) * innerW;
  const y = (v) => padT + (1 - (v - yMin) / (yMax - yMin)) * innerH;

  const mk = (key) => hours.map((h, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(h[key])}`).join(' ');
  const sunPath = mk('sun');
  const shadePath = mk('shade');
  const airPath = mk('air');

  const yTicks = [15, 20, 25, 30];

  return (
    <div className="screen">
      <div className="hourly-head">
        <h2>1時間ごとの体感</h2>
        <div className="legend">
          <span><span className="swatch sw-sun"></span>日向</span>
          <span><span className="swatch sw-shade"></span>日陰</span>
          <span><span className="swatch sw-air"></span>気温</span>
        </div>
      </div>

      <div className="chart-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block' }}>
          {/* y gridlines */}
          {yTicks.map(v => (
            <g key={v}>
              <line x1={padL} x2={width - padR} y1={y(v)} y2={y(v)} stroke="#efede8" strokeWidth="1" />
              <text x={padL - 8} y={y(v) + 3} textAnchor="end" fontSize="10" fill="#8a8a8a" fontFamily="JetBrains Mono">{v}°</text>
            </g>
          ))}

          {/* sunrise/sunset shading */}
          <rect x={x(0)} y={padT} width={x(1.5) - x(0)} height={innerH} fill="#0f0f0f" opacity="0.03" />
          <rect x={x(12.5)} y={padT} width={x(15) - x(12.5)} height={innerH} fill="#0f0f0f" opacity="0.03" />

          {/* now line */}
          <line x1={x(nowHour - 6)} x2={x(nowHour - 6)} y1={padT} y2={padT + innerH} stroke="#d94b1a" strokeDasharray="3 3" strokeWidth="1" />
          <text x={x(nowHour - 6) + 4} y={padT + 10} fontSize="9" fill="#d94b1a" fontFamily="JetBrains Mono" letterSpacing="0.08em">NOW · 14:20</text>

          {/* air temp dashed */}
          <path d={airPath} fill="none" stroke="#8a8a8a" strokeWidth="1" strokeDasharray="3 3" />

          {/* shade solid black */}
          <path d={shadePath} fill="none" stroke="#0f0f0f" strokeWidth="1.6" />

          {/* sun solid accent */}
          <path d={sunPath} fill="none" stroke="#d94b1a" strokeWidth="2" />

          {/* current dot */}
          <circle cx={x(nowHour - 6)} cy={y(nowH.feelsLikeSun)} r="4" fill="#d94b1a" />
          <circle cx={x(nowHour - 6)} cy={y(nowH.feelsLikeShade)} r="3" fill="#0f0f0f" />

          {/* x ticks — every 3h */}
          {hours.map((h, i) => i % 3 === 0 && (
            <text key={i} x={x(i)} y={height - 10} textAnchor="middle" fontSize="10" fill="#8a8a8a" fontFamily="JetBrains Mono">{String(h.h).padStart(2,'0')}:00</text>
          ))}
        </svg>

        <div className="hourly-strip">
          {hours.map((h, i) => (
            <div key={i} className={h.h === nowHour ? 'now' : ''}>
              <span className="h-sun">{h.sun.toFixed(0)}°</span>
              <span className="h-shade">{h.shade.toFixed(0)}°</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
        <InsightBlock
          title="日差しのピーク"
          value="13:00 – 14:00"
          detail="日向と日陰で最大 +6.3°C の差。帽子・日傘があると体感は2°C下がります。"
        />
        <InsightBlock
          title="涼しくなる時間"
          value="18:00 以降"
          detail="日没とともに日射の寄与がゼロに。気温と体感がほぼ一致します。"
        />
        <InsightBlock
          title="風の影響"
          value="南南西 2–3 m/s"
          detail="弱い風のため冷却効果は限定的。−0.3°Cほど。"
        />
      </div>
    </div>
  );
}

function InsightBlock({ title, value, detail }) {
  return (
    <div>
      <div className="eyebrow">{title}</div>
      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28, marginTop: 6, marginBottom: 8, letterSpacing: '-0.01em' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.6, maxWidth: 260 }}>{detail}</div>
    </div>
  );
}

function WeeklyScreen() {
  const week = window.APP_DATA.weekly;

  // scale feels-like across the week for the bar
  const allMax = Math.max(...week.map(w => w.sun));
  const allMin = Math.min(...week.map(w => w.air));

  return (
    <div className="screen">
      <div className="hourly-head">
        <h2>週間予報 · 体感</h2>
        <div className="legend">
          <span><span className="swatch sw-sun"></span>日向体感</span>
          <span><span className="swatch sw-shade" style={{ background: '#8a8a8a' }}></span>気温</span>
        </div>
      </div>

      <div className="weekly-list">
        {week.map((w, i) => {
          const cls = w.day === '土' ? 'sat' : w.day === '日' ? 'sun' : '';
          const rng = allMax - allMin;
          const airLeft = ((w.min - allMin) / rng) * 100;
          const airWidth = ((w.max - w.min) / rng) * 100;
          const sunLeft = airLeft;
          const sunWidth = ((w.sun - w.min) / rng) * 100;
          return (
            <div key={i} className={`week-row ${cls}`}>
              <div className="wday">{w.day}</div>
              <div className="wdate">{w.date}</div>
              <div className="cond">
                <CondGlyph cond={w.cond} />
                <span style={{ marginLeft: 10 }}>{w.note}</span>
              </div>
              <div className="range">
                <span>{w.min.toFixed(0)}°</span>
                <span style={{ color: 'var(--ink-5)' }}>—</span>
                <span>{w.max.toFixed(0)}°</span>
              </div>
              <div className="feels-bar">
                <div className="fb-air" style={{ left: `${airLeft}%`, width: `${airWidth}%` }} />
                <div className="fb-sun" style={{ left: `${sunLeft}%`, width: `${sunWidth}%`, height: 2 }} />
              </div>
              <div className="feels-num">
                {w.sun.toFixed(1)}<span className="unit">°C</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 32, display: 'flex', gap: 40, paddingTop: 20, borderTop: '1px solid var(--rule)' }}>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">週のポイント</div>
          <p style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 20, color: 'var(--ink-2)', lineHeight: 1.5, margin: '10px 0 0' }}>
            火曜・水曜にぐっと冷え込みますが、金曜からは再び初夏の陽気。日向では連日25°Cを超えます。
          </p>
        </div>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">注意</div>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.7, margin: '10px 0 0' }}>
            日中の気温と体感の差が大きい日が続きます。屋外に長時間いる場合は帽子・水分を。
          </p>
        </div>
      </div>
    </div>
  );
}

function CondGlyph({ cond }) {
  const stroke = "#2b2b2b";
  const sw = "1.2";
  if (cond === 'sun') return (
    <svg width="20" height="20" viewBox="0 0 20 20" style={{ verticalAlign: 'middle' }} fill="none" stroke={stroke} strokeWidth={sw}>
      <circle cx="10" cy="10" r="3.2" />
      {[0,45,90,135,180,225,270,315].map(a => (
        <line key={a}
          x1={10 + Math.cos(a*Math.PI/180)*5.5} y1={10 + Math.sin(a*Math.PI/180)*5.5}
          x2={10 + Math.cos(a*Math.PI/180)*8}   y2={10 + Math.sin(a*Math.PI/180)*8} />
      ))}
    </svg>
  );
  if (cond === 'partly') return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={stroke} strokeWidth={sw}>
      <circle cx="7" cy="7" r="2.5" />
      <path d="M9 14a3.5 3.5 0 117 0h-7z" />
    </svg>
  );
  if (cond === 'cloud') return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={stroke} strokeWidth={sw}>
      <path d="M5 13a3 3 0 010-6 4 4 0 017-1.5 3 3 0 013 7H5z" />
    </svg>
  );
  if (cond === 'rain') return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={stroke} strokeWidth={sw}>
      <path d="M5 11a3 3 0 010-6 4 4 0 017-1.5 3 3 0 013 7H5z" />
      <line x1="7" y1="14" x2="6" y2="17" />
      <line x1="11" y1="14" x2="10" y2="17" />
      <line x1="14" y1="14" x2="13" y2="17" />
    </svg>
  );
  return null;
}

Object.assign(window, { HourlyScreen, WeeklyScreen, InsightBlock, CondGlyph });
