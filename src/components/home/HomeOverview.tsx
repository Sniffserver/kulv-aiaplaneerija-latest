import { RaisedBedIcon, SunIcon, WateringIcon } from '../icons/GardenIcons';

type HomeOverviewProps = {
  bedCount: number;
  plantCount: number;
  taskCount: number;
  temperature?: number;
  weatherSummary?: string;
  onOpenGarden: () => void;
  onOpenTasks: () => void;
};

export function HomeOverview({
  bedCount,
  plantCount,
  taskCount,
  temperature,
  weatherSummary,
  onOpenGarden,
  onOpenTasks
}: HomeOverviewProps) {
  return (
    <div className="kulv-home-overview">
      <section className="kulv-card kulv-card--focus">
        <div className="kulv-card__header">
          <h2>Tänane fookus</h2>
          <span className="kulv-badge kulv-badge--accent">
            {taskCount} ülesannet
          </span>
        </div>

        <p className="kulv-card__description">
          {taskCount > 0
            ? 'Alusta tähtsaimast aiatoimest.'
            : 'Täna pole ühtegi ülesannet. Planeeri järgmist külvit.'}
        </p>

        <button
          type="button"
          className="kulv-button kulv-button--primary"
          onClick={onOpenTasks}
        >
          <WateringIcon size={18} />
          Ava ülesanded
        </button>
      </section>

      <section className="kulv-card">
        <div className="kulv-card__header">
          <h2>Aed</h2>
          <RaisedBedIcon className="kulv-icon" size={20} />
        </div>

        <dl className="kulv-stat-grid">
          <div>
            <dt>Peenrad</dt>
            <dd>{bedCount}</dd>
          </div>
          <div>
            <dt>Taimed</dt>
            <dd>{plantCount}</dd>
          </div>
        </dl>

        <button
          type="button"
          className="kulv-button kulv-button--secondary"
          onClick={onOpenGarden}
        >
          Ava aiaplaan
        </button>
      </section>

      <section className="kulv-card kulv-card--muted">
        <div className="kulv-card__header">
          <h2>Ilma</h2>
          <SunIcon className="kulv-icon--accent" size={20} />
        </div>

        <p className="kulv-card__description">
          {temperature !== undefined
            ? `${temperature}°C · ${weatherSummary ?? 'Ilmaandmed puuduvad'}`
            : 'Ilmaandmed pole veel saadaval.'}
        </p>
      </section>
    </div>
  );
}
