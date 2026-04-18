// Root App — router + tweaks

function Tweaks({ open, tweaks, setTweaks }) {
  return (
    <div className={`tweaks ${open ? 'open' : ''}`}>
      <h3>Tweaks</h3>
      <div className="row">
        <label>Theme</label>
        <select value={tweaks.theme} onChange={e => setTweaks({ ...tweaks, theme: e.target.value })}>
          <option value="paper">Paper</option>
          <option value="snow">Snow</option>
          <option value="ink">Ink</option>
        </select>
      </div>
      <div className="row">
        <label>Unit</label>
        <select value={tweaks.unit} onChange={e => setTweaks({ ...tweaks, unit: e.target.value })}>
          <option value="C">°C</option>
          <option value="F">°F</option>
        </select>
      </div>
      <div className="row">
        <label>位置</label>
        <select value={tweaks.inSun ? 'sun' : 'shade'} onChange={e => setTweaks({ ...tweaks, inSun: e.target.value === 'sun' })}>
          <option value="sun">日向</option>
          <option value="shade">日陰</option>
        </select>
      </div>
      <div className="row">
        <label>服装</label>
        <select value={tweaks.clothing} onChange={e => setTweaks({ ...tweaks, clothing: e.target.value })}>
          <option value="light">軽装</option>
          <option value="medium">通常</option>
          <option value="heavy">厚着</option>
        </select>
      </div>
      <div className="row">
        <label>日射ブースト</label>
        <input type="range" min="-3" max="3" step="0.5"
          value={tweaks.solarBoost}
          onChange={e => setTweaks({ ...tweaks, solarBoost: parseFloat(e.target.value) })} />
        <span className="val">{tweaks.solarBoost > 0 ? '+' : ''}{tweaks.solarBoost}°</span>
      </div>
    </div>
  );
}

const DEFAULT_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "paper",
  "unit": "C",
  "inSun": true,
  "clothing": "medium",
  "solarBoost": 0
}/*EDITMODE-END*/;

function App() {
  const [screen, setScreen] = React.useState(
    () => localStorage.getItem('taikan.screen') || 'home'
  );
  const [tweaks, setTweaks] = React.useState(DEFAULT_TWEAKS);
  const [tweaksOpen, setTweaksOpen] = React.useState(false);

  React.useEffect(() => {
    localStorage.setItem('taikan.screen', screen);
  }, [screen]);

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
      root.style.setProperty('--card', '#ffffff');
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
    home:   <HomeScreen tweaks={tweaks} />,
    hourly: <HourlyScreen tweaks={tweaks} />,
    weekly: <WeeklyScreen />,
    outfit: <OutfitScreen />,
    map:    <MapScreen />,
    colors: <ColorScreen />,
  };

  return (
    <ChromeWindow
      tabs={[{ title: 'taikan. — 体感温度' }, { title: 'weather.go.jp' }]}
      activeIndex={0}
      url="taikan.app/東京・渋谷"
      width={1180}
      height={760}
    >
      <div className="app" data-screen-label={screen}>
        <TopBar screen={screen} setScreen={setScreen} />
        {screens[screen]}
      </div>
      <Tweaks open={tweaksOpen} tweaks={tweaks} setTweaks={setTweaks} />
    </ChromeWindow>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
