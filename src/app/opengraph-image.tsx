import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

/**
 * Open Graph / social share image, generated at build time via ImageResponse.
 *
 * The glyph is the real icon (rasterized from icon.svg by `pnpm icons`) rather
 * than a CSS approximation, so the share card, the tab and the installed app all
 * show the same mark. Everything around it sticks to the satori-safe CSS subset
 * (flexbox, solid colors, gradients, border-radius); every multi-child container
 * sets display: flex.
 */
export const alt = 'Quantum Arcade — Juegos de fiesta';

export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default async function OpengraphImage() {
    const glyph = await readFile(join(process.cwd(), 'src/app/og-glyph.png'));

    return new ImageResponse(
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #111827 0%, #1B1030 55%, #111827 100%)',
                padding: '80px',
            }}
        >
            {/* eslint-disable-next-line @next/next/no-img-element -- satori rasterizes a plain <img>. */}
            <img
                width={240}
                height={240}
                alt=""
                src={`data:image/png;base64,${glyph.toString('base64')}`}
                style={{ marginBottom: 32 }}
            />

            <div
                style={{
                    display: 'flex',
                    fontSize: 104,
                    fontWeight: 700,
                    letterSpacing: '-2px',
                }}
            >
                <span style={{ color: '#FFFFFF' }}>Quantum</span>
                <span style={{ color: '#C27AFF', marginLeft: 24 }}>Arcade</span>
            </div>

            <div
                style={{
                    display: 'flex',
                    marginTop: 28,
                    fontSize: 38,
                    color: '#9CA3AF',
                    textAlign: 'center',
                }}
            >
                Una pantalla, un móvil para cada uno. Juegos de fiesta.
            </div>
        </div>,
        {
            ...size,
        },
    );
}
