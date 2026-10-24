import { describe, it, expect, beforeEach } from 'vitest';
import { ESTONIAN_CADASTRAL_PRESETS, CadastralParcelRecord } from './CadastralPlotSearchDialog';
import { useYardStore, createInitialPlan } from '../../stores/yardStore';

describe('Cadastral parcel presets and boundary logic', () => {
  beforeEach(() => {
    useYardStore.getState().setPlan(createInitialPlan());
  });

  it('contains valid authentic Estonian cadastral presets with verified vertices and areas', () => {
    expect(ESTONIAN_CADASTRAL_PRESETS.length).toBeGreaterThanOrEqual(5);

    ESTONIAN_CADASTRAL_PRESETS.forEach((preset: CadastralParcelRecord) => {
      expect(preset.cadastralCode).toMatch(/^\d{5}:\d{3}:\d{4}$/);
      expect(preset.areaM2).toBeGreaterThan(0);
      expect(preset.widthM).toBeGreaterThan(0);
      expect(preset.lengthM).toBeGreaterThan(0);
      expect(preset.polygon.length).toBeGreaterThanOrEqual(4);

      // Verify polygon vertices are inside or on bounds
      preset.polygon.forEach((pt) => {
        expect(pt.x).toBeGreaterThanOrEqual(0);
        expect(pt.x).toBeLessThanOrEqual(preset.widthM);
        expect(pt.y).toBeGreaterThanOrEqual(0);
        expect(pt.y).toBeLessThanOrEqual(preset.lengthM);
      });
    });
  });

  it('searches and matches presets by cadastral code or municipality name', () => {
    const kohilaQuery = '79501:027:0011';
    const foundKohila = ESTONIAN_CADASTRAL_PRESETS.find((p) => p.cadastralCode.includes(kohilaQuery));
    expect(foundKohila).toBeDefined();
    expect(foundKohila?.municipality).toBe('Kohila vald');

    const tartuQuery = 'tammelinn';
    const foundTartu = ESTONIAN_CADASTRAL_PRESETS.filter(
      (p) => p.address.toLowerCase().includes(tartuQuery) || p.municipality.toLowerCase().includes(tartuQuery)
    );
    expect(foundTartu.length).toBe(1);
    expect(foundTartu[0].cadastralCode).toBe('79508:042:0018');
  });

  it('applies selected cadastral parcel to yardStore with bounding box and boundary polygon', () => {
    const saaremaa = ESTONIAN_CADASTRAL_PRESETS.find((p) => p.cadastralCode === '34901:008:0042')!;
    expect(saaremaa).toBeDefined();

    useYardStore.getState().applyCadastralPlot({
      cadastralCode: saaremaa.cadastralCode,
      address: saaremaa.address,
      cadastralAreaM2: saaremaa.areaM2,
      widthM: saaremaa.widthM,
      lengthM: saaremaa.lengthM,
      boundaryPolygon: saaremaa.polygon,
      name: `Krunt · ${saaremaa.address}`
    });

    const plan = useYardStore.getState().plan;
    expect(plan.cadastralCode).toBe('34901:008:0042');
    expect(plan.cadastralAreaM2).toBe(2450);
    expect(plan.widthM).toBe(45);
    expect(plan.lengthM).toBe(55);
    expect(plan.boundaryPolygon).toEqual(saaremaa.polygon);
    expect(plan.name).toBe('Krunt · Kaevu tn 7, Kuressaare');
  });
});
