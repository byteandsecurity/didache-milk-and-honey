import { ImageResponse } from 'next/og';

export const size = {
    width: 512,
    height: 512,
};

export default function Icon() {
    return new ImageResponse((
            <div
                style={{
                    fontSize: 320, // Scaled up for 512x512 canvas
                    background: '#090d16',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '110px', // Proportional rounded square
                    border: '16px solid rgba(16, 185, 129, 0.4)',
                    color: '#10b981',
                    fontWeight: 900,
                }}
            >
                D
            </div>
        ),
        {
            ...size,
        });
}