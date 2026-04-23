import { getLabelColor, formatConf } from '../utils/helpers'
import { Brain } from 'lucide-react'

export default function ClassificationBadge({ label, confidence }) {
  const colors = getLabelColor(label)

  return (
    <div
      className="fade-up"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '18px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div style={{
        width: 44, height: 44,
        background: colors.dim,
        border: `1px solid ${colors.accent}44`,
        borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        <Brain size={20} color={colors.accent} />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 12, fontWeight: 600,
          color: 'var(--text-3)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 4
        }}>
          ML Classification
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 22, fontWeight: 700,
            color: colors.accent,
            letterSpacing: '-0.02em'
          }}>
            {label ? label.charAt(0).toUpperCase() + label.slice(1) : '—'}
          </span>
          {confidence != null && (
            <span style={{
              fontSize: 11, fontWeight: 500,
              color: 'var(--text-3)',
              fontFamily: 'var(--mono)'
            }}>
              {formatConf(confidence)} confidence
            </span>
          )}
        </div>
      </div>

      {/* Confidence bar */}
      {confidence != null && (
        <div style={{ width: 80 }}>
          <div style={{
            fontSize: 12, color: 'var(--text-3)', marginBottom: 4,
            textAlign: 'right', fontFamily: 'var(--mono)'
          }}>
            {formatConf(confidence)}
          </div>
          <div style={{
            height: 4, background: 'var(--bg-elevated)',
            borderRadius: 2, overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${Number(confidence) * 100}%`,
              background: colors.accent,
              borderRadius: 2,
              transition: 'width 0.6s ease'
            }} />
          </div>
        </div>
      )}
    </div>
  )
}