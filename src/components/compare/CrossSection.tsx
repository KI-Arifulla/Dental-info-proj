import { useId } from 'react'
import type { ReactNode } from 'react'
import type { TreatmentOption } from '../../data/types'

// Illustrated 2D cross-sections for the compare view. Colours are fixed (not theme tokens)
// so tissue and materials read the same in every theme.

const TOOTH =
  'M85 95 C80 60 85 32 102 30 C112 28 116 36 120 36 C124 36 128 28 138 30 C155 32 160 60 155 95 L150 120 C146 150 140 168 132 168 C126 168 124 140 120 140 C116 140 114 168 108 168 C100 168 94 150 90 120 Z'
const ENAMEL =
  'M85 95 C80 60 85 32 102 30 C112 28 116 36 120 36 C124 36 128 28 138 30 C155 32 160 60 155 95 C150 90 147 70 146 62 C140 48 132 45 126 50 C123 53 117 53 114 50 C108 45 100 48 94 62 C93 70 90 90 85 95 Z'
const PULP =
  'M108 72 C108 62 114 60 120 64 C126 60 132 62 132 72 L131 92 C132 120 136 145 134 160 L131 160 C129 140 124 118 122 102 L118 102 C116 118 111 140 109 160 L106 160 C104 145 108 120 109 92 Z'
const CROWN =
  'M85 97 C80 60 85 32 102 30 C112 28 116 36 120 36 C124 36 128 28 138 30 C155 32 160 60 155 97 C140 100 100 100 85 97 Z'
const CROWN_CAP =
  'M81 100 C75 60 81 25 102 24 C112 23 116 31 120 31 C124 31 128 23 138 24 C159 25 165 60 159 100 C142 104 98 104 81 100 Z'
const PREP_STUMP = 'M96 98 C94 76 98 60 108 56 C114 54 126 54 132 56 C142 60 146 76 144 98 Z'

function useIds() {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, '')
  return {
    id: (name: string) => `cs${raw}-${name}`,
    url: (name: string) => `url(#cs${raw}-${name})`,
  }
}

type Url = (name: string) => string

function Defs({ id }: { id: (name: string) => string }) {
  const across = (name: string, stops: string[]) => (
    <linearGradient id={id(name)} x1="0" x2="1" y1="0" y2="0">
      {stops.map((color, i) => (
        <stop key={i} offset={i / (stops.length - 1)} stopColor={color} />
      ))}
    </linearGradient>
  )
  const down = (name: string, stops: string[]) => (
    <linearGradient id={id(name)} x1="0" x2="0" y1="0" y2="1">
      {stops.map((color, i) => (
        <stop key={i} offset={i / (stops.length - 1)} stopColor={color} />
      ))}
    </linearGradient>
  )
  return (
    <defs>
      {down('bg', ['#fbfaf7', '#f1eee8'])}
      {down('gum', ['#f5b3b5', '#e88b92', '#cf6973'])}
      {down('bone', ['#ecdcb4', '#d2b47c'])}
      <pattern id={id('trabecular')} width="16" height="13" patternUnits="userSpaceOnUse">
        <ellipse cx="5" cy="4" rx="3.6" ry="2.4" fill="#b8955a" opacity="0.35" />
        <ellipse cx="13" cy="10" rx="2.6" ry="1.8" fill="#b8955a" opacity="0.3" />
        <ellipse cx="2" cy="11" rx="1.6" ry="1.2" fill="#a88449" opacity="0.3" />
      </pattern>
      {across('dentin', ['#e3cc9c', '#f2e3c1', '#dcc392'])}
      <linearGradient id={id('enamel')} x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.6" stopColor="#f3efe3" />
        <stop offset="1" stopColor="#ddd6c4" />
      </linearGradient>
      {down('pulp', ['#e3727b', '#b9474f'])}
      {across('gutta', ['#c9551f', '#f08a4b', '#c9551f'])}
      {down('composite', ['#eae4d2', '#cfc7b1'])}
      {/* Porcelain: warm, slightly translucent toward the biting edge. */}
      {down('porcelain', ['#e3ecee', '#f6f0e2', '#e6d7b8'])}
      {/* Zirconia: bright, opaque, matte white. */}
      <linearGradient id={id('zirconia')} x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.7" stopColor="#f7f7f4" />
        <stop offset="1" stopColor="#dededa" />
      </linearGradient>
      {across('titanium', ['#5c656d', '#aab3ba', '#e4e8eb', '#8d969e', '#4d555c'])}
      {across('steel', ['#7b8187', '#d3d7da', '#f5f6f7', '#a4aab0', '#6b7177'])}
      {down('wire', ['#f5f6f7', '#9aa0a6', '#5f656b'])}
      {across('zirconiaPost', ['#d9d6cc', '#f7f5ef', '#ffffff', '#e8e5dc', '#c9c5b9'])}
      {across('ceramicBracket', ['#dcd9d0', '#f6f3ea', '#fffdf8', '#ece7da', '#d2cdbf'])}
      <linearGradient id={id('aligner')} x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#dff3fb" stopOpacity="0.8" />
        <stop offset="0.5" stopColor="#a9dbee" stopOpacity="0.35" />
        <stop offset="1" stopColor="#7cc3e0" stopOpacity="0.6" />
      </linearGradient>
    </defs>
  )
}

