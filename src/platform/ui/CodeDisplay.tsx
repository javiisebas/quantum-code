import { ClassnameHelper } from '@/platform/util/classnames';
import { Eyebrow } from './Eyebrow';

/**
 * The big join-code readout shown on host screens. Splits the 6 digits into two
 * groups of three (`706 095`) so people can read them across a room without losing
 * their place, and keeps one consistent size/treatment everywhere it appears.
 */
export function CodeDisplay({
    code,
    size = 'lg',
    label = 'Código',
    className,
}: {
    code: number;
    size?: 'lg' | 'md';
    label?: string | null;
    className?: string;
}) {
    const digits = String(code);
    const grouped = `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return (
        <div className={ClassnameHelper.join('flex flex-col items-center gap-1', className)}>
            {label && <Eyebrow className="whitespace-nowrap">{label}</Eyebrow>}
            <span
                className={ClassnameHelper.join(
                    'font-mono font-bold tabular-nums tracking-[0.15em] text-white',
                    // The `short:` step down is owned HERE, by the component that owns this
                    // typography. A caller reaching in with `[&>span]` (as one did) also hits the
                    // eyebrow — which is a span too — and blows the label up to 30px.
                    size === 'lg' ? 'text-5xl short:text-3xl' : 'text-4xl',
                )}
            >
                {grouped}
            </span>
        </div>
    );
}
