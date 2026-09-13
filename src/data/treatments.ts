import type { Treatment, TreatmentOption } from './types'

export const treatments: Treatment[] = [
  {
    id: 'implants',
    name: 'Implants',
    description: 'Replacing a missing tooth with a fixed root and crown.',
    icon: '🦷',
    options: [
      {
        id: 'zirconia',
        name: 'Zirconia Implant',
        badge: 'Metal-free',
        shortDescription: 'Metal-free, tooth-colored root.',
        longDescription:
          'Zirconia implants offer a metal-free alternative for patients who prefer an all-ceramic solution or have metal sensitivities, with a white color that stays hidden even with gum recession.',
        pros: ['Metal-free', 'Tooth-colored at gumline', 'Low plaque affinity'],
        cons: ['Less long-term data than titanium', 'Fewer size/shape options'],
        price: 42000,
        currency: 'INR',
        specs: [
          { label: 'Healing', value: '3-6 months' },
          { label: 'Visits', value: '3-4 visits' },
          { label: 'Lifespan', value: '20+ years' },
          { label: 'Material', value: 'Zirconia ceramic' },
        ],
        model: { geometry: 'implant', material: 'zirconia' },
        modelLabel: 'Fixture in bone',
      },
      {
        id: 'titanium',
        name: 'Titanium Implant',
        badge: 'Most common',
        shortDescription: 'Industry standard, proven track record.',
        longDescription:
          'Titanium implants have been the gold standard for decades, fusing reliably with jawbone (osseointegration) and supporting a crown, bridge, or denture.',
        pros: ['Decades of clinical data', 'Excellent osseointegration', 'Wide range of sizes'],
        cons: ['Metal visible if gums recede', 'Can rarely trigger metal sensitivity'],
        price: 28000,
        currency: 'INR',
        specs: [
          { label: 'Healing', value: '3-6 months' },
          { label: 'Visits', value: '3-4 visits' },
          { label: 'Lifespan', value: '25+ years' },
          { label: 'Material', value: 'Titanium alloy' },
        ],
        model: { geometry: 'implant', material: 'titanium' },
        modelLabel: 'Fixture in bone',
      },
      {
        id: 'mini',
        name: 'Mini Implant',
        badge: 'Narrow ridge',
        shortDescription: 'Smaller diameter, less invasive.',
        longDescription:
          'Mini implants use a narrower post, allowing placement with less bone and a less invasive procedure — often used to stabilize dentures or for narrow ridges.',
        pros: ['Less invasive procedure', 'Shorter healing time', 'Lower cost'],
        cons: ['Lower load capacity', 'Not ideal for single molar replacement'],
        price: 18000,
        currency: 'INR',
        specs: [
          { label: 'Healing', value: '2-4 months' },
          { label: 'Visits', value: '2-3 visits' },
          { label: 'Lifespan', value: '10-15 years' },
          { label: 'Material', value: 'Titanium alloy' },
        ],
        model: { geometry: 'implant', material: 'metal', scale: [0.6, 0.6, 0.6] },
        modelLabel: 'Fixture in bone',
      },
    ],
  },
  {
    id: 'aligners',
    name: 'Aligners & Braces',
    description: 'Straightening teeth over months, visibly or invisibly.',
    icon: '😁',
    options: [
      {
        id: 'clear-aligners',
        name: 'Clear Aligners',
        badge: 'Invisible',
        shortDescription: 'Removable, nearly invisible clear trays.',
        longDescription:
          'Clear aligners are a series of custom-fit, removable plastic trays worn 20-22 hours a day, gradually shifting teeth into place with minimal visibility.',
        pros: ['Nearly invisible', 'Removable for eating/brushing', 'No metal brackets or wires'],
        cons: ['Requires strict daily wear', 'Higher cost than braces'],
        price: 160000,
        currency: 'INR',
        specs: [
          { label: 'Healing', value: 'N/A' },
          { label: 'Visits', value: 'Every 6-8 weeks' },
          { label: 'Lifespan', value: '6-18 month course' },
          { label: 'Wear time/day', value: '20-22 hrs' },
        ],
        model: { geometry: 'aligner-tray', material: 'plastic-clear' },
        modelLabel: 'Aligner tray',
      },
      {
        id: 'ceramic-brackets',
        name: 'Ceramic Brackets',
        badge: 'Tooth-colored',
        shortDescription: 'Fixed brackets that blend with tooth color.',
        longDescription:
          'Ceramic brackets work like traditional braces but use tooth-colored or clear brackets, making them far less noticeable while still handling complex movements.',
        pros: ['Blends with natural teeth', 'Handles complex cases', 'Fixed, no compliance needed'],
        cons: ['More visible than clear aligners', 'Brackets can stain if not cleaned well'],
        price: 65000,
        currency: 'INR',
        specs: [
          { label: 'Healing', value: 'N/A' },
          { label: 'Visits', value: 'Every 4-6 weeks' },
          { label: 'Lifespan', value: '12-24 month course' },
          { label: 'Wear time/day', value: '24 hrs (fixed)' },
        ],
        model: { geometry: 'crown', material: 'ceramic' },
        modelLabel: 'Bracket on tooth',
      },
      {
        id: 'metal-braces',
        name: 'Metal Braces',
        badge: 'Most affordable',
        shortDescription: 'Traditional metal brackets and wires.',
        longDescription:
          'Metal braces are the most affordable and durable orthodontic option, using stainless steel brackets and wires to correct even complex bite and alignment issues.',
        pros: ['Lowest cost option', 'Handles the most complex cases', 'Very durable hardware'],
        cons: ['Most visible option', 'Can cause initial discomfort/irritation'],
        price: 35000,
        currency: 'INR',
        specs: [
          { label: 'Healing', value: 'N/A' },
          { label: 'Visits', value: 'Every 4-6 weeks' },
          { label: 'Lifespan', value: '12-24 month course' },
          { label: 'Wear time/day', value: '24 hrs (fixed)' },
        ],
        model: { geometry: 'crown', material: 'metal' },
        modelLabel: 'Bracket on tooth',
      },
    ],
  },
  {
    id: 'rootcanal',
    name: 'Root Canal',
    description: 'Saving an infected tooth instead of removing it.',
    icon: '🦷',
    options: [
      {
        id: 'single-sitting',
        name: 'Single Sitting RCT',
        badge: 'One visit',
        shortDescription: 'Entire root canal completed in one appointment.',
        longDescription:
          'Single sitting root canal treatment cleans, shapes, and fills the infected root canal system in one visit, ideal for cases without complicating infection.',
        pros: ['Completed in one appointment', 'Less overall chair time', 'Fewer temporary fillings'],
        cons: ['Not suitable for heavily infected teeth', 'Longer single-visit duration'],
        price: 8000,
        currency: 'INR',
        specs: [
          { label: 'Healing', value: '1-2 weeks' },
          { label: 'Visits', value: '1 visit' },
          { label: 'Lifespan', value: '10-15 years' },
        ],
        model: { geometry: 'crown', material: 'ceramic' },
        modelLabel: 'Treated tooth',
      },
      {
        id: 'multi-sitting',
        name: 'Multi Sitting RCT',
        badge: 'Staged',
        shortDescription: 'Root canal completed across multiple visits.',
        longDescription:
          'Multi sitting root canal treatment spreads cleaning, disinfection, and filling across two or more visits, allowing medication time to resolve more severe infections.',
        pros: ['Better for severe infections', 'Allows medication between visits', 'Lower per-visit cost'],
        cons: ['Takes longer overall', 'Requires temporary filling between visits'],
        price: 6000,
        currency: 'INR',
        specs: [
          { label: 'Healing', value: '2-4 weeks' },
          { label: 'Visits', value: '2-3 visits' },
          { label: 'Lifespan', value: '10-15 years' },
        ],
        model: { geometry: 'crown', material: 'ceramic' },
        modelLabel: 'Treated tooth',
      },
      {
        id: 'rct-with-crown',
        name: 'RCT with Crown',
        badge: 'With cap',
        shortDescription: 'Root canal followed by a protective crown.',
        longDescription:
          'This option combines root canal treatment with a full-coverage crown placed afterward, protecting the weakened tooth and restoring its strength and appearance long-term.',
        pros: ['Protects tooth from fracture', 'Restores full chewing function', 'Longest-lasting result'],
        cons: ['Higher total cost', 'Requires an additional visit for the crown'],
        price: 15000,
        currency: 'INR',
        specs: [
          { label: 'Healing', value: '2-4 weeks' },
          { label: 'Visits', value: '2-3 visits' },
          { label: 'Lifespan', value: '15-20 years' },
        ],
        model: { geometry: 'crown', material: 'zirconia' },
        modelLabel: 'Crowned tooth',
      },
    ],
  },
]

export function getTreatment(id: string): Treatment | undefined {
  return treatments.find((t) => t.id === id)
}

export function getOption(treatmentId: string, optionId: string): TreatmentOption | undefined {
  return getTreatment(treatmentId)?.options.find((o) => o.id === optionId)
}

export function getOptions(treatmentId: string, optionIds: string[]) {
  const treatment = getTreatment(treatmentId)
  if (!treatment) return []
  return optionIds
    .map((id) => treatment.options.find((o) => o.id === id))
    .filter((o): o is NonNullable<typeof o> => Boolean(o))
}
