import clsx from 'clsx';

export class ClassnameHelper {
    static join(...classes: (string | null | boolean | undefined)[]): string {
        return clsx(classes);
    }
}
