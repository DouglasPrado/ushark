# Ushark — Documento 03: Functional Requirements

**Status:** Draft v1  
**Produto:** Ushark\
**Documento:** Functional Requirements  
**Dependências:**  
- `01-prd-master.md`
- `02-user-journeys.md`

---

# 1. Objetivo

Este documento transforma o PRD e as User Journeys em requisitos funcionais verificáveis.

Cada requisito possui um identificador estável no formato:

```text
FR-XXX
```

Esses IDs deverão ser utilizados posteriormente em:

- épicos;
- milestones;
- stories;
- critérios de aceite;
- testes;
- documentação técnica;
- arquivos `goal.md`.

---

# 2. Convenções

## Prioridade

```text
P0 = essencial
P1 = importante
P2 = evolução
```

## Estados de implementação

```text
planned
in-progress
done
blocked
deprecated
```

## Tipos

```text
UI
DOMAIN
TORRENT
PLAYBACK
SHARING
DATA
SECURITY
SYSTEM
```

---

# 3. Biblioteca e Conteúdo

## FR-001 — Criar biblioteca local

**Prioridade:** P0  
**Tipo:** DOMAIN

O sistema deve permitir a criação de uma biblioteca local.

### Critérios de aceite

- deve existir um `libraryId`;
- deve existir nome;
- deve existir pasta associada;
- deve ser indexada localmente;
- deve poder existir mesmo sem conteúdo.

---

## FR-002 — Persistir biblioteca local

O sistema deve persistir bibliotecas entre reinicializações.

### Critérios de aceite

- fechar e reabrir o app não pode apagar a biblioteca;
- ordem das sections deve ser preservada;
- memberships devem ser preservadas.

---

## FR-003 — Suportar filmes

O sistema deve representar filmes como entidades independentes das sources.

### Critério principal

```text
Content != Torrent
```

---

## FR-004 — Suportar séries

O sistema deve representar séries com temporadas e episódios.

---

## FR-005 — Suportar episódios

Cada episódio deve possuir identidade independente.

---

## FR-006 — Suportar conteúdo sem provider externo

Conteúdo manual/local deve ser permitido.

Exemplo:

```text
movie:local:<id>
```

---

## FR-007 — Identidade estável de Content

Cada Content deve possuir identificador imutável.

---

## FR-008 — Deduplicar Content

Se o mesmo conteúdo aparecer em múltiplas bibliotecas, o sistema deve reutilizar a mesma entidade.

---

# 4. Importação de Torrent

## FR-009 — Importar arquivo `.torrent`

**Prioridade:** P0  
**Tipo:** TORRENT

O sistema deve permitir selecionar e importar arquivos `.torrent`.

---

## FR-010 — Importar magnet link

O sistema deve permitir adicionar magnet links.

---

## FR-011 — Resolver metadata do torrent

Após receber magnet ou torrent, o sistema deve obter:

- nome;
- infoHash;
- lista de arquivos;
- tamanhos;
- piece metadata quando disponível.

---

## FR-012 — Mostrar progresso de resolução

Enquanto metadata não estiver disponível, a UI deve mostrar estado intermediário.

---

## FR-013 — Salvar torrent pendente

Se metadata não estiver disponível, o usuário deve poder manter a source para nova tentativa futura.

---

# 5. Identificação de Conteúdo

## FR-014 — Detectar arquivos de vídeo

O sistema deve identificar arquivos de mídia por extensão e características.

---

## FR-015 — Ignorar samples

Arquivos pequenos identificados como sample não devem ser escolhidos automaticamente como mídia principal.

---

## FR-016 — Inferir filme pelo nome

O sistema deve tentar inferir:

- título;
- ano;
- qualidade;
- codec.

---

## FR-017 — Inferir série

O sistema deve identificar padrões como:

```text
S01E01
1x01
Season 01 Episode 01
```

---

## FR-018 — Mapear episódio automaticamente

