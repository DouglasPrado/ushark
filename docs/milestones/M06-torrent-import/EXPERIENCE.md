# M06 — Experiência frontend

S00 concluída. Wizard modal «Importar source» acessível em Filmes/Séries, com Dialog/Button/navegação existentes. Source simulada compartilhada por infoHash, selectors separados por arquivo/conteúdo. Sem leitura de arquivo do usuário, bencode, rede ou daemon.

Entrada magnet validada (scheme, xt BTIH hex/base32, limite provisório de prévia 4096 caracteres) ou seleção de .torrent sintético em fixtures. Não apresentar seleção como leitura real. Metadata sintética: nome, hash, arquivos/tamanhos e inferência de título/ano/qualidade/codec quando disponível; pieces desconhecidas permanecem desconhecidas. Entrada inválida → erro e correção; resolvendo → cancelar invalida evento tardio; sucesso → revisão; sem peers/timeout/daemon/offline → salvar pendente ou retry explícito. Pendências deduplicadas em memória podem ser reabertas. Sem retry automático offline.

Revisão: escolher vídeos; samples/extras não são selecionados automaticamente. Ambiguidade exige escolha explícita. Paths hostis/bencode inválido → rejeição de fixture, sem efeitos no catálogo. Somente confirmar escreve no catálogo M02/M03 em memória. Cancelar não cria conteúdo/source. Retry/duplo clique não duplicam vínculos; falhas preservam rascunho. Escape/B fecha camada e devolve foco ao gatilho.

FR-009–016/029–033/044/210: wizard, metadata, pendência/retry, seleção/dedup. NFR-083/086–088/139/151 e RX-016–019/051: estados simulados/boundary; isolamento/processos/IPC/parser/hashes binários continuam S03–S08. D05/D08/D22 e limites definitivos adiados. UX final PENDING; hardware Windows/TV/controle físico e integrações pendentes.
