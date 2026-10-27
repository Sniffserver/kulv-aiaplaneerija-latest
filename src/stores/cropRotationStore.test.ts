import { describe, it, expect, beforeEach } from 'vitest';
import { useCropRotationStore, INITIAL_SUCCESSION_SLOTS, INITIAL_BED_HISTORY } from './cropRotationStore';

describe('useCropRotationStore', () => {
  beforeEach(() => {
    useCropRotationStore.getState().resetToDemoHistory();
  });

  it('initializes with default year, region, and demo history', () => {
    const state = useCropRotationStore.getState();
    expect(state.selectedYear).toBe(2026);
    expect(state.selectedRegion).toBe('central');
    expect(state.defaultProtection).toBe('none');
    expect(state.successionSlots.length).toBeGreaterThan(0);
    expect(state.historyRecords.length).toBeGreaterThan(0);
  });

  it('updates selected year, region, and protection mode', () => {
    const store = useCropRotationStore.getState();
    store.setSelectedYear(2027);
    expect(useCropRotationStore.getState().selectedYear).toBe(2027);

    store.setSelectedRegion('islands');
    expect(useCropRotationStore.getState().selectedRegion).toBe('islands');

    store.setDefaultProtection('greenhouse');
    expect(useCropRotationStore.getState().defaultProtection).toBe('greenhouse');
  });

  it('adds, updates, and deletes succession slots', () => {
    const store = useCropRotationStore.getState();

    const newSlotId = store.addSuccessionSlot({
      bedId: 'bed_test_1',
      year: 2026,
      seasonSlot: 'main_crop',
      plantId: 'till',
      plantName: 'Aedtill',
      plantNameEn: 'Dill',
      plantIcon: '🌿',
      botanicalFamily: 'Apiaceae',
      guild: 'light_feeder',
      sowDate: '06-01',
      harvestDate: '07-15',
      daysToMaturity: 45,
      protectionType: 'none',
      notes: 'Hiline tilli külv'
    });

    expect(newSlotId).toBeDefined();
    const added = useCropRotationStore.getState().successionSlots.find((s) => s.id === newSlotId);
    expect(added).toBeDefined();
    expect(added?.plantId).toBe('till');
    expect(added?.bedId).toBe('bed_test_1');

    // Update slot
    useCropRotationStore.getState().updateSuccessionSlot(newSlotId, {
      notes: 'Katteloori all kiiremaks kasvuks',
      protectionType: 'fleece'
    });
    const updated = useCropRotationStore.getState().successionSlots.find((s) => s.id === newSlotId);
    expect(updated?.notes).toBe('Katteloori all kiiremaks kasvuks');
    expect(updated?.protectionType).toBe('fleece');

    // Delete slot
    useCropRotationStore.getState().deleteSuccessionSlot(newSlotId);
    const deleted = useCropRotationStore.getState().successionSlots.find((s) => s.id === newSlotId);
    expect(deleted).toBeUndefined();
  });

  it('sets and updates bed year history records without duplicates', () => {
    const store = useCropRotationStore.getState();

    store.setBedYearHistory('bed_test_hist', 2025, [
      {
        plantId: 'hernes',
        plantName: 'Aedhernes',
        plantNameEn: 'Green Pea',
        plantIcon: '🫛',
        family: 'Fabaceae',
        guild: 'nitrogen_fixer'
      }
    ]);

    let record = useCropRotationStore
      .getState()
      .historyRecords.find((r) => r.bedId === 'bed_test_hist' && r.year === 2025);
    expect(record).toBeDefined();
    expect(record?.plantings[0].plantId).toBe('hernes');

    // Overwrite with different crop in the same year
    store.setBedYearHistory('bed_test_hist', 2025, [
      {
        plantId: 'uba',
        plantName: 'Põlduba',
        plantNameEn: 'Broad Bean',
        plantIcon: '🫘',
        family: 'Fabaceae',
        guild: 'nitrogen_fixer'
      }
    ]);

    const matchingRecords = useCropRotationStore
      .getState()
      .historyRecords.filter((r) => r.bedId === 'bed_test_hist' && r.year === 2025);
    expect(matchingRecords.length).toBe(1);
    expect(matchingRecords[0].plantings[0].plantId).toBe('uba');
  });

  it('duplicates rotation succession plan from one year to the next', () => {
    const store = useCropRotationStore.getState();

    // Ensure 2026 has slots
    const slots2026 = store.successionSlots.filter((s) => s.year === 2026);
    expect(slots2026.length).toBeGreaterThan(0);

    store.duplicateYearToNext(2026, 2027);

    const slots2027 = useCropRotationStore.getState().successionSlots.filter((s) => s.year === 2027);
    expect(slots2027.length).toBe(slots2026.length);
    expect(slots2027[0].year).toBe(2027);
    expect(slots2027[0].id).not.toBe(slots2026[0].id);
  });

  it('resets to demo history properly', () => {
    const store = useCropRotationStore.getState();
    store.setSelectedYear(2030);
    store.deleteSuccessionSlot(INITIAL_SUCCESSION_SLOTS[0].id);

    store.resetToDemoHistory();

    const resetState = useCropRotationStore.getState();
    expect(resetState.selectedYear).toBe(2026);
    expect(resetState.successionSlots.length).toBe(INITIAL_SUCCESSION_SLOTS.length);
    expect(resetState.historyRecords.length).toBe(INITIAL_BED_HISTORY.length);
  });
});
