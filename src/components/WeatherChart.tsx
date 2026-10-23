import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { WeatherInfo } from '../types';
import { TrendingUp, AlertTriangle, ShieldCheck, Thermometer } from 'lucide-react';

interface WeatherChartProps {
  weather: WeatherInfo;
}

export const WeatherChart: React.FC<WeatherChartProps> = ({ weather }) => {
  const [chartMode, setChartMode] = useState<'daily' | 'hourly'>('daily');

  // Format 5-day daily forecast data for Recharts
  const dailyData = (weather.dailyForecast || []).slice(0, 5).map((d) => ({
    name: d.dayName,
    date: d.date,
    maks: d.tempMax,
    min: d.tempMin,
    sademed: d.precipitationSum,
    kirjeldus: d.weatherDescription,
    icon: d.icon,
    onKülmaoht: d.tempMin <= 4
  }));

  // Format hourly progression for Recharts if available
  const hourlyData = (weather.hourlyForecast || []).slice(0, 16).map((h) => ({
    name: h.time,
    temp: h.temp,
    onKülmaoht: h.temp <= 4
  }));

  const min5DayTemp = dailyData.length > 0 ? Math.min(...dailyData.map((d) => d.min)) : weather.tempMin;
  const max5DayTemp = dailyData.length > 0 ? Math.max(...dailyData.map((d) => d.maks)) : weather.tempMax;
  const hasFrostRisk = min5DayTemp <= 4;

  const CustomDailyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            border: '1px solid var(--kulv-border, #C9BFA9)',
            borderRadius: '10px',
            padding: '10px 12px',
            boxShadow: 'var(--kulv-shadow-card, 0 2px 8px rgba(0,0,0,0.15))',
            fontSize: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
            <span>{data.icon}</span>
            <span>{data.name} ({data.date})</span>
          </div>
          <div style={{ color: 'var(--kulv-accent, #D97A3D)', fontWeight: 600 }}>
            Päevane maks: {data.maks}°C
          </div>
          <div style={{ color: 'var(--kulv-primary, #4F6B45)', fontWeight: 600 }}>
            Öine miinimum: {data.min}°C
          </div>
          {data.sademed > 0 && (
            <div style={{ color: 'var(--kulv-info, #4F6B45)', fontSize: '11px', marginTop: '2px' }}>
              Sademed: {data.sademed} mm
            </div>
          )}
          <div style={{ color: 'var(--kulv-text-muted, #5F675A)', fontSize: '11px', marginTop: '2px' }}>
            {data.kirjeldus}
          </div>
          {data.onKülmaoht && (
            <div
              style={{
                marginTop: '4px',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--kulv-danger, #B85C33)',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <AlertTriangle size={12} /> Öökülmaoht!
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomHourlyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            border: '1px solid var(--kulv-border, #C9BFA9)',
            borderRadius: '8px',
            padding: '8px 10px',
            boxShadow: 'var(--kulv-shadow-card, 0 2px 6px rgba(0,0,0,0.12))',
            fontSize: '12px'
          }}
        >
          <div style={{ fontWeight: 600 }}>{data.name}</div>
          <div style={{ color: 'var(--kulv-primary, #4F6B45)', fontWeight: 700, marginTop: '2px' }}>
            Temperatuur: {data.temp}°C
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      data-testid="temperature_forecast_chart_card"
      style={{
        backgroundColor: 'var(--kulv-surface, #FFFDF8)',
        border: '1px solid var(--kulv-border, #C9BFA9)',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: 'var(--kulv-shadow-card, 0 1px 3px rgba(0,0,0,0.08))'
      }}
    >
      {/* Title & Mode Switcher */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TrendingUp size={18} color="var(--kulv-primary, #4F6B45)" />
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)', margin: 0 }}>
              5 päeva temperatuurikõver
            </h2>
            <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}>
              Asukoht: {weather.locationName} ({weather.lat.toFixed(2)}°N, {weather.lng.toFixed(2)}°E)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)', padding: '2px', borderRadius: '8px' }}>
          <button
            type="button"
            onClick={() => setChartMode('daily')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: chartMode === 'daily' ? 'var(--kulv-surface, #FFFDF8)' : 'transparent',
              color: chartMode === 'daily' ? 'var(--kulv-text, #2A2E24)' : 'var(--kulv-text-muted, #5F675A)',
              boxShadow: chartMode === 'daily' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            Max / Min
          </button>
          <button
            type="button"
            onClick={() => setChartMode('hourly')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: chartMode === 'hourly' ? 'var(--kulv-surface, #FFFDF8)' : 'transparent',
              color: chartMode === 'hourly' ? 'var(--kulv-text, #2A2E24)' : 'var(--kulv-text-muted, #5F675A)',
              boxShadow: chartMode === 'hourly' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            24h-48h kõver
          </button>
        </div>
      </div>

      {/* Recharts Visualization */}
      <div style={{ width: '100%', height: '190px' }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'daily' ? (
            <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--kulv-accent, #D97A3D)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--kulv-accent, #D97A3D)" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--kulv-primary, #4F6B45)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--kulv-primary, #4F6B45)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--kulv-border, #C9BFA9)" opacity={0.35} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--kulv-text-muted, #5F675A)' }} />
              <YAxis
                unit="°"
                domain={['auto', 'auto']}
                tick={{ fontSize: 11, fill: 'var(--kulv-text-muted, #5F675A)' }}
              />
              <Tooltip content={<CustomDailyTooltip />} />
              {/* Critical +4°C Frost Warning Reference Line */}
              <ReferenceLine
                y={4}
                stroke="#B4233A"
                strokeDasharray="4 4"
                label={{ value: '+4°C Öökülmapiir', position: 'insideTopRight', fill: '#B4233A', fontSize: 10, fontWeight: 700 }}
              />
              <Area
                type="monotone"
                dataKey="maks"
                name="Päevane max"
                stroke="var(--kulv-accent, #D97A3D)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorMax)"
              />
              <Area
                type="monotone"
                dataKey="min"
                name="Öine min"
                stroke="var(--kulv-primary, #4F6B45)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorMin)"
              />
            </AreaChart>
          ) : (
            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--kulv-primary, #4F6B45)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--kulv-primary, #4F6B45)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--kulv-border, #C9BFA9)" opacity={0.35} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--kulv-text-muted, #5F675A)' }} interval={2} />
              <YAxis
                unit="°"
                domain={['auto', 'auto']}
                tick={{ fontSize: 11, fill: 'var(--kulv-text-muted, #5F675A)' }}
              />
              <Tooltip content={<CustomHourlyTooltip />} />
              <ReferenceLine
                y={4}
                stroke="#B4233A"
                strokeDasharray="4 4"
                label={{ value: '+4°C Külm', position: 'insideTopRight', fill: '#B4233A', fontSize: 10, fontWeight: 700 }}
              />
              <Area
                type="monotone"
                dataKey="temp"
                stroke="var(--kulv-primary, #4F6B45)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorHourly)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend & Agricultural Summary Badges */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          paddingTop: '8px',
          borderTop: '1px solid var(--kulv-surface-muted, #EFE6D4)',
          fontSize: '11px'
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--kulv-accent, #D97A3D)' }} />
            <span style={{ color: 'var(--kulv-text-muted, #5F675A)' }}>Päevane tipp ({max5DayTemp}°C)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--kulv-primary, #4F6B45)' }} />
            <span style={{ color: 'var(--kulv-text-muted, #5F675A)' }}>Öine miinimum ({min5DayTemp}°C)</span>
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '10px',
            backgroundColor: hasFrostRisk ? 'var(--kulv-accent-soft, #F3D8C2)' : 'rgba(79, 107, 69, 0.12)',
            color: hasFrostRisk ? 'var(--kulv-danger, #B85C33)' : 'var(--kulv-primary, #4F6B45)'
          }}
        >
          {hasFrostRisk ? (
            <>
              <AlertTriangle size={12} />
              <span>Öökülmaoht lähiajal (min {min5DayTemp}°C)</span>
            </>
          ) : (
            <>
              <ShieldCheck size={12} />
              <span>Öökülma pole oodata</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
