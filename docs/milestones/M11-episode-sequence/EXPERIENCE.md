# M11 — Experiência frontend

S00 concluída. Player resolve próxima identidade por catálogo M03, respeitando temporada/episódio e selector separado do pack. Especiais não entram implicitamente na sequência principal. Lacuna/sem source mostra episódio ausente; último episódio mostra fim de série; transição de temporada é explícita. Seleção local M08 fornece source do próximo.

A 30s do fim da fixture, prévia pode preparar o próximo com budget de um pedido; countdown só após término. Autoplay/preflight herdados de M01; desligar não inicia próximo. Countdown ilustrativo de 5s, tocar agora e cancelar. Cancelar em qualquer instante antes da troca invalida pedido/timer; Escape/B fecha camada antes de sair do player. Comando de início travado para evitar duplicata. Player remonta por id e posição/estado pessoal são independentes por episódio. Sair preserva contexto do catálogo.

Preflight falhou/rede indisponível → erro recuperável/retry, sem autoplay cego. Resolver ausência/end não recircula. Fixtures permitem simular fim sem esperar duração inteira, deixando claro que são prévias. D10/duração final/ordem de especiais e budgets reais permanecem UX/S03. FR-129–132/RX-029 representados; reutilização física da sessão/banda do atual não comprovadas. S03–S08 DEFERRED; UX PENDING adiada por instrução explícita.

Auditoria final: seleção automática desligada exige escolha explícita da fonte do próximo antes de preparar/iniciar; autoplay não atravessa essa escolha. Override válido permanece respeitado. Teste conectado M01/M08/M11 adicionado.
