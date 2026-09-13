# Ushark — Documento 04: Non-Functional Requirements

**Status:** Draft v1  
**Produto:** Ushark\
**Documento:** Non-Functional Requirements  
**Dependências:**  
- `01-prd-master.md`
- `02-user-journeys.md`
- `03-functional-requirements.md`

---

# 1. Objetivo

Este documento define os requisitos não funcionais do Ushark.

Enquanto os Functional Requirements definem **o que** o produto deve fazer, este documento define **como bem** o sistema deve fazer isso.

Os requisitos estão organizados no formato:

```text
NFR-XXX
```

Cada NFR deverá ser rastreável para:

- requisitos funcionais;
- arquitetura;
- testes;
- observabilidade;
- quality gates;
- milestones;
- stories.

---

# 2. Categorias

Os requisitos são agrupados em:

```text
Performance
Responsividade
Streaming
Cache
Resiliência
Persistência
Segurança
Privacidade
Observabilidade
Compatibilidade
Escalabilidade local
Manutenibilidade
Atualização
Offline
UX
Recursos
Rede
Integridade
```

---

# 3. Performance — Startup

## NFR-001 — Cold Start

**Prioridade:** P0

O aplicativo deve atingir uma Home utilizável em:

```text
< 2 segundos
```

em hardware compatível e biblioteca já indexada.

### Condições

Não inclui:

- primeira indexação completa;
- download de metadata remota;
- resolução de novos torrents.

---

## NFR-002 — Warm Start

Reabertura com processos/cache disponíveis deve atingir UI utilizável em:

```text
< 500 ms
```

como meta de otimização.

---

## NFR-003 — Biblioteca visível

Dados locais já indexados devem produzir conteúdo visível em:

```text
< 300 ms
```

após a UI estar pronta.

---

## NFR-004 — Nenhuma dependência remota para render inicial

A Home não deve aguardar:

- TMDB;
- trackers;
- DHT;
- health probes;
- sincronização de bibliotecas remotas.

---

# 4. Responsividade da UI

## NFR-005 — Navegação

Trocas de tela baseadas em dados locais devem responder em:

```text
< 100 ms
```

como meta perceptual.

---

## NFR-006 — Frame Rate

A interface de TV deve buscar:

```text
60 FPS
```

em hardware suportado.

---

## NFR-007 — Input Latency

O app deve processar ações de controle sem atraso perceptível adicional relevante além da latência introduzida por Sunshine/Moonlight.

---

## NFR-008 — Foco imediato

Mudança de foco entre cards não deve depender de request de rede.

---

## NFR-009 — Operações assíncronas

Nenhuma operação de:

- torrent;
- metadata;
- sync;
- indexação;
- image processing;

deve bloquear a thread principal da UI.

---

# 5. Performance de Imagens

## NFR-010 — Poster local

Poster já cacheado e dimensionado deve ser disponibilizado em:

```text
< 50 ms
```

como meta.

---

## NFR-011 — Thumbnails

A UI não deve carregar imagem original quando existir variante adequada.

---

## NFR-012 — Tamanhos derivados

O sistema deve permitir variantes de imagem adequadas a:

```text
cards pequenos
cards grandes
hero
backdrop
```

---

## NFR-013 — Carregamento progressivo

Imagens podem aparecer progressivamente sem bloquear navegação.

---

# 6. Biblioteca Grande

## NFR-014 — Virtualização

A interface deve continuar responsiva com milhares de Contents.

---

## NFR-015 — Render limitado

Somente elementos visíveis ou próximos devem ser montados sempre que possível.

---

## NFR-016 — Busca independente do volume visual

Busca local não deve depender de cards renderizados.

---

## NFR-017 — Indexação incremental

Alterar um único item não deve provocar reindexação global.

---

# 7. Streaming Startup

## NFR-018 — Startup desejado

Com source saudável:

```text
1 a 5 segundos
```

entre Play e reprodução.

---

## NFR-019 — Startup não garantido

O sistema deve reconhecer que startup depende de:

- peers;
- swarm;
- latência;
- bitrate;
- disco;
- rede.

Por isso o valor é uma meta operacional, não garantia absoluta.

