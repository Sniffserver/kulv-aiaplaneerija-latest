export type Language = 'et' | 'en';

export interface TranslationDict {
  [key: string]: {
    et: string;
    en: string;
  };
}

export const TRANSLATIONS: TranslationDict = {
  // Brand & Top Bar
  app_title: { et: 'KÜLV', en: 'KÜLV' },
  app_subtitle: { et: 'Põhjamaine aiaplaneerija', en: 'Nordic Garden Planner' },
  status_saved: { et: 'Salvestatud', en: 'Saved' },
  status_saving: { et: 'Salvestan...', en: 'Saving...' },
  status_error: { et: 'Salvestamine ebaõnnestus', en: 'Save failed' },

  // Navigation
  nav_home: { et: 'Kodu', en: 'Home' },
  nav_garden: { et: 'Aed & Peenrad', en: 'Garden & Beds' },
  nav_plants: { et: 'Taimed', en: 'Plants' },
  nav_calendar: { et: 'Kalender', en: 'Calendar' },
  nav_journal: { et: 'Päevik', en: 'Journal' },
  nav_blog: { et: 'Blogi & Teadus', en: 'Blog & Science' },

  // Top Actions
  action_soil_recipes: { et: 'Mullaretseptid ja leotised', en: 'Soil Recipes & Teas' },
  action_grow_tent: { et: 'Ettekasvatus & Telk', en: 'Grow Tent & Seedlings' },
  action_settings: { et: 'Seaded', en: 'Settings' },

  // Garden Views & Toolbar
  view_2d: { et: '2D Plaan', en: '2D Plan' },
  view_3d: { et: '3D Vaade', en: '3D View' },
  action_templates: { et: 'Aia näidismallid', en: 'Garden Presets' },
  action_add_bed: { et: 'Lisa peenar', en: 'Add Bed' },
  action_add_entity: { et: 'Lisa aiaobjekt', en: 'Add Yard Object' },
  action_undo: { et: 'Võta tagasi', en: 'Undo' },
  action_redo: { et: 'Tee uuesti', en: 'Redo' },
  action_zoom_in: { et: 'Suurenda', en: 'Zoom in' },
  action_zoom_out: { et: 'Vähenda', en: 'Zoom out' },
  action_fit_view: { et: 'Sobita', en: 'Fit view' },
  action_snap: { et: 'Nakkumine (0.5m)', en: 'Snap (0.5m)' },
  action_sun_simulation: { et: 'Päikese simulatsioon', en: 'Sun Simulation' },
  solar_hour: { et: 'Päikese kellaaeg', en: 'Solar Hour' },
  solar_shadows: { et: 'Varjude simulatsioon', en: 'Shadow Simulation' },

  // Companion Planting & Agronomy
  companion_harmony: { et: 'Peenra harmoonia', en: 'Bed Harmony' },
  companion_good: { et: 'Hea naaber (soodustab kasvu)', en: 'Good companion (supports growth)' },
  companion_bad: { et: 'Ebasoodne naaber (takistab kasvu)', en: 'Incompatible (inhibits growth)' },
  companion_neutral: { et: 'Neutraalne naaber', en: 'Neutral companion' },
  companion_conflicts_title: { et: 'Naabrustaimede hoiatused', en: 'Companion Plant Conflicts' },
  companion_synergy_summary: { et: 'Soodsad suhted ja kahjuripeletus', en: 'Synergies & Pest Deterrence' },
  crop_rotation_title: { et: 'Külvikorra kontroll', en: 'Crop Rotation Check' },
  crop_rotation_ok: { et: 'Külvikord on korras: antud taimeperekond ei ole siin 3 aastat kasvanud.', en: 'Crop rotation verified: this plant family has not grown here in 3 years.' },

  // Frost & Climate
  frost_risk_title: { et: 'Põhjamaine öökülmaoht', en: 'Nordic Frost Risk' },
  frost_free_period: { et: 'Öökülmavaba periood', en: 'Frost-free Period' },
  spring_frost_label: { et: 'Viimane kevadine öökülm', en: 'Last Spring Frost' },
  autumn_frost_label: { et: 'Esimene sügisene öökülm', en: 'First Autumn Frost' },
  gdd_title: { et: 'Efektiivsete temperatuuride summa (GDD)', en: 'Growing Degree Days (GDD)' },
  nordic_region_label: { et: 'Agrokliima piirkond', en: 'Agroclimatic Region' },
  region_north_coast: { et: 'Põhja-Eesti rannik (Tallinn, Lahemaa)', en: 'Northern Coast (Tallinn, Lahemaa)' },
  region_central: { et: 'Kesk-Eesti (Paide, Jõgeva)', en: 'Central (Paide, Jõgeva)' },
  region_southeast: { et: 'Lõuna- ja Kagu-Eesti (Tartu, Võru)', en: 'South-East (Tartu, Võru)' },
  region_islands: { et: 'Lääne-Eesti saared (Saaremaa, Hiiumaa)', en: 'Western Islands (Saaremaa, Hiiumaa)' },

  // Starter Garden Templates
  template_modal_title: { et: 'Vali aia terviklik näidismall', en: 'Select Starter Yard Preset' },
  template_modal_desc: { et: 'Laadi professionaalselt planeeritud põhjamaine krundipaigutus ühe klõpsuga.', en: 'Load a professionally planned Nordic yard layout with one click.' },
  template_orchard_title: { et: 'Klassikaline Eramaja Viljaaed', en: 'Nordic Family Orchard & Garden' },
  template_orchard_desc: { et: 'Elumaja põhjaküljel, 3 kõrgpeenart päikeses, kasvuhoone, viljapuud, marjapõõsad ja kompost.', en: 'House on northern boundary, 3 sunny raised beds, greenhouse, fruit trees, berry bushes and compost.' },
  template_urban_title: { et: 'Kompaktne Linna-Kõrgpeenarde Oaas', en: 'Compact Urban Raised-Bed Oasis' },
  template_urban_desc: { et: '4 ergonoomilist puitkõrgpeenart, terrassipotid ürtidele, sammasviljapuud ja vihmaveetünn.', en: '4 ergonomic wooden raised beds, herb patio planters, columnar fruit trees, and rain barrel.' },
  template_permaculture_title: { et: 'Maakodu Permakultuur & Suur Kasvuhoone', en: 'Rural Permaculture & Large Greenhouse' },
  template_permaculture_desc: { et: '6m kasvuhoone, soojapeenrad, looduslik veesilm mikrokliimale, hekk ja viljapuuaed.', en: '6m polycarbonate greenhouse, hugelkultur beds, natural microclimate pond, shelter hedge, and orchard.' },
  template_apply_btn: { et: 'Laadi see krundiplaan', en: 'Apply This Preset' },
  template_confirm: { et: 'Kas oled kindel, et soovid asendada praeguse plaani valitud näidismalliga?', en: 'Are you sure you want to replace current layout with this starter preset?' },
  template_success: { et: 'Näidismall edukalt laaditud!', en: 'Starter template loaded successfully!' },

  // Soil Recipes & Calculator
  soil_modal_title: { et: 'Mullaretseptid & Orgaanilised Leotised', en: 'Soil Recipes & Organic Teas' },
  soil_modal_subtitle: { et: 'Elav muld, külvisegud ja mikroobirikkad väetisteed', en: 'Living soil, seed mixes, and microbial liquid teas' },
  soil_cat_all: { et: 'Kõik retseptid', en: 'All Recipes' },
  soil_cat_soil: { et: 'Mullad & Substraadid', en: 'Soils & Substrates' },
  soil_cat_tea: { et: 'Väetisteed & Leotised', en: 'Fertilizer Teas' },
  soil_calc_batch_title: { et: 'Interaktiivne mahukalkulaator', en: 'Interactive Volume Calculator' },
  soil_calc_liters: { et: 'Vajalik maht liitrites (L)', en: 'Target volume in liters (L)' },
  soil_calc_bed_dims: { et: 'Või arvuta peenra mõõtude järgi', en: 'Or calculate by bed dimensions' },
  soil_calc_width: { et: 'Laius (m)', en: 'Width (m)' },
  soil_calc_length: { et: 'Pikkus (m)', en: 'Length (m)' },
  soil_calc_height: { et: 'Kõrgus (m)', en: 'Height (m)' },
  soil_calc_apply_dims: { et: 'Kasuta peenra mahtu', en: 'Use Bed Volume' },
  soil_base_ingredients: { et: 'Põhikoostisosad (alusvahekord)', en: 'Base Ingredients (ratio)' },
  soil_amendments: { et: 'Orgaanilised lisandid & mineraalid', en: 'Organic Amendments & Minerals' },
  soil_instructions: { et: 'Valmistamise ja laagerdamise juhend', en: 'Preparation & Application Guide' },
  soil_tea_ferment_title: { et: 'Käärimise & Valmimise Taimer', en: 'Brewing & Fermentation Guide' },

  // Crop Rotation & Succession Planner
  crop_rotation_planner_title: { et: 'Mitmeaastane viljavaheldus ja järjestikülv', en: 'Multi-Year Crop Rotation & Succession' },
  crop_rotation_planner_desc: { et: 'Interaktiivne ajajoon, sugukondade haigushoiatused ja öökülmapiirangud', en: 'Interactive timeline, botanical family disease alerts, and frost boundaries' },
  succession_add_slot: { et: 'Lisa järjestikülv', en: 'Add Succession Slot' },
  succession_season_early: { et: 'Varajane kevad', en: 'Early Spring' },
  succession_season_main: { et: 'Põhikultuur', en: 'Main Season' },
  succession_season_autumn: { et: 'Sügis & Vahekultuur', en: 'Autumn & Cover Crop' },
  frost_warning_spring: { et: 'Kevadine öökülmaoht', en: 'Spring Frost Hazard' },
  frost_warning_autumn: { et: 'Sügisene öökülmaoht', en: 'Autumn Frost Hazard' },
  frost_safe_window: { et: 'Ohutu avamaahooaeg', en: 'Safe Outdoor Season' },
  history_4yr_title: { et: '4 aasta peenra ajalugu', en: '4-Year Bed History' },

  // Common Actions
  btn_close: { et: 'Sulge', en: 'Close' },
  btn_save: { et: 'Salvesta', en: 'Save' },
  btn_cancel: { et: 'Loobu', en: 'Cancel' },
  btn_delete: { et: 'Kustuta', en: 'Delete' },
  btn_edit: { et: 'Muuda', en: 'Edit' }
};

export function getTranslation(key: string, lang: Language): string {
  const item = TRANSLATIONS[key];
  if (!item) return key;
  return item[lang] || item.et || key;
}
