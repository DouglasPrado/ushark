# M03 — Contrato da experiência

S00 concluída em 2026-09-13 sob `EXECUTE_MILESTONE M03`. Direção proposta para revisão humana após S02; sem aceite UX implícito.

## Jornada e identidade

Home → Séries (`#/series`) → Adicionar série (`#/series/new`, diálogo) → escolher fonte de exemplo → revisar arquivos → corrigir pendências → confirmar → série (`#/series/:id`) → temporada (`#/series/:id/season/:number`) → episódio (diálogo). Início e Filmes acessíveis na navegação. Especial é temporada 0, com rótulo “Especiais”. Voltar da temporada restaura seu botão; voltar da série restaura o card; fechar diálogo restaura a origem. Escape/B fecha apenas a superfície atual. Tab/Enter, setas e A/B/D-pad usam navegação M01; campos numéricos usam teclado nativo, selects usam esquerda/direita no controle.

Série tem ID próprio; episódio é identificado dentro da série por temporada/número, independente de source/arquivo. Uma source compartilhada pode atender vários episódios; cada vínculo guarda arquivo escolhido, selector episódio/manual e legenda. Sem merge automático. Arquivo duplo nunca recebe dois episódios por inferência: usuário escolhe explicitamente um destino manual ou deixa para depois.

## Fixtures e campos

O estado inicial apresenta oito séries reais identificadas por IMDb ID, com metadata e artes locais empacotadas, cada uma acompanhada de duas temporadas e seis episódios de demonstração mockados. Quatro fontes declarativas da série fictícia “Entre Órbitas” continuam disponíveis para exercitar organização: episódio avulso, temporada 1 (8 episódios), várias temporadas (T1/T2 e especial), pack ambíguo (arquivo desconhecido, sugestão incorreta, colisão e S01E01E02). O mesmo ID de série permite adicionar fontes diferentes sem duplicar a série. Inspeção adicional: metadata ausente (título editável obrigatório), série sem fonte e corpus de 20.000 episódios. Nenhum arquivo real ou rede em runtime.

Título: obrigatório, trim, até 160 caracteres. Temporada: inteiro 0–999; episódio: inteiro 1–9999. Campo vazio ou inválido mantém pendência e mostra instrução. Legenda: sem legenda ou arquivo declarativo relacionado. Cada linha mostra nome do arquivo, destino, legenda e “Identificado”, “Corrigido”, “Não identificado”, “Revisão manual” ou “Conflito”. Restaurar sugestão afeta apenas a linha; “Deixar para depois” exclui explicitamente o vínculo daquela confirmação. Pelo menos um arquivo válido é necessário para confirmar. Fonte duplicada substitui seus vínculos após revisão explícita, preservando outras fontes e IDs de episódio.

## Estados, entradas e recuperação

| Estado / entrada | Saída / copy e recuperação |
|---|---|
| Lista vazia | “Sua próxima série começa aqui.” → Adicionar série |
| Lista carregada | Cards → série → temporadas → episódios |
| Loading / lento | “Abrindo suas séries…”; mudança de cenário invalida resposta antiga |
| Erro de lista | “Não foi possível abrir as séries.” → Tentar novamente; dados preservados |
| Offline / metadata indisponível | Banner de simulação; catálogo e título manual disponíveis |
| Avulso / season pack / multitemporada | Escolher exemplo; resumo por temporada expansível; revisar e confirmar |
| Sem metadata | “Título do episódio indisponível”; não inventar títulos ou poster |
| Desconhecido / duplo | “Escolha temporada e episódio ou deixe para depois”; confirmar bloqueado até escolha explícita |
| Colisão | “Dois arquivos apontam para o mesmo episódio”; corrigir destino ou deixar um para depois |
| Saving / sucesso | Bloquear repetição; “Salvando…” → série e anúncio “Série atualizada nesta sessão.” |
| Falha de salvar | “Não foi possível salvar. Seu rascunho foi mantido.”; desativar falha simulada e repetir |
| Cancelar | Catálogo inalterado, rascunho/expansões/filtro preservados em memória; reabrir retoma |
| Fonte duplicada | Avisar antes de confirmar que substitui somente associações da mesma fonte |
| Zero / uma / múltiplas fontes | Episódio mostra fontes e arquivo/legenda por vínculo; sem player |
| Coleção extensa | Temporadas e episódios paginados (20 por página), renderização limitada; voltar preserva página |

Filtro de pendências preserva linha durante sua edição até sair do filtro para evitar perda de foco. Mudança explícita de fixture substitui o rascunho e reinicia filtro/expansão; cancelar não o apaga. Falha/retry não muda campos. Grupos seguem a temporada sugerida originalmente para não remontar a linha durante edição; campos mostram o destino final. Detalhes do episódio permitem reabrir associações salvas sem perder correções. Confirmar com arquivos deixados para depois mantém o rascunho completo para retomada; sem pendências adiadas, limpa o rascunho. Dados e rascunhos duram somente nesta sessão do app.

## Cobertura e validação

FR-004/005: hierarquia e identidade em memória. FR-017/018: sugestões declarativas, sem inferência real. FR-206 e UJ55: correção isolada por arquivo. FR-020/RX-008: vínculo e legenda visíveis; persistência/selector definitivo, inspeção de torrent e prioridade adiados a M06/integração. UJ06 cobre resumo antes da confirmação. NFR-080: corpus 20.000 e paginação frontend; índices/persistência e medições reais adiados a S07. Confrontado com matriz e requisitos; não altera ownership.

Validar lint/typecheck/build, invariantes de colisão/idempotência/rascunho/resposta antiga, teclado e gamepad sintético, capturas 1920×1080, 2560×1440 e 3840×2160 e Electron no macOS. TV, Windows e gamepad físico devem permanecer explicitamente pendentes. S03–S08 adiadas pela onda frontend M01–M22.