Arquivos identificados como episódios devem ser vinculados ao episódio correspondente.

---

## FR-019 — Permitir correção manual

Toda identificação automática deve poder ser corrigida.

---

## FR-020 — Persistir selector

A associação entre source e arquivo deve ser persistida.

Selectors mínimos:

```text
largest-video
filename
episode
manual
```

---

# 6. Metadata

## FR-021 — Resolver metadata via TMDB

O sistema deve conseguir buscar metadata externa usando TMDB.

---

## FR-022 — Armazenar external IDs

Deve ser possível guardar IDs como:

```text
TMDB
IMDb
```

---

## FR-023 — Cachear metadata

Metadata resolvida deve ser salva localmente.

---

## FR-024 — Cachear posters

Posters devem ser persistidos localmente.

---

## FR-025 — Cachear backdrops

Backdrops devem ser persistidos localmente.

---

## FR-026 — Permitir metadata override

Bibliotecas podem sobrescrever dados de apresentação.

---

## FR-027 — Preservar metadata global

Overrides não devem alterar cadastro global do Content.

---

# 7. Sources

## FR-028 — Vincular múltiplas sources

Um Content pode possuir múltiplas sources.

---

## FR-029 — Source torrent

A v1 deve suportar source do tipo:

```text
torrent
```

---

## FR-030 — Source por magnet

Uma source pode referenciar magnet.

---

## FR-031 — Source por arquivo `.torrent`

Uma source pode referenciar um arquivo torrent local ou empacotado.

---

## FR-032 — Armazenar infoHash

Sempre que disponível, infoHash deve ser armazenado.

---

## FR-033 — Deduplicar sources por infoHash

Mesma source não deve criar runtimes redundantes.

---

## FR-034 — Remover source sem remover Content

Remover uma source não deve remover automaticamente o Content.

---

## FR-035 — Conteúdo sem source

O sistema deve permitir Content sem source reproduzível.

---

# 8. Qualidade da Source

## FR-036 — Armazenar metadata técnica

A source pode armazenar:

- resolução;
- codec de vídeo;
- codec de áudio;
- HDR;
- canais;
- tamanho;
- bitrate.

---

## FR-037 — Detectar metadata técnica real

Dados detectados localmente devem ter precedência sobre dados declarados.

---

# 9. Torrent Streaming

## FR-038 — Reproduzir antes do download completo

**Prioridade:** P0

O sistema deve permitir playback progressivo.

---

## FR-039 — Priorizar pieces próximos

O engine deve priorizar pieces necessários para o playback atual.

---

## FR-040 — Janela de prioridade

O engine deve suportar níveis de prioridade por distância do playback.

---

## FR-041 — Reagir a seek

Ao receber seek:

- prioridade antiga deve ser reduzida;
- nova região deve receber prioridade;
- buffer deve ser reconstruído.

---

## FR-042 — Prefetch inicial

O sistema deve suportar prefetch antes do Play.

---

## FR-043 — Prefetch de extremidades

Quando necessário, o sistema deve poder priorizar começo e fim do arquivo.

---

## FR-044 — Não bloquear UI

Operações torrent não devem bloquear navegação da interface.

---

# 10. Cache

## FR-045 — RAM cache

O sistema deve possuir cache quente em memória quando aplicável.

---

## FR-046 — Disk cache

O sistema deve suportar cache persistente em disco.

---

## FR-047 — Configurar pasta de cache

Usuário pode escolher diretório.

---

## FR-048 — Configurar limite de cache

Usuário pode definir tamanho máximo.

---

## FR-049 — Limpeza automática

O sistema deve conseguir liberar espaço automaticamente.

---

## FR-050 — Política LRU

Conteúdo elegível deve poder ser removido por política de uso recente.

---

## FR-051 — Proteger conteúdo ativo

Nunca limpar automaticamente:

- playback ativo;
- torrent ativo;
- conteúdo protegido;
- conteúdo marcado Keep.

---

# 11. Modos de Armazenamento

