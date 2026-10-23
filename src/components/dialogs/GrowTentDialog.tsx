import React, { useState, useEffect } from 'react';
import { X, Sprout, Thermometer, Droplet, Gauge, AlertTriangle, CheckCircle, Info, Sliders } from 'lucide-react';

interface GrowTentDialogProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export const GrowTentDialog: React.FC<GrowTentDialogProps> = ({ isOpen, onDismiss }) => {
  const [temperature, setTemperature] = useState<number>(22.5);
  const [humidity, setHumidity] = useState<number>(65);
  const [growthStage, setGrowthStage] = useState<'propagation' | 'vegetative' | 'flowering'>('vegetative');
  const [leafOffset, setLeafOffset] = useState<number>(-1.0); // Leaf temp is usually 1-2°C cooler due to transpiration

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onDismiss]);

  if (!isOpen) return null;

  // Saturated Vapor Pressure formula (Tetens equation in kPa):
  // VP = 0.61078 * exp((17.27 * T) / (T + 237.3))
  const calcVpSat = (temp: number) => {
    return 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
  };

  const leafTemp = temperature + leafOffset;
  const vpLeafSat = calcVpSat(leafTemp);
  const vpAirSat = calcVpSat(temperature);
  const vpAir = vpAirSat * (humidity / 100);
  const vpd = Math.max(0, vpLeafSat - vpAir);
  const vpdFormatted = vpd.toFixed(2);

  // Growth Stage Targets
  const stageTargets = {
    propagation: { min: 0.4, max: 0.8, name: 'Idanemine & Noored taimed' },
    vegetative: { min: 0.8, max: 1.2, name: 'Taimede vegetatiivne kasv' },
    flowering: { min: 1.2, max: 1.6, name: 'Õitsemine ja viljumine' }
  };

  const currentTarget = stageTargets[growthStage];
  let vpdStatus: 'low' | 'optimal' | 'high' = 'optimal';
  if (vpd < currentTarget.min) vpdStatus = 'low';
  else if (vpd > currentTarget.max) vpdStatus = 'high';

  const getStatusColor = () => {
    if (vpdStatus === 'optimal') return 'var(--kulv-primary, #4F6B45)';
    if (vpdStatus === 'low') return 'var(--kulv-info, #176B87)';
    return 'var(--kulv-danger, #B85C33)';
  };

  const getAdvice = () => {
    if (vpdStatus === 'optimal') {
      return `VPD on ${currentTarget.name} faasi jaoks ideaalne! Taimede õhulõhed on avatud ja toitainete vedu juurtest lehtedesse toimub maksimaalse efektiivsusega.`;
    }
    if (vpdStatus === 'low') {
      return `Õhk on liiga niiske või jahe (VPD < ${currentTarget.min} kPa). Transpiratsioon seiskub, lehtedele koguneb kondens ja suureneb seenhaiguste/hallituse oht. Tõsta temperatuuri või suurenda ruumi tuulutust.`;
    }
    return `Õhk on liiga kuiv või liiga kuum (VPD > ${currentTarget.max} kPa). Taim kaotab liiga kiiresti vett, sulgeb kaitseks õhulõhed ning fotosüntees aeglustub. Suurenda õhuniiskust või langeta valgustuse kuumust.`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ettekasvatus ja dünaamiline VPD kalkulaator"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 1000
      }}
      onClick={onDismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--kulv-surface, #FFFDF8)',
          borderRadius: '16px',
          border: '1px solid var(--kulv-border, #C9BFA9)',
          boxShadow: 'var(--kulv-shadow-card, 0 8px 30px rgba(0,0,0,0.25))',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(79, 107, 69, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--kulv-primary, #4F6B45)',
                flexShrink: 0
              }}
            >
              <Sprout size={22} />
            </div>
            <div>
              <h3
                className="font-serif-display"
                style={{ margin: 0, fontSize: '19px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}
              >
                Ettekasvatus & VPD Kalkulaator
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '2px' }}>
                Siseruumi, taimelambi ja kasvuhoone mikrokliima
              </div>
            </div>
          </div>
          <button
            onClick={onDismiss}
            aria-label="Sulge aken"
            className="touch-target"
            style={{
              background: 'none',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--kulv-text-muted, #5F675A)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Growth Stage Selector */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)', marginBottom: '6px' }}>
            Kasvufaas:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {[
              { id: 'propagation', label: 'Idanemine', target: '0.4–0.8 kPa' },
              { id: 'vegetative', label: 'Vegetatiivne', target: '0.8–1.2 kPa' },
              { id: 'flowering', label: 'Õitsemine', target: '1.2–1.6 kPa' }
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setGrowthStage(st.id as any)}
                style={{
                  padding: '8px 6px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: growthStage === st.id ? '1.5px solid var(--kulv-primary, #4F6B45)' : '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: growthStage === st.id ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-surface-muted, #EFE6D4)',
                  color: growthStage === st.id ? 'white' : 'var(--kulv-text, #2A2E24)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 700 }}>{st.label}</span>
                <span style={{ fontSize: '9px', opacity: 0.85 }}>{st.target}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic VPD Hero Gauge */}
        <div
          style={{
            backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
            borderRadius: '14px',
            padding: '16px',
            border: `1.5px solid ${getStatusColor()}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: getStatusColor() }}>
              Aurumise defitsiit (Vapor Pressure Deficit)
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
              <span style={{ fontSize: '34px', fontWeight: 900, color: 'var(--kulv-text, #2A2E24)', lineHeight: 1 }}>
                {vpdFormatted}
              </span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--kulv-text-muted, #5F675A)' }}>
                kPa
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '4px' }}>
              Sihtvahemik: <strong>{currentTarget.min} – {currentTarget.max} kPa</strong>
            </div>
          </div>

          <div
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              border: `1px solid ${getStatusColor()}`,
              color: getStatusColor(),
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              fontSize: '12px'
            }}
          >
            {vpdStatus === 'optimal' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            <span>
              {vpdStatus === 'optimal' ? 'Optimaalne' : vpdStatus === 'low' ? 'Liiga madal (niiske)' : 'Liiga kõrge (kuiv)'}
            </span>
          </div>
        </div>

        {/* Interactive Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Temperature Slider */}
          <div
            style={{
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              borderRadius: '10px',
              padding: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                <Thermometer size={16} color="var(--kulv-primary, #4F6B45)" /> Õhutemperatuur
              </span>
              <strong style={{ fontSize: '14px', color: 'var(--kulv-primary, #4F6B45)' }}>
                {temperature.toFixed(1)}°C
              </strong>
            </div>
            <input
              type="range"
              min={12}
              max={36}
              step={0.5}
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '2px' }}>
              <span>12°C (Jahe)</span>
              <span>22°C (Mugav)</span>
              <span>36°C (Kuum)</span>
            </div>
          </div>

          {/* Humidity Slider */}
          <div
            style={{
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              borderRadius: '10px',
              padding: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                <Droplet size={16} color="var(--kulv-info, #176B87)" /> Suhteline õhuniiskus
              </span>
              <strong style={{ fontSize: '14px', color: 'var(--kulv-info, #176B87)' }}>
                {humidity}%
              </strong>
            </div>
            <input
              type="range"
              min={20}
              max={95}
              step={1}
              value={humidity}
              onChange={(e) => setHumidity(parseInt(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '2px' }}>
              <span>20% (Väga kuiv)</span>
              <span>60% (Tasakaalus)</span>
              <span>95% (Küllastunud)</span>
            </div>
          </div>
        </div>

        {/* Actionable Agronomic Advice */}
        <div
          style={{
            backgroundColor: 'rgba(79, 107, 69, 0.08)',
            border: '1px solid var(--kulv-border, #C9BFA9)',
            padding: '12px 14px',
            borderRadius: '10px',
            fontSize: '12px',
            color: 'var(--kulv-text, #2A2E24)',
            lineHeight: 1.45
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px', color: 'var(--kulv-text, #2A2E24)' }}>
            <Info size={15} color="var(--kulv-primary, #4F6B45)" />
            <span>Agronoomi soovitus antud näitudele:</span>
          </div>
          {getAdvice()}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button
            onClick={onDismiss}
            style={{
              padding: '8px 22px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--kulv-primary, #4F6B45)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px'
            }}
          >
            Valmis
          </button>
        </div>
      </div>
    </div>
  );
};