---

## NFR-020 — Feedback de startup

Se playback não iniciar imediatamente, o usuário deve receber feedback em menos de:

```text
250 ms
```

após clicar Play.

---

## NFR-021 — Preflight

Trabalho antecipado deve ser utilizado para reduzir startup percebido.

---

# 8. Seek

## NFR-022 — Seek desejado

Em source saudável:

```text
1 a 3 segundos
```

para retomar reprodução após seek significativo.

---

## NFR-023 — Cancelamento de prioridade antiga

O engine deve reagir ao seek imediatamente.

---

## NFR-024 — Novo buffer

O sistema não deve aguardar completion de download da região anterior.

---

# 9. Buffer

## NFR-025 — Buffer adaptativo

O buffer deve poder aumentar ou diminuir conforme:

- bitrate;
- throughput;
- estabilidade;
- disponibilidade.

---

## NFR-026 — Baixo buffer

Quando buffer entrar em zona crítica, engine deve aumentar agressividade de download.

---

## NFR-027 — Buffer saudável

Quando buffer estiver confortável, engine pode reduzir pressão de I/O/rede.

---

## NFR-028 — Sem valor fixo universal

O sistema não deve assumir que o mesmo número de MB serve para todos os conteúdos.

---

# 10. Streaming Ratio

## NFR-029 — Ratio mensurável

O sistema deve conseguir calcular:

```text
throughput sustentável / bitrate necessário
```

---

## NFR-030 — Ratio atualizado

Streaming Ratio deve ser atualizado ao longo da reprodução.

---

## NFR-031 — Oscilações

O valor exibido ou utilizado internamente deve evitar reagir excessivamente a picos momentâneos.

---

# 11. Torrent Health

## NFR-032 — Health inicial progressivo

O sistema deve aceitar score de baixa confiança inicialmente.

---

## NFR-033 — Confidence

Toda decisão automática baseada em Health deve poder considerar confiança da medição.

---

## NFR-034 — Reavaliação contínua

Health não é valor estático.

---

## NFR-035 — Métricas reais

Seeder count isolado não pode determinar o score.

---

## NFR-036 — Streaming Health separado

Adequação para playback deve ser separada da saúde geral do swarm.

---

# 12. Source Selection

## NFR-037 — Decisão explicável

O sistema deve poder registrar por que uma source foi escolhida.

Exemplo interno:

```text
higher stable throughput
acceptable quality
lower startup estimate
```

---

## NFR-038 — Não escolher apenas por resolução

Resolução máxima não deve ser a única variável.

---

## NFR-039 — Fallback

Se a source escolhida falhar, a arquitetura deve permitir troca sem reiniciar o aplicativo.

---

# 13. Cache de Memória

## NFR-040 — Memória limitada

RAM cache deve possuir limite configurável ou adaptativo.

---

## NFR-041 — Sem crescimento ilimitado

Cache não deve consumir memória indefinidamente.

---

## NFR-042 — Prioridade de dados quentes

Pieces relevantes ao playback devem ter precedência.

---

# 14. Cache em Disco

## NFR-043 — Limite configurável

Usuário deve poder estabelecer máximo.

---

## NFR-044 — Diretório configurável

Cache não deve estar preso a um volume específico.

---

## NFR-045 — Preferência por armazenamento rápido

A documentação deve recomendar SSD/NVMe para cache ativo.

---

## NFR-046 — Sem corrupção da biblioteca

Limpeza de cache não pode apagar metadata estrutural ou estado do usuário.

---

# 15. Limpeza

## NFR-047 — LRU segura

Limpeza automática deve respeitar proteções.

---

## NFR-048 — Nunca remover ativo

Arquivos usados em playback não devem ser removidos.

---

## NFR-049 — Nunca remover protegido

Conteúdo marcado para retenção deve permanecer.

---

## NFR-050 — Recuperação de espaço previsível

O sistema deve saber estimar quanto pode liberar antes de uma operação de limpeza.

---

# 16. Persistência

## NFR-051 — Estado transacional

Alterações críticas devem ser persistidas de forma consistente.

---

## NFR-052 — WAL