## FR-052 — Stream Only

O usuário deve poder assistir usando apenas cache temporário.

---

## FR-053 — Keep After Watching

Usuário pode manter arquivo depois de assistir.

---

## FR-054 — Download completo

Usuário pode solicitar download completo.

---

## FR-055 — Alterar modo

O modo de retenção pode ser alterado posteriormente.

---

# 12. Resume e Recuperação

## FR-056 — Persistir resume data

Torrent runtime deve poder ser retomado.

---

## FR-057 — Persistir posição de playback

Posição deve ser salva continuamente.

---

## FR-058 — Retomar playback

Ao reabrir conteúdo, usuário deve poder continuar.

---

## FR-059 — Restaurar torrents ativos

Após reinicialização, torrents ativos devem poder ser restaurados.

---

## FR-060 — Evitar reindexação global

Reabrir o app não deve exigir scan completo para mostrar a Home.

---

# 13. Playback

## FR-061 — Reproduzir com MPV

A arquitetura prevista deve suportar MPV como player principal.

---

## FR-062 — Direct Play

Quando possível, o arquivo deve ser reproduzido sem transcoding.

---

## FR-063 — Hardware decode

Playback deve suportar aceleração de hardware.

---

## FR-064 — Play/Pause

O usuário deve controlar reprodução.

---

## FR-065 — Seek

O usuário deve poder avançar e voltar.

---

## FR-066 — Múltiplas faixas de áudio

O player deve permitir troca de áudio.

---

## FR-067 — Legendas embutidas

O player deve suportar legendas presentes no arquivo.

---

## FR-068 — Legendas externas

O sistema deve permitir legendas externas quando suportado.

---

## FR-069 — Fullscreen

Playback deve funcionar em fullscreen sem exposição do desktop.

---

# 14. Sunshine e Moonlight

## FR-070 — Inicialização via Sunshine

O Ushark deve poder ser executado como app do Sunshine.

---

## FR-071 — Detectar modo TV

Quando iniciado por esse fluxo, o app pode entrar em experiência de TV.

---

## FR-072 — Fullscreen automático

Modo TV deve poder iniciar fullscreen.

---

## FR-073 — Encerramento integrado

Ao sair do app, a sessão deve poder terminar corretamente.

---

## FR-074 — Pausar ao desconectar Moonlight

Comportamento deve ser configurável.

---

# 15. Controle e Navegação

## FR-075 — Navegação por gamepad

Toda função principal deve ser utilizável sem mouse.

---

## FR-076 — D-pad

Deve navegar entre elementos focáveis.

---

## FR-077 — Botão selecionar

Deve existir ação padrão de confirmação.

---

## FR-078 — Botão voltar

Deve existir navegação reversa consistente.

---

## FR-079 — Preservar foco

Ao voltar de detalhes, a posição anterior deve ser restaurada.

---

## FR-080 — Foco visível

Elemento ativo deve possuir estado visual inequívoco.

---

# 16. Home

## FR-081 — Hero

A Home deve suportar conteúdo destacado.

---

## FR-082 — Continuar assistindo

A Home deve mostrar conteúdos incompletos recentes.

---

## FR-083 — Filmes

A Home pode mostrar seção de filmes.

---

## FR-084 — Séries

A Home pode mostrar seção de séries.

---

## FR-085 — Recentes

A Home pode mostrar conteúdos adicionados recentemente.

---

## FR-086 — Bibliotecas compartilhadas

A Home deve permitir acesso às subscriptions.

---

# 17. Details

## FR-087 — Tela de detalhes

Deve mostrar:

- título;
- descrição;
- ano;
- duração;
- metadata;
- health;
- ações.

---

## FR-088 — Iniciar preflight ao abrir details

Sources podem começar a ser avaliadas antes do Play.

---

## FR-089 — Ação Assistir

Deve iniciar Source Selection e playback.

---

## FR-090 — Ação Fontes

Deve permitir visualizar sources disponíveis.

