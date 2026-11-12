import { ImageResponse } from 'next/og';

export const size = {
    width: 32,
    height: 32,
};

export default function Icon() {
    return new ImageResponse((
            <div
                style={{
                    fontSize: 20,
                    background: '#090d16',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    border: '2px solid rgba(16, 185, 129, 0.4)',
                    color: '#10b981',
                    fontWeight: 800,
                }}
            >
                D
            </div>
        ),
        {
            ...size,
        });
}