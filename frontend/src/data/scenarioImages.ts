// Central module for scenario backdrop images. All 15 are bundled regardless
// (Game.tsx references every scene), so importing this module anywhere costs
// nothing extra — it exists so pages/utilities can request a scene's backdrop
// by id for preloading.
//
// The images are served as WebP (converted from the source PNG/JPG at build time by
// `node scripts/optimize-images.mjs` — ~95% smaller with no visible quality drop).
// The original s*.png / s3.jpg files remain in the folder as the editable masters.
import s1 from '../assets/scenarios/s1.webp';
import s2 from '../assets/scenarios/s2.webp';
import s3 from '../assets/scenarios/s3.webp';
import s4 from '../assets/scenarios/s4.webp';
import s5 from '../assets/scenarios/s5.webp';
import s6 from '../assets/scenarios/s6.webp';
import s7 from '../assets/scenarios/s7.webp';
import s8 from '../assets/scenarios/s8.webp';
import s9 from '../assets/scenarios/s9.webp';
import s10 from '../assets/scenarios/s10.webp';
import s11 from '../assets/scenarios/s11.webp';
import s12 from '../assets/scenarios/s12.webp';
import s13 from '../assets/scenarios/s13.webp';
import s14 from '../assets/scenarios/s14.webp';
import s15 from '../assets/scenarios/s15.webp';

export const scenarioImages: Record<number, string> = {
  1: s1, 2: s2, 3: s3, 4: s4, 5: s5, 6: s6, 7: s7,
  8: s8, 9: s9, 10: s10, 11: s11, 12: s12, 13: s13, 14: s14, 15: s15,
};