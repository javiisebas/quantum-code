'use client';

import { ClassnameHelper } from '@/platform/util/classnames';
import { TextareaHTMLAttributes, forwardRef, type InputHTMLAttributes } from 'react';

/**
 * The app's text field. There was no input primitive at all, so the three places that needed one
 * each hand-rolled it — and each hard-coded its own focus ring (purple here, yellow there),
 * padding and radius. They now share one recipe, and the caret ring matches the button focus
 * ring, so a form reads as one control set.
 *
 * `align="center"` is the default because every field in this app is a single short value typed
 * in a hurry on a phone (a name, an answer), where a centred value is easier to aim at and read
 * back.
 */
const BASE =
    'w-full rounded-xl bg-white/5 px-4 py-3 text-white ring-1 ring-inset ring-white/15 outline-none transition placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-60';

type Align = 'left' | 'center';

const ALIGN: Record<Align, string> = { left: 'text-left', center: 'text-center' };

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
    align?: Align;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
    { align = 'center', className, ...props },
    ref,
) {
    return (
        <input
            ref={ref}
            className={ClassnameHelper.join(BASE, 'text-lg font-semibold', ALIGN[align], className)}
            {...props}
        />
    );
});

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    align?: Align;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
    { align = 'center', className, ...props },
    ref,
) {
    return (
        <textarea
            ref={ref}
            className={ClassnameHelper.join(
                BASE,
                'resize-none text-base font-medium leading-relaxed',
                ALIGN[align],
                className,
            )}
            {...props}
        />
    );
});
