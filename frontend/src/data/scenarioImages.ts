// Central module for scenario backdrop images. All 15 are bundled regardless
// (Game.tsx references every scene), so importing this module anywhere costs
// nothing extra — it exists so pages/utilities can request a scene's backdrop
// by id for preloading.
import s1 from '../assets/scenarios/s1.png';
import s2 from '../assets/scenarios/s2.png';
import s3 from '../assets/scenarios/s3.jpg';
import s4 from '../assets/scenarios/s4.png';
import s5 from '../assets/scenarios/s5.png';
import s6 from '../assets/scenarios/s6.png';
import s7 from '../assets/scenarios/s7.png';
import s8 from '../assets/scenarios/s8.png';
import s9 from '../assets/scenarios/s9.png';
import s10 from '../assets/scenarios/s10.png';
import s11 from '../assets/scenarios/s11.png';
import s12 from '../assets/scenarios/s12.png';
import s13 from '../assets/scenarios/s13.png';
import s14 from '../assets/scenarios/s14.png';
import s15 from '../assets/scenarios/s15.png';

export const scenarioImages: Record<number, string> = {
  1: s1, 2: s2, 3: s3, 4: s4, 5: s5, 6: s6, 7: s7,
  8: s8, 9: s9, 10: s10, 11: s11, 12: s12, 13: s13, 14: s14, 15: s15,
};