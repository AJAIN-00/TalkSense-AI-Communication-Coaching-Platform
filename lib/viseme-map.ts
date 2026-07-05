/**
 * Viseme mapping for ARKit-compatible blend shapes
 * Maps phoneme groups to ARKit viseme morph target names
 * Used to drive mouth movements from SpeechSynthesis boundary events
 */

export type VisemeName =
  | 'viseme_sil'    // silence / rest
  | 'viseme_PP'     // P, B, M
  | 'viseme_FF'     // F, V
  | 'viseme_TH'     // TH (both)
  | 'viseme_DD'     // D, T, N, L
  | 'viseme_kk'     // K, G
  | 'viseme_CH'     // CH, J, SH, ZH
  | 'viseme_SS'     // S, Z
  | 'viseme_nn'     // N, NG
  | 'viseme_RR'     // R
  | 'viseme_aa'     // AH, AA (open mouth)
  | 'viseme_E'      // EH, AE
  | 'viseme_I'      // IH, IY
  | 'viseme_O'      // OW, AO (round mouth)
  | 'viseme_U';     // UW, UH (pursed)

// ARKit morph target names used in common GLB models (e.g., from Avaturn/RPM)
export const VISEME_NAMES: VisemeName[] = [
  'viseme_sil', 'viseme_PP', 'viseme_FF', 'viseme_TH',
  'viseme_DD', 'viseme_kk', 'viseme_CH', 'viseme_SS',
  'viseme_nn', 'viseme_RR', 'viseme_aa', 'viseme_E',
  'viseme_I', 'viseme_O', 'viseme_U',
];

/**
 * Maps common English phoneme letters/patterns to viseme names.
 * Used for real-time estimation from SpeechSynthesis word boundaries.
 */
export const PHONEME_TO_VISEME: Record<string, VisemeName> = {
  // Bilabials
  p: 'viseme_PP', b: 'viseme_PP', m: 'viseme_PP',
  // Labiodentals
  f: 'viseme_FF', v: 'viseme_FF',
  // Dentals
  th: 'viseme_TH',
  // Alveolars
  d: 'viseme_DD', t: 'viseme_DD', n: 'viseme_DD', l: 'viseme_DD',
  // Velars
  k: 'viseme_kk', g: 'viseme_kk', q: 'viseme_kk',
  // Affricates / Sibilants
  ch: 'viseme_CH', j: 'viseme_CH', sh: 'viseme_CH', zh: 'viseme_CH',
  s: 'viseme_SS', z: 'viseme_SS', x: 'viseme_SS',
  // Nasals
  ng: 'viseme_nn',
  // Rhotics
  r: 'viseme_RR', w: 'viseme_RR',
  // Vowels — open
  a: 'viseme_aa', ah: 'viseme_aa',
  // Vowels — mid-front
  e: 'viseme_E', ae: 'viseme_E',
  // Vowels — high-front
  i: 'viseme_I', ee: 'viseme_I', y: 'viseme_I',
  // Vowels — round
  o: 'viseme_O', ow: 'viseme_O',
  // Vowels — high-back
  u: 'viseme_U', oo: 'viseme_U',
  // Silence / h
  h: 'viseme_sil',
};

/**
 * Estimate viseme from a word character.
 * Simple first-letter heuristic for real-time SpeechSynthesis boundary events.
 */
export function charToViseme(char: string): VisemeName {
  const lower = char.toLowerCase();
  return PHONEME_TO_VISEME[lower] ?? 'viseme_sil';
}

/**
 * Get a sequence of visemes for a word (simplified phoneme estimation).
 * In production you'd use a proper phoneme dictionary; this is a
 * fast approximation good enough for real-time visual lip sync.
 */
export function wordToVisemes(word: string): VisemeName[] {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return ['viseme_sil'];

  const visemes: VisemeName[] = [];
  let i = 0;

  while (i < clean.length) {
    // Check 2-char digraphs first
    const digraph = clean.slice(i, i + 2);
    if (PHONEME_TO_VISEME[digraph]) {
      visemes.push(PHONEME_TO_VISEME[digraph]);
      i += 2;
    } else {
      visemes.push(PHONEME_TO_VISEME[clean[i]] ?? 'viseme_sil');
      i += 1;
    }
  }

  return visemes;
}

/**
 * Interpolation speed for viseme transitions (lerp factor per frame at 60fps)
 */
export const VISEME_LERP_SPEED = 0.3;
export const VISEME_DECAY_SPEED = 0.15;

/**
 * Microsoft SAPI viseme IDs → ARKit viseme names
 * Used when SpeechSynthesis provides numeric viseme IDs (Chrome/Edge)
 */
export const SAPI_VISEME_MAP: Record<number, VisemeName> = {
  0:  'viseme_sil',
  1:  'viseme_aa',
  2:  'viseme_aa',
  3:  'viseme_O',
  4:  'viseme_E',
  5:  'viseme_I',
  6:  'viseme_U',
  7:  'viseme_O',
  8:  'viseme_O',
  9:  'viseme_I',
  10: 'viseme_E',
  11: 'viseme_aa',
  12: 'viseme_RR',
  13: 'viseme_nn',
  14: 'viseme_SS',
  15: 'viseme_TH',
  16: 'viseme_FF',
  17: 'viseme_DD',
  18: 'viseme_kk',
  19: 'viseme_PP',
  20: 'viseme_FF',
  21: 'viseme_SS',
};
