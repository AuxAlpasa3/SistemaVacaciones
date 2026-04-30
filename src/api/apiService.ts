import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import qs from 'qs'; 

export const apiURL = import.meta.env.VITE_API_BASE_URL_PROD;

type ApiResponse<T> = Promise<T>;
type ApiError = {
    message: string;
    status?: number;
    data?: any;
};

type ContentType = 'application/json' | 'application/x-www-form-urlencoded';

const createApiClient = (contentType: ContentType = 'application/json'): AxiosInstance => {
    const client = axios.create({
        baseURL: apiURL,
        headers: {
            'Content-Type': contentType,
        },
    });

    if (contentType === 'application/x-www-form-urlencoded') {
        client.interceptors.request.use((config) => {
            if (config.data) {
                config.data = qs.stringify(config.data);
            }
            return config;
        });
    }

    // Interceptor para manejar errores globalmente
    client.interceptors.response.use(
        (response) => response,
        (error) => {
            const apiError: ApiError = {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            };
            console.error('API Error:', apiError);
            return Promise.reject(apiError);
        }
    );

    return client;
};


// Clientes preconfigurados
const jsonClient = createApiClient('application/json');
const formClient = createApiClient('application/x-www-form-urlencoded');

/**
 * Función genérica para realizar peticiones HTTP
 * @template T - Tipo esperado de la respuesta
 * @param method - Método HTTP
 * @param url - Endpoint
 * @param data - Datos para enviar (opcional)
 * @param config - Configuración adicional de Axios (opcional)
 * @param contentType - Tipo de contenido (opcional, por defecto JSON)
 * @returns Promise con los datos de tipo T
 */
const request = async <T>({
    method,
    url,
    data,
    config,
    contentType = 'application/json',
}: {
    method: 'get' | 'post' | 'put' | 'delete';
    url: string;
    data?: any;
    config?: AxiosRequestConfig;
    contentType?: ContentType;
}): ApiResponse<T> => {
    const client = contentType === 'application/x-www-form-urlencoded' ? formClient : jsonClient;
    const response: AxiosResponse<T> = await client.request<T>({
        method,
        url,
        data,
        ...config,
    });
    return response.data;
};

const get = <T>(url: string, config?: AxiosRequestConfig): ApiResponse<T> =>
    request<T>({ method: 'get', url, config });

const post = <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    contentType?: ContentType
): ApiResponse<T> => request<T>({ method: 'post', url, data, config, contentType });

const put = <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    contentType?: ContentType
): ApiResponse<T> => request<T>({ method: 'put', url, data, config, contentType });

const del = <T>(url: string, config?: AxiosRequestConfig): ApiResponse<T> =>
    request<T>({ method: 'delete', url, config });

// Métodos específicos para formularios
const postForm = <T>(url: string, data?: any, config?: AxiosRequestConfig): ApiResponse<T> =>
    post<T>(url, data, config, 'application/x-www-form-urlencoded');

const putForm = <T>(url: string, data?: any, config?: AxiosRequestConfig): ApiResponse<T> =>
    put<T>(url, data, config, 'application/x-www-form-urlencoded');

export const apiService = {
    get,
    post,
    put,
    delete: del,

    postForm,
    putForm,
};