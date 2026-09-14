# STATE.yaml e UPDATE.md

## STATE.yaml

É a fonte de verdade para máquinas/agentes. Deve ser pequeno, estável e atualizável.

Exemplo:

```yaml
project: example
status: running
current:
  milestone: M04
  phase: S04
  story: S04.2
milestones:
  M03: { status: done }
  M04:
    status: running
    stories:
      S00: done
      S01: done
      S02: done
      S03: done
      S04.1: done
      S04.2: running
      S04.3: pending
  M05: { status: pending }
```

No exemplo, `done` pressupõe que todos os gates exigidos pela política do projeto já passaram. Quando implementação local, CI, review, merge ou validação manual forem estados distintos, represente-os explicitamente e não antecipe `done`.

## UPDATE.md

É a visão humana. Deve responder rapidamente:

- onde estamos;
- o que terminou;
- o que está em execução;
- o que vem depois;
- bloqueios;
- status do UX;
- status funcional;
- validações recentes;
- conformidade/gates arquiteturais relevantes;
- distinção entre implementado, validado localmente, CI, review, merge e validação manual quando aplicável;
- decisões recentes.

Não transforme `UPDATE.md` em log cronológico infinito. Mantenha o estado atual e decisões relevantes.
