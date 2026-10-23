import { describe, it, expect, beforeEach } from 'vitest';
import { useYardStore, createInitialPlan } from '../../stores/yardStore';
import { useCropRotationStore } from '../../stores/cropRotationStore';
import { BOTANICAL_FAMILY_DETAILS } from '../../logic/cropRotationEngine';

describe('Garden Binder and Cadastral Documentation Data Contracts', () => {
  beforeEach(() => {
    useYardStore.getState().setPlan(createInitialPlan());
  });

  it('provides all necessary dossier metrics for the printable binder', () => {
    // Setup a parcel with boundary and metrics
    useYardStore.getState().applyCadastralPlot({
      cadastralCode: '79501:027:0011',
      address: 'Männiku tee 14, Kohila alev',
      cadastralAreaM2: 1850,
      widthM: 38,
      lengthM: 49,
      boundaryPolygon: [
        { x: 0, y: 0 },
        { x: 38, y: 0 },
        { x: 38, y: 49 },
        { x: 0, y: 49 }
      ],
      name: 'Männiku aed'
    });

    const plan = useYardStore.getState().plan;
    expect(plan.cadastralCode).toBe('79501:027:0011');
    expect(plan.cadastralAreaM2).toBe(1850);
    expect(plan.address).toBe('Männiku tee 14, Kohila alev');
    expect(plan.boundaryPolygon?.length).toBe(4);

    // Verify botanical families for companion matrix
    expect(BOTANICAL_FAMILY_DETAILS.Solanaceae.nameEt).toBe('Maavitsalised');
    expect(BOTANICAL_FAMILY_DETAILS.Brassicaceae.nameEt).toBe('Ristõielised');
    expect(BOTANICAL_FAMILY_DETAILS.Fabaceae.nameEt).toContain('Liblikõielised');
  });

  it('calculates succession slots correctly for bed documentation', () => {
    useCropRotationStore.getState().addSuccessionSlot({
      bedId: 'bed-1',
      plantId: 'tomato-1',
      plantName: 'Pihustomat',
      variety: 'Vilma',
      botanicalFamily: 'Solanaceae',
      guild: 'heavy_feeder',
      year: 2026,
      seasonSlot: 'main_crop',
      sowDate: '03-15',
      harvestDate: '08-20',
      daysToMaturity: 80,
      protectionType: 'greenhouse'
    });

    const slots = useCropRotationStore.getState().successionSlots;
    expect(slots.length).toBeGreaterThanOrEqual(1);

    const bedSlot = slots.find((s) => s.bedId === 'bed-1');
    expect(bedSlot).toBeDefined();
    expect(bedSlot?.plantName).toBe('Pihustomat');
    expect(bedSlot?.seasonSlot).toBe('main_crop');
  });
});
