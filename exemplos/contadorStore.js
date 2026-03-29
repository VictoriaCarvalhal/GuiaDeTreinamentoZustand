/**
 * Exemplo 1: Store Básico com Actions
 *
 * Demonstra a criação de um store Zustand simples com estado
 * e actions síncronas para incrementar, decrementar e resetar
 * um contador.
 *
 * Uso:
 *   import useContadorStore from './contadorStore'
 *
 *   function Contador() {
 *     const contador    = useContadorStore((state) => state.contador)
 *     const incrementar = useContadorStore((state) => state.incrementar)
 *     return <button onClick={incrementar}>{contador}</button>
 *   }
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useContadorStore = create(
  devtools(
    (set) => ({
      // --- Estado ---
      contador: 0,

      // --- Actions ---
      incrementar: () =>
        set(
          (state) => ({ contador: state.contador + 1 }),
          false,
          'contador/incrementar',
        ),

      decrementar: () =>
        set(
          (state) => ({ contador: state.contador - 1 }),
          false,
          'contador/decrementar',
        ),

      resetar: () =>
        set({ contador: 0 }, false, 'contador/resetar'),

      definir: (valor) =>
        set({ contador: valor }, false, 'contador/definir'),
    }),
    { name: 'ContadorStore' },
  ),
)

export default useContadorStore
