/**
 * Exemplo 4: Persistência de Estado com middleware `persist`
 *
 * Demonstra o uso do middleware `persist` do Zustand para salvar
 * as preferências do usuário no localStorage, de forma que elas
 * sobrevivam a recarregamentos da página.
 *
 * Uso:
 *   import usePreferenciasStore from './preferenciasStore'
 *
 *   function BotaoTema() {
 *     const tema          = usePreferenciasStore((state) => state.tema)
 *     const alternarTema  = usePreferenciasStore((state) => state.alternarTema)
 *     return (
 *       <button onClick={alternarTema}>
 *         {tema === 'claro' ? '🌙 Escuro' : '☀️ Claro'}
 *       </button>
 *     )
 *   }
 */

import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'

const usePreferenciasStore = create(
  devtools(
    persist(
      (set) => ({
        // --- Estado ---
        tema:             'claro',   // 'claro' | 'escuro'
        idioma:           'pt-BR',
        tamanhoFonte:     'medio',   // 'pequeno' | 'medio' | 'grande'
        notificacoes:     true,

        // --- Actions ---

        /** Alterna entre tema claro e escuro. */
        alternarTema: () =>
          set(
            (state) => ({ tema: state.tema === 'claro' ? 'escuro' : 'claro' }),
            false,
            'preferencias/alternarTema',
          ),

        /** Define o idioma da aplicação. */
        definirIdioma: (idioma) =>
          set({ idioma }, false, 'preferencias/definirIdioma'),

        /** Define o tamanho da fonte. */
        definirTamanhoFonte: (tamanho) =>
          set({ tamanhoFonte: tamanho }, false, 'preferencias/definirTamanhoFonte'),

        /** Ativa ou desativa as notificações. */
        toggleNotificacoes: () =>
          set(
            (state) => ({ notificacoes: !state.notificacoes }),
            false,
            'preferencias/toggleNotificacoes',
          ),

        /** Restaura todas as preferências para os valores padrão. */
        restaurarPadroes: () =>
          set(
            { tema: 'claro', idioma: 'pt-BR', tamanhoFonte: 'medio', notificacoes: true },
            false,
            'preferencias/restaurarPadroes',
          ),
      }),
      {
        name:    'preferencias-usuario', // chave usada no localStorage
        storage: createJSONStorage(() => localStorage),
        // Opcional: persista apenas algumas chaves do estado
        // partialize: (state) => ({ tema: state.tema, idioma: state.idioma }),
      },
    ),
    { name: 'PreferenciasStore' },
  ),
)

export default usePreferenciasStore
