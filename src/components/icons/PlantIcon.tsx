import type { ComponentType } from 'react';
import {
  CarrotIcon,
  TomatoIcon,
  CucumberIcon,
  LettuceIcon,
  RadishIcon,
  PeaIcon,
  BeanIcon,
  OnionIcon,
  GarlicIcon,
  StrawberryIcon,
  BasilIcon,
  PotatoIcon
} from './PlantIcons';
import {
  ChiliIcon,
  PumpkinIcon,
  ZucchiniIcon,
  BeetrootIcon,
  KaleIcon,
  SpinachIcon,
  BlueberryIcon,
  AppleIcon,
  HerbPotIcon,
  FlowerIcon,
  SeedlingIcon,
  SproutIcon
} from './PlantIconsExtra';
import type { IconProps } from './IconBase';

export const plantIconMap: Record<string, ComponentType<IconProps>> = {
  // Core plants (English & Estonian mappings)
  carrot: CarrotIcon,
  porgand: CarrotIcon,
  tomato: TomatoIcon,
  tomat: TomatoIcon,
  cucumber: CucumberIcon,
  kurk: CucumberIcon,
  lettuce: LettuceIcon,
  salat: LettuceIcon,
  radish: RadishIcon,
  redis: RadishIcon,
  pea: PeaIcon,
  hernes: PeaIcon,
  bean: BeanIcon,
  uba: BeanIcon,
  onion: OnionIcon,
  sibul: OnionIcon,
  garlic: GarlicIcon,
  küüslauk: GarlicIcon,
  kuuslauk: GarlicIcon,
  strawberry: StrawberryIcon,
  maasikas: StrawberryIcon,
  basil: BasilIcon,
  basiilik: BasilIcon,
  potato: PotatoIcon,
  kartul: PotatoIcon,

  // Extra plants
  chili: ChiliIcon,
  tšilli: ChiliIcon,
  tsilli: ChiliIcon,
  pepper: ChiliIcon,
  pipar: ChiliIcon,
  pumpkin: PumpkinIcon,
  kõrvits: PumpkinIcon,
  korvits: PumpkinIcon,
  zucchini: ZucchiniIcon,
  suvikõrvits: ZucchiniIcon,
  suvikorvits: ZucchiniIcon,
  beetroot: BeetrootIcon,
  peet: BeetrootIcon,
  kale: KaleIcon,
  lehtkapsas: KaleIcon,
  spinach: SpinachIcon,
  spinat: SpinachIcon,
  blueberry: BlueberryIcon,
  mustikas: BlueberryIcon,
  apple: AppleIcon,
  õun: AppleIcon,
  oun: AppleIcon,
  herb: HerbPotIcon,
  ürdid: HerbPotIcon,
  urdid: HerbPotIcon,
  herbpot: HerbPotIcon,
  flower: FlowerIcon,
  lill: FlowerIcon,
  õis: FlowerIcon,
  ois: FlowerIcon,
  seedling: SeedlingIcon,
  seemik: SeedlingIcon,
  tõusmed: SeedlingIcon,
  sprout: SproutIcon,
  idu: SproutIcon
};

export type PlantIconProps = IconProps & {
  plantKey?: string;
};

export function PlantIcon({ plantKey, size = 20, ...props }: PlantIconProps) {
  const normalized = (plantKey ?? '').trim().toLowerCase();
  const IconComponent = plantIconMap[normalized] || CarrotIcon;
  return <IconComponent size={size} {...props} />;
}
