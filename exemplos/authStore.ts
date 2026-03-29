/**
 * Exemplo 5: Autenticação com TypeScript + persist
 *
 * Demonstra como combinar TypeScript, actions assíncronas e o
 * middleware `persist` para gerenciar o estado de autenticação,
 * mantendo o usuário logado após recarregar a página.
 *
 * Uso:
 *   import useAuthStore from './authStore'
 *
 *   function LoginForm() {
 *     const login     = useAuthStore((state) => state.login)
 *     const usuario   = useAuthStore((state) => state.usuario)
 *     const estaLogado = useAuthStore((state) => state.estaLogado())
 *
 *     const handleSubmit = async (e) => {
 *       e.preventDefault()
 *       await login(email, senha)
 *     }
 *   }
 */

import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface Usuario {
  id:     number
  nome:   string
  email:  string
  perfil: string
}

interface AuthState {
  usuario:    Usuario | null
  token:      string | null
  carregando: boolean
  erro:       string | null
  login:      (email: string, senha: string) => Promise<void>
  logout:     () => void
  estaLogado: () => boolean
  limparErro: () => void
}

// ---------------------------------------------------------------------------
// Simulação de API (substitua por uma chamada real em produção)
// ---------------------------------------------------------------------------

/** Simula uma autenticação de API com delay. */
async function autenticarNaAPI(email: string, senha: string): Promise<{ usuario: Usuario; token: string }> {
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Simulação: qualquer senha com 6+ caracteres é aceita
  if (senha.length < 6) {
    throw new Error('Credenciais inválidas. Verifique seu e-mail e senha.')
  }

  return {
    usuario: {
      id:     1,
      nome:   'Estagiário DGTI',
      email,
      perfil: 'estagiario',
    },
    token: `token_simulado_${Date.now()}`,
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // --- Estado ---
        usuario:    null,
        token:      null,
        carregando: false,
        erro:       null,

        // --- Actions ---

        /** Realiza login do usuário. */
        login: async (email, senha) => {
          set({ carregando: true, erro: null }, false, 'auth/loginInicio')
          try {
            const { usuario, token } = await autenticarNaAPI(email, senha)
            set({ usuario, token, carregando: false }, false, 'auth/loginSucesso')
          } catch (error) {
            set(
              { erro: error.message, carregando: false },
              false,
              'auth/loginErro',
            )
          }
        },

        /** Realiza logout, limpando o estado do usuário e o token. */
        logout: () =>
          set(
            { usuario: null, token: null, erro: null },
            false,
            'auth/logout',
          ),

        /** Limpa a mensagem de erro. */
        limparErro: () =>
          set({ erro: null }, false, 'auth/limparErro'),

        // --- Derivados ---

        /** Retorna true se houver um usuário autenticado. */
        estaLogado: () => get().usuario !== null && get().token !== null,
      }),
      {
        name:    'auth-storage',
        storage: createJSONStorage(() => localStorage),
        // Persiste apenas usuario e token (não persiste estados transitórios)
        partialize: (state) => ({
          usuario: state.usuario,
          token:   state.token,
        }),
      },
    ),
    { name: 'AuthStore' },
  ),
)

export default useAuthStore
