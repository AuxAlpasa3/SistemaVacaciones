import type { CatalogoUsuario } from "../interfaces/Usuario";
import { decodificarJWT, validarToken } from "./tokenJTW";
import { decryptJWT } from "./desencriptar";
import { eliminarLocalStorageKey, obtenerJSONLocalStorage } from "./localStorage";
const key = import.meta.env.VITE_PHP_KEY;

export function obtenerUsuarioSesion(): CatalogoUsuario | null {
    try {
        const tokenLocalStorage = obtenerJSONLocalStorage('zk1dp');
        if (!tokenLocalStorage) {
            throw new Error("No se encontró el token del usuario en el almacenamiento");
        }

        const tokendescriptado = decryptJWT(tokenLocalStorage?.state?.usr, key);
        const tokenExpirado = validarToken(tokendescriptado || '');
        if (tokenExpirado) {
            eliminarLocalStorageKey('zk1dp');
            throw new Error("Token expirado o inválido");
        }
        const usuario = decodificarJWT(tokendescriptado || '');
        return usuario?.data || null;
    } catch (error) {
        console.error("Error al obtener el usuario de la sesión: ", error);
        return null;
    }

}