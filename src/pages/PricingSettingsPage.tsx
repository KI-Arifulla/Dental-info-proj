import { useState } from 'react'
import type { TreatmentOption } from '../data/types'
import { treatments } from '../data/treatments'
import { getEffectivePrice, setOverride } from '../utils/pricing'
import '../styles/settings.css'

interface PriceSettingRowProps {
  treatmentId: string
  option: TreatmentOption
}

function PriceSettingRow({ treatmentId, option }: PriceSettingRowProps) {
  const [value, setValue] = useState(() =>
    String(getEffectivePrice(treatmentId, option.id, option.price)),
  )

  function saveValue() {
    if (value.trim() === '') {
      setOverride(treatmentId, option.id, null)
      setValue(String(option.price))
      return
    }

    const nextPrice = Number(value)
    if (Number.isFinite(nextPrice) && nextPrice >= 0) {
      setOverride(treatmentId, option.id, nextPrice)
      setValue(String(nextPrice))
      return
    }

    setValue(String(getEffectivePrice(treatmentId, option.id, option.price)))
  }

  return (
    <label className="price-setting-row">
      <span className="price-setting-name">{option.name}</span>
      <span className="price-input-wrap">
        <input
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={value}
          aria-label={`${option.name} price`}
          onChange={(event) => setValue(event.target.value)}
          onBlur={saveValue}
        />
      </span>
      <small>Default price</small>
    </label>
  )
}

export function PricingSettingsPage() {
  return (
    <main className="page settings-page">
      <header className="settings-header">
        <h1 className="headline">Pricing</h1>
        <p className="subhead">
          Prices are stored on this iPad and override the built-in estimates everywhere in the app.
        </p>
      </header>

      <div className="pricing-sections">
        {treatments.map((treatment) => (
          <section className="pricing-section" key={treatment.id}>
            <h2>{treatment.name.toUpperCase()}</h2>
            <div className="pricing-rows">
              {treatment.options.map((option) => (
                <PriceSettingRow key={option.id} treatmentId={treatment.id} option={option} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
