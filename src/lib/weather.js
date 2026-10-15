import { storage } from '../state/storage';

const CACHE_MS = 30 * 60 * 1000;
const FALLBACK = { name: 'San Francisco', latitude: 37.7749, longitude: -122.4194 };

async function geocode(city) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
  );
  if (!res.ok) throw new Error('Location lookup failed');
  const place = (await res.json()).results?.[0];
  if (!place) throw new Error(`"${city}" not found`);
  return { name: place.name, latitude: place.latitude, longitude: place.longitude };
}

function locate() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ name: null, latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => resolve(null),
      { timeout: 6000, maximumAge: 60 * 60 * 1000 }
    );
  });
}

const hourLabel = (iso) => {
  const h = Number(iso.slice(11, 13));
  return `${h % 12 || 12}${h < 12 ? 'AM' : 'PM'}`;
};

export async function getWeather({ city, unit }) {
  const cacheKey = `${city || 'auto'}|${unit}`;
  const { weatherCache } = await storage.get('local', ['weatherCache']);
  if (weatherCache?.key === cacheKey && Date.now() - weatherCache.at < CACHE_MS) return weatherCache.data;

  const place = city ? await geocode(city) : (await locate()) ?? FALLBACK;
  const params = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    current: 'temperature_2m,weather_code,is_day',
    hourly: 'temperature_2m,weather_code,is_day',
    daily: 'temperature_2m_max,temperature_2m_min',
    temperature_unit: unit,
    timezone: 'auto',
    forecast_days: '2',
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error('Weather service unavailable');
  const json = await res.json();

  const nowHour = json.current.time.slice(0, 13);
  const start = Math.max(0, json.hourly.time.findIndex((t) => t.slice(0, 13) >= nowHour));
  const hours = [1, 2, 3, 4]
    .map((k) => start + k * 3)
    .filter((i) => i < json.hourly.time.length)
    .map((i) => ({
      label: hourLabel(json.hourly.time[i]),
      temp: Math.round(json.hourly.temperature_2m[i]),
      code: json.hourly.weather_code[i],
      isDay: !!json.hourly.is_day[i],
    }));

  const data = {
    name: place.name ?? json.timezone.split('/').pop().replace(/_/g, ' '),
    temp: Math.round(json.current.temperature_2m),
    code: json.current.weather_code,
    isDay: !!json.current.is_day,
    hi: Math.round(json.daily.temperature_2m_max[0]),
    lo: Math.round(json.daily.temperature_2m_min[0]),
    hours,
  };
  await storage.set('local', { weatherCache: { key: cacheKey, at: Date.now(), data } });
  return data;
}

export function describeWeather(code) {
  if (code === 0) return 'Clear';
  if (code <= 2) return 'Partly Cloudy';
  if (code === 3) return 'Cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 57) return 'Drizzle';
  if (code <= 67 || (code >= 80 && code <= 82)) return 'Rain';
  if (code <= 77 || code === 85 || code === 86) return 'Snow';
  return 'Thunderstorm';
}
