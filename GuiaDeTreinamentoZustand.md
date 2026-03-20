# Guia de Treinamento: Da Context API para o Zustand no Projeto SPQC
> **Gerado em:** 12/03/2026 | **Versão:** V2 (arquivo anterior: `Analise_Refatoracao_Zustand_NOVA.md`)  
> **Nível:** Iniciante → Intermediário | **Base:** Engenharia Reversa do Código Real do SPQC

---

## Índice

1. [Sumário de Termos Chave — O Dicionário de Campo](#1-sumário-de-termos-chave--o-dicionário-de-campo)
2. [Tabela Comparativa de Padrões: Context vs Zustand](#2-tabela-comparativa-de-padrões-context-vs-zustand)
3. [Justificativa Técnica — Por Que o SPQC Melhorou?](#3-justificativa-técnica--por-que-o-spqc-melhorou)
4. [Guia Zustand para Iniciantes — A Analogia do Restaurante](#4-guia-zustand-para-iniciantes--a-analogia-do-restaurante)

---

## 1. Sumário de Termos Chave — O Dicionário de Campo

Antes de mergulhar no código, vamos falar a mesma língua. Imagine que você acabou de entrar em uma nova empresa e precisa conhecer o vocabulário interno. Este é o seu glossário de sobrevivência.

---

### 🗄️ Store (Loja / Armazém)
**O que é:** A "caixa central" onde todo o estado de uma funcionalidade fica guardado. No Zustand, cada loja é um arquivo `.js` com a função `create()`.

**Exemplo de sistema do SPQC:**
```
/src/stores/useGerenciaStore.js    → Loja dos dados de gestores
/src/stores/useAuthStore.js        → Loja dos dados de autenticação
/src/stores/usePesquisaStore.js    → Loja dos resultados de busca
```

> **Analogia simples:** Pense na Store como um armário de uma empresa. Qualquer funcionário que precise de um documento vai ao mesmo armário, sem precisar pedir ao gerente.

---

### 📦 State (Estado)
**O que é:** Os **dados** que ficam guardados dentro da Store (ou do Context). É o "conteúdo do armário".

**Exemplo real do SPQC:** (`useGerenciaStore.js`, linha 10-14):
```javascript
// ZUSTAND — estado declarado junto com as ações
export const useGerenciaStore = create((set, get) => ({
  gerencias: [],          // STATE: lista de gestores
  unidadesAcademicas: [], // STATE: lista de unidades
  loading: false,         // STATE: indicador de carregamento
  error: null,            // STATE: última mensagem de erro
  ...
}));
```

---

### ⚡ Actions (Ações)
**O que é:** As **funções** que modificam o estado. São as ordens que "arrumam o armário". No Zustand, elas vivem **dentro** da própria Store.

**Exemplo real do SPQC** (`useGerenciaStore.js`, linha 45-57):
```javascript
adicionarGerencia: async (gerencia) => {
  set({ loading: true, error: null });   // Ação modifica o estado
  try {
    const response = await api.post('/gestor/cadastrarGestor', gerencia);
    await get().fetchGerencias();        // Chama outra ação interna
    return response.data;
  } catch (err) {
    set({ error: extrairMensagemErro(err, 'Erro ao cadastrar gestor') });
    throw err;
  } finally {
    set({ loading: false });
  }
},
```

---

### 🔭 Selectors (Seletores)
**O que é:** A forma como um componente **escolhe qual fatia específica** do estado ele quer observar. Com Selectors, o componente só "vê" o que precisa — e só rerenderiza quando *aquilo específico* muda.

**Exemplo real do SPQC** (`components/auth/PrivateRoute.jsx`, linha 5-6):
```javascript
// Componente pede APENAS o que precisa — não o objeto todo
const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
const loading = useAuthStore((s) => s.loading);
```

> **Por que isso importa:** Se `user` mudar (ex: foto de perfil atualizada), `PrivateRoute` **não vai rerenderizar**, porque ele selecionou SOMENTE `isAuthenticated` e `loading`. Na Context API, ele seria "acordado" mesmo sem precisar.

---

### 🔌 Middleware
**O que é:** Um "filtro intermediário" que você pode plugar à Store para adicionar comportamentos extras — como salvar automaticamente no `localStorage`, registrar eventos de auditoria, etc.

> **No SPQC atual:** O projeto não usa middlwares explícitos ainda, mas o Zustand tem suporte nativo ao `persist` (persistência automática) e `devtools` (debug visual no navegador). Isso abre caminho para futuras melhorias sem reescrever a lógica.

---

## 2. Tabela Comparativa de Padrões: Context vs Zustand

Abaixo, um confronto direto baseado no código real dos dois branches do SPQC.

### 🔴 2.1 — Criação e Registro do Estado

| Aspecto | Context API (Branch Legacy) | Zustand (Branch Refatorado) |
|---|---|---|
| **Arquivo de referência** | `src/contexts/GerenciaContext.jsx` | `src/stores/useGerenciaStore.js` |
| **Tamanho do arquivo** | 149 linhas | 101 linhas (−32%) |
| **Imports necessários** | `createContext`, `useContext`, `useState`, `React` | Somente `create` do Zustand |
| **Onde o estado vive** | Dentro de um componente `Provider` | Fora da árvore React, em módulo JS |
| **Precisa de wrapper no HTML?** | ✅ Sim — `<GerenciaProvider>` em `App.jsx` | ❌ Não |

**Antes (Context API):**
```jsx
// GerenciaContext.jsx — precisava de Provider + useState separados
const GerenciaContext = createContext({ gerencias: [], loading: false, ... });

export const GerenciaProvider = ({ children }) => {
  const [gerencias, setGerencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  return (
    <GerenciaContext.Provider value={{ gerencias, loading, error, ... }}>
      {children}
    </GerenciaContext.Provider>
  );
};
```

**Depois (Zustand):**
```javascript
// useGerenciaStore.js — estado + ações em um único bloco coeso
export const useGerenciaStore = create((set, get) => ({
  gerencias: [],
  loading: false,
  error: null,
  // ... ações diretamente aqui
}));
```

---

### 🔴 2.2 — O Provider Hell: O Problema Mais Visível

Este é o impacto mais dramático e imediato da refatoração.

**Antes — `App.jsx` (Legacy, 72 linhas):**
> 10 Providers aninhados — um dentro do outro como bonecas russas

```jsx
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
                            {/* ...conteúdo real aqui... */}
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

**Depois — `App.jsx` (Zustand, 57 linhas):**
> Zero Providers de estado de negócio. Componente limpo.

```jsx
function AppInitializer() {
  const inicializar = useAuthStore((s) => s.inicializar);
  const iniciarMonitoramento = usePublicStore((s) => s.iniciarMonitoramento);
  const pararMonitoramento = usePublicStore((s) => s.pararMonitoramento);

  useEffect(() => { inicializar(); }, []);
  useEffect(() => {
    iniciarMonitoramento();
    return () => pararMonitoramento();
  }, []);

  return null;
}

function App() {
  return (
    <PrimeReactProvider>
      <Router>
        <AppInitializer />
        <div className="min-h-screen flex flex-col">
          {/* ...conteúdo real, sem nenhum Provider bloqueando a view... */}
        </div>
      </Router>
    </PrimeReactProvider>
  );
}
```

---

### 🔴 2.3 — Consumo em Componentes: `useContext` vs Selectors

**Antes — `PrivateRoute.jsx` (Legacy):**
```jsx
// Recebe TODO o objeto do contexto — sem filtro
const { isAuthenticated } = useAuth();
```
> ⚠️ O componente "assina" o contexto inteiro. Qualquer mudança em `user`, `loading`, ou qualquer outro campo do `AuthContext` rerrenderiza este componente.

**Depois — `PrivateRoute.jsx` (Zustand):**
```jsx
// Selector: pede SOMENTE os campos necessários
const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
const loading = useAuthStore((s) => s.loading);
```
> ✅ O componente só rerrenderiza quando `isAuthenticated` OU `loading` mudam. Se `user` mudar (ex: nome atualizado), `PrivateRoute` fica em silêncio.

---

### 🔴 2.4 — Migração de Compatibilidade (Shim)

Um detalhe elegante da refatoração: o `AuthContext.jsx` **não foi simplesmente deletado**. Ele foi transformado em um arquivo-ponte de 4 linhas para garantir retrocompatibilidade:

**`/src/context/AuthContext.jsx` no branch Zustand (4 linhas!):**
```jsx
// Redireciona qualquer código antigo para o novo Store, sem quebrar imports
export { useAuthStore as useAuth } from '../stores/useAuthStore';
export const AuthProvider = ({ children }) => children; // Provider vazio — só passa os filhos
```

> **Lição:** Refatorações bem-feitas não quebram o contrato da interface pública. Componentes que ainda usavam `useAuth()` continuaram funcionando sem alteração.

---

### 🔴 2.5 — Lógica de Inicialização Async

**Antes (AuthContext Legacy):** A inicialização ficava grudada no ciclo de vida do componente Provider. Se o Provider não estivesse montado, nada funcionava.

```jsx
// AuthContext.jsx — lógica presa dentro do componente Provider
useEffect(() => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    configureAxios(token);
    checkAuth(); // função definida DENTRO do componente
  } else {
    setLoading(false);
  }
}, []);
```

**Depois (useAuthStore):** A inicialização é uma **Action** livre, chamada de qualquer lugar.

```javascript
// useAuthStore.js — inicialização como ação independente
inicializar: async () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) { set({ loading: false }); return; }

  configurarAxios(token);
  const usuarioLocal = restaurarSessaoLocal();
  if (usuarioLocal) set({ user: usuarioLocal, isAuthenticated: true });

  await get().verificarSessao(); // chama outra action interna
},
```

---

## 3. Justificativa Técnica — Por Que o SPQC Melhorou?

### 🏆 Ganho 1: Fim do Re-render em Cascata (Raiz do Problema)

**Como funcionava antes:** O React Context funciona por "transmissão de rádio". Quando qualquer dado dentro do `value` de um Provider muda, **todos** os componentes que chamaram `useContext()` daquele contexto são rerenderizados, independentemente de usar ou não o dado que mudou.

No SPQC legacy, o `EditalContext.jsx` tinha **25+ variáveis de estado** (`carregando`, `error`, `consoleData`, `consoleInscricaoData`, `consoleAvaliacaoData`, etc.). Uma simples mudança em `carregando = true` disparava rerenders em **todos** os componentes que usavam `useEdital()` — mesmo os que só precisavam do `editalAtivo`.

**Como ficou com Zustand:** Cada componente declara exatamente o slice de estado que quer via Selector. O re-render é cirúrgico — só quem depende daquele campo específico recebe o sinal.

---

### 🏆 Ganho 2: Estado Fora da Árvore React (Independence from Component Tree)

Com Context API, o estado existe **dentro** de um componente React. Isso significa:
- O estado só existe enquanto o Provider estiver montado na DOM.
- Você não consegue ler ou modificar o estado de fora do React (ex: em funções utilitárias, interceptors do axios, etc.).

Com Zustand, o estado é um **módulo JavaScript puro**. Você pode fazer:
```javascript
// Em qualquer lugar do sistema — sem precisar de hooks ou componentes
import { useAuthStore } from '../stores/useAuthStore';
const { logout } = useAuthStore.getState(); // acesso direito
logout();
```

---

### 🏆 Ganho 3: Remoção do Provider Hell e Acoplamento Estrutural

**Antes:** Adicionar um novo contexto exigia modificar `App.jsx`, criar um novo Provider, envolver a árvore inteira. O risco de quebrar a **ordem** dos Providers (que matéria, pois um pode depender de outro) era constante.

**Depois:** Adicionar um novo Store é criar um novo arquivo `.js`. O `App.jsx` não muda. Nenhuma hierarquia é afetada.

---

### 🏆 Ganho 4: Lógica Centralizada e Testável

No `GerenciaContext.jsx` legacy, as funções como `adicionarGerencia` dependiam dos `setState` locais do componente. Para testar, você precisava renderizar o componente Provider inteiro.

No `useGerenciaStore.js` (Zustand), a Store é um **objeto JavaScript puro**. Você pode importá-la, chamar a Action `adicionarGerencia` e verificar o estado resultante sem renderizar nenhum componente.

---

### 📊 Resumo Quantitativo do SPQC

| Métrica | Context API (Legacy) | Zustand (Refatorado) |
|---|---|---|
| Providers em `App.jsx` | **10 aninhados** | **0** (estado de negócio) |
| Linhas em `AuthContext.jsx` | 189 linhas | 4 linhas (shim) + 109 linhas (Store) |
| Linhas em `GerenciaContext.jsx` | 149 linhas | 101 linhas **(-32%)** |
| Linhas em `PesquisaContext.jsx` | 307 linhas | 187 linhas **(-39%)** |
| Re-renders por mudança de estado | **Todos os consumidores** | **Somente consumidores com Selector afetado** |
| Inicialização | Presa no ciclo do Provider | Action independente chamada de qualquer lugar |

---

## 4. Guia Zustand para Iniciantes — A Analogia do Restaurante

### Parte 1: O Restaurante e seus dois estilos de serviço

Imagine um restaurante movimentado com 10 mesas cheias. O gerente é o responsável por saber o status de tudo: cardápio do dia, promoções, quais pratos acabaram, temperatura do salão.

---

#### 🎙️ Modelo Context API: "O Gerente que Para o Salão"

Neste restaurante, toda vez que **qualquer informação muda**, o gerente pega o microfone e anuncia para **todas as mesas ao mesmo tempo**:

> *"Atenção, senhoras e senhores! O prato do dia mudou! O risoto está acabando! A temperatura baixou dois graus! Favor anotar!"*

Resultado: **todos os garçons param o que estão fazendo** e renovam o pedido na memória deles — mesmo que a mesa 7 só precise saber sobre o cardápio vegetariano e nada mais.

Isso é exatamente o `useContext()` sem filtros: **um dado muda → todos os componentes que "ouvem" aquele contexto são acordados**.

No SPQC legacy, o `EditalContext` tinha mais de 25 variáveis de estado. Quando `carregando` mudava de `false` para `true`, **todos os componentes** que usavam `useEdital()` eram rerenderizados — mesmo aqueles que só precisavam saber o `editalAtivo` e nunca olhavam para `carregando`.

---

#### 🍽️ Modelo Zustand: "O Balcão de Autoatendimento Inteligente"

No novo sistema, o restaurante instalou um **balcão de autoatendimento**. Cada cliente vai até o balcão e serve **exatamente o que precisa**:

- O cliente da mesa 3 pega somente o suco.
- O cliente da mesa 7 pega somente o prato vegetariano.
- O cliente da mesa 10 pega somente a conta.

Quando a **temperatura do suco** muda, **só os clientes que pegaram suco são avisados**. As mesas que pegaram o prato ou a conta continuam em paz, sem interrupção.

Este é o poder dos **Selectors**: cada componente declara exatamente qual "prato" (fatia de estado) ele quer consumir.

---

### 📝 Desafio de Raciocínio 1 — O Silêncio Cirúrgico

> **Contexto:** No SPQC, o componente `PrivateRoute.jsx` é responsável por bloquear o acesso à área logada. Ele usa o `useAuthStore`.

Observe os dois pedaços de código:

**Versão Legacy (Context):**
```jsx
const { isAuthenticated } = useAuth(); // pega o objeto inteiro
```

**Versão Zustand:**
```jsx
const isAuthenticated = useAuthStore((s) => s.isAuthenticated); // selector
const loading = useAuthStore((s) => s.loading);
```

**Cenário:** O usuário logado atualiza a foto de perfil. O backend retorna os novos dados do usuário e o `useAuthStore` atualiza a propriedade `user`.

**Pergunta:** Por que o componente `PrivateRoute` **não vai sofrer re-render** na versão Zustand, mas **sofreria** na versão Context API?

<details>
<summary>🧠 Clique para ver a resposta</summary>

**Resposta:**

Na **versão Context API**, o `PrivateRoute` chama `useAuth()`, que "assina" o contexto inteiro. Quando qualquer dado do `AuthContext` muda — incluindo `user` — o React notifica todos os assinantes. O `PrivateRoute` é acordado e rerenderizado, mesmo que `isAuthenticated` não tenha mudado.

Na **versão Zustand**, o `PrivateRoute` usa Selectors para pedir **somente** `isAuthenticated` e `loading`. O Zustand, internamente, compara o valor retornado pelo Selector **antes e depois** da atualização. A propriedade `user` mudou, mas `isAuthenticated` e `loading` **continuaram com os mesmos valores** (`true` e `false`). Conclusão: nenhum re-render. O componente permanece estático.

**Impacto prático:** Em um sistema com dezenas de componentes e dados de usuário que mudam com frequência, essa economia de re-renders se acumula e se torna perceptível em performance.
</details>

---

### Parte 2: Como Funciona a Cozinha (o Store)

Voltando ao restaurante: o balcão de autoatendimento tem uma **cozinha por trás**. A cozinha é a Store. Ela tem três responsabilidades:

1. **Guardar os ingredientes** (State): os dados que existem em determinado momento.
2. **Executar as receitas** (Actions): as funções que mudam os dados.
3. **Servir o prato certo para cada mesa** (Selectors): dar apenas a fatia que o componente pediu.

**A "receita" em código real** (`usePesquisaStore.js`, linha 45-63):
```javascript
pesquisarServidor: async (termo) => {
  // Validação — cozinha não aceita pedidos incompletos
  if (!termo || termo.trim().length < 4) {
    set({ error: 'Digite no mínimo 4 caracteres para pesquisar', servidores: [] });
    return [];
  }

  // Início do preparo — avisa o salão que está trabalhando
  get()._setLoadingEntidade('servidor', true);
  set({ error: null });

  try {
    // Busca o ingrediente no "fornecedor" (API)
    const response = await api.get('/pesquisar/servidor', { params: { termo: termo.trim() } });
    const dados = response.data.data || [];

    // Coloca na prateleira do balcão — qualquer mesa pode pegar agora
    set({ servidores: dados });
    return dados;
  } catch (err) {
    set({ error: '...', servidores: [] });
    throw err;
  } finally {
    // Avisa que o preparo terminou
    get()._setLoadingEntidade('servidor', false);
  }
},
```

---

### 📝 Desafio de Raciocínio 2 — O Problema do Loading Compartilhado

> **Contexto:** No SPQC `PesquisaContext.jsx` (legacy), havia uma **única variável** `loading` compartilhada por todas as 6 funções de pesquisa (`pesquisarServidor`, `pesquisarUnidade`, `pesquisarLaboratorioPorNome`, etc.).

```javascript
// PesquisaContext.jsx legacy — loading único para todos
const [loading, setLoading] = useState(false);
```

Já no `usePesquisaStore.js` (Zustand), o loading foi dividido:
```javascript
// usePesquisaStore.js — loading granular por entidade
const loadingInicial = {
  servidor: false,
  unidade: false,
  laboratorio: false,
  campus: false,
  localizacao: false,
};
// ...
loadingPorEntidade: { ...loadingInicial },
```

**Cenário:** Um usuário abre um formulário que dispara **simultaneamente** uma pesquisa de servidor E uma pesquisa de campus.

**Pergunta:** Na versão legacy, qual seria o comportamento indesejado causado pelo loading único? E por que o `loadingPorEntidade` do Zustand resolve esse problema?

<details>
<summary>🧠 Clique para ver a resposta</summary>

**Resposta:**

Na **versão legacy**, ambas as funções compartilham a mesma variável `loading`. O fluxo seria:
1. Pesquisa de servidor começa → `setLoading(true)`
2. Pesquisa de campus começa → `setLoading(true)` (redundante, mas ok)
3. Pesquisa de servidor termina primeiro → `setLoading(false)` ← **PROBLEMA!**
4. O indicador de loading desaparece, mas a pesquisa de campus **ainda está em andamento**!
5. Pesquisa de campus termina → `setLoading(false)` (mas o loading já foi apagado)

O usuário veria o spinner de "carregando" sumir prematuramente, podendo interagir com dados incompletos.

Na **versão Zustand**, cada entidade tem seu próprio loading. `loadingPorEntidade.servidor` vai para `false` quando o servidor termina, mas `loadingPorEntidade.campus` continua `true`. Os componentes que mostram o loading de cada entidade separadamente exibem o estado correto de forma independente.

**Lição:** Estado granular evita interferências entre operações concorrentes.
</details>

---

### Parte 3: A Comanda (o Contrato da Interface)

Uma das maiores elegâncias da refatoração do SPQC foi a **migração suave**. O arquivo `AuthContext.jsx` no branch Zustand tem apenas 4 linhas:

```jsx
export { useAuthStore as useAuth } from '../stores/useAuthStore';
export const AuthProvider = ({ children }) => children;
```

**O que aconteceu aqui:** Imagine que o restaurante mudou toda a cozinha de lugar — mas manteve o mesmo cardápio na frente do cliente. Os garçons (componentes que chamavam `useAuth()`) não precisaram aprender um novo sistema. A cozinha mudou internamente, mas a comanda (a interface pública `useAuth`) continuou funcionando.

Este é um princípio de engenharia chamado **"Open/Closed Principle"**: o sistema está fechado para modificações nos consumidores, mas aberto para melhorias internas.

---

### 📝 Desafio de Raciocínio 3 — Onde Vive o Estado?

> **Contexto:** No SPQC legacy, o estado de `gerencias` (a lista de gestores) existia **dentro** do componente `GerenciaProvider`. No Zustand, esse mesmo estado está em `useGerenciaStore`.

**Cenário:** Imagine que um serviço de interceptação do Axios precisa verificar, antes de fazer uma requisição HTTP, se o usuário está autenticado. Ele precisa ler `isAuthenticated` da Store.

**Pergunta:** Na arquitetura Context API, por que esse serviço **não conseguiria** acessar `isAuthenticated` diretamente? E como a arquitetura Zustand resolve isso de forma elegante?

<details>
<summary>🧠 Clique para ver a resposta</summary>

**Resposta:**

Na **arquitetura Context API**, o estado existe **dentro da árvore React**. Os hooks como `useContext()` só funcionam dentro de componentes React — eles não podem ser chamados de módulos JavaScript puros. Um interceptor do Axios é uma função JavaScript simples, sem acesso ao ciclo de vida React. Para ler `isAuthenticated` do Context, seria necessário criar gambiarras como usar `localStorage` como intermediário, ou criar variáveis globais externas — o que é considerado um anti-padrão.

Na **arquitetura Zustand**, o estado é um **módulo JavaScript** independente. Em qualquer arquivo do projeto, você pode fazer:
```javascript
import { useAuthStore } from '../stores/useAuthStore';

