// apiTypes.ts
export type User = {
    id: string;
    name: string;
    email: string;
};

export type CreateUserDto = Omit<User, 'id'>;
export type UpdateUserDto = Partial<CreateUserDto>;

export type ApiEndpoints = {
    users: {
        getAll: string;
        getById: (id: string) => string;
        create: string;
        update: (id: string) => string;
        delete: (id: string) => string;
    };
    // Agrega más endpoints según necesites
};

export const API_ENDPOINTS: ApiEndpoints = {
    users: {
        getAll: '/users',
        getById: (id) => `/users/${id}`,
        create: '/users',
        update: (id) => `/users/${id}`,
        delete: (id) => `/users/${id}`,
    },
};