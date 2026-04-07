import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
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
        }}
      >
        <span
          style={{
            color: '#7BB8E8',
            fontWeight: 900,
            fontSize: 72,
            letterSpacing: '-2px',
            lineHeight: 1,
          }}
        >
          LCP
        </span>
      </div>
    ),
    { ...size }
  )
}
