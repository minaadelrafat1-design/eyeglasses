/**
 * Optician knowledge base for the shopping assistant.
 *
 * Static, vendor-neutral guidance about materials, sizing, lenses and care.
 * Shared by the server-side assistant (as a callable tool) and the UI (as
 * quick-start prompts), so the store speaks with one voice.
 */

export type GuidanceTopic =
  | 'materials'
  | 'sizing'
  | 'lenses'
  | 'coatings'
  | 'face-shapes'
  | 'prescription'
  | 'care'
  | 'shipping-returns';

export interface GuidanceEntry {
  topic: GuidanceTopic;
  title: string;
  body: string;
}

export const GUIDANCE: Record<GuidanceTopic, GuidanceEntry> = {
  materials: {
    topic: 'materials',
    title: 'Frame materials',
    body: [
      'Acetate — plant-based plastic, layered for depth of colour. Warm on the skin, easy to adjust with heat, best for bold or tortoise looks. Slightly heavier than metal.',
      'Metal (stainless steel / monel) — slim profile, precise fit, adjustable nose pads. Understated and lightweight, ideal for a minimal look.',
      'Titanium — the premium choice: about 40% lighter than steel, hypoallergenic and highly corrosion resistant. Excellent for all-day wear and strong prescriptions.',
      'Mixed — an acetate front with metal temples, combining colour depth with a lighter, sleeker side profile.',
    ].join('\n'),
  },
  sizing: {
    topic: 'sizing',
    title: 'Frame sizing',
    body: [
      'Frame size is printed on the inside temple as three numbers: lens width – bridge width – temple length, in millimetres (e.g. 52-18-145).',
      'Lens width 46–50mm reads narrow, 51–54mm medium, 55mm+ wide.',
      'Total frame width should match the width of your face: the temples should meet your head without pinching, and the lens edge should sit close to but not past the outer corner of your eye.',
      'Bridge width controls how the frame sits on your nose. A lower bridge suits a flatter nose profile; adjustable nose pads add flexibility.',
      'Temple length is normally 135–150mm; the arm should curve just past your ear without pressure.',
    ].join('\n'),
  },
  lenses: {
    topic: 'lenses',
    title: 'Lens options',
    body: [
      'Single vision — one prescription across the lens, for distance or reading.',
      'Progressive — distance, intermediate and near zones blended without a visible line; the usual choice after about age 40.',
      'Reading — near-vision only, for close work.',
      'Non-prescription — plano lenses for style or screen use.',
      'Sunglass lenses — tinted, with polarisation available to cut glare from roads and water.',
      'Lens index matters for strong prescriptions: a higher index (1.67, 1.74) gives a noticeably thinner, lighter lens.',
    ].join('\n'),
  },
  coatings: {
    topic: 'coatings',
    title: 'Lens coatings',
    body: [
      'Anti-reflective — cuts glare and reflections, sharpens night vision and makes your eyes visible in photos.',
      'Blue-light filter — reduces high-energy visible light from screens; often chosen for long desk days.',
      'Scratch-resistant hard coat — standard on our lenses.',
      'Photochromic — clear indoors, darkening in sunlight.',
      'Hydrophobic / anti-smudge — repels water and fingerprints for easier cleaning.',
    ].join('\n'),
  },
  'face-shapes': {
    topic: 'face-shapes',
    title: 'Frames by face shape',
    body: [
      'Round face — angular frames (square, rectangular, geometric) add definition.',
      'Square face — softer curves (round, oval, aviator) balance a strong jaw.',
      'Oval face — the most flexible; most shapes work, keep frame width close to face width.',
      'Heart face — wider at the brow, so lighter bottoms: aviator, oval, rimless-feeling frames.',
      'Diamond face — cat-eye, oval and rimless styles highlight the cheekbones.',
      'Rectangle face — deeper lenses and bolder frames shorten the face visually.',
    ].join('\n'),
  },
  prescription: {
    topic: 'prescription',
    title: 'Using your prescription',
    body: [
      'You need sphere (SPH), cylinder (CYL), axis and, for progressives, the ADD value, plus your pupillary distance (PD).',
      'Prescriptions are typically valid for one to two years depending on your region.',
      'Never share your prescription in chat — you add it securely at checkout.',
    ].join('\n'),
  },
  care: {
    topic: 'care',
    title: 'Caring for your glasses',
    body: [
      'Rinse with lukewarm water, use a drop of mild soap, then dry with a microfibre cloth.',
      'Avoid paper towels and shirt hems — they scratch coatings.',
      'Use both hands to remove your frames to keep the fit even, and store them in a hard case.',
    ].join('\n'),
  },
  'shipping-returns': {
    topic: 'shipping-returns',
    title: 'Shipping and returns',
    body: [
      'Standard delivery arrives in a few business days; expedited options appear at checkout.',
      'Frames can be returned within 30 days in original condition.',
      'Prescription lenses are made to order — reach out to support for help with a remake.',
    ].join('\n'),
  },
};

export const GUIDANCE_TOPICS = Object.keys(GUIDANCE) as GuidanceTopic[];

export function guidanceFor(topic: string): GuidanceEntry | null {
  return GUIDANCE[topic as GuidanceTopic] ?? null;
}

/** Quick-start prompts shown in the empty chat state. */
export const STARTER_PROMPTS: string[] = [
  'Find black glasses under $100',
  'Show me frames for a round face',
  'What is the difference between acetate and titanium?',
  'Help me pick the right frame size',
];

/** Default follow-ups when the assistant has nothing more specific to offer. */
export const DEFAULT_SUGGESTIONS: string[] = [
  'Compare your top two picks',
  'Explain the lens options',
  'Show me something lighter',
];
