# Guia de Treinamento: Da Context API ao Zustand no SPQC

> **Para quem é este guia?** Desenvolvedores Junior que ingressam no projeto SPQC e precisam entender a arquitetura de gerenciamento de estado — como ela era, como ficou, e por quê a mudança foi feita.
>
> **Fonte de verdade:** Este guia foi construído a partir da análise direta dos arquivos do projeto em `./versao-anterior/spqc-frontend` (legado) e `./spqc-frontend` (atual), incluindo as anotações internas da equipe que realizou a migração.

---

## Navegação

- [1. Dicionário de Campo](#1-dicionário-de-campo)
- [2. O Problema que Motivou a Mudança — O "Provider Hell"](#2-o-problema-que-motivou-a-mudança--o-provider-hell)
- [3. Tabela Comparativa de Padrões](#3-tabela-comparativa-de-padrões)
- [4. Justificativa Técnica — Por que o SPQC melhorou?](#4-justificativa-técnica--por-que-o-spqc-melhorou)
- [5. A Figueira Estranguladora — A Estratégia de Migração](#5-a-figueira-estranguladora--a-estratégia-de-migração)
- [6. Zustand para Iniciantes — A Analogia do Restaurante](#6-zustand-para-iniciantes--a-analogia-do-restaurante)
- [7. Os 3 Desafios de Raciocínio Lógico](#7-os-3-desafios-de-raciocínio-lógico)

---

## 1. Dicionário de Campo

Antes de mergulhar no código, vamos alinhar o vocabulário. Pense nesta seção como o glossário que você consulta sempre que encontrar uma palavra nova.

---

### Store (Loja / Armazém)

Uma **Store** é o lugar central onde o estado da aplicação vive. Imagine uma única prateleira bem organizada onde qualquer parte do sistema pode ir buscar exatamente o que precisa, sem precisar pedir para um intermediário.

No SPQC, cada domínio tem a sua própria store:

- `useGerenciaStore` → armazena a lista de gestores
- `useCampusStore` → armazena a lista de campus
- `useLicencaStore` → armazena as licenças e órgãos de controle

```javascript
// Exemplo real — src/stores/useGerenciaStore.js
export const useGerenciaStore = create((set, get) => ({
  gerencias: [],   // <-- este é o estado (State)
  loading: false,
  error: null,
  fetchGerencias: async () => { ... }, // <-- esta é uma Action
}));
```

---

### State (Estado)

O **State** é o conjunto de dados que a store guarda em um determinado momento. É uma fotografia instantânea da realidade do sistema.

No `useGerenciaStore`, o state inclui:
- `gerencias` — a lista atual de gestores cadastrados
- `loading` — se uma requisição está em andamento
- `error` — a mensagem do último erro ocorrido

---

### Actions (Ações)

**Actions** são as funções que **modificam** o estado. Você não altera o state diretamente — você chama uma action, e ela faz a alteração de forma controlada.

Pense assim: o state é um quadro branco. Você não pode escrever nele diretamente. Você precisa pegar o pincel (a action) e usar ele.

```javascript
// Action real do useGerenciaStore.js
adicionarGerencia: async (gerencia) => {
  set({ loading: true, error: null }); // <-- modifica o state via set()
  try {
    await api.post('/gestor/cadastrarGestor', gerencia);
    await get().fetchGerencias();       // <-- chama outra action via get()
  } catch (err) {
    set({ error: extrairMensagemErro(err, 'Erro ao cadastrar gestor') });
    throw err;
  } finally {
    set({ loading: false });
  }
},
```

---

### Selectors (Seletores)

Um **Selector** é a forma como um componente diz: *"Só me avise quando esta parte específica do estado mudar."*

É o mecanismo mais importante para performance. Com um selector bem escrito, um componente re-renderiza **apenas** quando o dado que ele realmente usa sofre alteração.

```javascript
// Componente que usa selector
const gerencias = useGerenciaStore((state) => state.gerencias);
//                                  ^^^^^^^^^^^^^^^^^^^^^^^^^
//                 Só re-renderiza se "gerencias" mudar.
//                 Mudanças em "loading" ou "error" são ignoradas.
```

---

### Middleware

**Middleware** é uma camada de processamento que fica entre o disparo de uma action e a atualização do state. É usado para adicionar comportamentos extras, como:

- **`devtools`** — integra a store com o Redux DevTools para inspeção visual no navegador
- **`persist`** — salva o state no `localStorage` automaticamente
- **`immer`** — permite escrever mutações de state de forma mais legível

No SPQC atual, os stores usam Zustand puro sem middleware, mantendo a implementação mínima e direta.

---

## 2. O Problema que Motivou a Mudança — O "Provider Hell"

Para entender a solução, precisamos entender o problema. Abra o arquivo legado `./versao-anterior/spqc-frontend/src/App.jsx` e observe a estrutura:

```jsx
// App.jsx — versao-anterior (LEGADO)
function App() {
  return (
    <PrimeReactProvider>
      <Router>
        <AuthProvider>
          <PublicProvider>
            <ProdutoProvider>
              <GerenciaProvider>
                <LicencaProvider>
                  <PesquisaProvider>
                    <CampusProvider>
                      <LaboratorioProvider>
                        <LocalizacaoProvider>
                          <EntradaProvider>
                            <div className="min-h-screen flex flex-col">
                              {/* ... conteúdo real aqui, enterrado em 10 camadas */}
                            </div>
                          </EntradaProvider>
                        </LocalizacaoProvider>
                      </LaboratorioProvider>
                    </CampusProvider>
                  </PesquisaProvider>
                </LicencaProvider>
              </GerenciaProvider>
            </ProdutoProvider>
          </PublicProvider>
        </AuthProvider>
      </Router>
    </PrimeReactProvider>
  );
}
```

Isso tem um nome na comunidade frontend: **Provider Hell** (ou Pirâmide da Morte). São **10 camadas** de Providers aninhados. Cada uma dessas camadas:

1. Cria um novo contexto no React
2. Gerencia seu próprio `useState` e funções
3. Força uma re-renderização em todos os filhos quando qualquer dado seu muda

Agora compare com o mesmo arquivo na versão atual:

```jsx
// App.jsx — spqc-frontend (ATUAL COM ZUSTAND)
function App() {
  return (
    <PrimeReactProvider>
      <ConfirmDialog />
      <Router>
        <AppInitializer />
        <div className="min-h-screen flex flex-col">
          <Cabecalho />
          <main className="flex-1 pt-3">
            <Routes> ... </Routes>
          </main>
          <Rodape />
        </div>
      </Router>
    </PrimeReactProvider>
  );
}
```

**Zero Providers de domínio.** O estado existe, mas não precisa mais envolver a árvore inteira de componentes para estar disponível.

---

## 3. Tabela Comparativa de Padrões

Esta tabela usa código real do projeto para mostrar, lado a lado, como cada padrão era implementado antes e como ficou agora.

### 3.1 — Declaração do Estado

| Aspecto | Context API (legado) | Zustand (atual) |
|---|---|---|
| **Arquivo** | `versao-anterior/.../GerenciaContext.jsx` | `spqc-frontend/src/stores/useGerenciaStore.js` |
| **Linhas de código** | ~149 linhas | ~100 linhas |
| **Estrutura** | `createContext` + `useState` + `Provider` JSX | `create()` — função única, sem JSX |
| **Dependências React** | `import React, { createContext, useContext, useState }` | `import { create } from 'zustand'` |

**Antes (Context):**
```javascript
// versao-anterior — GerenciaContext.jsx
import React, { createContext, useContext, useState } from 'react';

const GerenciaContext = createContext({ /* valores padrão */ });
export const useGerencia = () => useContext(GerenciaContext);

export const GerenciaProvider = ({ children }) => {
    const [gerencias, setGerencias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // ... 100+ linhas de funções ...
    return (
        <GerenciaContext.Provider value={{ gerencias, loading, error, ... }}>
            {children}
        </GerenciaContext.Provider>
    );
};
```

**Depois (Zustand):**
```javascript
// atual — useGerenciaStore.js
import { create } from 'zustand';

export const useGerenciaStore = create((set, get) => ({
  gerencias: [],
  loading: false,
  error: null,
  // State e actions no mesmo objeto — sem JSX, sem Provider
  fetchGerencias: async () => { ... },
  adicionarGerencia: async (gerencia) => { ... },
}));
```

---

### 3.2 — Como Atualizar o Estado (Actions)

| Aspecto | Context API (legado) | Zustand (atual) |
|---|---|---|
| **Mecanismo de update** | `setState` do React (`setLoading`, `setError`) | `set()` do Zustand — atualiza apenas o que foi informado |
| **Chamada entre actions** | Referência direta à função local | `get()` — acessa a store atual de dentro de uma action |
| **Verbosidade** | Alta — cada action tem 4-5 linhas só de `setLoading` / `setError` | Idêntica em tamanho, mas sem `setLoading` individual |

**Antes:**
```javascript
// Dentro do GerenciaProvider (Context)
const fetchGerencias = async () => {
    setLoading(true);    // função separada de estado
    setError(null);      // função separada de estado
    try {
        const response = await api.get('/gestor/listarGestores');
        const dados = response.data.data || response.data || [];
        setGerencias(Array.isArray(dados) ? dados : []);
        return dados;
    } catch (err) {
        const mensagem = err.response?.data?.message || 'Erro ao buscar gestores';
        setError(mensagem);     // função separada de estado
        throw err;
    } finally {
        setLoading(false);  // função separada de estado
    }
};
```

**Depois:**
```javascript
// Dentro de useGerenciaStore (Zustand)
fetchGerencias: async () => {
    set({ loading: true, error: null }); // uma única chamada set()
    try {
      const response = await api.get('/gestor/listarGestores');
      const dados = extrairDados(response);
      set({ gerencias: Array.isArray(dados) ? dados : [] });
      return dados;
    } catch (err) {
      set({ error: extrairMensagemErro(err, 'Erro ao buscar gestores') });
      throw err;
    } finally {
      set({ loading: false });
    }
},
```

---

### 3.3 — O Shim de Compatibilidade (A Figueira em Ação)

Este é o padrão mais importante para entender a estratégia de migração do SPQC:

| Aspecto | Context API (legado) | Shim atual (Zustand) |
|---|---|---|
| **Arquivo** | `GerenciaContext.jsx` — 149 linhas | `GerenciaContext.jsx` — 4 linhas |
| **O que o arquivo faz** | Implementa o estado real com Context | Redireciona para o store Zustand |
| **Compatibilidade de imports** | — | Total — código antigo não precisa mudar |

```javascript
// GerenciaContext.jsx (ATUAL) — 4 linhas que substituem 149
export { useGerenciaStore as useGerencia } from '../stores/useGerenciaStore';
export const GerenciaProvider = ({ children }) => children;
export default GerenciaProvider;
```

**O que acontece aqui:**
1. `useGerencia` ainda existe, mas agora é apenas um apelido para `useGerenciaStore`
2. `GerenciaProvider` ainda existe, mas agora é um componente vazio — ele recebe filhos e os devolve sem criar nenhum contexto React
3. Qualquer componente que importava de `GerenciaContext` continua funcionando sem alteração

---

### 3.4 — Como Consumir o Estado nos Componentes

| Aspecto | Context API (legado) | Zustand (atual) |
|---|---|---|
| **Hook** | `useGerencia()` — retorna tudo | `useGerenciaStore((s) => s.campo)` — retorna só o que pediu |
| **Re-render** | Em qualquer mudança no Context | Apenas quando o campo selecionado muda |
| **Provider necessário?** | Sim — componente deve estar dentro do `GerenciaProvider` | Não — qualquer componente pode usar diretamente |

---

## 4. Justificativa Técnica — Por que o SPQC melhorou?

### 4.1 — Fim do Provider Hell

O `App.jsx` legado tinha 10 Providers aninhados. Isso significa que React precisava percorrer toda essa árvore para entregar o estado. Com Zustand, o `App.jsx` atual tem zero Providers de domínio — o estado é global por natureza e não precisa de "embalagem".

### 4.2 — Re-renders Cirúrgicos com Selectors

Com Context API, quando o `loading` de `GerenciaContext` mudava (ou seja, uma requisição começava), **todos** os componentes dentro do `GerenciaProvider` re-renderizavam — mesmo os que só precisavam exibir a lista de gerências e nunca usavam `loading`.

Com Zustand e selectors, cada componente especifica exatamente o que precisa:

```javascript
// Componente que só precisa da lista — não re-renderiza quando loading muda
const gerencias = useGerenciaStore((s) => s.gerencias);

// Componente que só precisa do loading — não re-renderiza quando a lista muda
const loading = useGerenciaStore((s) => s.loading);
```

### 4.3 — Estado Fora do Ciclo de Vida do React

No Context API, o estado vivia **dentro** de um componente Provider. Quando esse componente desmontava, o estado era destruído. Com Zustand, o estado existe fora da árvore React e persiste enquanto a aplicação estiver aberta.

### 4.4 — Remoção de Boilerplate

| Métrica | Context (GerenciaContext) | Zustand (useGerenciaStore) |
|---|---|---|
| Linhas de código | 149 | ~100 |
| Importações React | `createContext`, `useContext`, `useState` | Nenhuma |
| Necessita JSX para funcionar | Sim (`<GerenciaContext.Provider>`) | Não |
| Funções de setter separadas | `setGerencias`, `setLoading`, `setError` | `set()` — uma função unificada |

### 4.5 — Acesso Cruzado Entre Stores

Com Context, se um Provider precisasse de dados de outro Provider, era necessário importar múltiplos contextos, criando dependências em cascata. Com Zustand, qualquer store pode acessar outra store diretamente:

```javascript
// Uma store acessando outra — sem Provider envolvido
import { useAuthStore } from './useAuthStore';
const token = useAuthStore.getState().token;
```

---

## 5. A Figueira Estranguladora — A Estratégia de Migração

### O que é esse padrão?

A **Figueira Estranguladora** (Strangler Fig Pattern) é uma estratégia de engenharia de software para substituir um sistema legado de forma **gradual e segura**, sem precisar parar o desenvolvimento ou fazer uma reescrita total.

O nome vem de uma figueira tropical que cresce ao redor de uma árvore existente: lentamente, a nova árvore envolve a antiga, assume suas funções e, eventualmente, a árvore original pode ser removida sem que ninguém perceba a transição.

### Como o SPQC aplicou esse padrão

A equipe que fez a migração documentou a técnica nas notas internas (`AnotacoesRefatoracaoZustand.md`):

```javascript
// A técnica documentada pela própria equipe:
// "Redireciona qualquer código antigo para o novo Store, sem quebrar imports"
export { useAuthStore as useAuth } from '../stores/useAuthStore';
export const AuthProvider = ({ children }) => children; // Provider vazio — só passa os filhos
```

A migração ocorreu em 3 etapas:

```
ETAPA 1 — Estado Original (Context puro)
──────────────────────────────────────────────────────────────
GerenciaContext.jsx  →  Implementação real com createContext + useState
GerenciaProvider     →  Wrapping real na árvore do App.jsx
Componentes          →  import { useGerencia } from '../contexts/GerenciaContext'


ETAPA 2 — Estado Atual (Shim de Compatibilidade — FASE EM QUE O SPQC ESTÁ)
──────────────────────────────────────────────────────────────
useGerenciaStore.js  →  Implementação real com Zustand (estado vive aqui)
GerenciaContext.jsx  →  Shim de 4 linhas que redireciona para o store
GerenciaProvider     →  Componente vazio ({ children }) => children
App.jsx              →  Sem nenhum Provider de domínio
Componentes          →  import { useGerencia } from '../contexts/GerenciaContext'
                         (mesmo import de antes — funciona sem alterar nada)


ETAPA 3 — Limpeza Final (próximo passo natural)
──────────────────────────────────────────────────────────────
useGerenciaStore.js  →  Continua igual
GerenciaContext.jsx  →  REMOVIDO
Componentes          →  import { useGerenciaStore } from '../stores/useGerenciaStore'
                         (imports atualizados diretamente para a store)
```

### Por que não fazer tudo de uma vez?

O projeto tinha **40+ arquivos** importando hooks de contexto. Atualizar todos de uma vez seria:
- Arriscado (muitas alterações simultâneas = muitos pontos de falha)
- Demorado (cada componente precisaria de testes após a mudança)
- Desnecessário (o shim resolve o problema sem urgência)

O padrão da Figueira permite que a equipe migre **componente por componente**, no próprio ritmo, sem quebrar o que já funciona.

---

## 6. Zustand para Iniciantes — A Analogia do Restaurante

Imagine que você está em um restaurante. Vamos usar essa cena para entender os dois sistemas.

---

### O Restaurante com Context API — "A Burocracia do Salão"

Nesse restaurante, existe um **gerente no centro do salão**. Todas as informações sobre os pratos disponíveis, os preços e as promoções ficam com ele.

Quando **qualquer coisa** muda — um prato acaba, o preço de um item muda, uma promoção começa — o gerente **para tudo e faz um anúncio geral para o salão inteiro**:

> *"Atenção a todos! O preço do prato X mudou!"*

Resultado: **todos os garçons param o que estão fazendo e prestam atenção** — mesmo aqueles que estavam atendendo mesas que nunca pediram esse prato. Todos re-renderizam, mesmo sem precisar.

Além disso, para que qualquer garçom possa ouvir o gerente, o restaurante precisa ser construído de uma forma muito específica: o gerente deve estar no **centro**, com todos os garçons ao seu redor. Essa "construção obrigatória" é o equivalente ao Provider Hell — os componentes precisam estar **dentro** do Provider para acessar o estado.

---

### O Restaurante com Zustand — "O Balcão de Autoatendimento"

Agora imagine que o mesmo restaurante tem um **balcão de autoatendimento no corredor**. Nesse balcão, qualquer garçom pode chegar e consultar o cardápio, os preços e o status dos pratos disponíveis — a qualquer momento, sem precisar perguntar para o gerente.

O balcão não fica no centro do salão. Ele fica no corredor, independente de onde os garçons estão. Isso é o equivalente ao estado Zustand: **existe fora da árvore React**, disponível globalmente.

E mais importante: **cada garçom busca apenas o que precisa**.

```javascript
// Garçom A — só precisa saber se há mesas disponíveis (selector)
const mesas = useRestauranteStore((s) => s.mesas);

// Garçom B — só precisa saber o cardápio do dia (selector diferente)
const cardapio = useRestauranteStore((s) => s.cardapio);
```

Quando o cardápio muda, **apenas o Garçom B é notificado**. O Garçom A continua trabalhando sem interrupção. Isso é a eficiência dos **selectors**.

---

### A Mesa dos Selectors — O Conceito Central

| Situação | Context API | Zustand com Selector |
|---|---|---|
| `gerencias` muda | Todos os filhos do Provider re-renderizam | Só quem usa `(s) => s.gerencias` |
| `loading` muda | Todos os filhos do Provider re-renderizam | Só quem usa `(s) => s.loading` |
| `error` muda | Todos os filhos do Provider re-renderizam | Só quem usa `(s) => s.error` |

---

## 7. Os 3 Desafios de Raciocínio Lógico

Estes desafios não testam memorização. Eles testam se você entendeu a **mecânica** do que acontece. Para cada um, primeiro tente responder sozinho, depois leia a explicação.

---

### Desafio 1 — O Re-render Invisível

**Cenário:**
O componente `GerenciaCards.jsx` exibe a lista de gerências. Ele faz a seguinte chamada na versão legada com Context:

```javascript
// Versão legada — GerenciaCards.jsx
const { gerencias, loading, error } = useGerencia();
```

Um usuário clica no botão "Atualizar" na tela. Isso dispara `fetchGerencias()`, que imediatamente executa `setLoading(true)`.

**Pergunta:** No sistema com Context API, o `GerenciaCards` vai re-renderizar neste momento, mesmo que a lista de gerências ainda não tenha mudado? Por quê? No sistema com Zustand, o que seria diferente se o componente usasse um selector?

<details>
<summary>Ver resposta</summary>

**Com Context API:** Sim. Quando `setLoading(true)` é executado dentro do `GerenciaProvider`, o React entende que o `value` do Provider mudou (pois `loading` faz parte do objeto `value`). Isso dispara uma re-renderização em **todos** os componentes que consomem esse contexto — incluindo `GerenciaCards`, mesmo que ele não use `loading` para exibir nada.

**Com Zustand e selector:** Depende de como o componente foi escrito. Se ele usar:
```javascript
// Re-renderiza quando qualquer coisa na store muda (evitar)
const { gerencias, loading } = useGerenciaStore();

// Re-renderiza APENAS quando gerencias muda (correto)
const gerencias = useGerenciaStore((s) => s.gerencias);
```
Na segunda forma, quando `loading` muda para `true`, o `GerenciaCards` **não re-renderiza**, pois o selector só está "assinado" para mudanças em `gerencias`.

</details>

---

### Desafio 2 — O Import que Não Quebra

**Cenário:**
Um desenvolvedor Junior que acabou de entrar no projeto encontra este código em `GerenciaFormDialog.jsx`:

```javascript
import { useGerencia } from '../../contexts/GerenciaContext';
```

Ele abre o arquivo `GerenciaContext.jsx` na versão atual e vê apenas 4 linhas:

```javascript
export { useGerenciaStore as useGerencia } from '../stores/useGerenciaStore';
export const GerenciaProvider = ({ children }) => children;
export default GerenciaProvider;
```

Confuso, ele pergunta: *"Mas o estado não está no `GerenciaContext.jsx`! Onde está o `useState` das gerências? Como isso funciona?"*

**Pergunta:** Explique para esse desenvolvedor o que acontece quando `GerenciaFormDialog` chama `useGerencia()`. Trace o caminho completo que o código percorre.

<details>
<summary>Ver resposta</summary>

O caminho completo é:

1. `GerenciaFormDialog` chama `useGerencia()`
2. `useGerencia` é um apelido exportado de `GerenciaContext.jsx` que aponta para `useGerenciaStore`
3. `useGerenciaStore` é a store Zustand definida em `src/stores/useGerenciaStore.js`
4. O estado real (`gerencias`, `loading`, `error`) **vive dentro do Zustand**, não no arquivo `GerenciaContext.jsx`

O arquivo `GerenciaContext.jsx` atual é um **shim de compatibilidade** — ele não guarda estado. Ele existe apenas para preservar o caminho de import antigo (`contexts/GerenciaContext`) enquanto a implementação real foi movida para a store.

Esse é o padrão da Figueira Estranguladora em ação: o componente continua usando o import antigo, mas por baixo dos panos está falando diretamente com o Zustand.

</details>

---

### Desafio 3 — O Provider que Não Faz Nada

**Cenário:**
O `App.jsx` da versão legada tinha esta estrutura:

```jsx
<GerenciaProvider>
  <LicencaProvider>
    <CampusProvider>
      {/* ... componentes ... */}
    </CampusProvider>
  </LicencaProvider>
</GerenciaProvider>
```

O `App.jsx` atual ainda importa e usa `GerenciaProvider` em alguns trechos de transição? Não — mas suponha que um desenvolvedor, por engano, adicionasse o seguinte ao `App.jsx` atual:

```jsx
<GerenciaProvider>
  <HomeView />
</GerenciaProvider>
```

**Pergunta:** Isso causaria algum problema? O `GerenciaProvider` atual ainda cria um contexto React? Qual seria o impacto em performance?

<details>
<summary>Ver resposta</summary>

**Não causaria nenhum problema funcional**, mas seria código desnecessário.

O `GerenciaProvider` atual é definido como:
```javascript
export const GerenciaProvider = ({ children }) => children;
```

Isso é um **componente passthrough** — ele recebe `children` e os retorna sem fazer nada. Não cria contexto, não gerencia estado, não causa re-renders. É equivalente a não tê-lo na árvore.

Em performance: **impacto zero**. React ainda vai processar esse componente, mas como ele retorna apenas `children`, não há nenhuma diferença observável.

O motivo de ele ainda existir é justamente para que código legado que faça `<GerenciaProvider>` não quebre — o Provider está lá, só que "vazio". A limpeza final seria remover o shim e atualizar os imports diretamente para `useGerenciaStore`.

</details>

---

## Referências do Código Analisado

| Arquivo | Localização | Papel no Guia |
|---|---|---|
| `App.jsx` (legado) | `versao-anterior/spqc-frontend/src/App.jsx` | Demonstração do Provider Hell |
| `App.jsx` (atual) | `spqc-frontend/src/App.jsx` | Demonstração pós-migração |
| `GerenciaContext.jsx` (legado) | `versao-anterior/.../contexts/GerenciaContext.jsx` | Context API completo — 149 linhas |
| `GerenciaContext.jsx` (atual) | `spqc-frontend/src/contexts/GerenciaContext.jsx` | Shim de compatibilidade — 4 linhas |
| `useGerenciaStore.js` | `spqc-frontend/src/stores/useGerenciaStore.js` | Store Zustand — implementação real |
| `CampusContext.jsx` (legado) | `versao-anterior/.../contexts/CampusContext.jsx` | Context API — padrão idêntico |
| `useCampusStore.js` | `spqc-frontend/src/stores/useCampusStore.js` | Store Zustand — padrão idêntico |
| `AnotacoesRefatoracaoZustand.md` | `versao-anterior/spqc-frontend/_docs/...` | Notas internas da equipe |

---

> **Versão do Zustand em uso:** `^5.0.11` (conforme `package.json` do projeto)
> **React em uso:** `^19.1.0`
>
> *Documento gerado em 26/03/2026 — análise baseada nos arquivos reais do projeto SPQC.*
