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
- decisões recentes.

Não transforme `UPDATE.md` em log cronológico infinito. Mantenha o estado atual e decisões relevantes.