// Fora de qualquer componente React — funciona perfeitamente!
api.interceptors.request.use((config) => {
  const { isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated) {
    // redireciona para login, cancela request, etc.
  }
  return config;
});
```

O método `useAuthStore.getState()` (sem o hook, sem React) lê o estado atual da Store diretamente do módulo JavaScript. Isso desacopla completamente o estado da árvore de componentes.

**Lição:** Zustand elimina a fronteira artificial entre "mundo React" e "mundo JavaScript" para o gerenciamento de estado.
</details>

---

## Conclusão: O Que Este Estudo Nos Ensina

A migração do SPQC não foi apenas uma troca de ferramentas. Foi uma mudança de **filosofia**:

| Filosofia | Context API | Zustand |
|---|---|---|
| **Onde o estado vive** | Dentro da árvore React (Provider) | Em módulo JavaScript independente |
| **Quem é notificado** | Todos que "ouvem" o contexto | Somente quem tem Selector afetado |
| **Onde a lógica fica** | Espalhada: Provider + hooks + useState | Centralizada dentro da Store (create) |
| **Como inicializa** | Dependente do ciclo do componente | Action independente chamada de qualquer lugar |
| **Testabilidade** | Precisa renderizar o Provider | Importa o módulo e chama actions direto |

O resultado prático: **menos código, menos rerenders, mais coesão, mais testabilidade** — e um `App.jsx` que voltou a ser legível sem precisar de scroll horizontal para fechar todos os Providers.

---

*Análise realizada por Antigravity Engine com base nos arquivos reais dos branches `SPQC_Branch_EstudoRefatoracao` e `SPQC_Branch_RefatoradoZustand`. Nenhum arquivo de código foi modificado durante esta análise.*
