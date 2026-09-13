# TorrentStream — Architecture 09: UX & Navigation Specification

**Status:** Draft v1  
**Produto:** TorrentStream  
**Documento:** UX / Interaction Architecture  
**Dependências:**  
- `01-prd-master.md`
- `02-user-journeys.md`
- `03-functional-requirements.md`
- `04-non-functional-requirements.md`
- `docs/architecture/01-library-manifest.md`
- `docs/architecture/02-torrent-streaming-engine.md`
- `docs/architecture/03-health-score-source-selection.md`
- `docs/architecture/04-playback-mpv-sunshine.md`
- `docs/architecture/05-shared-libraries-sync.md`
- `docs/architecture/06-data-model.md`
- `docs/architecture/07-ipc-contracts.md`
- `docs/architecture/08-security-model.md`

---

# 1. Objetivo

Este documento define a experiência de navegação do TorrentStream.

A interface deve funcionar igualmente bem em:

```text
Desktop
TV via Sunshine/Moonlight
```

Porém o princípio de design principal será:

> **Gamepad-first e TV-first.**

O usuário deve conseguir realizar as tarefas essenciais sem mouse ou teclado.

---

# 2. Princípios de UX

A experiência deve seguir:

```text
1. Foco sempre visível.
2. Navegação previsível.
3. Nenhuma tela sem saída clara.
4. Feedback imediato para toda ação.
5. Loading não bloqueia navegação quando não for necessário.
6. Complexidade do torrent fica escondida.
7. Erros possuem ação de recuperação.
8. Voltar sempre restaura contexto.
9. Nenhuma ação principal depende de hover.
10. A TV nunca deve parecer um desktop remoto.
```

---

# 3. Estrutura principal

Navegação de alto nível:

```text
Home
Filmes
Séries
Bibliotecas
Downloads
Busca
Configurações
```

Em TV, pode existir barra superior/lateral com essas áreas.

---

# 4. Shell da aplicação

Estrutura conceitual:

```text
┌──────────────────────────────────────────────┐
│ TorrentStream      Home Filmes Séries ...   │
├──────────────────────────────────────────────┤
│                                              │
│                 SCREEN CONTENT               │
│                                              │
└──────────────────────────────────────────────┘
```

---

# 5. TV Mode

Em TV mode:

- fullscreen;
- sem window chrome;
- foco inicial automático;
- cursor do mouse ocultável;
- sem elementos pequenos;
- sem menus de sistema expostos;
- navegação por controle obrigatória.

---

# 6. Desktop Mode

Pode oferecer:

- mouse;
- teclado;
- windowed mode;
- atalhos adicionais.

Mas o mesmo componente deve continuar funcional via gamepad.

---

# 7. Gamepad Mapping

Mapa inicial:

```text
D-pad / Left Stick
Mover foco

A
Selecionar / confirmar

B
Voltar / fechar

X
Ação secundária

Y
Ações rápidas / áudio-legenda no player

LB
Anterior / seek backward

RB
Próximo / seek forward

Start
Menu / opções

View / Select
Informações técnicas
```

---

# 8. Regra do botão B

`B` deve ter comportamento consistente:

```text
Modal → fechar modal

Overlay → fechar overlay

Details → voltar à lista

Player → sair para Details

Screen → voltar à anterior
```

Nunca executar ação destrutiva diretamente.

---

# 9. Focus Model

Todo elemento interativo deve possuir:

```text
focusable
focus state
navigation neighbors
disabled state
```

---

# 10. Focus State

Elemento focado deve ter contraste claro.

Pode usar:

- escala;
- borda;
- brilho;
- mudança de background;
- metadata contextual.

Nunca depender apenas de cor.

---

# 11. Spatial Navigation

Navegação deve ser espacial e determinística.

Exemplo em carrossel:

```text
← item anterior
→ próximo item
↑ seção anterior
↓ seção seguinte
```

---

# 12. Focus Graph

Para telas complexas, definir grafo de foco explicitamente.

Evitar depender apenas de ordem DOM.

---

# 13. Focus Restoration

Ao abrir Details a partir de um card:

```text
card A
↓
Details
↓
B
↓
card A novamente
```

Também preservar:

```text
scroll position
section position
selected tab
```

---

# 14. Home

Estrutura recomendada:

