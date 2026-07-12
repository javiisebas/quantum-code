import { ImageResponse } from 'next/og';

/**
 * Open Graph / social share image, generated at build time via ImageResponse.
 *
 * On-brand dark background with the purple spy "eye" glyph, the title, and a
 * Spanish tagline. Only satori-safe CSS is used (flexbox, solid colors,
 * gradients, border-radius); every multi-child container sets display: flex.
 */
export const alt = 'Quantum Code';

export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default function OpengraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background:
                        'linear-gradient(135deg, #111827 0%, #1B1030 55%, #111827 100%)',
                    padding: '80px',
                }}
            >
                {/* Eye / target glyph */}
                <div
                    style={{
                        width: 150,
                        height: 150,
                        borderRadius: '50%',
                        border: '12px solid #7E22CE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 48,
                    }}
                >
                    <div
                        style={{
                            width: 88,
                            height: 88,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #C27AFF 0%, #7E22CE 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                background: '#111827',
                            }}
                        />
                    </div>
                </div>

                {/* Title */}
                <div
                    style={{
                        display: 'flex',
                        fontSize: 104,
                        fontWeight: 700,
                        letterSpacing: '-2px',
                    }}
                >
                    <span style={{ color: '#FFFFFF' }}>Quantum</span>
                    <span style={{ color: '#C27AFF', marginLeft: 24 }}>Code</span>
                </div>

                {/* Spanish tagline */}
                <div
                    style={{
                        display: 'flex',
                        marginTop: 28,
                        fontSize: 38,
                        color: '#9CA3AF',
                        textAlign: 'center',
                    }}
                >
                    Descifra el código y guía a tu equipo a la victoria.
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
