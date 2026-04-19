// Real weather via Geolocation API + Open-Meteo (no API key required)
// Mutates window.APP_DATA with live data, dispatches 'weather:loaded' / 'weather:updated' events.

(function () {
  'use strict';

  const DEFAULT = { lat: 35.68, lon: 139.69, name: '東京' };

  const DIRS = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東',
                '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西'];
  const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

  window.WEATHER_STATE = { loading: true, error: null, source: 'dummy', lastUpdated: null };

  function degToJpDir(deg) {
    if (deg == null || isNaN(deg)) return '—';
    return DIRS[Math.round((deg % 360) / 22.5) % 16];
  }

  function feelsLikeSun(shade, solar) {
    return shade + (solar || 0) * 0.007;
  }

  function estimateDailySun(shadeMax, code) {
    const factors = { 0: 5.5, 1: 4.5, 2: 3.0, 3: 1.0 };
    const f = factors[code] != null ? factors[code] : (code <= 48 ? 0.5 : 0);
    return shadeMax + f;
  }

  function wmoToCond(code) {
    if (code === 0) return 'sun';
    if (code <= 2) return 'partly';
    if (code <= 48) return 'cloud';
    return 'rain';
  }

  function wmoToNote(code) {
    if (code === 0) return '晴れ';
    if (code === 1 || code === 2) return '晴れ時々曇り';
    if (code === 3) return '曇り';
    if (code >= 45 && code <= 48) return '霧';
    if (code >= 51 && code <= 57) return '霧雨';
    if (code >= 61 && code <= 67) return '雨';
    if (code >= 71 && code <= 77) return '雪';
    if (code >= 80 && code <= 82) return 'にわか雨';
    if (code >= 95) return '雷雨';
    return '—';
  }

  function getPosition() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve({ ...DEFAULT, fallback: true });
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, name: null }),
        () => resolve({ ...DEFAULT, fallback: true }),
        { timeout: 10000, maximumAge: 5 * 60 * 1000 }
      );
    });
  }

  async function reverseGeocode(lat, lon) {
    try {
      const res = await fetch(
        'https://api.bigdatacloud.net/data/reverse-geocode-client' +
        `?latitude=${lat}&longitude=${lon}&localityLanguage=ja`
      );
      if (!res.ok) throw new Error('geocode ' + res.status);
      const d = await res.json();
      const city = d.city || d.locality || '';
      const area = d.principalSubdivision || '';
      if (city && area && city !== area) return `${area}・${city}`;
      return city || area || `${lat.toFixed(2)},${lon.toFixed(2)}`;
    } catch (err) {
      return `${lat.toFixed(2)},${lon.toFixed(2)}`;
    }
  }

  async function fetchForecast(lat, lon) {
    const url = 'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${lat}&longitude=${lon}` +
      '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,uv_index,shortwave_radiation,weather_code,pressure_msl' +
      '&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,uv_index,shortwave_radiation,precipitation_probability,precipitation' +
      '&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,weather_code,sunrise,sunset' +
      '&timezone=auto&forecast_days=7&wind_speed_unit=ms';
    const res = await fetch(url);
    if (!res.ok) throw new Error('forecast ' + res.status);
    return res.json();
  }

  function applyForecast(data, locationName) {
    const cur = data.current;
    const h = data.hourly;
    const day = data.daily;

    const shadeFeel = cur.apparent_temperature;
    const sunFeel = feelsLikeSun(shadeFeel, cur.shortwave_radiation);
    // cur.time is "YYYY-MM-DDTHH:mm" in the location's local timezone (no TZ suffix).
    // Parse components directly to avoid local-vs-UTC interpretation differences.
    const [datePart, timePart = '00:00'] = cur.time.split('T');
    const [yr, mo, dy] = datePart.split('-').map(Number);
    const [hr, mn] = timePart.split(':').map(Number);
    const dow = new Date(Date.UTC(yr, mo - 1, dy)).getUTCDay();
    const timeLabel = `${yr}年${mo}月${dy}日(${DAY_LABELS[dow]}) ${String(hr).padStart(2, '0')}:${String(mn).padStart(2, '0')}`;
    const todayStr = datePart;

    window.APP_DATA.now = {
      timeLabel,
      location: locationName,
      airTemp: +(cur.temperature_2m.toFixed(1)),
      feelsLikeSun: +(sunFeel.toFixed(1)),
      feelsLikeShade: +(shadeFeel.toFixed(1)),
      humidity: Math.round(cur.relative_humidity_2m),
      windMS: +(cur.wind_speed_10m.toFixed(1)),
      windDir: degToJpDir(cur.wind_direction_10m),
      uv: Math.round(cur.uv_index || 0),
      solar: Math.round(cur.shortwave_radiation || 0),
      pressure: Math.round(cur.pressure_msl || 1013),
      sunrise: (day.sunrise[0] || '').slice(11, 16) || '—',
      sunset: (day.sunset[0] || '').slice(11, 16) || '—',
    };

    const hourlyOut = [];
    for (let i = 0; i < h.time.length; i++) {
      const [tDate, tTime = '00:00'] = h.time[i].split('T');
      if (tDate !== todayStr) continue;
      const hh = parseInt(tTime.slice(0, 2), 10);
      if (hh < 6 || hh > 21) continue;
      const shade = h.apparent_temperature[i];
      const solar = h.shortwave_radiation[i] || 0;
      hourlyOut.push({
        h: hh,
        air: +(h.temperature_2m[i].toFixed(1)),
        sun: +(feelsLikeSun(shade, solar).toFixed(1)),
        shade: +(shade.toFixed(1)),
        hum: Math.round(h.relative_humidity_2m[i]),
        wind: +(h.wind_speed_10m[i].toFixed(1)),
        solar: Math.round(solar),
        precipProb: h.precipitation_probability ? Math.round(h.precipitation_probability[i] || 0) : 0,
        precipMm: h.precipitation ? +((h.precipitation[i] || 0).toFixed(1)) : 0,
      });
    }
    if (hourlyOut.length >= 4) window.APP_DATA.hourly = hourlyOut;

    window.APP_DATA.weekly = day.time.map((tstr, i) => {
      const [y, m, dd] = tstr.split('-').map(Number);
      const dowI = new Date(Date.UTC(y, m - 1, dd)).getUTCDay();
      const shade = day.apparent_temperature_max[i];
      const code = day.weather_code[i];
      return {
        day: DAY_LABELS[dowI],
        date: `${m}/${dd}`,
        air: +((day.temperature_2m_max[i] + day.temperature_2m_min[i]) / 2).toFixed(1),
        sun: +(estimateDailySun(shade, code).toFixed(1)),
        shade: +(shade.toFixed(1)),
        min: +(day.temperature_2m_min[i].toFixed(1)),
        max: +(day.temperature_2m_max[i].toFixed(1)),
        cond: wmoToCond(code),
        note: wmoToNote(code),
      };
    });
  }

  async function fetchRegions() {
    const regions = window.APP_DATA.regions;
    const out = await Promise.all(regions.map(async (r) => {
      try {
        const url = 'https://api.open-meteo.com/v1/forecast' +
          `?latitude=${r.lat}&longitude=${r.lon}` +
          '&current=temperature_2m,apparent_temperature,shortwave_radiation' +
          '&timezone=auto&wind_speed_unit=ms';
        const res = await fetch(url);
        if (!res.ok) return r;
        const d = await res.json();
        const air = d.current.temperature_2m;
        const shade = d.current.apparent_temperature;
        const solar = d.current.shortwave_radiation;
        const feels = feelsLikeSun(shade, solar);
        return {
          ...r,
          air: +(air.toFixed(1)),
          feels: +(feels.toFixed(1)),
          delta: +((feels - air).toFixed(1)),
        };
      } catch (err) {
        return r;
      }
    }));
    window.APP_DATA.regions = out;
  }

  async function load() {
    const prevSource = (window.WEATHER_STATE && window.WEATHER_STATE.source) || 'dummy';
    window.WEATHER_STATE = {
      loading: true, error: null, source: prevSource,
      lastUpdated: window.WEATHER_STATE && window.WEATHER_STATE.lastUpdated,
    };
    window.dispatchEvent(new CustomEvent('weather:loading'));
    try {
      const pos = await getPosition();
      const [locName, forecast] = await Promise.all([
        pos.name ? Promise.resolve(pos.name) : reverseGeocode(pos.lat, pos.lon),
        fetchForecast(pos.lat, pos.lon),
      ]);
      applyForecast(forecast, locName);
      window.WEATHER_STATE = {
        loading: false, error: null,
        source: pos.fallback ? 'default' : 'gps',
        lastUpdated: Date.now(),
      };
      window.dispatchEvent(new CustomEvent('weather:loaded'));
      fetchRegions().then(() => {
        window.dispatchEvent(new CustomEvent('weather:updated'));
      }).catch(() => {});
    } catch (err) {
      console.warn('Weather load failed, using dummy data:', err);
      window.WEATHER_STATE = {
        loading: false, error: err.message || 'error', source: 'dummy',
        lastUpdated: window.WEATHER_STATE && window.WEATHER_STATE.lastUpdated,
      };
      window.dispatchEvent(new CustomEvent('weather:error'));
      window.dispatchEvent(new CustomEvent('weather:loaded'));
    }
  }

  window.refreshWeather = load;
  window.WEATHER_PROMISE = load();
})();