```text
Hero

Continuar assistindo

Minha Biblioteca

Filmes

Séries

Bibliotecas compartilhadas

Adicionados recentemente
```

Sections devem ser configuráveis no futuro.

---

# 15. Hero

Hero deve destacar um item por vez.

Elementos:

- backdrop;
- título;
- descrição curta;
- metadata;
- botão Assistir;
- Health opcional;
- origem/biblioteca opcional.

---

# 16. Hero Focus

Ao entrar na Home:

```text
focus inicial
→ CTA principal do Hero
```

ou primeiro card de Continuar Assistindo, conforme preferência futura.

---

# 17. Hero Rotation

Se houver rotação automática:

- não mudar enquanto o usuário estiver interagindo;
- pausar ao ganhar foco;
- nunca mover foco automaticamente.

---

# 18. Continue Watching

Cards devem mostrar:

- poster/backdrop;
- progresso;
- tempo restante;
- episódio, se série.

Ação principal:

```text
Continuar
```

---

# 19. Continue Watching Focus

Ao focar, pode mostrar:

```text
Continuar de 01:02:17
```

---

# 20. Grid/Card Layout

Cards devem ter proporção consistente.

Tipos:

```text
poster
landscape
square
```

Uso inicial:

```text
poster
```

para filmes/séries.

---

# 21. Card Information Density

Card padrão não deve ficar sobrecarregado.

Default:

```text
poster
title
small metadata
health summary opcional
```

Detalhes completos ficam em Details.

---

# 22. Card Focus Expansion

Ao focar:

- mostrar título completo;
- quality badge;
- health bars;
- progresso;
- talvez pequeno scale-up.

---

# 23. Lazy Health

Cards não focados não precisam probe atual.

Ao focar:

```text
Health probe low/normal priority
```

pode iniciar.

---

# 24. Scroll Behavior

Carrosséis horizontais:

- foco deve permanecer confortável no viewport;
- movimento deve antecipar próximo item;
- animação curta.

---

# 25. Large Grid

Para milhares de itens:

```text
virtualized rendering
```

Navegação não deve perder posição ao reciclar elementos.

---

# 26. Filmes

Tela de Filmes:

```text
Todos
Recentes
Favoritos
Gêneros
Collections
```

Filtros podem existir como barra superior.

---

# 27. Séries

Tela de Séries:

```text
Continuar
Todas
Recentes
Favoritas
```

---

# 28. Library Screen

Bibliotecas:

```text
Minha Biblioteca

Compartilhado por Douglas

Sci-Fi Brasil

[ + Adicionar biblioteca ]
```

---

# 29. Shared Library Card

Mostrar:

- nome;
- avatar/logo;
- descrição curta;
- quantidade aproximada;
- update status.

---

# 30. Enter Shared Library

Ao entrar:

```text
identity/hero
↓
author-defined sections
```

Preservar exatamente a ordem publicada.

---

# 31. Shared Library Badge

UI pode exibir:

```text
Compartilhado
```

de forma discreta.

---

# 32. Details Screen

Estrutura:

```text
Backdrop

Title
Metadata
Description

Health

[ Assistir ]
[ Fontes ]
[ Favorito ]
[ Mais ]

Sections extras
```

---

# 33. Details Initial Render

Mostrar imediatamente dados locais.

Health pode aparecer como:

```text
◌ Medindo...
```

e atualizar depois.

---

# 34. Details Focus Order

Exemplo:

```text
Assistir
↓
Fontes
↓
Favorito
↓
Mais
↓
conteúdo relacionado
```

Horizontalmente, ações ficam em row.

---

# 35. Play CTA

Principal CTA.

Pode exibir:

```text
Assistir
```

ou:

```text
Continuar
```

---

# 36. Play Feedback

Ao pressionar:

```text
estado muda em <250ms
```

Exemplo:

```text
Preparando...
```

Não deixar botão aparentemente sem resposta.

---

# 37. Playback Prepare Screen

Pode ser overlay simples:

```text
Preparando reprodução...

Conectando à fonte
████░ Muito bom
```

Sem bloquear cancelamento.

---

# 38. Cancel Prepare

`B` deve permitir cancelar enquanto seguro.

---

# 39. Source Screen

Exemplo:

