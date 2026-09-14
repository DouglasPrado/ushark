# Checkpoint funcional — M03

Status: NOT_STARTED — integração adiada. Decisão: PENDING.

## Pré-condições e integrações reais

UX M01–M22 aprovada; M02 e M06 integrados; S03–S05 concluídas. Persistência, provider, inspeção de arquivos e selectors reais no caminho principal, em perfil temporário dedicado.

## Jornada para revisar

1. Importar episódio avulso real de teste, confirmar identidade e reabrir após restart.
2. Importar season pack; conferir que uma source atende vários episódios com selectors independentes.
3. Importar pack multitemporada e especiais; comparar hierarquia e arquivos identificados.
4. Corrigir episódio não identificado e identificação errada; reabrir e conferir o mesmo `resolved_file_id` ou recuperação explícita se o arquivo mudou.
5. Exercitar colisão e arquivo de episódio duplo; confirmar que não há merge ou escolha automática indevida.
6. Indisponibilizar provider e metadata parcial; revisar/cadastrar, reiniciar offline e restaurar provider sem trocar identidade ou mapping.
7. Injetar falha transacional, retry e duplicata da mesma source; comprovar rollback/idempotência.
8. Validar paginação/índices com corpus grande e registrar medições; conferir fronteiras IPC/path e navegação na plataforma alvo.

## Evidências e decisão

PENDENTES: versões/ambiente, corpus, arquivos de teste, comandos, banco após restart, falhas exercitadas e resultados. Critérios: persistência real, ausência de mock no caminho principal, identidade preservada, erros recuperáveis e escala medida. Aprovação humana PENDENTE; só após aceite iniciar S06.
