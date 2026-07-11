'use client';

import { ClassnameHelper } from '@/helpers/clean-classname.helper';
import { Button as HeroButton, ButtonProps } from '@heroui/react';
import { FC } from 'react';

/**
 * The app's primary call-to-action button.
 *
 * Wraps HeroUI's `Button` with the shared purple styling so every CTA stays
 * consistent. Pass only layout utilities (width, margins) through `className`;
 * colour utilities would collide with the base styles.
 */
const PRIMARY_CLASSES =
    'bg-purple-700 text-sm font-semibold text-white shadow-sm hover:bg-purple-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700';

export const PrimaryButton: FC<ButtonProps> = ({ className, ...props }) => (
    <HeroButton size="lg" className={ClassnameHelper.join(PRIMARY_CLASSES, className)} {...props} />
);
