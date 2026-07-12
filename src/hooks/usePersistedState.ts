'use client';

import { LocalStorageHelper } from '@/helpers/local-storage.helper';
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

/**
 * State that transparently mirrors to `localStorage`.
 *
 * Hydration-safe: the first render (server + initial client render) always uses
 * `initialValue`, and the stored value is read in an effect after mount. This
 * avoids the server/client markup mismatch you get from reading `localStorage`
 * inside a `useState` initializer. Consumers that must not act until the real
 * value is known can gate on the returned `hydrated` flag.
 */
export const usePersistedState = <T>(
    key: string,
    initialValue: T,
): [T, Dispatch<SetStateAction<T>>, boolean] => {
    const [value, setValue] = useState<T>(initialValue);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        const stored = LocalStorageHelper.getLocalStorageItem<T>(key);
        if (stored !== null) {
            setValue(stored);
        }
        setHydrated(true);
    }, [key]);

    const setPersisted = useCallback<Dispatch<SetStateAction<T>>>(
        (next) => {
            setValue((prev) => {
                const resolved = next instanceof Function ? next(prev) : next;
                LocalStorageHelper.setLocalStorageItem(key, resolved);
                return resolved;
            });
        },
        [key],
    );

    return [value, setPersisted, hydrated];
};
