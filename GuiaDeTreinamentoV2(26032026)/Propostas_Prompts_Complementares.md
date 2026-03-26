# Propostas de Prompts Complementares — Projeto SPQC

> Este documento identifica ângulos de análise que o guia principal não cobre, e propõe prompts com personas especializadas que podem gerar documentação de alto valor para a equipe do SPQC.

---

## Por que gerar mais prompts?

O guia principal (`Guia_Treinamento_Context_para_Zustand.md`) cobre o ângulo **didático-Junior**: o que mudou, como funciona, e por quê. Mas uma migração arquitetural desse porte tem impactos em outras dimensões que merecem documentação própria:

- Como garantir que a migração não introduziu bugs? *(QA / Testes)*
- Como o estado Zustand se comporta em produção? *(Observabilidade)*
- O que um desenvolvedor deve checar ao criar um novo store? *(Code Review)*
- Como a migração afetou o bundle e o tempo de carregamento? *(Performance)*

Cada uma dessas perguntas merece uma persona diferente e um nível de profundidade diferente.

---

## Prompt 1 — Persona: Engenheiro de QA

**Título sugerido:** `Estrategia_Testes_Zustand_SPQC.md`

**Situação que justifica:**
A migração moveu lógica de negócio de dentro de Providers React para stores Zustand. Isso muda a forma como os testes unitários e de integração devem ser escritos. Um QA Engineer precisa saber como mockar stores, como testar actions assíncronas e como garantir que o shim de compatibilidade não mascare erros.

```markdown
## Prompt QA Engineer — Testes para Stores Zustand no SPQC

### Persona
Aja como um Engenheiro de QA Sênior especialista em testes de aplicações React com
gerenciamento de estado moderno (Zustand, React Testing Library, Vitest/Jest).
Seu foco é cobertura de testes pragmática: testar comportamento, não implementação.

### Contexto
O projeto SPQC migrou de Context API para Zustand usando a Figueira Estranguladora.
Os stores ficam em `./spqc-frontend/src/stores/`. Os shims de compatibilidade ficam
em `./spqc-frontend/src/contexts/`. Não há testes automatizados ainda.

### Missão
Gere um Guia de Estratégia de Testes cobrindo:

1. Como testar um store Zustand isoladamente (sem montar componentes React)?
   - Use `useGerenciaStore` como exemplo real do projeto.
   - Demonstre como resetar o estado entre testes.

2. Como testar um componente que consome um store via selector?
   - Use `GerenciaCards.jsx` como exemplo (componente real do projeto).
   - Como mockar `useGerenciaStore` sem afetar outros testes?

3. Como testar o shim de compatibilidade?
   - Verifique que `useGerencia` de `GerenciaContext.jsx` e `useGerenciaStore`
     de `useGerenciaStore.js` retornam o mesmo estado.

4. Quais as 3 armadilhas mais comuns ao testar Zustand que a equipe deve evitar?

### Restrições
- Use Vitest como runner (compatível com o Vite do projeto).
- Use React Testing Library para testes de componente.
- Não modifique nenhum arquivo de código fonte.
- Gere exemplos com o código real dos stores do SPQC.

### Saída
Arquivo markdown em `./spqc-frontend/_docs/analise-consolidada/Estrategia_Testes_Zustand.md`
```

**Por que esta persona?** Um QA Engineer pensa em *"o que pode quebrar?"* — perspectiva complementar ao guia didático, que pensa em *"como funciona?"*.

---

## Prompt 2 — Persona: Tech Lead (Code Review)

**Título sugerido:** `Checklist_Code_Review_Zustand_SPQC.md`

**Situação que justifica:**
Agora que o padrão Zustand está estabelecido, novos desenvolvedores vão criar novos stores. Sem um checklist de code review, o projeto corre risco de ter stores inconsistentes: alguns com selectors mal escritos, outros sem `limparErro`, outros que não usam `get()` para chamar outras actions.

