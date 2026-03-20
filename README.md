# Guia de Treinamento: Zustand

> **Guia de Estudo para Estagiários do DGTI**  
> Gerenciamento de Estado com Zustand em React

---

## Sumário

1. [O que é Zustand?](#1-o-que-é-zustand)
2. [Por que usar Zustand?](#2-por-que-usar-zustand)
3. [Instalação](#3-instalação)
4. [Conceitos Fundamentais](#4-conceitos-fundamentais)
5. [Criando seu Primeiro Store](#5-criando-seu-primeiro-store)
6. [Lendo o Estado nos Componentes](#6-lendo-o-estado-nos-componentes)
7. [Actions: Atualizando o Estado](#7-actions-atualizando-o-estado)
8. [Selectors e Otimização de Performance](#8-selectors-e-otimização-de-performance)
9. [Actions Assíncronas](#9-actions-assíncronas)
10. [TypeScript com Zustand](#10-typescript-com-zustand)
11. [Middlewares](#11-middlewares)
    - [devtools](#devtools)
    - [persist](#persist)
12. [Boas Práticas](#12-boas-práticas)
13. [Exercícios Práticos](#13-exercícios-práticos)
14. [Recursos Adicionais](#14-recursos-adicionais)

---

## 1. O que é Zustand?

**Zustand** (que significa "estado" em alemão) é uma biblioteca leve e simples de gerenciamento de estado global para aplicações React. Ela foi criada pela equipe da [Pmndrs (Poimandres)](https://github.com/pmndrs) e se destaca por sua API minimalista e flexível.

Ao contrário de soluções como Redux, Zustand não exige boilerplate excessivo. Com apenas algumas linhas de código, você consegue criar um store global acessível por qualquer componente da aplicação.

---

## 2. Por que usar Zustand?

| Característica       | Zustand | Redux | Context API |
|----------------------|---------|-------|-------------|
| Boilerplate          | ✅ Mínimo | ❌ Alto | ✅ Baixo |
| Performance          | ✅ Excelente | ✅ Boa | ⚠️ Pode causar re-renders |
| Tamanho do bundle    | ✅ ~1kb | ❌ Maior | ✅ Nativo |
| Curva de aprendizado | ✅ Baixa | ❌ Alta | ✅ Baixa |
| DevTools             | ✅ Suporte | ✅ Nativo | ❌ Limitado |
| Middleware           | ✅ Sim | ✅ Sim | ❌ Não |

**Principais vantagens do Zustand:**
- API simples e intuitiva
- Sem providers obrigatórios (não precisa envolver o app em `<Provider>`)
- Suporte nativo a TypeScript
- Fácil integração com React DevTools
- Funciona fora de componentes React (útil para services e testes)

---

## 3. Instalação

Com **npm**:

```bash
npm install zustand
```

Com **yarn**:

```bash
yarn add zustand
```

Com **pnpm**:

```bash
pnpm add zustand
```

> **Requisito:** React 16.8+ (hooks necessários)

---

## 4. Conceitos Fundamentais

Antes de criar um store, entenda os três pilares do Zustand:

| Conceito  | Descrição                                                                 |
|-----------|---------------------------------------------------------------------------|
| **State** | O estado armazenado no store (variáveis, objetos, arrays).                |
| **Action** | Funções dentro do store que modificam o estado via `set()`.              |
| **Selector** | Função que extrai uma parte específica do estado para uso no componente.|

O fluxo é simples:

```
Componente → chama Action → Action usa set() → Estado é atualizado → Componente re-renderiza
```

---

## 5. Criando seu Primeiro Store

Um store Zustand é criado com a função `create`:

```javascript
// src/store/contadorStore.js
import { create } from 'zustand'

const useContadorStore = create((set) => ({
  // Estado inicial
  contador: 0,

  // Actions
  incrementar: () => set((state) => ({ contador: state.contador + 1 })),
  decrementar: () => set((state) => ({ contador: state.contador - 1 })),
  resetar:     () => set({ contador: 0 }),
}))

export default useContadorStore
```

**Explicando o código:**
- `create` recebe uma função que retorna um objeto com o estado e as actions.
- `set` é a função fornecida pelo Zustand para atualizar o estado.
- Você pode chamar `set` com um objeto (substitui parcialmente o estado) ou com uma função que recebe o estado atual e retorna o novo estado.

---

## 6. Lendo o Estado nos Componentes

Para consumir o store em um componente React, use o hook retornado por `create`:

```jsx
// src/components/Contador.jsx
import useContadorStore from '../store/contadorStore'

function Contador() {
  const contador     = useContadorStore((state) => state.contador)
  const incrementar  = useContadorStore((state) => state.incrementar)
  const decrementar  = useContadorStore((state) => state.decrementar)
  const resetar      = useContadorStore((state) => state.resetar)

  return (
    <div>
      <h1>Contador: {contador}</h1>
      <button onClick={decrementar}>-</button>
      <button onClick={incrementar}>+</button>
      <button onClick={resetar}>Resetar</button>
    </div>
  )
}

export default Contador
```

> **Dica:** Sempre passe uma função seletora (`(state) => state.algumaCoisa`) ao invés de consumir o store inteiro. Isso evita re-renders desnecessários.

---

## 7. Actions: Atualizando o Estado

### 7.1 Atualização simples (replace parcial)

```javascript
set({ contador: 10 })
// Apenas a propriedade 'contador' é atualizada; o resto do estado é mantido
```

### 7.2 Atualização baseada no estado anterior

```javascript
set((state) => ({ contador: state.contador + 1 }))
```

### 7.3 Atualização de objetos aninhados

Para objetos aninhados, use o spread operator para não perder outras propriedades:

```javascript
// src/store/usuarioStore.js
import { create } from 'zustand'

const useUsuarioStore = create((set) => ({
  usuario: {
    nome: '',
    email: '',
    perfil: {
      bio: '',
      avatar: '',
    },
  },

  atualizarNome: (novoNome) =>
    set((state) => ({
      usuario: { ...state.usuario, nome: novoNome },
    })),

  atualizarBio: (novaBio) =>
    set((state) => ({
      usuario: {
        ...state.usuario,
        perfil: { ...state.usuario.perfil, bio: novaBio },
      },
    })),
}))

export default useUsuarioStore
```

### 7.4 Lendo o estado atual dentro de uma action com `get`

```javascript
import { create } from 'zustand'

const useStore = create((set, get) => ({
  itens: [],
  total: 0,

  adicionarItem: (item) => {
    const itensAtuais = get().itens
    const novoTotal   = get().total + item.preco
    set({ itens: [...itensAtuais, item], total: novoTotal })
  },
}))
```

---

## 8. Selectors e Otimização de Performance

Um **selector** é a função passada para o hook que extrai apenas o que o componente precisa. O Zustand faz comparação por referência (`===`) por padrão — o componente só re-renderiza se o valor selecionado mudar.

### Bom uso (selector específico):

```javascript
// ✅ Componente só re-renderiza quando 'contador' mudar
const contador = useContadorStore((state) => state.contador)
```

### Evitar (sem selector):

```javascript
// ❌ Componente re-renderiza sempre que QUALQUER parte do store mudar
const store = useContadorStore()
```

### Selecionando múltiplos valores com `useShallow`

Quando você precisa selecionar múltiplos valores de uma vez, use `useShallow` para evitar re-renders desnecessários:

```javascript
import { useShallow } from 'zustand/react/shallow'

function MeuComponente() {
  const { contador, usuario } = useContadorStore(
    useShallow((state) => ({
      contador: state.contador,
      usuario:  state.usuario,
    }))
  )
  // ...
}
```

> **Por que `useShallow`?** Sem ele, um novo objeto `{ contador, usuario }` é criado a cada render, fazendo a comparação por referência sempre falhar e causando re-renders desnecessários.

---

## 9. Actions Assíncronas

Zustand suporta actions assíncronas nativamente — basta usar `async/await`:

```javascript
// src/store/produtosStore.js
import { create } from 'zustand'

const useProdutosStore = create((set) => ({
  produtos:    [],
  carregando:  false,
  erro:        null,

  buscarProdutos: async () => {
    set({ carregando: true, erro: null })
    try {
      const resposta = await fetch('https://api.exemplo.com/produtos')
      const dados    = await resposta.json()
      set({ produtos: dados, carregando: false })
    } catch (error) {
      set({ erro: error.message, carregando: false })
    }
  },
}))

export default useProdutosStore
```

Usando no componente:

```jsx
// src/components/ListaProdutos.jsx
import { useEffect } from 'react'
import useProdutosStore from '../store/produtosStore'

function ListaProdutos() {
  const produtos      = useProdutosStore((state) => state.produtos)
  const carregando    = useProdutosStore((state) => state.carregando)
  const erro          = useProdutosStore((state) => state.erro)
  const buscarProdutos = useProdutosStore((state) => state.buscarProdutos)

  useEffect(() => {
    buscarProdutos()
  }, [buscarProdutos])

  if (carregando) return <p>Carregando...</p>
  if (erro)       return <p>Erro: {erro}</p>

  return (
    <ul>
      {produtos.map((produto) => (
        <li key={produto.id}>{produto.nome} — R$ {produto.preco}</li>
      ))}
    </ul>
  )
}

export default ListaProdutos
```

---

## 10. TypeScript com Zustand

Zustand tem excelente suporte a TypeScript. Defina a interface do store para ter autocompletar e verificação de tipos:

```typescript
// src/store/contadorStore.ts
import { create } from 'zustand'

// 1. Defina a interface do estado
interface ContadorState {
  contador:   number
  incrementar: () => void
  decrementar: () => void
  resetar:    () => void
  definir:    (valor: number) => void
}

// 2. Passe a interface como tipo genérico para `create`
const useContadorStore = create<ContadorState>((set) => ({
  contador: 0,

  incrementar: () => set((state) => ({ contador: state.contador + 1 })),
  decrementar: () => set((state) => ({ contador: state.contador - 1 })),
  resetar:     () => set({ contador: 0 }),
  definir:     (valor) => set({ contador: valor }),
}))

export default useContadorStore
```

### Exemplo mais completo com TypeScript:

```typescript
// src/store/carrinhoStore.ts
import { create } from 'zustand'

interface Produto {
  id:     number
  nome:   string
  preco:  number
}

interface ItemCarrinho extends Produto {
  quantidade: number
}

interface CarrinhoState {
  itens:          ItemCarrinho[]
  adicionarItem:  (produto: Produto) => void
  removerItem:    (id: number) => void
  limparCarrinho: () => void
  totalItens:     () => number
  totalPreco:     () => number
}

const useCarrinhoStore = create<CarrinhoState>((set, get) => ({
  itens: [],

  adicionarItem: (produto) => {
    const itens         = get().itens
    const itemExistente = itens.find((i) => i.id === produto.id)

    if (itemExistente) {
      set({
        itens: itens.map((i) =>
          i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i
        ),
      })
    } else {
      set({ itens: [...itens, { ...produto, quantidade: 1 }] })
    }
  },

  removerItem: (id) =>
    set((state) => ({
      itens: state.itens.filter((i) => i.id !== id),
    })),

  limparCarrinho: () => set({ itens: [] }),

  totalItens: () => get().itens.reduce((acc, i) => acc + i.quantidade, 0),

  totalPreco: () =>
    get().itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0),
}))

export default useCarrinhoStore
```

---

## 11. Middlewares

Middlewares são funções que envolvem o `create` para adicionar funcionalidades extras ao store.

### devtools

Integra o store com o Redux DevTools Extension para inspeção do estado no navegador:

```javascript
// src/store/contadorStore.js
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useContadorStore = create(
  devtools(
    (set) => ({
      contador: 0,
      incrementar: () => set(
        (state) => ({ contador: state.contador + 1 }),
        false,             // replace: false (merge, não substitui)
        'contador/incrementar' // nome da action no DevTools
      ),
      decrementar: () => set(
        (state) => ({ contador: state.contador - 1 }),
        false,
        'contador/decrementar'
      ),
    }),
    { name: 'ContadorStore' } // nome do store no DevTools
  )
)

export default useContadorStore
```

> **Como usar:** Instale a extensão [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd) no seu navegador e abra o painel DevTools (F12 → aba "Redux").

### persist

Persiste o estado automaticamente no `localStorage` (ou `sessionStorage`), sobrevivendo a recarregamentos da página:

```javascript
// src/store/preferenciasStore.js
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const usePreferenciasStore = create(
  persist(
    (set) => ({
      tema:    'claro',
      idioma:  'pt-BR',

      alternarTema: () =>
        set((state) => ({
          tema: state.tema === 'claro' ? 'escuro' : 'claro',
        })),

      definirIdioma: (idioma) => set({ idioma }),
    }),
    {
      name:    'preferencias-usuario', // chave no localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export default usePreferenciasStore
```

### Combinando múltiplos middlewares

```javascript
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

const useStore = create(
  devtools(
    persist(
      (set) => ({
        // seu estado e actions aqui
      }),
      { name: 'meu-store' }
    ),
    { name: 'MeuStore' }
  )
)
```

---

## 12. Boas Práticas

### ✅ Faça

- **Separe os stores por domínio/funcionalidade**: `usuarioStore`, `carrinhoStore`, `notificacoesStore`.
- **Use TypeScript**: interfaces bem definidas evitam bugs e melhoram a manutenção.
- **Sempre use selectors**: extraia apenas os dados que o componente precisa.
- **Coloque a lógica nas actions**: mantenha os componentes simples; deixe o store cuidar da lógica.
- **Nomeie suas actions no devtools**: facilita o debug.

### ❌ Evite

- **Guardar dados derivados no estado**: prefira calculá-los nas actions ou em `useMemo` no componente.

  ```javascript
  // ❌ Ruim: duplicação de estado
  { itens: [...], totalItens: 5, totalPreco: 150.00 }

  // ✅ Bom: calcule na action ou no componente
  { itens: [...] }
  totalItens: () => get().itens.length
  ```

- **Stores gigantescos**: divida stores grandes em menores e mais focados.
- **Mutação direta do estado**: sempre use `set()`, nunca modifique o estado diretamente.

  ```javascript
  // ❌ NUNCA faça isso
  adicionarItem: (item) => {
    state.itens.push(item) // mutação direta!
  }

  // ✅ Correto
  adicionarItem: (item) =>
    set((state) => ({ itens: [...state.itens, item] }))
  ```

### Estrutura de arquivos recomendada

```
src/
├── components/
│   ├── Contador.jsx
│   ├── Carrinho.jsx
│   └── ListaProdutos.jsx
├── store/
│   ├── contadorStore.js
│   ├── carrinhoStore.js
│   └── produtosStore.js
└── App.jsx
```

---

## 13. Exercícios Práticos

### Exercício 1 — Lista de Tarefas (To-Do List)

Crie um store Zustand para gerenciar uma lista de tarefas com as seguintes funcionalidades:

- Adicionar uma nova tarefa com título e descrição.
- Marcar uma tarefa como concluída/pendente.
- Remover uma tarefa.
- Filtrar tarefas (todas / pendentes / concluídas).

<details>
<summary>💡 Dica de estrutura</summary>

```javascript
// src/store/tarefasStore.js
import { create } from 'zustand'

const useTarefasStore = create((set, get) => ({
  tarefas: [],
  filtro: 'todas', // 'todas' | 'pendentes' | 'concluidas'

  adicionarTarefa: (titulo, descricao) => { /* ... */ },
  toggleTarefa:    (id) => { /* ... */ },
  removerTarefa:   (id) => { /* ... */ },
  definirFiltro:   (filtro) => { /* ... */ },
  tarefasFiltradas: () => { /* retorne tarefas baseadas no filtro */ },
}))
```

</details>

---

### Exercício 2 — Carrinho de Compras

Implemente um carrinho de compras com:

- Lista de produtos disponíveis (pode ser um array fixo).
- Adicionar/remover produto do carrinho.
- Alterar quantidade de um item.
- Exibir subtotal por item e total geral.
- Botão para limpar o carrinho.

<details>
<summary>💡 Dica de estrutura</summary>

```typescript
// src/store/carrinhoStore.ts
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
  totalPreco:        () => number
}
```

</details>

---

### Exercício 3 — Autenticação de Usuário

Crie um store para simular o fluxo de autenticação:

- Estado: `usuario`, `token`, `carregando`, `erro`.
- Action `login(email, senha)`: simule uma chamada de API com `setTimeout` ou `fetch`.
- Action `logout()`: limpe o estado do usuário e token.
- Use o middleware `persist` para manter o usuário logado após recarregar a página.

<details>
<summary>💡 Dica de estrutura</summary>

```typescript
// src/store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Usuario {
  id:    number
  nome:  string
  email: string
}

interface AuthState {
  usuario:    Usuario | null
  token:      string | null
  carregando: boolean
  erro:       string | null
  login:      (email: string, senha: string) => Promise<void>
  logout:     () => void
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario:    null,
      token:      null,
      carregando: false,
      erro:       null,
      login:      async (email, senha) => { /* ... */ },
      logout:     () => set({ usuario: null, token: null }),
    }),
    { name: 'auth-storage' }
  )
)
```

</details>

---

### Exercício 4 — Tema da Aplicação (Dark/Light Mode)

Crie um store para alternar entre tema claro e escuro:

- Persista a preferência no `localStorage`.
- Aplique a classe CSS correspondente no `document.body`.
- Crie um botão de alternância de tema que reflita o estado atual.

---

## 14. Recursos Adicionais

### Documentação oficial

- 📖 [Documentação Zustand (EN)](https://zustand.docs.pmnd.rs/)
- 📦 [Repositório GitHub do Zustand](https://github.com/pmndrs/zustand)

### Leituras complementares

- [Comparação: Zustand vs Redux vs Context API](https://zustand.docs.pmnd.rs/getting-started/comparison)
- [Receitas e padrões avançados](https://zustand.docs.pmnd.rs/guides/updating-state)
- [Immer integration (imutabilidade simplificada)](https://zustand.docs.pmnd.rs/integrations/immer-middleware)

### Ferramentas úteis

- [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools) — para inspecionar stores com `devtools` middleware
- [React Developer Tools](https://react.dev/learn/react-developer-tools) — para inspecionar componentes React

---

## Exemplo de Projeto Completo

Para ver todos os conceitos acima aplicados em um projeto real, consulte os arquivos de exemplo na pasta [`exemplos/`](./exemplos/):

| Arquivo | Conceito |
|---------|----------|
| [`exemplos/contadorStore.js`](./exemplos/contadorStore.js) | Store básico com actions |
| [`exemplos/carrinhoStore.ts`](./exemplos/carrinhoStore.ts) | Store com TypeScript |
| [`exemplos/produtosStore.js`](./exemplos/produtosStore.js) | Actions assíncronas |
| [`exemplos/preferenciasStore.js`](./exemplos/preferenciasStore.js) | Middleware persist |
| [`exemplos/authStore.ts`](./exemplos/authStore.ts) | persist + TypeScript |

---

> **Dúvidas?** Abra uma issue neste repositório ou consulte a documentação oficial do Zustand.  
> **Bons estudos! 🚀**