SQLite deve ser configurável para modo apropriado de concorrência, como WAL, conforme spec técnica.

---

## NFR-053 — Playback progress

Perda abrupta do app não deve causar perda significativa de progresso.

Meta:

```text
perder no máximo alguns segundos de posição
```

---

## NFR-054 — Resume Data

Estado torrent deve ser salvo periodicamente e no shutdown normal.

---

# 17. Atomicidade

## NFR-055 — Library Update

Atualização de biblioteca remota deve ser atômica.

---

## NFR-056 — Rollback

Versão anterior deve permanecer disponível até confirmação da nova.

---

## NFR-057 — Crash during update

Crash durante sync não deve deixar manifest parcialmente aplicado.

---

# 18. Integridade

## NFR-058 — Hash

Artefatos importantes podem possuir hash de integridade.

---

## NFR-059 — Manifest imutável por versão

Conteúdo identificado como versão X não deve mudar silenciosamente.

---

## NFR-060 — Dados corrompidos

Cache corrompido deve ser invalidável sem apagar estado do usuário.

---

# 19. Offline

## NFR-061 — Home offline

Aplicativo deve abrir sem internet usando dados locais.

---

## NFR-062 — Metadata offline

Metadata previamente sincronizada deve continuar disponível.

---

## NFR-063 — Imagens offline

Posters previamente cacheados devem continuar disponíveis.

---

## NFR-064 — Conteúdo local

Mídia já presente em disco deve continuar reproduzível.

---

## NFR-065 — Degradação clara

Recursos indisponíveis por falta de internet devem indicar estado, não quebrar a UI.

---

# 20. Rede

## NFR-066 — Operação em LAN

Uso via Sunshine/Moonlight deve funcionar adequadamente em rede local compatível.

---

## NFR-067 — Não saturar rede desnecessariamente

Torrent engine deve poder limitar download/upload.

---

## NFR-068 — Limites configuráveis

Usuário pode definir:

```text
download limit
upload limit
```

se a implementação expuser esse controle.

---

## NFR-069 — Prioridade de playback

Se houver conflito entre download geral e streaming ativo, playback deve ter precedência.

---

# 21. CPU

## NFR-070 — Evitar transcoding desnecessário

Direct Play deve ser preferido.

---

## NFR-071 — Hardware decode

Quando disponível, usar aceleração de hardware.

---

## NFR-072 — Não bloquear UI com CPU heavy tasks

Parsing, hashing e probing devem ficar fora da thread principal.

---

# 22. GPU

## NFR-073 — GPU decode

Player deve poder usar hardware decode.

---

## NFR-074 — Sunshine hardware encode

Arquitetura deve permitir que Sunshine utilize encoder de hardware quando disponível.

---

## NFR-075 — Sem dupla transcodificação desnecessária

Evitar pipelines que decodificam/transcodificam sem necessidade.

---

# 23. Disco

## NFR-076 — I/O concorrente controlado

Torrent engine e player não devem causar thrashing excessivo de disco.

---

## NFR-077 — Cache quente separado

Arquitetura deve permitir cache ativo em volume diferente da biblioteca permanente.

---

## NFR-078 — Escrita desnecessária

Não persistir cada pequena atualização de runtime como arquivo JSON.

---

# 24. Escalabilidade Local

## NFR-079 — Milhares de conteúdos

Arquitetura deve suportar milhares de filmes/séries indexados.

---

## NFR-080 — Dezenas de milhares de episódios

Data model não deve assumir biblioteca pequena.

---

## NFR-081 — Múltiplas bibliotecas

Usuário pode assinar diversas libraries sem duplicar Content.

---

## NFR-082 — Múltiplas sources

Um Content pode ter várias sources sem degradação estrutural.

---

# 25. Process Isolation

## NFR-083 — UI separada do Torrent Runtime

Crash da UI não deve necessariamente invalidar sessão torrent.

---

## NFR-084 — Player isolado

Falha do player não deve derrubar todo o app.

---

## NFR-085 — Reinício de componente

Componentes isolados devem poder ser reiniciados quando possível.

---

# 26. Resiliência

## NFR-086 — Tracker failure

