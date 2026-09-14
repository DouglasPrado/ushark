# Checkpoint funcional — M02

Status: READY_FOR_REVIEW. Decisão humana: PENDING.

## Pré-condições e integrações reais

UX M01–M22 aprovada, M01 integrado e S03–S05 concluídas. Persistência local, adapter TMDB, metadata/cache/assets e boundary Electron reais; browser mantém mock deliberado. Perfil e arquivos temporários dedicados usados nos ensaios.

## Jornada para revisar

1. Criar filme manual e por provider real, guardar IDs e associar múltiplas sources declaradas sem alegar resolução torrent.
2. Favoritar, corrigir identificação e testar merge com destino já existente; comparar sources/memberships/progresso/histórico/overrides antes e depois.
3. Fechar/reabrir; conferir ordem, relações, favorito, metadata, posters e backdrops offline.
4. Indisponibilizar provider: navegar catálogo local e cadastrar manualmente; restaurar provider e atualizar metadata sem mudar identidade/override.
5. Remover última source mantendo Content; remover membership mantendo arquivo e estado pessoal; confirmar delete somente do arquivo temporário dedicado. Cancelamento/falha não apagam silenciosamente.
6. Injetar falha em transação, merge e migração; comprovar rollback/recuperação; validar fresh e upgrade histórico.
7. Verificar imagens dimensionadas/progressivas, fronteiras IPC/path e navegação na plataforma alvo; registrar medições reais e limites.

## Evidências e decisão

[Validação S03–S05](evidence/INTEGRATION_VALIDATION.md): 49/49 testes afetados, Electron offline/restart, boundaries, migrations, merge/rollback, cache e segurança passaram localmente.

Pendências para decisão completa: configurar `USHARK_TMDB_TOKEN` e executar smoke real de busca/refresh/assets; executar os itens aplicáveis em Windows/TV/controle físico; confirmar a jornada humana. CI/review/merge continuam separados. Aprovação humana PENDENTE; só após aceite iniciar S06. Não encerrar M02 antes de S08.
