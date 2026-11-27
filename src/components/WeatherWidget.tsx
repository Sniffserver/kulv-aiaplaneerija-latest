import React, { useState } from 'react';
import { WeatherInfo } from '../types';
import { AlertTriangle, CloudSun, RefreshCw, Droplets, Wind, Thermometer, MapPin, Calendar, Info } from 'lucide-react';

interface WeatherWidgetProps {
  weather: WeatherInfo;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather, isLoading = false, onRefresh }) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  const forecast = weather.dailyForecast || [];
  const selectedDay = forecast[selectedDayIndex] || forecast[0] || null;

  return (
    <div
      data-testid="weather_widget_card"
      style={{
        backgroundColor: 'var(--kulv-surface, #FFFDF8)',
        border: '1px solid var(--kulv-border, #C9BFA9)',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: 'var(--kulv-shadow-card, 0 1px 3px rgba(0,0,0,0.08))',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {/* Top Header: Location, Coordinates & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} aria-hidden="true" color="var(--kulv-primary, #4F6B45)" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
              {weather.locationName}
            </span>
            <span aria-hidden="true" style={{ color: 'var(--kulv-border, #C9BFA9)' }}>
              ·
            </span>
            <span style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
              {weather.lat.toFixed(2)}°N, {weather.lng.toFixed(2)}°E
            </span>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '2px' }}>
            {weather.isLive ? 'Reaalajas prognoos (Open-Meteo)' : 'Põhjamaine aiaprognoos'}
            {weather.lastUpdated && ` · Uuendatud ${weather.lastUpdated}`}
          </div>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Värskenda ilmateadet"
            aria-label="Värskenda ilmateadet"
            className="touch-target"
            style={{
              background: 'none',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              borderRadius: '8px',
              padding: '8px',
              cursor: isLoading ? 'wait' : 'pointer',
              color: 'var(--kulv-primary, #4F6B45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '44px',
              minHeight: '44px'
            }}
          >
            <RefreshCw
              size={15}
              aria-hidden="true"
              className={isLoading ? 'spin-animation' : ''}
              style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }}
            />
          </button>
        )}
      </div>

      {/* Main Temperature & Weather State */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
          borderRadius: '12px',
          padding: '12px 14px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ fontSize: '36px', fontWeight: 800, color: 'var(--kulv-text, #2A2E24)', lineHeight: 1 }}>
              {weather.temperature.toFixed(1)}°C
            </span>
            {weather.apparentTemperature !== undefined && (
              <span style={{ fontSize: '12px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                (tajutav {weather.apparentTemperature.toFixed(1)}°)
              </span>
            )}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--kulv-primary, #4F6B45)', marginTop: '4px' }}>
            {weather.weatherDescription}
          </div>
        </div>

        <div aria-hidden="true" style={{ fontSize: '42px', lineHeight: 1 }}>
          {weather.icon || <CloudSun size={42} color="var(--kulv-accent, #D97A3D)" />}
        </div>
      </div>

      {/* Weather Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontVariantNumeric: 'tabular-nums' }}>
        <div
          style={{
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            border: '1px solid var(--kulv-border, #C9BFA9)',
            borderRadius: '8px',
            padding: '6px 8px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: 'var(--kulv-text-muted, #5F675A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px'
            }}
          >
            <Thermometer size={11} aria-hidden="true" /> Maks/Min
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '2px' }}>
            {weather.tempMax}° / {weather.tempMin}°
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            border: '1px solid var(--kulv-border, #C9BFA9)',
            borderRadius: '8px',
            padding: '6px 8px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: 'var(--kulv-text-muted, #5F675A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px'
            }}
          >
            <Droplets size={11} aria-hidden="true" /> Õhuniiskus
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '2px' }}>{weather.relativeHumidity ?? 65}%</div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            border: '1px solid var(--kulv-border, #C9BFA9)',
            borderRadius: '8px',
            padding: '6px 8px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: 'var(--kulv-text-muted, #5F675A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px'
            }}
          >
            <Wind size={11} aria-hidden="true" /> Tuul
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '2px' }}>{weather.windSpeed} m/s</div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            border: '1px solid var(--kulv-border, #C9BFA9)',
            borderRadius: '8px',
            padding: '6px 8px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: 'var(--kulv-text-muted, #5F675A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px'
            }}
          >
            <span aria-hidden="true">🌧️</span> Sademed
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '2px' }}>{weather.precipitation} mm</div>
        </div>
      </div>

      {/* Multi-Day Weather Forecast Strip */}
      {forecast.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--kulv-text-muted, #5F675A)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Calendar size={12} aria-hidden="true" /> 7-päevane ilmaprognoos (vali päev):
            </span>
            {selectedDay && (
              <span style={{ fontSize: '10px', color: 'var(--kulv-primary, #4F6B45)', fontWeight: 600 }}>
                {selectedDay.dayName}: {selectedDay.weatherDescription}
              </span>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '4px',
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {forecast.map((day, idx) => {
              const isSelected = selectedDayIndex === idx;
              const isFreezing = day.tempMin <= 0;
              const hasFrostRisk =
                day.frostRisk === 'light' ||
                day.frostRisk === 'moderate' ||
                day.frostRisk === 'severe' ||
                day.tempMin <= 3;
              return (
                <button
                  key={day.date}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedDayIndex(idx)}
                  style={{
                    minWidth: '70px',
                    padding: '8px 4px',
                    borderRadius: '10px',
                    border: isSelected
                      ? '2px solid var(--kulv-primary, #4F6B45)'
                      : isFreezing
                        ? '1px solid var(--kulv-danger, #B85C33)'
                        : hasFrostRisk
                          ? '1px solid var(--kulv-accent, #D97A3D)'
                          : '1px solid var(--kulv-border, #C9BFA9)',
                    backgroundColor: isSelected
                      ? 'var(--kulv-accent-soft, #F3D8C2)'
                      : isFreezing
                        ? 'var(--kulv-accent-soft, #F3D8C2)'
                        : 'var(--kulv-surface-muted, #EFE6D4)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                    {day.dayName}
                  </span>
                  <span aria-hidden="true" style={{ fontSize: '18px' }}>{day.icon}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                    {day.tempMax}°
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      color: isFreezing
                        ? 'var(--kulv-danger-text, #8C1D18)'
                        : hasFrostRisk
                          ? 'var(--kulv-accent-strong, #8F3E14)'
                          : 'var(--kulv-text-muted, #5F675A)',
                      fontWeight: hasFrostRisk ? 700 : 500
                    }}
                  >
                    öö {day.tempMin}° {isFreezing ? '❄️' : hasFrostRisk ? '⚠️' : ''}
                  </span>
                  {day.precipitationProbability !== undefined && day.precipitationProbability > 20 ? (
                    <span style={{ fontSize: '10px', color: 'var(--kulv-info-text, #0F556D)', fontWeight: 600 }}>
                      <span aria-hidden="true">🌧️</span> {day.precipitationProbability}%
                    </span>
                  ) : day.precipitationSum > 0 ? (
                    <span style={{ fontSize: '10px', color: 'var(--kulv-info-text, #0F556D)', fontWeight: 600 }}>
                      {day.precipitationSum}mm
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Weather Alerts & Warnings for Crops */}
      {weather.alerts && weather.alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {weather.alerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                backgroundColor: 'var(--kulv-accent-soft, #F3D8C2)',
                border: '1px solid var(--kulv-accent, #D97A3D)',
                padding: '10px 14px',
                borderRadius: '8px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
              }}
            >
              <AlertTriangle
                size={18}
                aria-hidden="true"
                color="var(--kulv-accent, #D97A3D)"
                style={{ flexShrink: 0, marginTop: '2px' }}
              />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                  {alert.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--kulv-text, #2A2E24)', marginTop: '2px' }}>
                  {alert.advice}
                </div>
                {alert.affectedCrops && (
                  <div style={{ fontSize: '11px', color: 'var(--kulv-text, #2A2E24)', marginTop: '2px' }}>
                    Mõjutatud: {alert.affectedCrops}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Agricultural Advice / Garden Tips */}
      {weather.tips && weather.tips.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--kulv-primary-soft, #E2ECE3)',
            border: '1px solid var(--kulv-border, #C9BFA9)',
            borderRadius: '10px',
            padding: '10px 12px',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start'
          }}
        >
          <Info size={16} aria-hidden="true" color="var(--kulv-primary-strong, #243D2B)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '12px', color: 'var(--kulv-text, #2A2E24)', lineHeight: 1.4 }}>{weather.tips[0]}</div>
        </div>
      )}
    </div>
  );
};
