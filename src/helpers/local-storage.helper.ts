export class LocalStorageHelper {
    static setLocalStorageItem<T>(key: string, value: T): void {
        try {
            const stringValue = JSON.stringify({ value });
            localStorage.setItem(key, stringValue);
        } catch {
            console.warn(`Unable to set localStorage<${key}=${value}> to string`);
        }
    }

    static getLocalStorageItem<T>(key: string): T | null {
        try {
            const stringValue = localStorage.getItem(key);
            if (!stringValue) {
                return null;
            }

            const { value } = JSON.parse(stringValue);
            return value;
        } catch {
            console.warn(`Unable to get localStorage<${key}>`);
        }

        return null;
    }

    static getOrSetLocalStorageItem<T>(key: string, setValue: T): T {
        try {
            const stringValue = localStorage.getItem(key);
            if (!stringValue) {
                LocalStorageHelper.setLocalStorageItem(key, setValue);
                return setValue;
            }

            const { value } = JSON.parse(stringValue);
            return value;
        } catch {
            console.warn(`Unable to get localStorage<${key}>`);
        }

        return setValue;
    }

    static removeLocalStorageItem(key: string): void {
        try {
            if (!localStorage.getItem(key)) {
                console.warn(`Key "${key}" does not exist in localStorage.`);
                return;
            }

            localStorage.removeItem(key);
        } catch (error) {
            console.warn(`Unable to remove localStorage<${key}>. Error:`, error);
        }
    }
}
