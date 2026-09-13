# S00 — contrato da experiência

Implementação autorizada pelo usuário: EXECUTE_MILESTONE M01. Escopo atual S00–S02, até checkpoint UX. Propostas abaixo aguardam validação visual.

Fluxo: /onboarding (boas-vindas → biblioteca → cache → preferências) → /home (vazia). /settings permite editar preferências e retornar. B/Escape fecha modal primeiro, volta etapa preservando rascunho ou volta à Home. Na primeira etapa permanece com saída de janela disponível. Teclado Tab/Enter e setas de navegação, gamepad A/B/D-pad/analógico. Campos usam teclado nativo; escolha de pastas é mockada com opções focáveis.

| Campo | Default proposto | Validação |
|---|---|---|
| Nome da biblioteca | Minha biblioteca | Obrigatório; até 80 caracteres |
| Biblioteca | C:\TorrentStream\Library | Obrigatória; mock simula seletor/inacessível |
| Cache | C:\TorrentStream\Cache | Obrigatória; distinta da biblioteca |
| Limite | 100 GB | Número inteiro entre 1 e 10000 (UX, não quota real) |
| Estratégia | Equilíbrio | Qualidade / equilíbrio / início rápido |
| Resolução | 4K | 720p / 1080p / 4K |
| Áudio / legenda | Português / Português | Português / English; legenda também desligada |
| Seleção automática / preflight foco | Ativos | Booleano |
| Auto-switch / autoplay / preflight próximo | Desativados | Booleano |
| Desconexão Moonlight | Pausar | Pausar / continuar; preferência sem integração |
| Limpeza automática / reter parciais | Ativos | Booleano |

Estados: pronto, salvando, sucesso, loading, offline, degraded, erro recuperável. Simulador dev oferece normal/loading/offline/erro ao salvar/pasta inacessível/degraded. Nada salva em disco; reiniciar volta ao onboarding. Reset restaura apenas preferências de reprodução, não paths/cache/biblioteca ou dados pessoais das fixtures.

Direção visual: interface de sala escura, tipografia grande, accent verde-lima, hierarquia de passos e um CTA principal. Sem imagens externas. Safe areas e escala em 1080p/1440p/4K. Focus ring sempre visível; modais Radix prendem e restauram foco.

Validação local: macOS, Node 26.8.1; testes Chromium/Electron conforme disponibilidade. Corpus: biblioteca vazia, rascunho, fixture pessoal protegida e cenários de falha. Medir setas/rota local <100ms em amostras automatizadas como evidência local, não certificação Windows/TV. Windows x64, gamepad físico e TV real permanecem validações manuais pendentes.

Referências: A11 §§3–26/53–64/69–84, A09 §§5–13/89–95/107–133, A08 §21; UJ01/22/62/79/80. Defaults são propostas; limites de filesystem/persistência definitivos só S03.
