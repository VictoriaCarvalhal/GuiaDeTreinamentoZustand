# Análise Consolidada — Migração Context API → Zustand (SPQC)

> Documentação técnica e didática sobre a refatoração de gerenciamento de estado do projeto SPQC.
> Gerado em: 26/03/2026

---

## Documentos Disponíveis

### Documento Principal

#### [Guia de Treinamento: Da Context API ao Zustand](./Guia_Treinamento_Context_para_Zustand.md)

**Para quem:** Desenvolvedores Junior que precisam entender a arquitetura de estado do SPQC.

**O que você vai encontrar:**

| Seção | Conteúdo |
|---|---|
| 📖 Dicionário de Campo | Termos chave: Store, State, Actions, Selectors, Middleware |
| 🔥 O Problema — Provider Hell | Análise do `App.jsx` legado com 10 Providers aninhados |
| 📊 Tabela Comparativa | Context API vs Zustand com código real do projeto |
| ⚙️ Justificativa Técnica | Por que o SPQC melhorou com a troca |
| 🌳 Figueira Estranguladora | A estratégia de migração incremental usada no SPQC |
| 🍽️ Analogia do Restaurante | Zustand explicado via Balcão de Autoatendimento |
| 🧠 3 Desafios de Raciocínio | Cenários reais de causa e efeito baseados no código |

**Arquivos de código analisados:**
- `versao-anterior/spqc-frontend/src/App.jsx` — Provider Hell (10 camadas)
- `spqc-frontend/src/App.jsx` — Pós-migração (zero Providers de domínio)
- `versao-anterior/.../GerenciaContext.jsx` — Context completo (149 linhas)
- `spqc-frontend/src/contexts/GerenciaContext.jsx` — Shim (4 linhas)
- `spqc-frontend/src/stores/useGerenciaStore.js` — Store Zustand real

---

### Documento Secundário

#### [Propostas de Prompts Complementares](./Propostas_Prompts_Complementares.md)

**Para quem:** Tech Leads e gestores que querem expandir a documentação do projeto com outras perspectivas.

**O que você vai encontrar:**

| Prompt | Persona | Pergunta Central |
|---|---|---|
| Prompt 1 | QA Engineer | Como testar stores Zustand e o shim de compatibilidade? |
| Prompt 2 | Tech Lead | Como garantir consistência em novos stores via Code Review? |
| Prompt 3 | Performance Engineer | Como medir e provar o ganho de performance? |
| Prompt 4 | Arquiteto de Software | Qual é o roadmap para finalizar a migração? |

> **Recomendação:** Esses prompts são prontos para uso — basta copiá-los e aplicá-los em uma nova sessão de IA com o contexto do projeto.

---

## Mapa da Migração (Resumo Visual)

```
ANTES (versao-anterior)                   DEPOIS (spqc-frontend)
─────────────────────────────────────     ─────────────────────────────────────
App.jsx                                   App.jsx
  └── AuthProvider                          └── PrimeReactProvider
      └── PublicProvider                        └── Router
          └── ProdutoProvider                       └── AppInitializer  ← novo
              └── GerenciaProvider                  └── <conteúdo limpo>
                  └── LicencaProvider
                      └── PesquisaProvider       src/stores/
                          └── CampusProvider       ├── useAuthStore.js
                              └── LaboratorioP.    ├── useCampusStore.js
                                  └── LocalizP.    ├── useGerenciaStore.js
                                      └── EntradaP ├── useLicencaStore.js
                                          └── APP  └── ... (10 stores total)

src/contexts/                             src/contexts/ (shims — 4 linhas cada)
  ├── GerenciaContext.jsx (149 linhas)      ├── GerenciaContext.jsx → store
  ├── CampusContext.jsx   (112 linhas)      ├── CampusContext.jsx   → store
  ├── LicencaContext.jsx  (145 linhas)      ├── LicencaContext.jsx  → store
  └── ... (12 contexts total)              └── ... (redirecionamentos)
```

---

## Status da Migração no Projeto

| Etapa | Status | Descrição |
|---|---|---|
| Etapa 1 — Context puro | ✅ Concluída | Estado vivia nos Providers (`versao-anterior`) |
| Etapa 2 — Zustand + Shims | ✅ Concluída | Estado em Zustand, imports preservados via shims |
| Etapa 3 — Limpeza dos Shims | 🔲 Pendente | Remover shims, atualizar imports direto para stores |

> Para planejar a Etapa 3, use o **Prompt 4** do documento de propostas (Persona: Arquiteto de Software).

---

## Dependências de Tecnologia

| Tecnologia | Versão | Papel |
|---|---|---|
| React | ^19.1.0 | Framework UI |
| Zustand | ^5.0.11 | Gerenciamento de estado |
| Vite | ^6.3.5 | Build tool |
| React Router Dom | ^7.6.1 | Roteamento |

---

*Análise baseada nos arquivos reais dos diretórios `./versao-anterior/spqc-frontend` e `./spqc-frontend` do projeto SPQC.*
