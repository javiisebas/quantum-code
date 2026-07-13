import { ImageResponse } from 'next/og';

/**
 * Apple touch icon, generated at build time via ImageResponse (satori).
 *
 * Recreates the icon.svg concept — a dark brand tile with a purple spy "eye"
 * (target ring + iris + keyhole pupil) — using only the CSS subset satori
 * supports: solid colors, gradients, border, and border-radius.
 */
export const size = {
    width: 180,
    height: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
    return new ImageResponse(
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#111827',
            }}
        >
            {/* Eye outline / target ring */}
            <div
                style={{
                    width: 132,
                    height: 132,
                    borderRadius: '50%',
                    border: '10px solid #7E22CE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {/* Iris */}
                <div
                    style={{
                        width: 78,
                        height: 78,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #C27AFF 0%, #7E22CE 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {/* Keyhole pupil */}
                    <div
                        style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: '#111827',
                        }}
                    />
                </div>
            </div>
        </div>,
        {
            ...size,
        },
    );
}
