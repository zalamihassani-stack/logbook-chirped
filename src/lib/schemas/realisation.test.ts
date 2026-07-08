import { describe, it, expect } from 'vitest'
import { validateRealisation } from './realisation'

const VALID = {
  procedure_id: 'proc-1',
  enseignant_id: 'ens-1',
  activity_type: 'autonome' as const,
  performed_at: '2024-06-15',
}

describe('validateRealisation', () => {
  it('returns empty string for valid minimal data', () => {
    expect(validateRealisation(VALID)).toBe('')
  })

  it('accepts optional fields without error', () => {
    expect(
      validateRealisation({
        ...VALID,
        ipp_patient: 'AB123',
        commentaire: 'Bon geste',
        compte_rendu: 'RAS',
        superviseur_resident_id: 'res-42',
      })
    ).toBe('')
  })

  it('requires procedure_id', () => {
    const err = validateRealisation({ ...VALID, procedure_id: '' })
    expect(err).toBeTruthy()
    expect(err).toMatch(/geste/i)
  })

  it('requires enseignant_id', () => {
    const err = validateRealisation({ ...VALID, enseignant_id: '' })
    expect(err).toBeTruthy()
    expect(err).toMatch(/enseignant/i)
  })

  it('rejects an unknown activity_type', () => {
    const err = validateRealisation({ ...VALID, activity_type: 'inconnu' })
    expect(err).toBeTruthy()
  })

  it('accepts all three valid activity_type values', () => {
    expect(validateRealisation({ ...VALID, activity_type: 'expose' })).toBe('')
    expect(validateRealisation({ ...VALID, activity_type: 'supervise' })).toBe('')
    expect(validateRealisation({ ...VALID, activity_type: 'autonome' })).toBe('')
  })

  it('rejects a date in DD/MM/YYYY format', () => {
    const err = validateRealisation({ ...VALID, performed_at: '15/06/2024' })
    expect(err).toBeTruthy()
    expect(err).toMatch(/[Dd]ate/)
  })

  it('rejects ipp_patient exceeding 64 characters', () => {
    const err = validateRealisation({ ...VALID, ipp_patient: 'a'.repeat(65) })
    expect(err).toBeTruthy()
    expect(err).toMatch(/IPP/)
  })

  it('returns an error for null or undefined input', () => {
    expect(validateRealisation(null)).toBeTruthy()
    expect(validateRealisation(undefined)).toBeTruthy()
  })
})
