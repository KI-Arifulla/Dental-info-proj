import type { DentalScene } from './types'

// Node names match objects in the Blender build scripts (blender/build_*.py) exported to public/models.
// Sectioned jaw (blender/build_section.py): static back half plus *_Front pieces that peel away on reveal.
const sectionedJaw = (variant: 'Ridge' | 'Standard') => [
  ...['Gum', 'Cortical', 'Cancellous', 'PDL_Left', 'PDL_Right'].map((part) => `SEC_${part}_${variant}`),
  `SEC_Gum_${variant}_Front`,
  `SEC_Bone_${variant}_Front`,
  ...['Left', 'Right'].flatMap((side) => [`SEC_ADJ_${side}`, `SEC_ADJ_${side}_Front`]),
]
const IMPLANT_BASE = sectionedJaw('Ridge')
const NATURAL_BASE = sectionedJaw('Standard')

const MISSING_TOOTH = {
  id: 'before',
  label: 'Missing tooth',
  description: 'The tooth is gone and the gum has healed over the gap, leaving an empty space in the bone.',
  nodes: [],
}

function bracesScene(kind: 'Metal' | 'Ceramic', name: string): DentalScene {
  const hardware = (stage: 'Crooked' | 'Aligned') =>
    ['Brackets', 'Wire', 'Ties'].map((part) => `ORT_${part}_${kind}_${stage}`)
  return {
    focusLabel: { title: 'Moving tooth', subtitle: '(Root shifts in bone)' },
    file: 'ortho',
    baseNodes: NATURAL_BASE,
    revealNodes: ['ORT_Tooth_Crooked', 'ORT_Tooth_Aligned'],
    stages: [
      {
        id: 'before',
        label: 'Crowded tooth',
        description: 'The middle tooth is rotated and pushed out of line with its neighbours.',
        nodes: ['ORT_Tooth_Crooked'],
      },
      {
        id: 'fitted',
        label: `${name} fitted`,
        description: 'Brackets are bonded to each tooth and a wire links them to apply gentle pressure.',
        nodes: ['ORT_Tooth_Crooked', ...hardware('Crooked')],
      },
      {
        id: 'aligned',
        label: 'Tooth aligned',
        description: 'Over months of adjustments the wire straightens and the tooth moves into line.',
        nodes: ['ORT_Tooth_Aligned', ...hardware('Aligned')],
      },
      {
        id: 'after',
        label: 'Braces removed',
        description: 'Hardware comes off, leaving a straight, evenly spaced row of teeth.',
        nodes: ['ORT_Tooth_Aligned'],
      },
    ],
  }
}

const INFECTED_PULP = 'RCT_Pulp_Infected'
const SINGLE_TOOTH_REVEAL = [
  'RCT_Tooth_Decayed',
  'RCT_Tooth_Accessed',
  'RCT_Tooth_Fractured',
  'RCT_Tooth_Prepared',
  'RCT_Fill_Temp',
  'RCT_Fill_Composite',
  'RCT_Crown',
]

