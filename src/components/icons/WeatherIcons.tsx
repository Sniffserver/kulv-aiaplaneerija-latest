import { IconBase, type IconProps } from './IconBase';

export function ClearSkyIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2" />
      <path d="M12 19v2" />
      <path d="M3 12h2" />
      <path d="M19 12h2" />
      <path d="M6 6l1.5 1.5" />
      <path d="M16.5 16.5 18 18" />
      <path d="M18 6l-1.5 1.5" />
      <path d="M7.5 16.5 6 18" />
    </IconBase>
  );
}

export function PartlyCloudyIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 2v1" />
      <path d="M3 8H2" />
      <path d="M4.5 4.5 3.8 3.8" />
      <path d="M7 17a4 4 0 0 1 0-8 5 5 0 0 1 9.6 1.4A3.5 3.5 0 0 1 17 17H7Z" />
    </IconBase>
  );
}

export function CloudyIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6 1.4A3.5 3.5 0 0 1 17 18H7Z" />
    </IconBase>
  );
}

export function RainIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 15a4 4 0 0 1 0-8 5 5 0 0 1 9.6 1.4A3.5 3.5 0 0 1 17 15H7Z" />
      <path d="M9 18v2" />
      <path d="M13 18v2" />
      <path d="M17 18v2" />
    </IconBase>
  );
}

export function LightRainIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 15a4 4 0 0 1 0-8 5 5 0 0 1 9.6 1.4A3.5 3.5 0 0 1 17 15H7Z" />
      <path d="M10 18v1" />
      <path d="M14 18v1" />
    </IconBase>
  );
}

export function ThunderstormIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 14a4 4 0 0 1 0-8 5 5 0 1 1 9.6 1.4A3.5 3.5 0 0 1 17 14H7Z" />
      <path d="M13 14l-3 4h3l-2 4" />
    </IconBase>
  );
}

export function SnowIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 15a4 4 0 0 1 0-8 5 5 0 0 1 9.6 1.4A3.5 3.5 0 0 1 17 15H7Z" />
      <path d="M9 19h.01" />
      <path d="M13 19h.01" />
      <path d="M17 19h.01" />
    </IconBase>
  );
}

export function WindIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 8h11a3 3 0 1 0-3-3" />
      <path d="M3 13h15a3 3 0 1 1-3 3" />
      <path d="M3 18h8" />
    </IconBase>
  );
}

export function FogIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 13a4 4 0 0 1 0-8 5 5 0 0 1 9.6 1.4A3.5 3.5 0 0 1 17 13H7Z" />
      <path d="M4 17h16" />
      <path d="M6 20h12" />
    </IconBase>
  );
}

export function FrostIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3v18" />
      <path d="M4 7l16 10" />
      <path d="M20 7 4 17" />
    </IconBase>
  );
}

export function HeatIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
    </IconBase>
  );
}

export function DewIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11Z" />
      <path d="M9 14a3 3 0 0 0 3 3" />
    </IconBase>
  );
}
