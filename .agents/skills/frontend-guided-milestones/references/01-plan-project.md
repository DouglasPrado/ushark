# PLAN_PROJECT — Do PRD ao mapa de milestones

Use este modo quando o projeto ainda não possui um mapa de milestones confiável.

## Processo

1. Descobrir a documentação de produto relevante.
2. Extrair requisitos funcionais, jornadas, regras e restrições.
3. Atribuir IDs estáveis aos requisitos quando o PRD ainda não os possui.
4. Agrupar requisitos em capacidades de produto.
5. Transformar capacidades em milestones verticais.
6. Identificar dependências entre milestones.
7. Ordenar milestones por dependência e valor de produto.
8. Criar uma matriz `requisito → milestone`.
9. Auditar cobertura.
10. Criar `docs/milestones/` e `docs/execution/`.

## Invariantes

- Todo requisito executável deve estar coberto por pelo menos um milestone.
- Evite duplicar ownership de um requisito entre milestones; quando necessário, indique milestone primário e dependência.
- Um milestone não deve ser uma camada técnica isolada.
- Não detalhe todas as stories do projeto no planejamento macro.
- Detalhe somente o milestone que será executado em seguida.

## Relatório de cobertura esperado

```text
Requirements discovered: 142
Mapped:                 142
Orphan:                   0
Duplicate ownership:      0
Milestones:              12
Dependency cycles:        0
```

Se houver órfãos, duplicidades indevidas ou ciclos de dependência, o plano ainda não está pronto.
