# Estrutura de repositório frontend-first

Use esta referência quando uma tarefa criar, mover ou revisar entrypoints, componentes, mocks, tipos ou packages. No Ushark, a fonte normativa é `docs/architecture/11-frontend-first-project-setup.md`, especialmente as seções 6–16, 26, 47–49 e 85–94.

## Estrutura inicial

```text
apps/desktop/src/
├── main/
├── preload/
└── renderer/

packages/
├── ui/
├── mocks/
│   ├── data/
│   ├── services/
│   └── scenarios/
└── types/
```

## Ownership

- `main`: janela, lifecycle, fullscreen e modo TV básico. Não recebe regra de produto, catálogo, player, banco ou torrent.
- `preload`: boundary mínima e explícita. Não expõe Node irrestrito; novas capacidades exigem fluxo aprovado e contrato versionado.
- `renderer`: telas, componentes específicos do app, navegação, foco/gamepad, estados visuais e interação.
- `packages/ui`: componentes visuais reutilizáveis e sem regra de produto.
- `packages/types`: contratos mínimos exigidos pela UI, sem detalhes prematuros de runtime, banco ou RPC.
- `packages/mocks/data`: fixtures determinísticas e realistas.
- `packages/mocks/services`: adapters em memória que implementam os boundaries consumidos pela UI.
- `packages/mocks/scenarios`: comportamento reutilizável de loading, falha, offline, lentidão e demais cenários.

## Imports e exports

- Consumidores usam `@ushark/ui`, `@ushark/types[/subpath]` e `@ushark/mocks[/subpath]` declarados em `package.json`.
- Não importe diretórios internos de `packages/*` por travessia relativa a partir do renderer ou dos testes.
- Imports relativos permanecem válidos dentro do mesmo package ou da mesma área do renderer.
- Cada workspace declara as dependências que consome; não dependa acidentalmente de resolução pelo package raiz.

## Crescimento progressivo

- Não crie `core`, `domain`, `database`, `contracts`, `torrentd`, `player` ou outros packages da arquitetura-alvo apenas para completar um diagrama.
- Crie um package somente quando houver responsabilidade clara e mais de um consumidor, ou quando isolamento técnico for necessário.
- Uma integração real substitui o mock atrás do mesmo contrato; ela não move regra privilegiada para o renderer.

## Gate de alteração estrutural

Ao reorganizar o frontend:

1. inventarie entrypoints, imports, aliases, testes e links documentais afetados;
2. mova os arquivos sem manter stubs no local antigo;
3. atualize exports e dependências dos workspaces;
4. valide ausência de imports diretos para diretórios internos de `packages/*`;
5. execute format, lint, typecheck, build, testes frontend e Electron aplicáveis;
6. sincronize evidências e hashes alterados, sem fabricar aprovação humana.
