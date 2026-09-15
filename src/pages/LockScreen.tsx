import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CLINIC_NAME, DEFAULT_PASSCODE } from '../config/appConfig'
import { useAuth } from '../context/useAuth'
import '../styles/lock.css'

export function LockScreen() {
  const [entered, setEntered] = useState('')
  const [hasError, setHasError] = useState(false)
  const errorTimerRef = useRef<number | null>(null)
  const { unlock } = useAuth()
  const navigate = useNavigate()

  useEffect(
    () => () => {
      if (errorTimerRef.current !== null) window.clearTimeout(errorTimerRef.current)
    },
    [],
  )

  function continueToTreatments() {
    unlock()
    navigate('/treatments')
  }

  function enterDigit(digit: string) {
    if (hasError || entered.length >= DEFAULT_PASSCODE.length) return
    const next = `${entered}${digit}`
    setEntered(next)

    if (next.length !== DEFAULT_PASSCODE.length) return
    if (next === DEFAULT_PASSCODE) {
      continueToTreatments()
      return
    }

    setHasError(true)
    errorTimerRef.current = window.setTimeout(() => {
      setHasError(false)
      setEntered('')
      errorTimerRef.current = null
    }, 550)
  }

  function removeDigit() {
    if (!hasError) setEntered((current) => current.slice(0, -1))
  }

  return (
    <main className="lock-screen">
      <section className="lock-branding">
        <div className="clinic-mark" aria-hidden="true">🦷</div>
        <h1 className="headline">{CLINIC_NAME}</h1>
        <p className="subhead">
          Treatment explainer. Enter the clinic passcode to begin a consultation.
        </p>
      </section>

      <section className={`lock-keypad-panel${hasError ? ' keypad-error' : ''}`}>
        <h2>Clinic passcode</h2>
        <div className="keypad-dots" aria-label={`${entered.length} digits entered`}>
          {Array.from({ length: DEFAULT_PASSCODE.length }, (_, index) => (
            <span
              key={index}
              className={`keypad-dot${index < entered.length ? ' filled' : ''}${
                hasError ? ' error' : ''
              }`}
            />
          ))}
        </div>
        <div className="keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              type="button"
              className="keypad-btn"
              key={digit}
              onClick={() => enterDigit(digit)}
            >
              {digit}
            </button>
          ))}
          <span aria-hidden="true" />
          <button type="button" className="keypad-btn" onClick={() => enterDigit('0')}>
            0
          </button>
          <button
            type="button"
            className="keypad-btn keypad-backspace"
            aria-label="Backspace"
            onClick={removeDigit}
          >
            ⌫
          </button>
        </div>
        <button type="button" className="btn-link lock-skip" onClick={continueToTreatments}>
          Continue without passcode
        </button>
      </section>
    </main>
  )
}