export const optionScenes: Record<string, DentalScene> = {
  'implants/zirconia': {
    focusLabel: { title: 'Zirconia Implant', subtitle: '(Metal-free)' },
    file: 'implants',
    baseNodes: IMPLANT_BASE,
    revealNodes: ['IMP_Crown'],
    stages: [
      MISSING_TOOTH,
      {
        id: 'implant',
        label: 'Zirconia implant placed',
        description: 'A one-piece, tooth-coloured ceramic implant is set into the bone. No metal anywhere.',
        nodes: ['IMP_Zr_Body'],
      },
      {
        id: 'crown',
        label: 'Crown fitted',
        description: 'A ceramic crown is cemented onto the built-in abutment. The white root stays hidden even if gums recede.',
        nodes: ['IMP_Zr_Body', 'IMP_Crown'],
      },
    ],
  },
  'implants/titanium': {
    focusLabel: { title: 'Titanium Implant', subtitle: '(Two-piece)' },
    file: 'implants',
    baseNodes: IMPLANT_BASE,
    revealNodes: ['IMP_Crown'],
    stages: [
      MISSING_TOOTH,
      {
        id: 'fixture',
        label: 'Titanium post placed',
        description: 'A threaded titanium post is placed in the bone and left to fuse for 3-6 months.',
        nodes: ['IMP_Ti_Fixture', 'IMP_Ti_Join'],
      },
      {
        id: 'abutment',
        label: 'Abutment attached',
        description: 'A separate metal connector screws into the post and rises through the gum.',
        nodes: ['IMP_Ti_Fixture', 'IMP_Ti_Join', 'IMP_Ti_Abutment'],
      },
      {
        id: 'crown',
        label: 'Crown fitted',
        description: 'The crown is fixed onto the abutment, completing the replacement tooth.',
        nodes: ['IMP_Ti_Fixture', 'IMP_Ti_Join', 'IMP_Ti_Abutment', 'IMP_Crown'],
      },
    ],
  },
  'implants/mini': {
    focusLabel: { title: 'Mini Implant', subtitle: '(Narrow post)' },
    file: 'implants',
    baseNodes: IMPLANT_BASE,
    revealNodes: ['IMP_Denture_Base', 'IMP_Denture_Tooth'],
    stages: [
      { ...MISSING_TOOTH, description: 'A narrow ridge with too little bone for a standard implant.' },
      {
        id: 'post',
        label: 'Mini implant placed',
        description: 'A thin 2.4 mm post with a ball-shaped head goes into the narrow ridge in one short visit.',
        nodes: ['IMP_Mini_Post'],
      },
      {
        id: 'denture',
        label: 'Denture snapped on',
        description: 'The denture has a metal housing with a rubber O-ring that clips over the ball to hold it steady.',
        nodes: ['IMP_Mini_Post', 'IMP_Mini_ORing', 'IMP_Mini_Housing', 'IMP_Denture_Base', 'IMP_Denture_Tooth'],
      },
    ],
  },
  'aligners/clear-aligners': {
    focusLabel: { title: 'Moving tooth', subtitle: '(Root shifts in bone)' },
    file: 'ortho',
    baseNodes: NATURAL_BASE,
    revealNodes: ['ORT_Tooth_Crooked', 'ORT_Tooth_Aligned'],
    stages: [
      {
        id: 'before',
        label: 'Crowded tooth',
        description: 'The middle tooth is rotated and pushed out of line with its neighbours.',
        nodes: ['ORT_Tooth_Crooked'],
      },
      {
        id: 'tray',
        label: 'Aligner worn',
        description: 'A clear, custom tray slips over the teeth 20-22 hours a day, nudging the tooth each week.',
        nodes: ['ORT_Tooth_Crooked', 'ORT_Aligner_Tray'],
      },
      {
        id: 'after',
        label: 'Tooth aligned',
        description: 'After the series of trays the tooth sits straight in the arch.',
        nodes: ['ORT_Tooth_Aligned'],
      },
    ],
  },
  'aligners/ceramic-brackets': bracesScene('Ceramic', 'Ceramic braces'),
  'aligners/metal-braces': bracesScene('Metal', 'Metal braces'),
  'rootcanal/single-sitting': {
    focusLabel: { title: 'Treated tooth', subtitle: '(Canals cleaned & sealed)' },
    file: 'rootcanal',
    baseNodes: NATURAL_BASE,
    revealNodes: SINGLE_TOOTH_REVEAL,
    stages: [
      {
        id: 'before',
        label: 'Deep decay',
        description: 'Decay has reached the pulp, inflaming the nerve inside the tooth.',
        nodes: ['RCT_Tooth_Decayed', INFECTED_PULP],
      },
      {
        id: 'cleaned',
        label: 'Canals cleaned',
        description: 'The decay and infected pulp are removed and the canals are shaped and disinfected.',
        nodes: ['RCT_Tooth_Accessed'],
      },
      {
        id: 'sealed',
        label: 'Filled and sealed',
        description: 'In the same visit the canals are filled and the tooth is sealed with a tooth-coloured filling.',
        nodes: ['RCT_Tooth_Accessed', 'RCT_Canal_Filled', 'RCT_Fill_Composite'],
      },
    ],
  },
  'rootcanal/multi-sitting': {
    focusLabel: { title: 'Treated tooth', subtitle: '(Infection cleared)' },
    file: 'rootcanal',
    baseNodes: NATURAL_BASE,
    revealNodes: SINGLE_TOOTH_REVEAL,
    stages: [
      {
        id: 'before',
        label: 'Infection and abscess',
        description: 'Infected pulp has spread past the root tip, forming an abscess in the bone.',
        nodes: ['RCT_Tooth_Decayed', INFECTED_PULP, 'RCT_Abscess_Large'],
      },
      {
        id: 'visit-1',
        label: 'Visit 1: medicated',
        description: 'Canals are cleaned and packed with medicine under a temporary filling while the abscess heals.',
        nodes: ['RCT_Tooth_Accessed', 'RCT_Canal_Medicated', 'RCT_Fill_Temp', 'RCT_Abscess_Small'],
      },
      {
        id: 'visit-2',
        label: 'Visit 2: filled',
        description: 'Once the infection settles, the canals are filled and a permanent filling seals the tooth.',
        nodes: ['RCT_Tooth_Accessed', 'RCT_Canal_Filled', 'RCT_Fill_Composite'],
      },
    ],
  },
  'rootcanal/rct-with-crown': {
    focusLabel: { title: 'Restored tooth', subtitle: '(Post & crown)' },
    file: 'rootcanal',
    baseNodes: NATURAL_BASE,
    revealNodes: SINGLE_TOOTH_REVEAL,
    stages: [
      {
        id: 'before',
        label: 'Cracked and infected',
        description: 'A broken cusp and a crack let decay reach the pulp, causing infection at the root tip.',
        nodes: ['RCT_Tooth_Fractured', INFECTED_PULP, 'RCT_Abscess_Large'],
      },
      {
        id: 'rct',
        label: 'Root canal and post',
        description: 'Canals are filled, a fibre post anchors a core, and the tooth is shaped to receive a crown.',
        nodes: ['RCT_Tooth_Prepared', 'RCT_Canal_Filled', 'RCT_Post'],
      },
      {
        id: 'crown',
        label: 'Crown fitted',
        description: 'A zirconia crown covers the whole weakened tooth, protecting it from fracture.',
        nodes: ['RCT_Tooth_Prepared', 'RCT_Canal_Filled', 'RCT_Post', 'RCT_Crown'],
      },
    ],
  },
}

export function getOptionScene(treatmentId: string, optionId: string): DentalScene | undefined {
  return optionScenes[`${treatmentId}/${optionId}`]
}