```markdown
## Prompt Tech Lead — Checklist de Code Review para Stores Zustand no SPQC

### Persona
Aja como um Tech Lead com 8 anos de experiência em arquitetura frontend.
Você é rigoroso em revisões de código, mas sua comunicação é construtiva:
você explica o "porquê" de cada item do checklist, não apenas lista regras.

### Contexto
O projeto SPQC usa Zustand 5.x com React 19. O padrão de store está estabelecido
em arquivos como `useGerenciaStore.js`, `useCampusStore.js` e `useLicencaStore.js`
em `./spqc-frontend/src/stores/`.

### Missão
Analise os stores existentes e extraia um **Checklist de Code Review** para quando
um desenvolvedor criar ou modificar um store no SPQC. O checklist deve cobrir:

1. **Consistência de estrutura:** O store segue o padrão dos outros stores do projeto?
   (presença de `loading`, `error`, `limparErro`, funções `extrairDados` e
   `extrairMensagemErro` como helpers externos)

2. **Selectors nos componentes:** O consumidor do store usa selector ou desestrutura
   o store inteiro? Por que isso importa para performance?

3. **Uso correto de `get()`:** Quando uma action chama outra action do mesmo store,
   ela usa `get().outraAction()` ou referência direta? Qual o risco de cada abordagem?

4. **Tratamento de erro:** O `catch` usa `set({ error: ... })` ou `console.error`
   solto? Quando cada abordagem é adequada?

5. **Nomenclatura:** O store segue o padrão `useNomeDominioStore`?
   O shim de compatibilidade exporta `useNomeDominio` como alias?

### Formato de saída
Para cada item do checklist:
- ✅ Exemplo correto (código real ou baseado nos stores existentes)
- ❌ Antipadrão correspondente
- 💡 Explicação do impacto

### Saída
`./spqc-frontend/_docs/analise-consolidada/Checklist_Code_Review_Zustand.md`
```

**Por que esta persona?** Um Tech Lead pensa em *"como garantir que novos contribuidores sigam o padrão?"* — perspectiva de escalabilidade e consistência.

---

## Prompt 3 — Persona: Engenheiro de Performance

**Título sugerido:** `Analise_Performance_Render_SPQC.md`

**Situação que justifica:**
A justificativa técnica para usar Zustand frequentemente menciona "menos re-renders". Mas sem dados concretos ou exemplos mensuráveis, essa afirmação fica abstrata para a equipe. Um engenheiro de performance pode quantificar o impacto e criar um guia de profiling para o projeto.

```markdown
## Prompt Performance Engineer — Impacto de Re-renders no SPQC

### Persona
Aja como um Engenheiro de Performance Frontend especialista em React DevTools
Profiler, análise de re-renders e otimização de componentes com Zustand.
Você transforma conceitos abstratos de performance em experimentos concretos
e mensuráveis que qualquer desenvolvedor pode reproduzir.

### Contexto
O SPQC migrou de Context API (10 Providers aninhados) para Zustand.
A justificativa era reduzir re-renders desnecessários. Preciso de um guia
que ensine a equipe a **verificar** essa melhoria com ferramentas reais.

### Missão
Gere um documento ensinando:

1. **Como usar React DevTools Profiler** para contar re-renders antes e depois
   de uma ação. Use o cenário: "usuário clica em 'Buscar Gerências'" como caso de teste.

2. **Demonstração teórica do ganho:**
   - No Context legado: quantos componentes re-renderizariam quando `loading`
     mudasse de `false` para `true` no `GerenciaProvider`?
   - No Zustand atual com selector: quantos re-renderizariam no mesmo cenário?

3. **Antipadrões de performance com Zustand:**
   - O que acontece se um componente fizer `const store = useGerenciaStore()`
     sem selector?
   - Como detectar esse problema no projeto?
   - Como corrigir?

4. **Quando NÃO usar selector:**
   - Há casos onde selectors granulares demais prejudicam a legibilidade
     sem ganho real de performance?

### Restrições
- Baseie os exemplos nos stores reais do SPQC (`useGerenciaStore`, `useCampusStore`).
- Não modifique nenhum arquivo de código.

### Saída
`./spqc-frontend/_docs/analise-consolidada/Analise_Performance_Render.md`
```

