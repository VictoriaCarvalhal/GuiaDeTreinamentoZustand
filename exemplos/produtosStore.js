/**
 * Exemplo 3: Actions Assíncronas — Busca de Produtos
 *
 * Demonstra como realizar chamadas de API dentro de um store Zustand
 * usando async/await, com tratamento de estados de carregamento e erro.
 *
 * Uso:
 *   import useProdutosStore from './produtosStore'
 *
 *   function ListaProdutos() {
 *     const produtos       = useProdutosStore((state) => state.produtos)
 *     const carregando     = useProdutosStore((state) => state.carregando)
 *     const buscarProdutos = useProdutosStore((state) => state.buscarProdutos)
 *
 *     useEffect(() => { buscarProdutos() }, [buscarProdutos])
 *
 *     if (carregando) return <p>Carregando...</p>
 *     return <ul>{produtos.map((p) => <li key={p.id}>{p.nome}</li>)}</ul>
 *   }
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const API_URL = 'https://fakestoreapi.com/products'

const useProdutosStore = create(
  devtools(
    (set) => ({
      // --- Estado ---
      produtos:   [],
      carregando: false,
      erro:       null,

      // --- Actions ---

      /** Busca todos os produtos da API. */
      buscarProdutos: async () => {
        set({ carregando: true, erro: null }, false, 'produtos/buscarInicio')
        try {
          const resposta = await fetch(API_URL)
          if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`)
          }
          const dados = await resposta.json()
          set({ produtos: dados, carregando: false }, false, 'produtos/buscarSucesso')
        } catch (error) {
          set(
            { erro: error.message, carregando: false },
            false,
            'produtos/buscarErro',
          )
        }
      },

      /** Busca produtos por categoria. */
      buscarPorCategoria: async (categoria) => {
        set({ carregando: true, erro: null }, false, 'produtos/buscarCategoriaInicio')
        try {
          const resposta = await fetch(`${API_URL}/category/${encodeURIComponent(categoria)}`)
          if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`)
          }
          const dados = await resposta.json()
          set({ produtos: dados, carregando: false }, false, 'produtos/buscarCategoriaSucesso')
        } catch (error) {
          set(
            { erro: error.message, carregando: false },
            false,
            'produtos/buscarCategoriaErro',
          )
        }
      },

      /** Limpa a lista de produtos e quaisquer erros. */
      limpar: () =>
        set({ produtos: [], erro: null }, false, 'produtos/limpar'),
    }),
    { name: 'ProdutosStore' },
  ),
)

export default useProdutosStore