---

## FR-091 — Favoritar

Deve permitir favoritar localmente.

---

# 18. Torrent Health Score

## FR-092 — Calcular Streaming Health

**Prioridade:** P0

O sistema deve calcular adequação de uma source para streaming.

---

## FR-093 — Medir throughput

Health deve considerar velocidade observada.

---

## FR-094 — Medir piece availability

Health deve considerar disponibilidade de pieces relevantes.

---

## FR-095 — Considerar peers úteis

Peers conectados e capazes de fornecer dados devem influenciar o score.

---

## FR-096 — Considerar estabilidade

Oscilação de throughput deve influenciar negativamente.

---

## FR-097 — Considerar bitrate

O score deve relacionar capacidade da source à necessidade do conteúdo.

---

## FR-098 — Calcular Streaming Ratio

```text
sustainable throughput / media bitrate
```

---

## FR-099 — Confidence

Toda medição pode possuir nível de confiança.

---

## FR-100 — Estado Medindo

UI deve suportar estado ainda sem score confiável.

---

## FR-101 — Barras visuais

O score deve ser apresentado em indicador simples.

---

## FR-102 — Labels

Labels mínimas:

```text
Excelente
Muito bom
Bom
Instável
Ruim
```

---

## FR-103 — Startup estimate

O sistema deve poder estimar tempo até Play.

---

## FR-104 — Separar Swarm Health

Internamente, saúde geral do swarm deve ser distinta de Streaming Health.

---

# 19. Source Selection Engine

## FR-105 — Comparar sources

O sistema deve conseguir avaliar múltiplas sources de um Content.

---

## FR-106 — Selecionar automaticamente

Se habilitado, a melhor source deve ser escolhida sem intervenção.

---

## FR-107 — Respeitar preferência de qualidade

Usuário pode definir prioridades.

---

## FR-108 — Respeitar resolução máxima

Source Selection deve poder filtrar resoluções.

---

## FR-109 — Preferir estabilidade

Modo de equilíbrio deve penalizar sources instáveis.

---

## FR-110 — Permitir escolha manual

Usuário sempre pode selecionar source específica.

---

## FR-111 — Persistir source override

Seleção manual pode ser salva.

---

## FR-112 — Fallback automático

Se uma source falhar, o sistema pode procurar alternativa.

---

## FR-113 — Troca automática configurável

Usuário pode permitir ou bloquear troca automática.

---

# 20. Health History

## FR-114 — Persistir histórico por source

Pode armazenar:

- throughput;
- startup;
- buffering;
- failures;
- timestamp.

---

## FR-115 — Usar histórico como sinal

O sistema pode combinar histórico e medição atual.

---

# 21. Downloads

## FR-116 — Tela de downloads

Deve mostrar torrents ativos.

---

## FR-117 — Mostrar progresso

Exibir porcentagem.

---

## FR-118 — Mostrar velocidade

Exibir throughput.

---

## FR-119 — Mostrar peers

Exibir número de peers quando disponível.

---

## FR-120 — Pausar

Usuário pode pausar download.

---

## FR-121 — Retomar

Usuário pode continuar.

---

## FR-122 — Cancelar

Usuário pode cancelar.

---

## FR-123 — Abrir Content

Item de download deve levar aos detalhes.

---

# 22. Estado do Usuário

## FR-124 — Salvar progresso

Playback progress deve ser local.

---

## FR-125 — Marcar assistido

Sistema deve registrar conclusão.

---

## FR-126 — Remover de Continuar Assistindo

Conteúdo concluído deve sair da seção apropriada.

---

## FR-127 — Favoritos locais

Favoritos não pertencem a bibliotecas compartilhadas.

---

## FR-128 — Preservar histórico após unsubscribe

Remover biblioteca não deve apagar histórico.

---

# 23. Próximo Episódio

## FR-129 — Detectar próximo episódio

Player deve conhecer sequência da série.

---

