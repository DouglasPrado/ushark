# M02 — D03/D19: identidade, merge e apresentação

Status: ACCEPTED para o contrato M02/S03 em 2026-09-14.

## D03 — Correção de identidade

`Content.id` é imutável. Identificar um conteúdo local como um conteúdo externo já conhecido é uma operação explícita de merge, nunca um rename silencioso de PK.

O ID canônico é o destino. A mesma transação move memberships, sources e estado pessoal e só então remove o registro local. Se ambos existirem:

- favorito usa união lógica;
- progresso conserva o maior valor conhecido;
- histórico e preferências usam união estável sem duplicatas;
- memberships e sources são deduplicadas por ID;
- o override do destino é mantido e um override divergente da origem é preservado em `preservedOverrides`;
- IDs externos incompatíveis geram `IDENTITY_CONFLICT` e exigem nova decisão, sem mutação parcial.

Falha intermediária reverte toda a operação. Retry usa a mesma `idempotencyKey` e não duplica relações.

## D19 — Precedência de apresentação

O título exibido em uma biblioteca segue:

1. `MovieMembership.titleOverride` daquela biblioteca;
2. metadata canônica/local atual do `Content`;
3. fallback explícito da UI para dado ausente.

Refresh do provider atualiza somente campos pertencentes ao provider. Não altera identidade, estado pessoal, sources nem overrides. Metadata customizada global não é introduzida por M02; quando existir, será uma camada distinta de override de biblioteca.

Escolha/viabilidade de source continua separada da metadata e da apresentação. Ausência de source é `sources: []`; source declarada, disponível, ausente, indisponível ou com erro usa `MovieSource.availability`, sem fabricar Health ou disponibilidade de arquivo.

## Segurança

O renderer solicita exclusão por `contentId`/`sourceId` e `confirm: true`. Somente o Core resolve o path interno registrado e confirma que ele pertence a uma raiz gerenciada. Paths arbitrários não fazem parte do contrato IPC.
