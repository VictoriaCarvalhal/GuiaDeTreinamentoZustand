/**
 * Exemplo 2: Carrinho de Compras com TypeScript
 *
 * Demonstra o uso de TypeScript com Zustand para tipagem forte
 * do estado e das actions.  Inclui lógica de adicionar/remover
 * itens e cálculo de totais derivados via actions.
 *
 * Uso:
 *   import useCarrinhoStore from './carrinhoStore'
 *
 *   function Carrinho() {
 *     const itens         = useCarrinhoStore((state) => state.itens)
 *     const adicionarItem = useCarrinhoStore((state) => state.adicionarItem)
 *     const total         = useCarrinhoStore((state) => state.totalPreco())
 *     // ...
 *   }
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface Produto {
  id:    number
  nome:  string
  preco: number
}

interface ItemCarrinho extends Produto {
  quantidade: number
}

interface CarrinhoState {
  itens:             ItemCarrinho[]
  adicionarItem:     (produto: Produto) => void
  removerItem:       (id: number) => void
  alterarQuantidade: (id: number, quantidade: number) => void
  limparCarrinho:    () => void
  totalItens:        () => number
  totalPreco:        () => number
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const useCarrinhoStore = create<CarrinhoState>()(
  devtools(
    (set, get) => ({
      // --- Estado ---
      itens: [],

      // --- Actions ---

      /** Adiciona um produto ao carrinho ou incrementa sua quantidade. */
      adicionarItem: (produto) => {
        const itens         = get().itens
        const itemExistente = itens.find((i) => i.id === produto.id)

        if (itemExistente) {
          set(
            {
              itens: itens.map((i) =>
                i.id === produto.id
                  ? { ...i, quantidade: i.quantidade + 1 }
                  : i,
              ),
            },
            false,
            'carrinho/adicionarItem',
          )
        } else {
          set(
            { itens: [...itens, { ...produto, quantidade: 1 }] },
            false,
            'carrinho/adicionarItem',
          )
        }
      },

      /** Remove um produto do carrinho pelo id. */
      removerItem: (id) =>
        set(
          (state) => ({ itens: state.itens.filter((i) => i.id !== id) }),
          false,
          'carrinho/removerItem',
        ),

      /** Altera a quantidade de um item (remove se quantidade <= 0). */
      alterarQuantidade: (id, quantidade) => {
        if (quantidade <= 0) {
          get().removerItem(id)
          return
        }
        set(
          (state) => ({
            itens: state.itens.map((i) =>
              i.id === id ? { ...i, quantidade } : i,
            ),
          }),
          false,
          'carrinho/alterarQuantidade',
        )
      },

      /** Remove todos os itens do carrinho. */
      limparCarrinho: () =>
        set({ itens: [] }, false, 'carrinho/limparCarrinho'),

      // --- Derivados ---

      /** Retorna o total de unidades no carrinho. */
      totalItens: () =>
        get().itens.reduce((acc, i) => acc + i.quantidade, 0),

      /** Retorna o valor total do carrinho. */
      totalPreco: () =>
        get().itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0),
    }),
    { name: 'CarrinhoStore' },
  ),
)

export default useCarrinhoStore
