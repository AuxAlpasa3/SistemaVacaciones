// constants/rolesPermissions.ts
import type { Usuario } from '../interfaces/Usuario';

// Definir los IDs de roles disponibles
export const ROLES = {
    ADMINISTRADOR: 1,
    RECURSOS_HUMANOS: 2,
    SUPERVISOR: 3
} as const;

// Interfaz para los items del menú
export interface MenuItem {
    path: string;
    label: string;
    icon: string;
    rolesPermitidos: number[];
}

// Interfaz para las secciones del menú
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
            // {
            //     path: '/HistorialPersonal/HistorialPersonal',
            //     label: 'Historial del Personal',
            //     icon: 'FaUserFriends',
            //     rolesPermitidos: [1, 2] 
            // },
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
        rolesPermitidos: [1, 2],  // Admin, RRHH
        subItems: [
            {
                path: '/TablaVacaciones/TablaVacaciones',
                label: 'TablaVacaciones',
                icon: 'FaTable',
                rolesPermitidos: [1, 2]  // Admin, RRHH
            },
            {
                path: '/Ubicaciones/Ubicaciones',
                label: 'Ubicaciones',
                icon: 'FaMapMarkerAlt',
                rolesPermitidos: [1, 2]  // Admin, RRHH
            },
            {
                path: '/Cargo/Cargo',
                label: 'Cargo',
                icon: 'FaBriefcase',
                rolesPermitidos: [1, 2] // Admin, RRHH
            },
            {
                path: '/Departamento/Departamento',
                label: 'Departamento',
                icon: 'FaBuilding',
                rolesPermitidos: [1, 2]  // Admin, RRHH
            },
        ]
    },
    {
        id: 'configuracion',
        title: 'CONFIGURACIÓN',
        icon: 'Settings',
        rolesPermitidos: [1], // Solo Administrador
        subItems: [
            {
                path: '/Usuarios/Usuarios',
                label: 'Usuarios',
                icon: 'Users',
                rolesPermitidos: [1] // Solo Administrador
            }
        ]
    }
];

// Función para normalizar el ID del rol (convertir a número)
export const normalizarRolId = (rolId: number | string | undefined): number | null => {
    if (rolId === undefined || rolId === null) return null;
    const numero = typeof rolId === 'string' ? parseInt(rolId, 10) : rolId;
    return isNaN(numero) ? null : numero;
};

// Función para verificar si un rol tiene acceso
export const tieneAcceso = (rolId: number | string | undefined, rolesPermitidos: number[]): boolean => {
    const rolIdNormalizado = normalizarRolId(rolId);
    if (!rolIdNormalizado) return false;
    return rolesPermitidos.includes(rolIdNormalizado);
};

// Función para filtrar el menú según el rol del usuario
export const filtrarMenuPorRol = (usuario: Usuario | null): MenuSection[] => {
    if (!usuario?.IdRolUsuario) {
        console.log('No hay usuario o IdRolUsuario');
        return [];
    }
    
    const rolId = usuario.IdRolUsuario;
    const rolIdNormalizado = normalizarRolId(rolId);
    
    console.log('Filtrando menú para rol:', {
        original: rolId,
        tipo: typeof rolId,
        normalizado: rolIdNormalizado,
        nombre: usuario.RolUsuario
    });
    
    if (!rolIdNormalizado) {
        console.log('Rol ID no válido');
        return [];
    }
    
    const seccionesFiltradas = MENU_CONFIG.reduce<MenuSection[]>((sectionsFiltradas, section) => {
        // Verificar si la sección está permitida
        const seccionPermitida = tieneAcceso(rolIdNormalizado, section.rolesPermitidos);
        
        if (!seccionPermitida) {
            return sectionsFiltradas;
        }
        
        // Filtrar los subitems permitidos
        const subItemsFiltrados = section.subItems.filter(item =>
            tieneAcceso(rolIdNormalizado, item.rolesPermitidos)
        );
        
        // Solo incluir la sección si tiene subitems
        if (subItemsFiltrados.length > 0) {
            sectionsFiltradas.push({
                ...section,
                subItems: subItemsFiltrados
            });
        }
        
        return sectionsFiltradas;
    }, []);
    
    console.log(`Secciones filtradas: ${seccionesFiltradas.length}`);
    return seccionesFiltradas;
};

// Función para obtener el nombre del rol
export const obtenerNombreRol = (rolId: number | null): string => {
    const rolesMap: { [key: number]: string } = {
        1: 'Administrador',
        2: 'Operaciones',
        3: 'Recursos Humanos',
        4: 'Báscula',
        5: 'Administrativo',
        6: 'Comercial'
    };
    return rolId ? rolesMap[rolId] || `Rol ${rolId}` : 'Sin rol';
};