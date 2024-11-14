import clsx from 'clsx';

export class ClassnameHelper {
    static filter(...classes: (string | null | undefined)[]): string {
        return classes.filter(Boolean).join(' ');
    }

    static join(...classes: (string | null | boolean | undefined)[]): string {
        return clsx(classes);
    }
}
