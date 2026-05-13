// rolesPermissions.ts
import type { CatalogoUsuario } from '../interfaces/Usuario';

export const ROLES = {
    ADMINISTRADOR: 1,
    RECURSOS_HUMANOS: 2,
    SUPERVISOR: 3
} as const;

export interface MenuItem {
    path: string;
    label: string;
    icon: string;
    rolesPermitidos: number[];
}

export interface MenuSection {
    id: string;
    title: string;
    icon: string;
    rolesPermitidos: number[];
    subItems: MenuItem[];
}

export const MENU_CONFIG: MenuSection[] = [
    {
        id: 'procesos',
        title: 'PROCESOS',
        icon: 'Process',
        rolesPermitidos: [1, 2, 3], 
        subItems: [
            {
                path: '/Personal/Personal',
                label: 'Personal',
                icon: 'FaUsers',
                rolesPermitidos: [1, 2] 
            },
            {
                path: '/Vacaciones/Vacaciones',
                label: 'Vacaciones',
                icon: 'Calendar',
                rolesPermitidos: [1, 2, 3] 
            }
        ]
    },
    {
        id: 'catalogos',
        title: 'CATÁLOGOS',
        icon: 'LibraryBig',
        rolesPermitidos: [1, 2],
        subItems: [
            {
                path: '/TablaVacaciones/TablaVacaciones',
                label: 'Tabla Vacaciones',
                icon: 'FaTable',
                rolesPermitidos: [1, 2]
            },
            {
                path: '/Ubicaciones/Ubicaciones',
                label: 'Ubicaciones',
                icon: 'FaMapMarkerAlt',
                rolesPermitidos: [1, 2]
            },
            {
                path: '/Cargo/Cargo',
                label: 'Cargo',
                icon: 'FaBriefcase',
                rolesPermitidos: [1, 2]
            },
            {
                path: '/Departamento/Departamento',
                label: 'Departamento',
                icon: 'FaBuilding',
                rolesPermitidos: [1, 2]
            },
        ]
    },
    {
        id: 'configuracion',
        title: 'CONFIGURACIÓN',
        icon: 'Settings',
        rolesPermitidos: [1, 2],
        subItems: [
            {
                path: '/Usuario/Usuario',
                label: 'Usuario',
                icon: 'Users',
                rolesPermitidos: [1, 2]
            }
        ]
    }
];

// Función para obtener el nombre del rol
export const obtenerNombreRol = (rolId: number | null): string => {
    switch (rolId) {
        case 1: return 'Administrador';
        case 2: return 'Recursos Humanos';
        case 3: return 'Supervisor';
        default: return 'Sin rol';
    }
};

export const normalizarRolId = (rolId: number | string | undefined | null): number | null => {
    if (rolId === undefined || rolId === null) return null;
    
    // Si es número, devolver directamente
    if (typeof rolId === 'number') return rolId;
    
    // Si es string, intentar convertir
    if (typeof rolId === 'string') {
        // Limpiar el string (remover espacios, etc.)
        const cleaned = rolId.trim();
        const numero = parseInt(cleaned, 10);
        return isNaN(numero) ? null : numero;
    }
    
    return null;
};

export const tieneAcceso = (rolId: number | string | undefined | null, rolesPermitidos: number[]): boolean => {
    const rolIdNormalizado = normalizarRolId(rolId);
    if (!rolIdNormalizado) return false;
    return rolesPermitidos.includes(rolIdNormalizado);
};

export const filtrarMenuPorRol = (usuario: CatalogoUsuario | null): MenuSection[] => {
    if (!usuario) {
        console.error('❌ filtrarMenuPorRol: usuario es null');
        return [];
    }
    
    const rolId = usuario.rol 
    
    console.log('🔍 filtrarMenuPorRol - Datos del usuario:', {
        usuarioCompleto: usuario,
        rolEncontrado: rolId,
        tipoRol: typeof rolId,
        propiedadesDisponibles: Object.keys(usuario)
    });
    
    if (!rolId) {
        console.error('❌ filtrarMenuPorRol: No se encontró rol en el usuario');
        return [];
    }
    
    const rolIdNormalizado = normalizarRolId(rolId);
    
    console.log('📊 Información del rol:', {
        original: rolId,
        normalizado: rolIdNormalizado,
        nombreRol: obtenerNombreRol(rolIdNormalizado)
    });
    
    if (!rolIdNormalizado) {
        console.error('❌ filtrarMenuPorRol: No se pudo normalizar el rol ID');
        return [];
    }
    
    const seccionesFiltradas = MENU_CONFIG.reduce<MenuSection[]>((acumulador, seccion) => {
        console.log(`\n📁 Procesando sección: ${seccion.title}`);
        console.log(`   Roles permitidos en sección: [${seccion.rolesPermitidos}]`);
        
        // Verificar si la sección es accesible para este rol
        const seccionPermitida = tieneAcceso(rolIdNormalizado, seccion.rolesPermitidos);
        
        if (!seccionPermitida) {
            console.log(`   ❌ Sección NO permitida para rol ${rolIdNormalizado}`);
            return acumulador;
        }
        
        console.log(`   ✅ Sección permitida`);
        
        // Filtrar subItems accesibles
        const subItemsFiltrados = seccion.subItems.filter(item => {
            const permitido = tieneAcceso(rolIdNormalizado, item.rolesPermitidos);
            console.log(`     📄 SubItem: ${item.label} - Roles: [${item.rolesPermitidos}] - ${permitido ? '✅ Permitido' : '❌ No permitido'}`);
            return permitido;
        });
        
        if (subItemsFiltrados.length === 0) {
            console.log(`   ⚠️ Sección sin subItems válidos, se omite`);
            return acumulador;
        }
        
        console.log(`   ✅ Sección agregada con ${subItemsFiltrados.length} subItems`);
        acumulador.push({
            ...seccion,
            subItems: subItemsFiltrados
        });
        
        return acumulador;
    }, []);
    
    console.log(`\n🎯 RESULTADO FINAL: ${seccionesFiltradas.length} secciones accesibles`);
    seccionesFiltradas.forEach(seccion => {
        console.log(`   - ${seccion.title}: [${seccion.subItems.map(i => i.label).join(', ')}]`);
    });
    
    return seccionesFiltradas;
};

// Función para obtener el menú según el rol (con manejo especial para admin)
export const obtenerMenuPorRol = (usuario: CatalogoUsuario | null): MenuSection[] => {
    if (!usuario) {
        console.warn('⚠️ obtenerMenuPorRol: usuario nulo');
        return [];
    }
    
    const rolId = usuario.rol;
    const rolNormalizado = normalizarRolId(rolId);
    
    // Si es administrador (rol 1), mostrar todo el menú completo
    if (rolNormalizado === 1) {
        console.log('👑 Usuario Administrador - Mostrando menú completo');
        return MENU_CONFIG;
    }
    
    // Para otros roles, filtrar
    console.log(`🔒 Usuario ${obtenerNombreRol(rolNormalizado)} - Filtrando menú`);
    return filtrarMenuPorRol(usuario);
};