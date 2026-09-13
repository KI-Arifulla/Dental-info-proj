import { useParams } from 'react-router-dom'
import { getOption, getTreatment } from '../data/treatments'
import { ModelViewer } from '../three/ModelViewer'
import { SpecSheet } from '../components/detail/SpecSheet'
import { Breadcrumbs } from '../components/layout/Breadcrumbs'

export function OptionDetailPage() {
  const { treatmentId = '', optionId = '' } = useParams()
  const treatment = getTreatment(treatmentId)
  const option = getOption(treatmentId, optionId)

  if (!treatment || !option) {
    return (
      <div className="page">
        <p>Option not found.</p>
        <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }]} />
      </div>
    )
  }

  return (
    <div className="page">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/' },
          { label: treatment.name, to: `/treatment/${treatmentId}` },
          { label: option.name },
        ]}
      />
      <div className="detail-split">
        <div className="detail-viewer">
          <ModelViewer {...option.model} height={480} />
        </div>
        <div className="detail-specs">
          <SpecSheet option={option} />
        </div>
      </div>
    </div>
  )
}