Falha de tracker não deve encerrar automaticamente o torrent.

---

## NFR-087 — Peer loss

Peer disconnect deve ser tratado como condição normal.

---

## NFR-088 — Network reconnect

Após retorno da rede, componentes devem tentar recuperação.

---

## NFR-089 — Metadata provider failure

Falha do TMDB não deve impedir acesso ao catálogo local.

---

## NFR-090 — Shared library service failure

Subscriptions existentes devem continuar acessíveis localmente.

---

# 27. Segurança de Manifest

## NFR-091 — Declarative only

Manifest não pode executar código.

---

## NFR-092 — Path sandbox

Todos os paths internos devem ser validados.

---

## NFR-093 — Path traversal

Entradas contendo traversal devem ser rejeitadas.

---

## NFR-094 — Absolute paths

Bibliotecas remotas não devem apontar livremente para filesystem do usuário.

---

## NFR-095 — Protocol allowlist

Remote assets devem utilizar protocolos explicitamente permitidos.

---

# 28. Limites de Parsing

## NFR-096 — Tamanho máximo de manifest

Deve existir limite configurado na spec técnica.

---

## NFR-097 — Profundidade JSON

Parser deve rejeitar estruturas excessivamente profundas.

---

## NFR-098 — Quantidade máxima de items

Deve existir proteção contra payload malicioso.

---

## NFR-099 — Quantidade máxima de assets

Obrigatório.

---

## NFR-100 — Tamanho máximo de string

Campos textuais devem possuir limites razoáveis.

---

# 29. Remote Assets

## NFR-101 — Não confiar em MIME declarado

Cliente deve validar conteúdo baixado quando possível.

---

## NFR-102 — Cache local

Assets remotos devem ser cacheados.

---

## NFR-103 — Timeout

Requests externos devem possuir timeout.

---

## NFR-104 — Falha de asset

Imagem quebrada não deve impedir carregamento da biblioteca.

---

# 30. Assinatura

## NFR-105 — Algoritmo moderno

Assinatura deve utilizar algoritmo considerado seguro no momento da implementação.

Planejado:

```text
Ed25519
```

---

## NFR-106 — Identidade persistente

Uma subscription assinada deve lembrar a identidade previamente aceita.

---

## NFR-107 — Mudança de key

Troca inesperada deve exigir ação explícita do usuário.

---

# 31. Privacidade

## NFR-108 — Estado local por padrão

Histórico e progresso devem permanecer locais, salvo feature explícita futura.

---

## NFR-109 — Não publicar biblioteca automaticamente

Conteúdo criado localmente é privado por padrão.

---

## NFR-110 — Publicação explícita

Compartilhamento remoto exige ação do usuário.

---

# 32. Logs

## NFR-111 — Logs estruturados

Componentes principais devem produzir logs estruturados.

---

## NFR-112 — Correlation IDs

Operações complexas podem possuir identificador correlacionável.

Exemplo:

```text
playbackSessionId
torrentSessionId
librarySyncId
```

---

## NFR-113 — Sem secrets em logs

Tokens, credenciais e URLs sensíveis não devem ser logados integralmente.

---

# 33. Observabilidade

## NFR-114 — Métricas torrent

Disponibilizar internamente:

- peers;
- throughput;
- upload;
- download;
- piece availability;
- buffer.

---

## NFR-115 — Métricas player

Disponibilizar:

- codec;
- bitrate;
- posição;
- dropped frames quando possível;
- hardware decode.

---

## NFR-116 — Métricas UI

Durante desenvolvimento, permitir observar:

- frame drops;
- render duration;
- memory.

---

## NFR-117 — Diagnóstico exportável

Futuramente, diagnóstico poderá ser exportado sem dados pessoais desnecessários.

---

# 34. Compatibilidade

## NFR-118 — Windows

Windows é plataforma principal inicial.

---

## NFR-119 — Arquitetura futura

Separação de domínio deve evitar dependência total de APIs exclusivas de Windows quando não necessário.

---

## NFR-120 — Sunshine

Versões suportadas devem ser documentadas.

---

## NFR-121 — Moonlight

