# M08 — Experiência frontend

S00 concluída. Detalhes em Filmes/Home/episódio exibem seleção de source reutilizável. Preflight simulado cancelável ao sair/suspender; medição não bloqueia Play. Seleção automática usa viabilidade, preferência, limite de resolução e source local; override viável permanece em memória por conteúdo e pode ser removido. Lista estável por id, recomendação indicada sem reordenar a lista/foco a cada medição.

Unknown/medindo não equivalem a indisponível. Health ready/degraded mostra 0–100, barra/label, confidence separado e ratio com Mbps em ambos os termos, startup estimado. Offline mantém local elegível e fontes remotas indisponíveis. Erro → retry; confiança baixa reduz certeza; 4K inviável não vence; origem inválida bloqueia; múltiplas origens preservadas. Preferências: equilíbrio, qualidade máxima, início rápido, menor tamanho e resolução máxima. Premissas mecânicas de fixture, pesos definitivos D06/D07/D09/D19 permanecem UX/S03.

Preflight/readiness/ranking e override atrás de SelectionPreview; mocks nunca alegam sondagem real. Escolha vai ao Player com sourceId/selector e modo local/progressivo; cancelar mantém escolha anterior. AutoSelect desabilitado exige escolha explícita. Preferências iniciais herdadas de M01; ajustes do detalhe são sessão local. Falta de source mostra vazio; não cria uma fonte automaticamente. Fixtures de comparação ficam explícitas em cenários.

FR-088/089/092–102/104–111/221/227 e NFR/RX listados na cobertura: manifestações visuais e transições. Runtime/throughput real/EMA/calibração/hardware e <10ms no hardware alvo não comprovados. S03–S08 adiadas; UX PENDING para revisão final por instrução do usuário.
