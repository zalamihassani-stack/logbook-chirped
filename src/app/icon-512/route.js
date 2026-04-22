import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  const logoData = readFileSync(join(process.cwd(), 'public/logo.png'))
  const base64 = `data:image/png;base64,${logoData.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
        }}
      >
        <img src={base64} width={512} height={512} alt="" style={{ objectFit: 'contain' }} />
      </div>
    ),
    { width: 512, height: 512 }
  )
}
