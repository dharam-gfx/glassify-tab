import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Navigation,
  Sun,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStore } from '../state/store';
import { describeWeather, getWeather } from '../lib/weather';
import WidgetShell from './WidgetShell';

export function WeatherIcon( { code, isDay = true, size = 20 } ) {
  const props = { size, strokeWidth: 1.75 };
  if ( code === 0 ) return isDay ? <Sun {...props} color="#ffd60a" /> : <Moon {...props} color="#e5e5ea" />;
  if ( code <= 2 ) return isDay ? <CloudSun {...props} color="#ffd60a" /> : <CloudMoon {...props} />;
  if ( code === 3 ) return <Cloud {...props} />;
  if ( code <= 48 ) return <CloudFog {...props} />;
  if ( code <= 57 ) return <CloudDrizzle {...props} color="#64d2ff" />;
  if ( code <= 67 || ( code >= 80 && code <= 82 ) ) return <CloudRain {...props} color="#64d2ff" />;
  if ( code <= 77 || code === 85 || code === 86 ) return <CloudSnow {...props} />;
  return <CloudLightning {...props} color="#ffd60a" />;
}

export default function WeatherWidget( { span = 'span-2x2' } ) {
  const { settings } = useStore();
  const [state, setState] = useState( { status: 'loading' } );

  useEffect( () => {
    let live = true;
    setState( { status: 'loading' } );
    getWeather( { city: settings.weatherCity.trim(), unit: settings.tempUnit } )
      .then( ( data ) => live && setState( { status: 'ok', data } ) )
      .catch( ( err ) => live && setState( { status: 'error', error: err.message } ) );
    return () => {
      live = false;
    };
  }, [settings.weatherCity, settings.tempUnit] );

  if ( state.status === 'loading' ) {
    return (
      <WidgetShell span={span}>
        <div className="skeleton h-4 w-24" />
        <div className="skeleton mt-3 h-10 w-20" />
        <div className="skeleton mt-auto h-10 w-full" />
      </WidgetShell>
    );
  }

  if ( state.status === 'error' ) {
    return (
      <WidgetShell span={span} title="Weather">
        <p className="muted">Weather unavailable.</p>
        <p className="muted mt-1">{state.error}</p>
      </WidgetShell>
    );
  }

  const d = state.data;
  return (
    <WidgetShell span={span}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1 font-semibold" style={{ fontSize: 'var(--fs-footnote)' }}>
            <span className="truncate">{d.name}</span>
            <Navigation size={10} className="fill-current" />
          </div>
          <div className="font-light leading-none tracking-tight" style={{ fontSize: 'var(--fs-display)' }}>
            {d.temp}°
          </div>
        </div>
        <WeatherIcon code={d.code} isDay={d.isDay} size={24} />
      </div>
      <div className="mt-1 font-medium">{describeWeather( d.code )}</div>
      <div className="muted tabular-nums">
        H:{d.hi}° L:{d.lo}°
      </div>
      <div className="weather-hours">
        {d.hours.map( ( h ) => (
          <div key={h.label}>
            <span className="muted">{h.label}</span>
            <WeatherIcon code={h.code} isDay={h.isDay} size={16} />
            <span className="font-medium tabular-nums">{h.temp}°</span>
          </div>
        ) )}
      </div>
    </WidgetShell>
  );
}
