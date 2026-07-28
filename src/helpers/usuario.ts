// helpers/usuario.ts
import type { CatalogoUsuario } from "../interfaces/Usuario";
import { decodificarJWT, validarToken } from "./tokenJTW";
import { decryptJWT } from "./desencriptar";
import { eliminarLocalStorageKey, obtenerJSONLocalStorage, obtenerLocalStorage } from "./localStorage";

const key = import.meta.env.VITE_PHP_KEY;

export function obtenerUsuarioSesion(): CatalogoUsuario | null {
    try { 
        const tokenData = obtenerJSONLocalStorage('zk1dp'); 
        if (!tokenData) {
            console.warn("No se encontró el token del usuario en el almacenamiento");
            return null;
        }
 
        let tokenString: string | null = null;
         
        if (tokenData?.state?.usr) {
            tokenString = tokenData.state.usr;
        }  
        else if (typeof tokenData === 'string') {
            tokenString = tokenData;
        }
        // Si tokenData tiene la propiedad usr directamente
        else if (tokenData?.usr) {
            tokenString = tokenData.usr;
        }

        if (!tokenString) {
            console.warn("No se pudo extraer el token del almacenamiento");
            return null;
        }
 
        let tokendescriptado: string;
        try {
            const decrypted = decryptJWT(tokenString, key);
            if (!decrypted) {
                throw new Error("Error al desencriptar el token");
            }
            tokendescriptado = decrypted;
        } catch (decryptError) {
            console.error("Error al desencriptar el token:", decryptError); 
            tokendescriptado = tokenString;
        }
 
        try {
            const tokenExpirado = validarToken(tokendescriptado);
            if (tokenExpirado) {
                eliminarLocalStorageKey('zk1dp');
                console.warn("Token expirado, eliminando sesión");
                return null;
            }
        } catch (validationError) {
            console.error("Error al validar el token:", validationError);
            // Si hay error en la validación, asumimos que el token es inválido
            eliminarLocalStorageKey('zk1dp');
            return null;
        }

        // Decodificar el JWT para obtener los datos del usuario
        let usuarioDecodificado: any;
        try {
            usuarioDecodificado = decodificarJWT(tokendescriptado);
        } catch (decodeError) {
            console.error("Error al decodificar el JWT:", decodeError);
            return null;
        }

        // Extraer los datos del usuario
        const usuarioData = usuarioDecodificado?.data || usuarioDecodificado;

        if (!usuarioData) {
            console.warn("No se encontraron datos de usuario en el token");
            return null;
        }

        // Mapear los datos al formato CatalogoUsuario
        return mapearUsuario(usuarioData);
        
    } catch (error) {
        console.error("Error al obtener el usuario de la sesión: ", error);
        return null;
    }
}

/**
 * Función para mapear los datos del token al formato CatalogoUsuario
 */
function mapearUsuario(data: any): CatalogoUsuario | null {
    try {
        // Verificar que los datos necesarios existan
        if (!data) {
            return null;
        }

        const usuario: CatalogoUsuario = {
            IdUsuario: data.IdUsuario || data.idUsuario || data.id || 0,
            Usuario: data.Usuario || data.usuario || data.username || '',
            EmpleadoID: data.EmpleadoID || data.empleadoID || data.empleadoId || 0,
            Descripcion: data.Descripcion || data.descripcion || '',
            TipoUsuario: data.TipoUsuario || data.tipoUsuario || data.tipo || 0,
            TipoUsuarioNombre: data.TipoUsuarioNombre || data.tipoUsuarioNombre || '',
            Estatus: data.Estatus || data.estatus || data.status || 1,
            rol: data.rol || data.Rol || data.role || 0,
            RolUsuario: data.RolUsuario || data.rolUsuario || data.rolNombre || '',
            Ubicacion: data.Ubicacion || data.ubicacion || 0,
            IdPersonal: data.IdPersonal || data.idPersonal || data.personalId || 0,
            NoEmpleado: data.NoEmpleado || data.noEmpleado || data.numeroEmpleado || '',
            NombreCompleto: data.NombreCompleto || data.nombreCompleto || data.nombre || '',
            Cargo: data.Cargo || data.cargo || 0,
            Departamento: data.Departamento || data.departamento || 0,
            Empresa: data.Empresa || data.empresa || 1,
            Status: data.Status || data.status || 1,
            IdUbicacion: data.IdUbicacion || data.idUbicacion || data.ubicacionId || 0,
            NSS: data.NSS || data.nss || null,
            esJefeInmediato: data.esJefeInmediato || data.esJefe || data.esJefeInmediato || 0,
            RutaFoto: data.RutaFoto || data.rutaFoto || data.foto || data.fotoUrl || '',
            Email: data.Email || data.email || data.correo || '',
            Contacto: data.Contacto || data.contacto || data.telefono || null,
            IdJefeInmediato: data.IdJefeInmediato || data.idJefeInmediato || data.jefeId || null,
            TipoSangre: data.TipoSangre || data.tipoSangre || data.sangre || null,
            FechaIngreso: data.FechaIngreso || data.fechaIngreso || data.ingreso || '',
            Alergias: data.Alergias || data.alergias || null,
            Turno: data.Turno || data.turno || null,
            FechadeNacimiento: data.FechadeNacimiento || data.fechadeNacimiento || data.nacimiento || null,
            Direccion: data.Direccion || data.direccion || null
        };

        return usuario;
    } catch (error) {
        console.error("Error al mapear los datos del usuario:", error);
        return null;
    }
}