## FR-130 — Autoplay configurável

Usuário pode habilitar reprodução automática.

---

## FR-131 — Countdown

Pode existir contagem regressiva antes do próximo episódio.

---

## FR-132 — Preflight antecipado

Próximo episódio pode ser preparado antes do atual acabar.

---

# 24. Biblioteca Compartilhada

## FR-133 — Criar biblioteca compartilhável

**Prioridade:** P0  
**Tipo:** SHARING

Usuário pode criar biblioteca independente.

---

## FR-134 — Nome da biblioteca

Campo obrigatório.

---

## FR-135 — Descrição

Campo opcional.

---

## FR-136 — Identidade visual

Pode possuir:

- avatar;
- logo;
- banner;
- accent color.

---

## FR-137 — Adicionar Content existente

Curador pode adicionar Contents já conhecidos.

---

## FR-138 — Selecionar sources publicadas

Curador decide quais sources fazem parte da biblioteca.

---

## FR-139 — Criar sections

Curador pode criar seções.

---

## FR-140 — Ordenar sections

Ordem publicada deve ser persistida.

---

## FR-141 — Ordenar items

Ordem dentro da section deve ser persistida.

---

## FR-142 — Hero

Curador pode definir conteúdo de destaque.

---

## FR-143 — Preview

Curador deve visualizar experiência antes de publicar.

---

# 25. Manifest

## FR-144 — Gerar manifest

Biblioteca compartilhada deve ser serializável.

---

## FR-145 — Validar manifest

Manifest deve seguir schema conhecido.

---

## FR-146 — Versionar manifest

Toda publicação gera versão.

---

## FR-147 — Tornar versão imutável

Versão publicada não deve ser editada em-place.

---

## FR-148 — Hash de integridade

Manifest pode possuir hash de conteúdo.

---

# 26. Export e Import

## FR-149 — Exportar arquivo de biblioteca

Sistema deve permitir pacote compartilhável.

---

## FR-150 — Importar arquivo de biblioteca

Sistema deve validar antes de importar.

---

## FR-151 — Importar por link/código

Sistema deve suportar identificador remoto.

---

## FR-152 — Preview antes da importação

Mostrar:

- nome;
- autor;
- quantidade de conteúdos;
- versão.

---

# 27. Subscriptions

## FR-153 — Assinar biblioteca

Usuário pode acompanhar biblioteca remota.

---

## FR-154 — Persistir versão instalada

Subscription deve conhecer versão atual.

---

## FR-155 — Verificar atualização

Sistema pode consultar nova versão.

---

## FR-156 — Baixar atualização

Nova versão deve ser obtida sem remover a atual primeiro.

---

## FR-157 — Validar atualização

Antes de ativar.

---

## FR-158 — Aplicar atomicamente

Swap somente após sucesso.

---

## FR-159 — Preservar versão anterior em falha

Nunca deixar biblioteca parcialmente atualizada.

---

# 28. Atualizações e Overrides

## FR-160 — Preservar user overrides

Atualização remota não pode apagar preferências locais.

---

## FR-161 — Preservar progresso

Atualização não pode apagar playback state.

---

## FR-162 — Preservar favoritos

Atualização não pode apagar favoritos.

---

## FR-163 — Remoção remota não apaga Content pessoal

Se usuário adicionou item à biblioteca própria, ele continua existindo.

---

## FR-164 — Ocultar item localmente

Usuário pode esconder item de uma library subscription.

---

# 29. Fork

## FR-165 — Duplicar biblioteca

Usuário pode criar cópia independente.

---

## FR-166 — Novo ID

Fork deve receber novo `libraryId`.

---

## FR-167 — Parar sincronização automática da cópia

Fork não deve seguir o original automaticamente.

---

# 30. Busca

## FR-168 — Busca global

Busca deve consultar todos os Contents indexados.

---

## FR-169 — Buscar por título

Obrigatório.

---

## FR-170 — Buscar por título original

Quando disponível.

