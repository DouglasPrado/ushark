# PLAN_PROJECT — Do PRD ao mapa de milestones

Use este modo quando o projeto ainda não possui um mapa de milestones confiável.

## Processo

1. Descobrir a documentação de produto e arquitetura relevante.
2. Extrair requisitos funcionais, jornadas, regras e restrições.
3. Classificar a arquitetura entre decisões fechadas, obrigações, recomendações, exemplos e destino futuro.
4. Atribuir IDs estáveis aos requisitos quando o PRD ainda não os possui.
5. Agrupar requisitos em capacidades de produto.
6. Transformar capacidades em milestones verticais.
7. Identificar dependências de produto e arquitetura entre milestones.
8. Ordenar milestones por dependência e valor de produto.
9. Criar uma matriz `requisito → milestone` e um mapa `restrição arquitetural → milestone/story/gate`.
10. Auditar cobertura, conflitos e decisões ainda abertas.
11. Criar `docs/milestones/` e `docs/execution/`.

## Invariantes

- Todo requisito executável deve estar coberto por pelo menos um milestone.
- Evite duplicar ownership de um requisito entre milestones; quando necessário, indique milestone primário e dependência.
- Um milestone não deve ser uma camada técnica isolada.
- Não detalhe todas as stories do projeto no planejamento macro.
- Detalhe somente o milestone que será executado em seguida.
- Não converta cada tabela, DTO, threshold exemplificativo ou componente da arquitetura-alvo em requisito/story.
- Toda decisão arquitetural normativa aplicável deve ter owner, fase de materialização e forma futura de validação.
- Conflitos entre fontes devem ser registrados; não escolha silenciosamente a interpretação mais conveniente.

## Relatório de cobertura esperado

```text
Requirements discovered: 142
Mapped:                 142
Orphan:                   0
Duplicate ownership:      0
Milestones:              12
Dependency cycles:        0
Architecture constraints: 18
Unmapped constraints:      0
Open architecture decisions: 3
```

Se houver requisitos/constraints órfãos, duplicidades indevidas ou ciclos de dependência, o plano ainda não está pronto. Decisões abertas podem permanecer quando têm owner e momento explícitos e não tornam o próximo trabalho ambíguo.
