export function obtenerLocalStorage(key: string): string {
    return localStorage.getItem(key) || '';
}

export function obtenerJSONLocalStorage(key: string) {
    return JSON.parse(localStorage.getItem(key) || '{}');
}

export function setLocalStorage(key: string, value: string) {
    localStorage.setItem(key, value)
}

export function setJSONLocalStorage(key: string, value: string) {
    JSON.stringify(localStorage.setItem(key, value))
}

export function eliminarLocalStorageKey(key: string) {
    localStorage.removeItem(key);
}

export function eliminarTodoLocalStorage() {
    localStorage.clear();
}