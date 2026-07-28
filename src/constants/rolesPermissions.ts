import type { CatalogoUsuario } from '../interfaces/Usuario';

export const ROLES = {
    ADMINISTRADOR: 1,
    RECURSOS_HUMANOS: 2,
    JEFE_INMEDIATO: 3
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

 

export const normalizarRolId = (rolId: number | string | undefined | null): number | null => {
    if (rolId === undefined || rolId === null) return null;
     
    if (typeof rolId === 'number') return rolId;
     
    if (typeof rolId === 'string') { 
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
        console.error(' filtrarMenuPorRol: usuario es null');
        return [];
    }
    
    const rolId = usuario.rol 
    
    if (!rolId) {
        console.error('filtrarMenuPorRol: No se encontró rol en el usuario');
        return [];
    }
    
    const rolIdNormalizado = normalizarRolId(rolId);
    
    if (!rolIdNormalizado) {
        console.error(' filtrarMenuPorRol: No se pudo normalizar el rol ID');
        return [];
    }
    
    const seccionesFiltradas = MENU_CONFIG.reduce<MenuSection[]>((acumulador, seccion) => {
        const seccionPermitida = tieneAcceso(rolIdNormalizado, seccion.rolesPermitidos);
        
        if (!seccionPermitida) {
            return acumulador;
        }
        
        const subItemsFiltrados = seccion.subItems.filter(item => {
            const permitido = tieneAcceso(rolIdNormalizado, item.rolesPermitidos);
            return permitido;
        });
        
        if (subItemsFiltrados.length === 0) {
            return acumulador;
        }
        
        acumulador.push({
            ...seccion,
            subItems: subItemsFiltrados
        });
        
        return acumulador;
    }, []);
    
    seccionesFiltradas.forEach(seccion => {
        console.log(`   - ${seccion.title}: [${seccion.subItems.map(i => i.label).join(', ')}]`);
    });
    
    return seccionesFiltradas;
};
 
export const obtenerMenuPorRol = (usuario: CatalogoUsuario | null): MenuSection[] => {
    if (!usuario) {
        console.warn('obtenerMenuPorRol: usuario nulo');
        return [];
    }
    
    const rolId = usuario.rol;
    const rolNormalizado = normalizarRolId(rolId);
     
    if (rolNormalizado === 1) {
        return MENU_CONFIG;
    }
    
    return filtrarMenuPorRol(usuario);
};