---

## FR-171 — Buscar séries e episódios

Obrigatório.

---

## FR-172 — Mostrar memberships

Resultado pode indicar bibliotecas onde o Content aparece.

---

# 31. Offline

## FR-173 — Abrir biblioteca offline

Dados cacheados devem continuar acessíveis.

---

## FR-174 — Reproduzir conteúdo local offline

Conteúdo já armazenado deve tocar.

---

## FR-175 — Indicar funções indisponíveis

UI deve informar quando sync ou peer discovery não estiver disponível.

---

# 32. Indexação

## FR-176 — File watcher

Mudanças em biblioteca local devem ser detectadas.

---

## FR-177 — Indexação incremental

Somente itens alterados devem ser reprocessados.

---

## FR-178 — Não bloquear startup

Indexer pode continuar em background.

---

# 33. UI Performance

## FR-179 — Virtualizar listas grandes

Cards não visíveis não devem ser renderizados desnecessariamente.

---

## FR-180 — Progressive hydration

UI pode renderizar antes de metadata remota completar.

---

## FR-181 — Thumbnails otimizadas

Interface deve usar imagens adequadas ao tamanho exibido.

---

# 34. Diagnóstico

## FR-182 — Tela técnica opcional

Usuário avançado pode visualizar runtime.

---

## FR-183 — Mostrar download speed

Diagnóstico deve exibir throughput.

---

## FR-184 — Mostrar buffer

Diagnóstico deve exibir buffer estimado.

---

## FR-185 — Mostrar Streaming Ratio

Quando disponível.

---

## FR-186 — Mostrar decoder

Player pode informar codec/hardware decode.

---

# 35. Configurações

## FR-187 — Configurar qualidade preferida

Usuário pode definir política.

---

## FR-188 — Configurar resolução máxima

Obrigatório.

---

## FR-189 — Configurar source auto-switch

Obrigatório.

---

## FR-190 — Configurar autoplay

Obrigatório.

---

## FR-191 — Configurar idioma de áudio

Preferência local.

---

## FR-192 — Configurar idioma de legenda

Preferência local.

---

## FR-193 — Configurar comportamento ao desconectar Moonlight

Exemplo:

```text
pause
continue
```

---

# 36. Segurança

## FR-194 — Rejeitar código executável em manifest

Nenhuma biblioteca deve executar código.

---

## FR-195 — Rejeitar path traversal

Paths como:

```text
../../
```

devem ser inválidos.

---

## FR-196 — Rejeitar paths absolutos externos

Manifest remoto não deve acessar arquivos arbitrários.

---

## FR-197 — Limitar tamanho de manifest

Parser deve aplicar limites.

---

## FR-198 — Limitar profundidade JSON

Obrigatório.

---

## FR-199 — Limitar assets

Obrigatório.

---

## FR-200 — Validar schema antes de persistir

Obrigatório.

---

# 37. Assinatura de Biblioteca

## FR-201 — Verificar assinatura

Quando presente, assinatura deve poder ser validada.

---

## FR-202 — Detectar mudança de identidade

Uma subscription assinada não deve aceitar nova identidade silenciosamente.

---

## FR-203 — Exibir status de verificação

UI pode informar:

```text
Assinatura válida
Assinatura inválida
Não assinada
```

---

# 38. Erros

## FR-204 — Tratar source sem peers

Sistema deve oferecer retry ou fallback.

---

## FR-205 — Tratar metadata ausente

Usuário pode criar item manualmente.

---

## FR-206 — Tratar episódio não identificado

Usuário pode mapear manualmente.

---

## FR-207 — Tratar falta de espaço

Mostrar ações possíveis.

---

## FR-208 — Tratar cache corrompido

Sistema deve poder invalidar e reconstruir dados afetados.

---

## FR-209 — Tratar falha do player

Playback failure não deve derrubar a UI inteira.

---

## FR-210 — Tratar falha de torrent runtime

UI deve continuar disponível quando possível.