```text
Fontes

RECOMENDADA
4K HEVC
28 GB
█████ Excelente
Pronto em ~1s

4K Remux
72 GB
██░░░ Instável

1080p
12 GB
█████ Excelente
```

---

# 40. Source Ordering

Default:

```text
recommended
↓
remaining candidates
```

---

# 41. Source Selection

Selecionar manualmente deve:

- aplicar local override;
- mostrar feedback;
- permitir remover override.

---

# 42. Local Override Badge

Exemplo:

```text
Sua preferência
```

---

# 43. Health UI

Default:

```text
█████ Excelente
```

Opcional:

```text
Pronto em ~1s
```

Não mostrar detalhes como peers/ratio na UI principal.

---

# 44. Health States

```text
Medindo...
Excelente
Muito bom
Bom
Instável
Ruim
Indisponível
Offline
```

---

# 45. Health Degradation

Durante playback, evitar alarmar o usuário por oscilação pequena.

Mostrar mensagem somente se ação for necessária.

---

# 46. Search

Busca deve abrir com foco no campo.

Em TV, teclado virtual pode depender do Moonlight/OS.

Também suportar teclado físico.

---

# 47. Search Results

Resultados aparecem progressivamente.

Cada resultado mostra:

- poster;
- título;
- tipo;
- membership opcional.

---

# 48. Search Membership

Exemplo:

```text
Presente em:
Minha Biblioteca
Compartilhado por Douglas
```

Pode ficar em Details para evitar poluição.

---

# 49. Empty Search

```text
Nenhum resultado encontrado.
```

Sem tela quebrada.

---

# 50. Downloads Screen

Cada item:

```text
Poster
Title
Progress
Speed
Peers
Status
```

---

# 51. Download Actions

Ao focar:

```text
Pausar
Retomar
Cancelar
Abrir
```

---

# 52. Cancel Download

Se apagar dados:

```text
confirm modal
```

---

# 53. Empty Downloads

```text
Nenhum download ativo.
```

---

# 54. Player Surface

Durante playback, foco visual deve ser no vídeo.

Overlay oculto por default após timeout.

---

# 55. Player Overlay

Elementos:

```text
Title
Episode info
Progress bar
Current time
Duration
Playback controls
Audio
Subtitles
Source
Info
```

---

# 56. Player Overlay Entry

Qualquer input relevante pode mostrar overlay.

---

# 57. Overlay Timeout

Exemplo:

```text
3–5s
```

Sem interação.

---

# 58. Pause Overlay

Quando pausado:

```text
overlay permanece
```

---

# 59. Player Focus

Ao abrir overlay:

```text
focus default
→ Play/Pause
```

ou último controle usado.

---

# 60. Seek UX

Tap:

```text
±10s
```

Hold:

```text
acelera incrementos
```

---

# 61. Seek Preview

Pode mostrar:

```text
01:22:30
```

e thumbnail futura.

Thumbnail preview não é obrigatório na v1.

---

# 62. Seek Buffering

Se nova região ainda não está pronta:

```text
Bufferizando...
```

sem mostrar desktop.

---

# 63. Audio Menu

Lista:

```text
Português 5.1
English TrueHD 7.1
```

Track atual marcado.

---

# 64. Subtitle Menu

Lista:

```text
Desativada
Português
English
```

---

# 65. Source Menu During Playback

Pode mostrar source atual e alternativas.

Troca manual deve explicar que pode haver pequena interrupção.

---

# 66. Technical Info

Área avançada:

```text
Source
Health
Ratio
Peers
Buffer
Codec
Resolution
Decoder
FPS
```

---

# 67. Next Episode

Perto do fim:

```text
Próximo episódio em 10s

[ Assistir agora ]
[ Cancelar ]
```

---

# 68. Next Episode Focus

Default:

```text
Assistir agora
```

mas countdown não deve impedir Cancelar.

---

# 69. Credits Handling

Autoplay threshold pode ser configurável futuramente.

---

# 70. Exit Player

`B`:

```text
save progress
↓
close player
↓
return to Details
```

---

# 71. Player Exit Confirmation

Não exigir confirmação para saída normal.

---

# 72. Source Fallback UX

Se automático:

```text
Fonte alterada para manter reprodução estável
```

toast discreto.

---

# 73. Manual Fallback Mode

```text
Uma fonte mais estável está disponível.

[ Trocar ]
[ Continuar ]
```

---