/**
 * Función para actualizar el usuario en el localStorage
 */
export function actualizarUsuarioSesion(usuarioActualizado: CatalogoUsuario): boolean {
    try {
        const tokenData = obtenerJSONLocalStorage('zk1dp');
        if (!tokenData) {
            console.warn("No se encontró el token para actualizar");
            return false;
        }

        // Si el tokenData es un objeto con state.usr, actualizar state
        if (tokenData.state && tokenData.state.usr) {
            // Para actualizar necesitamos mantener la estructura original
            // y solo actualizar los datos del usuario en el token
            const tokenString = tokenData.state.usr;
            const tokendescriptado = decryptJWT(tokenString, key);
            if (tokendescriptado) {
                // Decodificar y actualizar los datos
                const decoded = decodificarJWT(tokendescriptado);
                if (decoded) {
                    // Actualizar los datos del usuario en el payload
                    const payload = decoded.data || decoded;
                    Object.assign(payload, usuarioActualizado);
                     
                }
            }
        }

        // Guardar el usuario actualizado en una clave separada o en el mismo objeto
        const currentData = obtenerJSONLocalStorage('zk1dp');
        if (currentData) {
            // Si los datos son un objeto, añadir la propiedad usuarioActualizado
            const updatedData = {
                ...currentData,
                usuarioActual: usuarioActualizado,
                // Mantener la estructura original
                state: {
                    ...currentData.state,
                    usuarioData: usuarioActualizado
                }
            };
            localStorage.setItem('zk1dp', JSON.stringify(updatedData));
        }

        return true;
    } catch (error) {
        console.error("Error al actualizar el usuario de sesión:", error);
        return false;
    }
}
 
export function obtenerDatosUsuarioLocal(): CatalogoUsuario | null {
    try {
        const data = obtenerJSONLocalStorage('zk1dp');
        if (!data) return null;
 
        if (data.usuarioActual) {
            return data.usuarioActual;
        }

        if (data.usuario) {
            return data.usuario;
        }

        if (data.user) {
            return data.user;
        }

        if (data.data) {
            return mapearUsuario(data.data);
        }

        return null;
    } catch (error) {
        console.error("Error al obtener datos del usuario local:", error);
        return null;
    }
} 

export function obtenerTokenEncriptado(): string | null {
    try {
        const tokenData = obtenerJSONLocalStorage('zk1dp');
        if (!tokenData) return null;

        if (tokenData.state?.usr) {
            return tokenData.state.usr;
        }

        if (typeof tokenData === 'string') {
            return tokenData;
        }

        if (tokenData.usr) {
            return tokenData.usr;
        }

        return null;
    } catch (error) {
        console.error("Error al obtener el token encriptado:", error);
        return null;
    }
}
 
export function obtenerTokenDesencriptado(): string | null {
    try {
        const tokenEncriptado = obtenerTokenEncriptado();
        if (!tokenEncriptado) return null;

        const tokendescriptado = decryptJWT(tokenEncriptado, key);
        return tokendescriptado || null;
    } catch (error) {
        console.error("Error al obtener el token desencriptado:", error);
        return null;
    }
} 

export function guardarUsuarioSesion(usuario: CatalogoUsuario): void {
    try {
        const tokenData = obtenerJSONLocalStorage('zk1dp');
        if (tokenData) { 
            const updatedData = {
                ...tokenData,
                usuarioActual: usuario,
                state: {
                    ...tokenData.state,
                    usuarioData: usuario
                }
            };
            localStorage.setItem('zk1dp', JSON.stringify(updatedData));
        } else { 
            localStorage.setItem('zk1dp', JSON.stringify({
                usuarioActual: usuario,
                usuario: usuario
            }));
        }
    } catch (error) {
        console.error("Error al guardar el usuario de sesión:", error);
    }
}