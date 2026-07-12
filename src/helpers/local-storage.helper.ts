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

    static removeLocalStorageItem(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn(`Unable to remove localStorage<${key}>. Error:`, error);
        }
    }
}