O produto deve usar protocolos de input de forma compatível com o fluxo Sunshine/Moonlight.

---

# 35. Controle

## NFR-122 — 100% das funções essenciais via gamepad

Usuário na TV não deve precisar de mouse para:

- navegar;
- abrir;
- reproduzir;
- pausar;
- voltar;
- selecionar fonte;
- trocar áudio;
- trocar legenda;
- sair.

---

## NFR-123 — Focus trap

Modais não devem perder foco para elementos atrás.

---

## NFR-124 — Focus restoration

Ao fechar overlay/modal, foco retorna ao elemento anterior.

---

# 36. Legibilidade na TV

## NFR-125 — Distância

Texto deve ser legível a distância típica de sala.

---

## NFR-126 — Contraste

Elementos de foco devem possuir contraste suficiente.

---

## NFR-127 — Safe areas

UI deve considerar overscan/safe area quando necessário.

---

# 37. Progressive Hydration

## NFR-128 — Dados locais primeiro

Render inicial deve usar cache local.

---

## NFR-129 — Metadata remota depois

Enriquecimento remoto ocorre sem bloquear.

---

## NFR-130 — Health assíncrono

Cards/details podem aparecer antes do Health Score.

---

# 38. Atualizações do App

## NFR-131 — Update não destrutivo

Atualização do aplicativo não deve apagar:

- biblioteca;
- cache index;
- estado;
- downloads.

---

## NFR-132 — Data migrations

Mudanças de schema devem possuir migração.

---

## NFR-133 — Migration rollback/failure

Falha de migração deve ser tratada de forma recuperável.

---

# 39. Compatibilidade de Schema

## NFR-134 — Semantic versioning

Schemas devem seguir versionamento coerente.

---

## NFR-135 — Minor compatibility

Versões compatíveis devem poder ser lidas quando possível.

---

## NFR-136 — Major incompatibility

Mudanças breaking devem ser detectadas explicitamente.

---

# 40. Manutenibilidade

## NFR-137 — Modularidade

Arquitetura deve separar:

```text
UI
Library
Metadata
Torrent
Health
Source Selection
Playback
Sharing
Persistence
```

---

## NFR-138 — Contracts

Integrações entre módulos devem possuir contratos explícitos.

---

## NFR-139 — Engine substituível

UI não deve depender diretamente de detalhes específicos do torrent engine.

---

## NFR-140 — Player substituível

Domínio não deve ser acoplado profundamente ao MPV.

---

# 41. Testabilidade

## NFR-141 — Domain testável sem UI

Regras de biblioteca e Source Selection devem possuir testes isolados.

---

## NFR-142 — Torrent abstraído

Deve ser possível testar comportamentos com mocks/fakes.

---

## NFR-143 — Health determinístico em testes

Health Score deve aceitar inputs controláveis.

---

## NFR-144 — Manifest fixtures

Devem existir manifests válidos e inválidos para testes.

---

# 42. Quality Gates

## NFR-145 — Nenhuma regressão crítica de startup

Mudanças devem ser avaliadas contra budget de inicialização.

---

## NFR-146 — Nenhuma regressão crítica de UI

Frame drops persistentes devem ser tratados como regressão.

---

## NFR-147 — Nenhuma perda de estado

Testes devem cobrir crash/restart.

---

## NFR-148 — Segurança de import

Payloads maliciosos conhecidos devem ser rejeitados.

---

# 43. Recursos

## NFR-149 — Memória previsível

Aplicativo não deve crescer indefinidamente durante navegação.

---

## NFR-150 — Cleanup de runtime

Sessões encerradas devem liberar recursos.

---

## NFR-151 — Torrent session reuse

Quando seguro, runtime deve ser reutilizado para mesma source.

---

# 44. Shutdown

## NFR-152 — Shutdown gracioso

Ao encerrar:

```text
save playback state
save resume data
flush critical writes
stop player
stop UI
```

---

## NFR-153 — Timeout de shutdown

Processos auxiliares não devem impedir encerramento indefinidamente.

---

## NFR-154 — Crash recovery

No próximo startup, estado incompleto deve ser detectável.

---

# 45. Direitos e Neutralidade

