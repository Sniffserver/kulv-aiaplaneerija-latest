/**
 * Local Microclimate Calibration Engine for KÜLV.
 * Learns and adjusts regional Open-Meteo forecasts against local garden sensors (ESP32, BLE, Home Assistant, min/max thermometer).
 */

export interface MicroclimateSample {
  id: string;
  date: string;
  forecastMin: number;
  measuredMin: number;
  offset: number; // measuredMin - forecastMin
  environment: 'open_bed' | 'greenhouse' | 'cold_frame';
}

export interface MicroclimateProfile {
  name: string;
  averageNightOffset: number; // e.g. -2.0°C for cold pockets, +3.5°C for greenhouses
  terrainClassification: 'frost_pocket' | 'standard' | 'sheltered' | 'greenhouse';
  description: string;
  samplesCount: number;
  lastCalibratedDate?: string;
}

const STORAGE_KEY = 'kulv_microclimate_profile';

export const MicroclimateEngine = {
  /**
   * Evaluates the microclimate profile based on calibration samples.
   */
  calculateProfile(samples: MicroclimateSample[]): MicroclimateProfile {
    if (!samples || samples.length === 0) {
      return {
        name: 'Kalibreerimata (avamaa standard)',
        averageNightOffset: 0.0,
        terrainClassification: 'standard',
        description: 'Kasutatakse piirkondlikku Open-Meteo mudelit ilma lokaalse nihketa.',
        samplesCount: 0
      };
    }

    const totalOffset = samples.reduce((sum, s) => sum + s.offset, 0);
    const avgOffset = Math.round((totalOffset / samples.length) * 10) / 10;

    let terrainClassification: MicroclimateProfile['terrainClassification'] = 'standard';
    let name = 'Tavapärane mikrokliima';
    let description = 'Öised temperatuurid vastavad lähedalasuva ilmajaama prognoosile.';

    if (avgOffset <= -1.8) {
      terrainClassification = 'frost_pocket';
      name = 'Külmalohk / Orupõhi';
      description = `Lokaalne öine temperatuur on keskmiselt ${Math.abs(avgOffset)}°C jahedam kui piirkonna prognoosis (külma õhu kogunemine ja tugevam öökülmaoht).`;
    } else if (avgOffset >= 3.0) {
      terrainClassification = 'greenhouse';
      name = 'Kasvuhoone mikrokliima';
      description = `Kaitstud sisekliima hoiab öösel soojust keskmiselt +${avgOffset}°C kõrgemal kui avamaal.`;
    } else if (avgOffset >= 1.2) {
      terrainClassification = 'sheltered';
      name = 'Tuulevarjuline / Soe nõlv';
      description = `Lõunanõlv või hoonete tuulevari leevendab öist jahtumist umbes +${avgOffset}°C võrra.`;
    }

    return {
      name,
      averageNightOffset: avgOffset,
      terrainClassification,
      description,
      samplesCount: samples.length,
      lastCalibratedDate: samples[samples.length - 1]?.date
    };
  },

  /**
   * Adjusts a regional forecast temperature by applying the learned local microclimate offset.
   */
  adjustNightTemperature(forecastTemp: number, offset: number): number {
    return Math.round((forecastTemp + offset) * 10) / 10;
  },

  /**
   * Loads saved profile from local storage.
   */
  loadProfile(): MicroclimateProfile {
    try {
      if (typeof localStorage !== 'undefined') {
        const item = localStorage.getItem(STORAGE_KEY);
        if (item) return JSON.parse(item);
      }
    } catch {}
    return this.calculateProfile([]);
  },

  /**
   * Saves profile to local storage.
   */
  saveProfile(profile: MicroclimateProfile): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      }
    } catch {}
  }
};
