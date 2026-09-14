# Checkpoint funcional — M03

Status: READY_FOR_REVIEW. Decisão humana: PENDING.

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

[Evidência S05](evidence/INTEGRATION_VALIDATION.md): caminho Electron real,
pack de temporada/especial, source compartilhada, selectors e legenda
independentes, arte persistida, restart, falha parcial recuperável e retry.
Suíte afetada M02/M03/M06 com runtimes reais: **86/86 passou**. Corpus de 50.000
episódios e índices constam em `evidence/BACKEND_S04_1.md`.

Pendências explícitas: TMDB ao vivo sem token, runtime torrent empacotado e
Windows/TV/controle/Moonlight físicos. Decisão humana continua `PENDING`; S06
não foi iniciado.
