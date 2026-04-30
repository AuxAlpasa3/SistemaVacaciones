import { jwtDecode, type JwtPayload } from "jwt-decode"
import type { Usuario } from "../interfaces/Usuario";

export interface DecodedToken extends JwtPayload {
    data: Usuario;
}

export function decodificarJWT(token: string): DecodedToken | null {
    try {
        const tkn: DecodedToken = jwtDecode(token);
        return tkn;
    } catch (error) {
        console.error("Error al decodificar JWT:", error);
        return null;
    }
}

export function validarToken(token: string) {
    try {
        if (!token) {
            return false;
        }

        const tokenDecodificado = decodificarJWT(token);
        const fechaActual = Date.now() / 1000;

        // verificar expiración (vencimiento)
        const tokenExpirado = tokenDecodificado?.exp ? tokenDecodificado.exp < fechaActual : false;

        return tokenExpirado;

    } catch (error: any) {
        console.error("token invalido", error);
        return false;
    }

}