---

# 39. Confirmações destrutivas

## FR-211 — Diferenciar remover da biblioteca de apagar arquivo

As ações devem ser distintas.

---

## FR-212 — Confirmar delete físico

Arquivo local não deve ser apagado silenciosamente.

---

## FR-213 — Unsubscribe preserva estado

UI deve informar o que será mantido.

---

# 40. Primeiro Uso

## FR-214 — Onboarding

Primeiro acesso deve possuir fluxo inicial.

---

## FR-215 — Selecionar pasta da biblioteca

Obrigatório ou com default válido.

---

## FR-216 — Selecionar pasta de cache

Obrigatório ou com default válido.

---

## FR-217 — Definir limite inicial de cache

Deve existir valor padrão.

---

## FR-218 — Definir política de qualidade inicial

Usuário pode escolher uma opção.

---

## FR-219 — Detectar Sunshine opcionalmente

Sistema pode orientar integração.

---

# 41. Estados Globais

## FR-220 — Estados previsíveis de UI

Componentes assíncronos devem utilizar estados explícitos.

Mínimos:

```text
idle
loading
ready
degraded
offline
error
```

---

## FR-221 — Estados de Health

Mínimos:

```text
idle
measuring
ready
error
```

---

## FR-222 — Estados de Sync

Mínimos:

```text
idle
checking
downloading
validating
applying
ready
error
```

---

# 42. Regras de Domínio Obrigatórias

## FR-223 — Content é independente de Source

Nunca modelar torrent como Content.

---

## FR-224 — Estado do usuário é independente de Library

Progresso e preferências não pertencem ao manifest.

---

## FR-225 — Biblioteca compartilhada não controla runtime local

Curador pode recomendar source, não forçar execução.

---

## FR-226 — Runtime real vence metadata declarativa

Exemplo:

```text
Manifest: 4K
Probe: 1080p

Resultado técnico: 1080p
```

---

## FR-227 — User override tem maior prioridade local

Escolhas explícitas do usuário devem ser respeitadas.

---

# 43. Ordem de Prioridade de Dados

O sistema deve respeitar:

```text
1. User Override
2. Runtime detected data
3. Library Manifest
4. Metadata Provider
```

Para apresentação:

```text
1. Library-specific display override
2. Provider metadata
3. fallback
```

---

# 44. Matriz de Prioridades

## P0 — Core

```text
Biblioteca
Import torrent/magnet
Metadata
Sources
Streaming progressivo
Piece scheduling
Playback
Moonlight navigation
Health Score
Source Selection
Shared Library
Manifest
Import/Export
Subscriptions
User State
Security básica
```

## P1 — Completo

```text
Health history
Auto fallback
Fork
Diagnóstico
Cache avançado
Next episode preflight
Signed libraries
```

## P2 — Evolução

```text
Smart Collections
features sociais
ratings compartilhados
plugins
extensões
```

---

# 45. Relação com os Próximos Documentos

O próximo documento:

```text
04-non-functional-requirements.md
```

deverá definir restrições não funcionais para estes requisitos.

Exemplos:

```text
FR-038
Reproduzir antes do download completo

NFR relacionado:
tempo máximo de startup esperado
```

Depois as especificações técnicas detalharão implementação.

---

# 46. Regra para Milestones Futuras

Nenhuma story deverá apontar apenas para uma descrição livre.

Cada story deverá indicar:

```text
FR IDs
+
Acceptance Criteria
+
Technical Specs
```

Exemplo:

```text
Story: Implementar importação de magnet

Requirements:
FR-010
FR-011
FR-012
FR-013

Specs:
02-torrent-streaming-engine.md
```

---

# 47. Regra Central

> **Todo comportamento importante do produto deve possuir um requisito funcional rastreável.**

Isso permite ligar:

```text
Produto
↓
Requirement
↓
Milestone
↓
Story
↓
Código
↓
Teste
```

sem depender da interpretação do agente.
