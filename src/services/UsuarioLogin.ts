import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Usuario } from '../interfaces/Usuario'

interface UsuarioState {
    usr: string | null
    setUsuario: (usr: string) => void
    clearUsuario: () => void
}

export const useUsuarioStore = create<UsuarioState>()(
    persist(
        (set) => ({
            usr: null,
            setUsuario: (usr: string) => set({ usr }),
            clearUsuario: () => set({ usr: null })
        }),
        {
            name: 'zk1dp',
            storage: createJSONStorage(() => localStorage),
        }
    )
)