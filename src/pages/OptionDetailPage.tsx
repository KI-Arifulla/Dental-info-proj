import { useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getOption, getOptions, getTreatment } from '../data/treatments'
import { ModelViewer } from '../three/ModelViewer'
import type { ModelViewerHandle } from '../three/ModelViewer'
import { getOptionScene } from '../data/scenes'

function revealLabel(value: number) {
  if (value < 3) return 'Gum closed'
  if (value < 40) return 'Lifting gum'
  if (value < 70) return 'Opening bone'
  return 'See-through tooth'
}
import { SpecSheet } from '../components/detail/SpecSheet'
import { getEffectivePrice } from '../utils/pricing'
import '../styles/explainer.css'

export function OptionDetailPage() {
  const { treatmentId = '', optionId = '' } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const viewerRef = useRef<ModelViewerHandle>(null)
  const [isRotating, setIsRotating] = useState(false)
  // Keyed by option so moving to another option starts again at its existing condition.
  const [sceneView, setSceneView] = useState({ key: '', stage: 0, reveal: 0 })
  const sceneKey = `${treatmentId}/${optionId}`
  const stageIndex = sceneView.key === sceneKey ? sceneView.stage : 0
  const reveal = sceneView.key === sceneKey ? sceneView.reveal : 0
  const scene = getOptionScene(treatmentId, optionId)
  const treatment = getTreatment(treatmentId)
  const option = getOption(treatmentId, optionId)

  if (!treatment || !option) {
    return (
      <main className="page">
        <p>Option not found.</p>
      </main>
    )
  }

  const isPatientView = searchParams.get('patient') === '1'
  const selectedIds = Array.from(
    new Set((searchParams.get('selected') ?? '').split(',').filter(Boolean)),
  )
  const selectedOptions = getOptions(treatmentId, selectedIds).slice(0, 3)
  const cycleIds = searchParams.has('selected')
    ? selectedOptions.map((selectedOption) => selectedOption.id)
    : treatment.options.map((treatmentOption) => treatmentOption.id)
  const price = getEffectivePrice(treatmentId, option.id, option.price)
  const backSearch = selectedOptions.length
    ? `?${new URLSearchParams({ selected: selectedOptions.map((item) => item.id).join(',') })}`
    : ''

  function togglePatientView() {
    const nextParams = new URLSearchParams(searchParams)
    if (isPatientView) nextParams.delete('patient')
    else nextParams.set('patient', '1')
    setSearchParams(nextParams, { replace: true })
  }

  function move(direction: -1 | 1) {
    if (cycleIds.length === 0) return
    const currentIndex = cycleIds.indexOf(optionId)
    const nextIndex =
      currentIndex === -1
        ? direction === 1
          ? 0
          : cycleIds.length - 1
        : (currentIndex + direction + cycleIds.length) % cycleIds.length
    const nextParams = new URLSearchParams(searchParams)
    navigate({
      pathname: `/treatment/${treatmentId}/option/${cycleIds[nextIndex]}`,
      search: nextParams.toString() ? `?${nextParams}` : '',
    })
  }

  function toggleRotation() {
    viewerRef.current?.rotate()
    setIsRotating((current) => !current)
  }

  return (
    <main className={`page explainer-page${isPatientView ? ' patient-mode' : ''}`}>
      <div className="explainer-layout">
        <section className="detail-info-panel">
          <SpecSheet option={option} price={price} />
          <div className="detail-actions">
            <button type="button" className="btn-primary" onClick={togglePatientView}>
              {isPatientView ? 'Exit patient view' : 'Patient view'}
            </button>
            <Link className="btn-secondary" to={`/treatment/${treatmentId}${backSearch}`}>
              Back to options
            </Link>
          </div>
        </section>
        <section className="detail-viewer-panel">
          <ModelViewer
            ref={viewerRef}
            {...option.model}
            scene={scene}
            stageIndex={stageIndex}
            reveal={reveal / 100}
            height="100%"
          />
          {scene && (
            <div className="scene-sliders" aria-label="Treatment walkthrough">
              <div className="scene-slider">
                <div className="scene-slider-head">
                  <label htmlFor="stage-slider">Treatment stage</label>
                  <span>
                    {stageIndex + 1} / {scene.stages.length}
                  </span>
                </div>
                <input
                  id="stage-slider"
                  type="range"
                  min={0}
                  max={scene.stages.length - 1}
                  step={1}
                  value={stageIndex}
                  aria-valuetext={scene.stages[stageIndex].label}
                  onChange={(event) =>
                    setSceneView({ key: sceneKey, stage: Number(event.target.value), reveal })
                  }
                />
                <div className="scene-slider-ends">
                  <span>Before</span>
                  <span>After</span>
                </div>
                <p className="scene-stage">
                  <strong>{scene.stages[stageIndex].label}</strong>
                  {scene.stages[stageIndex].description}
                </p>
              </div>
              <div className="scene-slider">
                <div className="scene-slider-head">
                  <label htmlFor="reveal-slider">Look inside</label>
                  <span>{revealLabel(reveal)}</span>
                </div>
                <input
                  id="reveal-slider"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={reveal}
                  aria-valuetext={revealLabel(reveal)}
                  onChange={(event) =>
                    setSceneView({ key: sceneKey, stage: stageIndex, reveal: Number(event.target.value) })
                  }
                />
              </div>
            </div>
          )}
          {!scene && (
            <div className="model-label">
              <span aria-hidden="true" />
              {option.modelLabel ?? option.name}
            </div>
          )}
          <div className="pill-controls viewer-controls" aria-label="3D model controls">
            <button
              type="button"
              className={`pill-controls-btn${isRotating ? ' active' : ''}`}
              onClick={toggleRotation}
            >
              Rotate
            </button>
            <button type="button" className="pill-controls-btn" onClick={() => viewerRef.current?.zoomIn()}>
              Zoom in
            </button>
            <button type="button" className="pill-controls-btn" onClick={() => viewerRef.current?.zoomOut()}>
              Zoom out
            </button>
            <button
              type="button"
              className="pill-controls-btn"
              onClick={() => {
                viewerRef.current?.reset()
                setIsRotating(false)
              }}
            >
              Reset
            </button>
            <button type="button" className="pill-controls-btn" onClick={() => move(-1)}>
              Previous
            </button>
            <button type="button" className="pill-controls-btn" onClick={() => move(1)}>
              Next
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