# 74. Error Screen — Playback

```text
Não foi possível iniciar a reprodução.

[ Tentar novamente ]
[ Trocar fonte ]
[ Voltar ]
```

---

# 75. Error Screen — Source

```text
Esta fonte está indisponível no momento.
```

Se alternativa:

```text
Encontramos outra versão.

[ Usar alternativa ]
```

---

# 76. Error Screen — Offline

```text
Você está offline.

Conteúdos disponíveis localmente continuam funcionando.
```

---

# 77. Offline Indicator

Pequeno indicador global.

Não usar modal recorrente.

---

# 78. Library Import Flow

```text
Adicionar biblioteca
↓
Arquivo / Link
↓
Validando
↓
Preview
↓
Confirmar
↓
Instalando
↓
Abrir biblioteca
```

---

# 79. Import Preview

Mostrar:

```text
Name
Author
Version
Items
Sections
Signature state
```

---

# 80. Signature UI

Estados:

```text
✓ Assinatura válida
Biblioteca não assinada
Assinatura inválida
Identidade alterada
```

---

# 81. Invalid Signature

Bloquear import/update.

A ação principal deve ser:

```text
Voltar
```

Não oferecer "ignorar" por default.

---

# 82. Library Update UI

Background update pode gerar toast:

```text
Compartilhado por Douglas foi atualizado.
```

---

# 83. Update Details

Opcional:

```text
+ 3 filmes
+ 1 série
```

---

# 84. Update Failure

```text
Não foi possível atualizar.

A versão anterior continua disponível.
```

---

# 85. Create Shared Library

Flow:

```text
Bibliotecas
↓
Criar
↓
Nome/Descrição
↓
Appearance
↓
Contents
↓
Sections
↓
Preview
↓
Publish/Export
```

---

# 86. Shared Library Editor

Pode ser mais desktop-oriented, mas ainda deve funcionar com teclado/mouse e manter semântica consistente.

TV mode pode tornar edição avançada secundária.

---

# 87. Preview As Subscriber

Ação obrigatória:

```text
Visualizar como assinante
```

---

# 88. Publish Confirmation

```text
Publicar v15?

Esta versão será imutável.
```

---

# 89. Settings

Seções:

```text
Playback
Quality
Cache
Downloads
TV / Moonlight
Libraries
Advanced
About
```

---

# 90. Playback Settings

```text
Strategy
Max Resolution
Auto Fallback
Auto Switch
Autoplay
Audio Language
Subtitle Language
Subtitle Policy
```

---

# 91. Cache Settings

```text
Cache Path
Max Size
Auto Cleanup
Retention Behavior
```

---

# 92. TV Settings

```text
Start Fullscreen
Pause on Disconnect
Controller Hints
```

---

# 93. Advanced Settings

```text
Diagnostics
Logs
Health details
Torrent limits
Developer options
```

---

# 94. Onboarding

Fluxo curto.

```text
Welcome
↓
Library folder
↓
Cache folder
↓
Playback preference
↓
Sunshine setup
↓
Home
```

---

# 95. Onboarding Skip

Algumas etapas podem ter default.

Não bloquear por configuração não essencial.

---

# 96. First Empty Home

```text
Sua biblioteca está vazia.

[ Adicionar torrent ]
[ Adicionar magnet ]
[ Importar biblioteca ]
```

---

# 97. Loading States

Padrões:

```text
skeleton
spinner
inline progress
status text
```

Escolher conforme contexto.

---

# 98. Skeleton

Usar para:

- cards;
- posters;
- library sections.

---

# 99. Spinner

Evitar em grandes áreas por longos períodos.

Usar para operações pontuais.

---

# 100. Inline Progress

Bom para:

```text
downloads
sync
import
```

---

# 101. Background Work

Não bloquear interface para:

- metadata refresh;
- health probes;
- library sync;
- indexing;
- cache cleanup.

---

# 102. Global Busy State

Evitar.

Somente operações realmente exclusivas devem bloquear.

---

# 103. Notifications

Tipos:

```text
toast
banner
modal
```

---

# 104. Toast

Usar para:

- update concluído;
- source switched;
- favorite changed;
- download paused.

---

# 105. Banner

Usar para:

- offline;
- degraded service;
- storage warning.

---

# 106. Modal

Usar apenas para:

- destructive confirmation;
- security identity change;
- irreversible publish;
- critical decisions.

---

# 107. Modal Focus

Focus trap obrigatório.

Ao fechar, retorna ao elemento que abriu.

---

# 108. Destructive Actions

Botão destrutivo deve ter:

- texto explícito;
- confirmação;
- informação do efeito.

---

# 109. Remove vs Delete

Sempre diferenciar:

```text
Remover da biblioteca
```

de:

```text
Apagar arquivo do disco
```

---

# 110. Unsubscribe Modal

```text
Remover "Compartilhado por Douglas"?

Seu progresso, favoritos e conteúdos salvos serão mantidos.
```

---

# 111. Accessibility

Não depender apenas de:

- cor;
- hover;
- animação.

---

# 112. Typography

TV exige tamanho maior que desktop tradicional.

Especificação visual final fica para design system, mas deve priorizar leitura a distância.

---

# 113. Contrast

Focus e textos devem manter contraste adequado.

---

# 114. Reduced Motion

Suportar futura preferência de animação reduzida.

---

# 115. Safe Area

Elementos importantes não ficam colados à borda.

---

# 116. Overscan

Considerar TVs antigas/overscan como fallback.

---

# 117. Resolution Scaling

UI deve funcionar em:

```text
1080p
1440p
4K
```

sem ficar pequena demais.

---

# 118. Responsive TV Layout

Escala visual deve considerar densidade física, não apenas pixel count.

---

# 119. Image Fallback

Poster ausente:

```text
placeholder consistente
```

---

# 120. Metadata Fallback

Descrição ausente não quebra layout.

---

# 121. Health Fallback

Sem score:

```text
Medindo...
```

ou:

```text
Não medido
```

---

# 122. Empty Sections

Não renderizar seção vazia, salvo caso editorial específico.

---

# 123. Persisted Navigation State

Pode preservar:

```text
last main screen
last library
last focused item
```

durante sessão.

---

# 124. App Restart

Default recomendado:

```text
Home
```

mas Continue Watching deve aparecer imediatamente.

---

# 125. Reconnect Moonlight

Se sessão do app continua:

```text
retornar ao estado atual
```

---

# 126. Controller Disconnected

Mostrar toast discreto:

```text
Controle desconectado
```

Se reconectar:

```text
Controle conectado
```

---

# 127. Keyboard Hints

Desktop pode mostrar shortcuts.

TV não deve poluir UI com hints permanentes.

---

# 128. Contextual Hints

Pode mostrar discretamente:

```text
A Selecionar
B Voltar
Y Opções
```

na parte inferior.

---

# 129. Hints Adaptativos

Exibir conforme input mais recente:

```text
gamepad
keyboard
mouse
```

---

# 130. Performance Perception

Se operação real demora:

```text
feedback em <250ms
```

para parecer responsiva.

---

# 131. Progressive Hydration

Tela deve aparecer por camadas:

```text
layout
↓
local metadata
↓
images
↓
health
↓
remote updates
```

---

# 132. No Layout Jump

Atualização de health/image não deve mover cards de forma incômoda.

Reservar espaço.

---

# 133. Focus During Hydration

Elemento focado não deve ser desmontado porque metadata chegou.

---

# 134. Error Recovery

Toda tela de erro deve oferecer pelo menos uma ação útil:

```text
Retry
Alternative
Back
Settings
```

---

# 135. Debug UX

Technical mode deve ser explicitamente avançado.

Usuário comum não precisa ver:

```text
infoHash
piece
tracker
DHT
```

---

# 136. Naming

Na UI usar:

```text
Fonte
Qualidade
Disponibilidade
```

em vez de termos BitTorrent quando possível.

---

# 137. "Torrent Health"

Pode ser label de produto se desejado, mas a interface normal pode simplesmente exibir:

```text
Qualidade da fonte
```

---

# 138. UX State Machines

## Details Health

```text
idle
↓
measuring
↓
ready
```

ou:

```text
unavailable
```

## Playback

```text
preparing
↓
buffering
↓
playing
↓
paused
↓
ended
```

## Sync

```text
checking
↓
downloading
↓
validating
↓
applying
↓
ready
```

---

# 139. Navigation State Machine

```text
Home
↓
Details
↓
Player
↓
Details
↓
Home
```

Outro caminho:

```text
Home
↓
Libraries
↓
Shared Library
↓
Details
↓
Player
```

---

# 140. Screen IDs

IDs conceituais:

```text
home
movies
series
libraries
library-details
content-details
sources
downloads
search
settings
player
diagnostics
```

---

# 141. Route State

Cada route deve possuir:

```text
route params
focus restore key
scroll state
```

---

# 142. Deep Link Route

Deep link nunca entra diretamente em player.

Pode abrir:

```text
import preview
library
content details
```

depois de validação.

---

# 143. Loading Library

Ao abrir shared library:

```text
local snapshot primeiro
```

não esperar update check.

---

# 144. Update While Browsing

Se library atualiza:

- não jogar usuário para Home;
- não mover foco inesperadamente;
- aplicar atualização preservando contexto quando possível.

---

# 145. Removed Focused Item

Se update remover item atualmente focado:

```text
focus nearest valid neighbor
```

e opcionalmente mostrar toast.

---

# 146. Playback During Library Update

Playback não deve ser interrompido por update de layout/manifest.

---

# 147. Source Removed During Playback

Runtime atual pode continuar até sessão terminar se já autorizado/localmente resolvido.

Próxima reprodução usa novo catálogo.

---

# 148. UX Performance Targets

```text
focus move         immediate / <100ms
screen transition  <100ms for local data
feedback           <250ms
cached poster      <50ms target
home visible       <300ms after UI ready
```

---

# 149. Acceptance Criteria — TV Navigation

Considerado funcional quando:

1. todas as funções essenciais funcionam via gamepad;
2. foco nunca desaparece;
3. B volta de forma previsível;
4. foco é restaurado ao retornar;
5. modais prendem foco;
6. listas grandes mantêm navegação;
7. nenhuma ação depende de hover;
8. desktop não aparece no fluxo normal.

---

# 150. Acceptance Criteria — Home/Details

Considerado funcional quando:

1. Home aparece usando dados locais;
2. Continue Watching funciona;
3. cards focados mostram estado;
4. Details aparece antes do Health finalizar;
5. Play responde imediatamente;
6. Sources podem ser abertas manualmente;
7. favorites são acessíveis;
8. library origin não confunde o usuário.

---

# 151. Acceptance Criteria — Player

Considerado funcional quando:

1. overlay funciona por controle;
2. pause/play funciona;
3. seek funciona;
4. áudio e legenda podem ser trocados;
5. B retorna para Details;
6. erro permite retry/fallback/back;
7. source switch possui feedback;
8. Next Episode funciona.

---

# 152. Acceptance Criteria — Async UX

Considerado funcional quando:

1. health probe não bloqueia navegação;
2. sync não bloqueia Home;
3. metadata loading não bloqueia layout;
4. indexing não bloqueia UI;
5. erro remoto não quebra biblioteca local;
6. loading possui feedback imediato.

---

# 153. Relação com Functional Requirements

Atende principalmente:

```text
FR-070–091
TV, Controle, Home e Details

FR-100–113
Health/Source UI

FR-116–132
Downloads e episódios

FR-133–167
Shared Libraries

FR-168–193
Search, settings e preferences
```

---

# 154. Relação com NFRs

Atende principalmente:

```text
NFR-005–017
Responsividade e bibliotecas grandes

NFR-118–130
Controle, legibilidade e hydration

NFR-145–159
Quality gates e performance
```

---

# 155. Decisões fechadas

```text
Primary UX
= TV-first

Primary Input
= gamepad

Focus
= explicit and persistent

B
= predictable back

Health
= simple bars + label

Details
= local-first + async health

Player
= overlay over video

Loading
= progressive, non-blocking

Shared Library
= author layout preserved

Desktop exposure
= avoid completely in TV flow
```

---

# 156. Próxima Etapa

Com a arquitetura de produto, dados, segurança, IPC e UX fechadas, a próxima camada deve ser:

```text
10-epics-and-milestones.md
```

Depois:

```text
milestones/
stories/
goal.md
```

A partir daí o projeto pode ser preparado para execução automatizada pelo Claude Code/Devflow.

---

# 157. Regra central

> **O usuário deve navegar como se estivesse em uma plataforma de streaming; torrent, processos, sync e runtime devem permanecer invisíveis até que uma informação técnica realmente seja necessária.**