function Label({
  y,
  tx,
  ty,
  swatch,
  children,
}: {
  y: number
  tx: number
  ty: number
  swatch?: string
  children: ReactNode
}) {
  return (
    <g>
      <line x1={tx} y1={ty} x2={176} y2={y} stroke="#3c4443" strokeWidth={0.6} />
      <circle cx={tx} cy={ty} r={1.8} fill="#3c4443" stroke="#ffffff" strokeWidth={0.6} />
      {swatch && (
        <rect x={179} y={y - 4.5} width={9} height={9} rx={2} fill={swatch} stroke="#6b7171" strokeWidth={0.5} />
      )}
      <text
        x={swatch ? 191 : 179}
        y={y + 3}
        fontSize={8.5}
        fontWeight={600}
        fill="#2f3534"
        stroke="#ffffff"
        strokeWidth={2.4}
        paintOrder="stroke"
        strokeLinejoin="round"
      >
        {children}
      </text>
    </g>
  )
}

function Bone({ url }: { url: Url }) {
  return (
    <>
      <rect x={0} y={0} width={280} height={180} fill={url('bg')} />
      <rect x={0} y={110} width={280} height={70} fill={url('bone')} />
      <rect x={0} y={110} width={280} height={70} fill={url('trabecular')} />
      {/* Dense cortical plate along the crest. */}
      <rect x={0} y={108} width={280} height={6} fill="#f3e8cc" />
      <line x1={0} y1={108} x2={280} y2={108} stroke="#c3a56e" strokeWidth={0.8} />
    </>
  )
}

/** Gum on either side of the tooth neck; `left`/`right` are where it meets the tooth. */
function Gum({ url, left = 90, right = 150 }: { url: Url; left?: number; right?: number }) {
  return (
    <g fill={url('gum')} stroke="#c25e68" strokeWidth={0.7}>
      <path d={`M-1 114 L-1 96 Q40 90 66 90 Q${left - 8} 86 ${left - 4} 85 Q${left - 1} 98 ${left + 1} 114 Z`} />
      <path d={`M281 114 L281 96 Q240 90 214 90 Q${right + 8} 86 ${right + 4} 85 Q${right + 1} 98 ${right - 1} 114 Z`} />
    </g>
  )
}

