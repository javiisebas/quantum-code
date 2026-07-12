import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export class ClassnameHelper {
    /**
     * Join class names and resolve Tailwind conflicts. `clsx` handles conditionals;
     * `twMerge` then dedupes clashing utilities so a caller's `className` reliably
     * overrides a component's built-in classes (e.g. `<Eyebrow className="text-purple-300">`
     * wins over the default `text-gray-400`). Without this the two would both be emitted
     * and the winner would depend on stylesheet order.
     */
    static join(...classes: (string | null | boolean | undefined)[]): string {
        return twMerge(clsx(classes));
    }
}
