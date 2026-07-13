'use client';

import { ClassnameHelper } from '@/platform/util/classnames';
import { ClipboardEvent, useRef, useState } from 'react';

const LENGTH = 6;

/**
 * Pull a 6-digit join code out of pasted text — either a bare code or a full join
 * URL (`…/join/<game>?code=NNNNNN`). Prefers the `code=` query value so a URL whose
 * origin contains digits (e.g. `localhost:3000`) doesn't poison the result.
 */
const extractCode = (raw: string): string => {
    const fromQuery = raw.match(/code=(\d{6})/i);
    if (fromQuery) return fromQuery[1];
    return raw.replace(/\D/g, '').slice(-LENGTH);
};

/**
 * The join-code field, rendered as six OTP-style cells. A single transparent input
 * overlays the cells, so paste (incl. a whole join link), the mobile numeric keypad,
 * iOS SMS autofill (`autocomplete="one-time-code"`) and backspace all just work, while
 * the boxes give the premium, unmistakable "type your code here" affordance.
 */
export function CodeInput({
    value,
    onChange,
    onComplete,
    autoFocus = false,
    ariaLabel = 'Código de la partida',
}: {
    value: string;
    onChange: (digits: string) => void;
    onComplete?: (digits: string) => void;
    autoFocus?: boolean;
    ariaLabel?: string;
}) {
    const [focused, setFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const commit = (raw: string) => {
        const digits = raw.replace(/\D/g, '').slice(0, LENGTH);
        onChange(digits);
        if (digits.length === LENGTH) onComplete?.(digits);
    };

    const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault();
        commit(extractCode(event.clipboardData.getData('text')));
    };

    return (
        <div className="relative">
            <input
                ref={inputRef}
                value={value}
                onChange={(e) => commit(e.target.value)}
                onPaste={handlePaste}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={LENGTH}
                aria-label={ariaLabel}
                autoFocus={autoFocus}
                className="absolute inset-0 z-10 h-full w-full cursor-text rounded-xl opacity-0"
            />
            {/*
             * The cells are FLUID, not fixed-width. Six 44px cells plus gaps came to 304px, which
             * overflowed its own card at 375px (a 279px content box) — the boxes were visibly
             * clipped on a phone. Each cell now flexes to the space available and takes its
             * height from its width (`aspect`), capped so it never balloons on a TV.
             */}
            <div className="flex w-full gap-1.5 sm:gap-2" aria-hidden="true">
                {Array.from({ length: LENGTH }).map((_, i) => {
                    const char = value[i];
                    const isActive =
                        focused &&
                        (i === value.length || (value.length === LENGTH && i === LENGTH - 1));
                    return (
                        <div
                            key={i}
                            className={ClassnameHelper.join(
                                'flex aspect-[3/4] max-h-16 min-w-0 flex-1 items-center justify-center rounded-xl text-2xl font-bold tabular-nums text-white ring-1 ring-inset transition-all',
                                // A filled cell reads as "done"; the caret cell as "you are here".
                                char ? 'bg-white/10 ring-white/20' : 'bg-white/5 ring-white/10',
                                isActive && 'ring-2 ring-purple-500',
                            )}
                        >
                            {char ?? ''}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