function Tooth({ url, pulp = 'vital' }: { url: Url; pulp?: 'vital' | 'filled' }) {
  return (
    <>
      {/* Periodontal ligament halo around the root. */}
      <path d={TOOTH} fill="none" stroke="#a9875a" strokeWidth={3} opacity={0.5} />
      <path d={TOOTH} fill={url('dentin')} stroke="#a89572" strokeWidth={1} />
      <path d={ENAMEL} fill={url('enamel')} stroke="#c9bfa8" strokeWidth={0.6} />
      {pulp === 'vital' ? (
        <path d={PULP} fill={url('pulp')} opacity={0.9} />
      ) : (
        <path d={PULP} fill={url('gutta')} stroke="#a8441a" strokeWidth={0.5} />
      )}
    </>
  )
}

function Implant({ url, post, mini }: { url: Url; post: string; mini?: boolean }) {
  const half = mini ? 6 : 14
  const top = mini ? 96 : 110
  const bottom = 168
  const pitch = 7
  const side: [number, number][] = [[-half, top]]
  for (let y = top + 4; y < bottom - 8; y += pitch) {
    const taper = ((y - top) / (bottom - top)) * (mini ? 2 : 5)
    side.push([-half - 2.5 + taper, y + pitch / 2], [-half + taper, y + pitch])
  }
  const tip = half - (mini ? 2 : 5)
  const leftSide = side.map(([x, y]) => `L${120 + x} ${y}`).join(' ')
  const rightSide = [...side].reverse().map(([x, y]) => `L${120 - x} ${y}`).join(' ')
  const d = `M${120 - half} ${top} ${leftSide} L${120 - tip} ${bottom - 3} Q120 ${bottom + 4} ${120 + tip} ${bottom - 3} ${rightSide} Z`
  return (
    <>
      <path d={d} fill={url(post)} stroke="#4a5157" strokeWidth={0.8} />
      {!mini && <path d="M110 112 L112 90 L128 90 L130 112 Z" fill={url('titanium')} stroke="#4a5157" strokeWidth={0.8} />}
    </>
  )
}

function Highlight({ d }: { d: string }) {
  return <path d={d} stroke="#ffffff" strokeWidth={2.2} fill="none" opacity={0.85} strokeLinecap="round" />
}