## NFR-155 — Sem dependência de catálogo central ilegal

O software não deve exigir catálogo de conteúdo não autorizado para funcionar.

---

## NFR-156 — Biblioteca neutra

Manifest deve funcionar igualmente para conteúdo:

- próprio;
- domínio público;
- autorizado;
- Creative Commons.

---

# 46. Budgets de Performance

Valores iniciais:

```text
Cold start              < 2s
Warm start              < 500ms
Library visible         < 300ms
Local navigation        < 100ms
Cached poster           < 50ms
Playback start          1–5s*
Seek                     1–3s*
UI target               60 FPS
```

`*` dependente de source, swarm e rede.

---

# 47. SLOs Locais Propostos

Para cenários controlados de teste:

## NFR-157 — Biblioteca

95% das aberturas de biblioteca já indexada:

```text
< 300 ms
```

---

## NFR-158 — Navegação

95% das transições puramente locais:

```text
< 100 ms
```

---

## NFR-159 — UI

Sessão normal deve manter frame pacing aceitável sem stutter contínuo.

---

## NFR-160 — Persistência

Operações normais não devem perder estado confirmado após shutdown gracioso.

---

# 48. Cenários de Benchmark

Deverão existir benchmarks pelo menos para:

```text
100 Contents
1.000 Contents
10.000 Contents
```

e:

```text
1 source por Content
5 sources por Content
```

Para séries:

```text
1.000 episódios
10.000 episódios
50.000 episódios
```

---

# 49. Cenários de Stress

Testes futuros devem cobrir:

```text
múltiplos torrents ativos
downloads concorrentes
playback + download
sync de library durante playback
metadata refresh durante navegação
cache próximo do limite
network disconnect
```

---

# 50. Cenários de Failure Injection

Devem ser testáveis:

```text
player crash
torrent runtime crash
database locked
disk full
network unavailable
tracker unavailable
TMDB timeout
manifest inválido
asset inválido
```

---

# 51. Matriz de Criticidade

## P0

```text
Startup
UI responsiva
Streaming
Seek
Persistência
Cache seguro
Security sandbox
Offline local
Process isolation
State recovery
```

## P1

```text
Health sophistication
Historical scoring
Advanced observability
Signed libraries
Performance tuning
```

## P2

```text
Extended compatibility
Advanced diagnostics
Optional telemetry
```

---

# 52. Relação com Functional Requirements

Exemplos:

```text
FR-038 — Reproduzir antes do download completo
↓
NFR-018 — Startup desejado
NFR-025 — Buffer adaptativo
NFR-069 — Prioridade de playback
```

```text
FR-153 — Assinar biblioteca
↓
NFR-055 — Update atômico
NFR-059 — Manifest imutável
NFR-106 — Identidade persistente
```

```text
FR-075 — Navegação por gamepad
↓
NFR-122 — Funções essenciais via gamepad
NFR-123 — Focus trap
NFR-124 — Focus restoration
```

---

# 53. Quality Gate para Stories

Uma story somente deve ser considerada concluída quando:

```text
Functional Acceptance Criteria
+
Applicable NFRs
+
Tests
+
No critical regression
```

forem atendidos.

---

# 54. Quality Gate para Milestones

Milestones críticas devem verificar:

- regressão de startup;
- regressão de UI;
- memory growth;
- persistência;
- crash recovery;
- segurança;
- compatibilidade de schema.

---

# 55. Próxima Etapa

Com PRD, User Journeys, Functional Requirements e Non-Functional Requirements definidos, a próxima camada é a arquitetura técnica.

Ordem:

```text
docs/architecture/
├── 01-library-manifest.md
├── 02-torrent-streaming-engine.md
├── 03-health-score-source-selection.md
├── 04-playback-mpv-sunshine.md
└── 05-shared-libraries-sync.md
```

Depois:

```text
data model
IPC contracts
security model
UX specs
milestones
stories
```

---

# 56. Regra Central

> **Performance percebida, segurança e resiliência são requisitos do produto, não otimizações opcionais posteriores.**

O Ushark deve parecer simples na interface porque a complexidade técnica é tratada internamente.
