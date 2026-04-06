import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0D2B4E',
          borderRadius: '20%',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              color: '#7BB8E8',
              fontWeight: 900,
              fontSize: 160,
              letterSpacing: '-4px',
              lineHeight: 1,
            }}
          >
            LCP
          </span>
          <span
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 52,
              marginTop: 8,
              letterSpacing: 2,
            }}
          >
            LOGBOOK
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
