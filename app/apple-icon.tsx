import { ImageResponse } from 'next/og';

export const size = {
    width: 180,
    height: 180,
};

export default function AppleIcon() {
    return new ImageResponse((
            <div
                style={{
                    fontSize: 110,
                    background: '#090d16',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '40px',
                    border: '4px solid rgba(16, 185, 129, 0.5)',
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