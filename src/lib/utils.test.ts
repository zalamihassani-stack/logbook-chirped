import { describe, it, expect } from 'vitest'
import { formatDate, getResidentYear, getInitials, maskPatientIdentifier } from './utils'

describe('formatDate', () => {
  it('returns - for null', () => {
    expect(formatDate(null)).toBe('-')
  })
  it('returns - for undefined', () => {
    expect(formatDate(undefined)).toBe('-')
  })
  it('returns - for empty string', () => {
    expect(formatDate('')).toBe('-')
  })
  it('returns - for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('-')
  })
  it('returns a formatted string containing the year for a valid ISO date', () => {
    const result = formatDate('2024-03-15')
    expect(result).not.toBe('-')
    expect(result).toContain('2024')
  })
})

describe('getResidentYear', () => {
  it('returns 1 for null', () => {
    expect(getResidentYear(null)).toBe(1)
  })
  it('returns 1 for undefined', () => {
    expect(getResidentYear(undefined)).toBe(1)
  })
  it('returns 1 when start date is today', () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(getResidentYear(today)).toBe(1)
  })
  it('returns 5 for a very old start date (clamped)', () => {
    expect(getResidentYear('2010-01-01')).toBe(5)
  })
  it('returns 2 for a date ~1 year ago', () => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 1)
    d.setDate(d.getDate() - 30)
    expect(getResidentYear(d.toISOString().slice(0, 10))).toBe(2)
  })
})

describe('getInitials', () => {
  it('returns ? for null', () => {
    expect(getInitials(null)).toBe('?')
  })
  it('returns ? for empty string', () => {
    expect(getInitials('')).toBe('?')
  })
  it('returns first two initials uppercased', () => {
    expect(getInitials('Jean Dupont')).toBe('JD')
  })
  it('handles single name', () => {
    expect(getInitials('Hajar')).toBe('H')
  })
  it('returns at most 2 initials for long names', () => {
    expect(getInitials('Ali Baba Hassan')).toBe('AB')
  })
})

describe('maskPatientIdentifier', () => {
  it('returns empty string for null', () => {
    expect(maskPatientIdentifier(null)).toBe('')
  })
  it('returns empty string for undefined', () => {
    expect(maskPatientIdentifier(undefined)).toBe('')
  })
  it('returns bullets for value of 4 chars or fewer', () => {
    expect(maskPatientIdentifier('12')).toBe('••••')
    expect(maskPatientIdentifier('1234')).toBe('••••')
  })
  it('preserves first 2 and last 2 chars for longer values', () => {
    const result = maskPatientIdentifier('123456789')
    expect(result.startsWith('12')).toBe(true)
    expect(result.endsWith('89')).toBe(true)
    expect(result).toContain('•••')
  })
  it('handles numeric values', () => {
    const result = maskPatientIdentifier(12345)
    expect(result).toBe('12•••45')
  })
})