**Por que esta persona?** Um Performance Engineer pensa em *"como provar e medir o impacto?"* — perspectiva de evidência empírica.

---

## Prompt 4 — Persona: Arquiteto de Software (Próximos Passos)

**Título sugerido:** `Roadmap_Finalizacao_Migracao_SPQC.md`

**Situação que justifica:**
A migração está na **Etapa 2** (stores Zustand + shims de compatibilidade). A **Etapa 3** seria remover os shims e atualizar os imports. Mas quando fazer isso? Em que ordem? Quais são os riscos? Um arquiteto pode criar um roadmap de finalização seguro.

```markdown
## Prompt Arquiteto de Software — Roadmap para Finalizar a Migração Zustand no SPQC

### Persona
Aja como um Arquiteto de Software especialista em migração incremental de sistemas
legados. Você pensa em termos de risco, impacto e sequência de execução.
Você não apenas lista o que fazer, mas explica em que ordem fazer e por quê.

### Contexto
O SPQC está na Etapa 2 da migração Context API → Zustand:
- Zustand stores estão implementados para todos os domínios (10 stores em `src/stores/`)
- Shims de compatibilidade existem em `src/contexts/` (4 linhas cada)
- Componentes ainda importam via caminho antigo (`contexts/NomeContext`)
- App.jsx já não tem Providers de domínio

A Etapa 3 seria remover os shims e atualizar os imports direto para as stores.

### Missão
Gere um **Roadmap de Finalização** contendo:

1. **Inventário de dependências:** Para cada shim em `src/contexts/`, liste
   quantos componentes ainda importam dele. (Analise os arquivos .jsx do projeto)

2. **Ordem de migração recomendada:** Qual domínio migrar primeiro?
   (sugestão: começar pelos com menos dependências)

3. **Procedimento de migração por domínio:**
   Passo a passo para migrar `GerenciaContext` → import direto de `useGerenciaStore`
   sem quebrar nada.

4. **Critérios de "Pronto":** Como a equipe sabe que um domínio foi completamente
   migrado e o shim pode ser removido?

5. **Riscos e mitigações:**
   - O que pode quebrar durante a migração?
   - Como o shim protege contra quebras acidentais?

### Restrições
- Não modifique nenhum arquivo de código.
- Baseie o inventário nos arquivos reais do projeto.

### Saída
`./spqc-frontend/_docs/analise-consolidada/Roadmap_Finalizacao_Migracao.md`
```

**Por que esta persona?** Um Arquiteto pensa em *"qual é o próximo passo seguro?"* — perspectiva de continuidade e gestão de risco da migração.

---

## Resumo das Propostas

| # | Persona | Documento Gerado | Pergunta Central |
|---|---|---|---|
| 1 | QA Engineer | `Estrategia_Testes_Zustand.md` | Como testar o que foi migrado? |
| 2 | Tech Lead | `Checklist_Code_Review_Zustand.md` | Como manter o padrão em novos stores? |
| 3 | Performance Engineer | `Analise_Performance_Render.md` | Como medir e provar o ganho? |
| 4 | Arquiteto de Software | `Roadmap_Finalizacao_Migracao.md` | Qual é o próximo passo seguro? |

> **Sugestão de prioridade:** Comece pelo Prompt 4 (Roadmap) — ele define o que precisa ser feito para terminar o que foi começado. Depois o Prompt 2 (Code Review) — garante que novos contribuidores não quebrem o padrão estabelecido.

---

*Documento gerado em 26/03/2026 — projeto SPQC.*