function Scene({ option, url }: { option: TreatmentOption; url: Url }) {
  switch (option.id) {
    case 'zirconia':
    case 'titanium':
    case 'mini': {
      const mini = option.id === 'mini'
      const post = option.id === 'zirconia' ? 'zirconiaPost' : option.id === 'titanium' ? 'titanium' : 'steel'
      const name =
        option.id === 'zirconia' ? 'Zirconia post' : option.id === 'titanium' ? 'Titanium post' : 'Thin one-piece post'
      return (
        <>
          <Bone url={url} />
          <Implant url={url} post={post} mini={mini} />
          <Gum url={url} left={mini ? 112 : 108} right={mini ? 128 : 132} />
          <path d={CROWN} fill={url('porcelain')} stroke="#b9ad91" strokeWidth={1} />
          <Highlight d="M94 46 C98 38 104 35 110 38" />
          <Label y={36} tx={144} ty={52} swatch={url('porcelain')}>
            Porcelain crown
          </Label>
          {!mini && (
            <Label y={84} tx={128} ty={100} swatch={url('titanium')}>
              Titanium abutment
            </Label>
          )}
          <Label y={140} tx={126} ty={140} swatch={url(post)}>
            {name}
          </Label>
          <Label y={166} tx={60} ty={150}>
            Jaw bone
          </Label>
        </>
      )
    }
    case 'clear-aligners':
      return (
        <>
          <Bone url={url} />
          <Tooth url={url} />
          <Gum url={url} />
          <path d={CROWN_CAP} fill={url('aligner')} stroke="#4ea7cb" strokeWidth={1.2} />
          <Highlight d="M89 72 C87 50 91 34 101 29" />
          <Label y={36} tx={158} ty={52} swatch={url('aligner')}>
            Clear plastic tray
          </Label>
          <Label y={80} tx={140} ty={64} swatch={url('enamel')}>
            Natural enamel
          </Label>
          <Label y={140} tx={132} ty={132}>
            Tooth root
          </Label>
          <Label y={166} tx={60} ty={150}>
            Jaw bone
          </Label>
        </>
      )
    case 'ceramic-brackets':
    case 'metal-braces': {
      const ceramic = option.id === 'ceramic-brackets'
      const fill = url(ceramic ? 'ceramicBracket' : 'steel')
      return (
        <>
          <Bone url={url} />
          <Tooth url={url} />
          <Gum url={url} />
          <rect x={0} y={58.5} width={280} height={3.5} fill={url('wire')} />
          <g stroke={ceramic ? '#b3ad9d' : '#50575d'} strokeWidth={0.9}>
            <path d="M106 48 h28 v6 h-3 v12 h3 v6 h-28 v-6 h3 v-12 h-3 Z" fill={fill} />
            <rect x={111} y={56} width={18} height={8} rx={1.5} fill={ceramic ? '#f4f1e8' : '#8e959b'} />
          </g>
          <Label y={34} tx={132} ty={50} swatch={fill}>
            {ceramic ? 'Tooth-coloured ceramic' : 'Stainless steel bracket'}
          </Label>
          <Label y={80} tx={164} ty={60} swatch={url('steel')}>
            Steel archwire
          </Label>
          <Label y={140} tx={132} ty={132}>
            Natural tooth
          </Label>
          <Label y={166} tx={60} ty={150}>
            Jaw bone
          </Label>
        </>
      )
    }
    case 'single-sitting':
    case 'multi-sitting':
      return (
        <>
          <Bone url={url} />
          <Tooth url={url} pulp="filled" />
          <Gum url={url} />
          <path
            d="M104 38 Q120 50 136 38 L133 70 Q120 78 107 70 Z"
            fill={url('composite')}
            stroke="#9f967f"
            strokeWidth={0.8}
            strokeDasharray="2 1.5"
          />
          <Label y={34} tx={132} ty={50} swatch={url('composite')}>
            Composite filling
          </Label>
          <Label y={96} tx={131} ty={92} swatch={url('gutta')}>
            Gutta-percha seal
          </Label>
          <Label y={140} tx={146} ty={132} swatch={url('dentin')}>
            Own tooth root
          </Label>
          <text x={10} y={170} fontSize={8.5} fontWeight={700} fill="#2f3534">
            {option.id === 'single-sitting' ? 'Done in 1 visit' : 'Done over 2–3 visits'}
          </text>
        </>
      )
    case 'rct-with-crown':
      return (
        <>
          <Bone url={url} />
          <Tooth url={url} pulp="filled" />
          <Gum url={url} />
          <path d={CROWN_CAP} fill={url('zirconia')} stroke="#a9a9a0" strokeWidth={1.2} />
          <path d={PREP_STUMP} fill="none" stroke="#b5ad98" strokeWidth={0.8} strokeDasharray="2.5 2" />
          <Label y={34} tx={156} ty={48} swatch={url('zirconia')}>
            Zirconia crown
          </Label>
          <Label y={78} tx={140} ty={78}>
            Shaped tooth inside
          </Label>
          <Label y={140} tx={131} ty={140} swatch={url('gutta')}>
            Gutta-percha seal
          </Label>
          <Label y={166} tx={60} ty={150}>
            Jaw bone
          </Label>
        </>
      )
    default:
      return (
        <>
          <Bone url={url} />
          <Tooth url={url} />
          <Gum url={url} />
        </>
      )
  }
}

export function CrossSection({ option }: { option: TreatmentOption }) {
  const { id, url } = useIds()
  return (
    <svg className="cross-section" viewBox="0 0 280 180" role="img" aria-label={`Cross-section of ${option.name}`}>
      <Defs id={id} />
      <Scene option={option} url={url} />
    </svg>
  )
}
