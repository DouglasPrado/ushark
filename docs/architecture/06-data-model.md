# Ushark — Architecture 06: Data Model

**Status:** Draft v1  
**Produto:** Ushark\
**Documento:** Architecture Specification  
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

---

# 1. Objetivo

Este documento define o modelo de dados persistente do Ushark.

A base local precisa representar de forma consistente:

- bibliotecas;
- conteúdos;
- filmes;
- séries;
- episódios;
- metadata;
- sources;
- torrents;
- memberships;
- sections;
- subscriptions;
- versões;
- user state;
- user overrides;
- downloads;
- cache;
- health history;
- playback history;
- sync jobs;
- assets.

O objetivo central é manter uma separação rígida entre:

```text
Catalog
Runtime
User State
Remote Library State
Cache
```

---

# 2. Banco principal

A persistência local planejada será:

```text
SQLite
```

Razões:

- embutido;
- sem servidor adicional;
- rápido;
- adequado para desktop;
- transacional;
- índices;
- FTS;
- WAL;
- fácil backup;
- fácil migração.

---

# 3. Princípio central

O banco não deve refletir diretamente a estrutura de arquivos do manifest.

O manifest é:

```text
formato de intercâmbio
```

O SQLite é:

```text
modelo operacional local
```

Fluxo:

```text
Manifest
↓
Validate
↓
Normalize
↓
Persist
↓
Runtime View
```

---

# 4. Separação de domínios

O schema deve ser dividido conceitualmente em:

```text
Catalog
Libraries
Sources
Playback
Torrent Runtime
Cache
Sharing
Health
System
```

---

# 5. Entidades principais

```text
contents
movies
series
episodes

metadata_providers
content_metadata

sources
torrent_sources
content_sources
source_files

libraries
library_versions
library_memberships
library_sections
library_section_items
library_assets

subscriptions
library_keys
library_sync_jobs

user_content_state
user_library_overrides
user_source_overrides

downloads
torrent_runtime
resume_entries

cache_entries

health_snapshots
health_history

playback_sessions
playback_history

settings
migrations
```

---

# 6. Content

Tabela:

```text
contents
```

Representa a identidade permanente do conteúdo.

Campos:

```text
id TEXT PRIMARY KEY
type TEXT NOT NULL
created_at INTEGER NOT NULL
updated_at INTEGER NOT NULL
```

`type`:

```text
movie
series
episode
local-video
```

---

# 7. Regra de identidade

Exemplos:

```text
movie:tmdb:157336
tv:tmdb:1396
episode:tmdb:62085
movie:local:<uuid>
```

O Content não depende de Source.

---

# 8. Movies

Tabela:

```text
movies
```

Campos:

```text
content_id TEXT PRIMARY KEY
release_year INTEGER
runtime_seconds INTEGER
```

FK:

```text
content_id → contents.id
```

---

# 9. Series

Tabela:

```text
series
```

Campos:

```text
content_id TEXT PRIMARY KEY
first_air_year INTEGER
status TEXT
```

---

# 10. Episodes

Tabela:

```text
episodes
```

Campos:

```text
content_id TEXT PRIMARY KEY
series_content_id TEXT NOT NULL
season_number INTEGER NOT NULL
episode_number INTEGER NOT NULL
runtime_seconds INTEGER
```

Índice único recomendado:

```text
(series_content_id, season_number, episode_number)
```

---

# 11. Metadata Providers

Tabela:

```text
metadata_providers
```

Campos:

```text
id TEXT PRIMARY KEY
name TEXT NOT NULL
```

Exemplos:

```text
tmdb
imdb
local
```

---

# 12. Content Metadata

Tabela:

```text
content_metadata
```

Campos:

```text
content_id TEXT NOT NULL
provider_id TEXT NOT NULL
provider_content_id TEXT NOT NULL
title TEXT
original_title TEXT
description TEXT
poster_asset_id TEXT
backdrop_asset_id TEXT
language TEXT
raw_json TEXT
fetched_at INTEGER
expires_at INTEGER
PRIMARY KEY (content_id, provider_id)
```

---

# 13. Metadata External IDs

Pode ser normalizado em tabela adicional:

```text
content_external_ids
```

Campos:

```text
content_id
provider
external_id
PRIMARY KEY(content_id, provider)
```

---

# 14. Sources

Tabela:

```text
sources
```

Representa qualquer forma reproduzível de Content.

Campos:

```text
id TEXT PRIMARY KEY
type TEXT NOT NULL
created_at INTEGER NOT NULL
updated_at INTEGER NOT NULL
active INTEGER NOT NULL DEFAULT 1
```

V1:

```text
type = torrent
```

---

# 15. Torrent Sources

Tabela:

```text
torrent_sources
```

Campos:

```text
source_id TEXT PRIMARY KEY
info_hash TEXT
magnet TEXT
torrent_file_path TEXT
name TEXT
total_size INTEGER
piece_length INTEGER
metadata_ready INTEGER NOT NULL DEFAULT 0
```

Índice:

```text
info_hash
```

---

# 16. Content Sources

Relacionamento N:N:

```text
content_sources
```

Campos:

```text
content_id TEXT NOT NULL
source_id TEXT NOT NULL
preferred_by_author INTEGER DEFAULT 0
created_at INTEGER NOT NULL
PRIMARY KEY(content_id, source_id)
```

---

# 17. Source Media Info

Tabela:

```text
source_media_info
```

Campos:

```text
source_id TEXT NOT NULL
file_id TEXT NOT NULL
resolution TEXT
width INTEGER
height INTEGER
video_codec TEXT
audio_codec TEXT
audio_channels TEXT
hdr_type TEXT
duration_seconds REAL
bitrate_bps INTEGER
file_size INTEGER
detected_at INTEGER
PRIMARY KEY(source_id, file_id)
```

---

# 18. Source Files

Tabela:

```text
source_files
```

Campos:

```text
source_id TEXT NOT NULL
file_id TEXT NOT NULL
path TEXT NOT NULL
name TEXT NOT NULL
extension TEXT
size INTEGER NOT NULL
offset INTEGER
first_piece INTEGER
last_piece INTEGER
is_video INTEGER DEFAULT 0
is_subtitle INTEGER DEFAULT 0
is_sample INTEGER DEFAULT 0
PRIMARY KEY(source_id, file_id)
```

---

# 19. Content Source Selectors

Tabela:

```text
content_source_selectors
```

Campos:

```text
content_id TEXT NOT NULL
source_id TEXT NOT NULL
selector_type TEXT NOT NULL
selector_value TEXT
season_number INTEGER
episode_number INTEGER
resolved_file_id TEXT
PRIMARY KEY(content_id, source_id)
```

Tipos:

```text
largest-video
filename
episode
manual
```

---

# 20. Libraries

Tabela:

```text
libraries
```

Campos:

```text
id TEXT PRIMARY KEY
kind TEXT NOT NULL
name TEXT NOT NULL
description TEXT
author_id TEXT
created_at INTEGER NOT NULL
updated_at INTEGER NOT NULL
active_version INTEGER
```

`kind`:

```text
local
remote
fork
```

---

# 21. Library Appearance

Tabela:

```text
library_appearance
```

Campos:

```text
library_id TEXT PRIMARY KEY
logo_asset_id TEXT
banner_asset_id TEXT
accent_color TEXT
```

---

# 22. Library Versions

Tabela:

```text
library_versions
```

Campos:

```text
library_id TEXT NOT NULL
version INTEGER NOT NULL
schema_version TEXT NOT NULL
content_hash TEXT NOT NULL
manifest_path TEXT NOT NULL
signature TEXT
signature_key_id TEXT
created_at INTEGER NOT NULL
PRIMARY KEY(library_id, version)
```

---

# 23. Library Memberships

Tabela:

```text
library_memberships
```

Campos:

```text
library_id TEXT NOT NULL
content_id TEXT NOT NULL
position INTEGER
added_in_version INTEGER
removed_in_version INTEGER
PRIMARY KEY(library_id, content_id)
```

---

# 24. Library Sections

Tabela:

```text
library_sections
```

Campos:

```text
library_id TEXT NOT NULL
section_id TEXT NOT NULL
type TEXT NOT NULL
title TEXT
position INTEGER NOT NULL
hero_content_id TEXT
metadata_json TEXT
PRIMARY KEY(library_id, section_id)
```

---

# 25. Section Items

Tabela:

```text
library_section_items
```

Campos:

```text
library_id TEXT NOT NULL
section_id TEXT NOT NULL
content_id TEXT NOT NULL
position INTEGER NOT NULL
PRIMARY KEY(library_id, section_id, content_id)
```

Índice:

```text
(library_id, section_id, position)
```

---

# 26. Collections

Opcional na v1 normalizada:

```text
collections
collection_items
```

Pode ser introduzida desde já para evitar sobrecarregar sections.

---

# 27. Library Assets

Tabela:

```text
library_assets
```

Campos:

```text
id TEXT PRIMARY KEY
library_id TEXT
type TEXT NOT NULL
source_type TEXT NOT NULL
path TEXT
remote_uri TEXT
content_hash TEXT
mime_type TEXT
width INTEGER
height INTEGER
size INTEGER
cached_path TEXT
created_at INTEGER
```

---

# 28. Source Origins

Tabela:

```text
source_origins
```

Campos:

```text
source_id TEXT NOT NULL
origin_type TEXT NOT NULL
origin_id TEXT NOT NULL
added_in_version INTEGER
removed_in_version INTEGER
PRIMARY KEY(source_id, origin_type, origin_id)
```

Exemplos:

```text
local
library
fork
```

---

# 29. Subscriptions

Tabela:

```text
library_subscriptions
```

Campos:

```text
library_id TEXT PRIMARY KEY
installed_version INTEGER NOT NULL
auto_update INTEGER NOT NULL DEFAULT 1
status TEXT NOT NULL
source_type TEXT NOT NULL
source_uri TEXT
last_checked_at INTEGER
created_at INTEGER NOT NULL
updated_at INTEGER NOT NULL
```

---

# 30. Subscription Status

Valores:

```text
active
paused
error
removed
```

---

# 31. Library Keys

Tabela:

```text
library_keys
```

Campos:

```text
library_id TEXT NOT NULL
key_id TEXT NOT NULL
algorithm TEXT NOT NULL
public_key TEXT NOT NULL
trusted_at INTEGER NOT NULL
status TEXT NOT NULL
PRIMARY KEY(library_id, key_id)
```

---

# 32. Sync Jobs

Tabela:

```text
library_sync_jobs
```

Campos:

```text
id TEXT PRIMARY KEY
library_id TEXT NOT NULL
from_version INTEGER
to_version INTEGER
state TEXT NOT NULL
started_at INTEGER
finished_at INTEGER
error_code TEXT
diff_json TEXT
```

---

# 33. User Content State

Tabela:

```text
user_content_state
```

Campos:

```text
content_id TEXT PRIMARY KEY
position_seconds REAL NOT NULL DEFAULT 0
duration_seconds REAL
watched INTEGER NOT NULL DEFAULT 0
favorite INTEGER NOT NULL DEFAULT 0
last_played_at INTEGER
completed_at INTEGER
created_at INTEGER NOT NULL
updated_at INTEGER NOT NULL
```

---

# 34. Regra crítica

`user_content_state` nunca deve depender de `library_id`.

O mesmo Content mantém:

```text
um estado do usuário
```

independentemente de onde aparece.

---

# 35. User Library Overrides

Tabela:

```text
user_library_overrides
```

Campos:

```text
library_id TEXT NOT NULL
content_id TEXT NOT NULL
hidden INTEGER NOT NULL DEFAULT 0
custom_title TEXT
custom_description TEXT
PRIMARY KEY(library_id, content_id)
```

---

# 36. User Source Overrides

Tabela:

```text
user_source_overrides
```

Campos:

```text
content_id TEXT PRIMARY KEY
preferred_source_id TEXT
updated_at INTEGER NOT NULL
```

---

# 37. Playback Preferences

Tabela:

```text
playback_preferences
```

Pode existir como singleton.

Campos:

```text
id INTEGER PRIMARY KEY CHECK(id = 1)
strategy TEXT
max_resolution TEXT
prefer_hdr INTEGER
auto_fallback INTEGER
auto_switch INTEGER
autoplay_next INTEGER
audio_language TEXT
subtitle_language TEXT
subtitle_policy TEXT
moonlight_disconnect_behavior TEXT
```

---

# 38. Downloads

Tabela:

```text
downloads
```

Campos:

```text
source_id TEXT PRIMARY KEY
mode TEXT NOT NULL
status TEXT NOT NULL
destination_path TEXT
progress REAL NOT NULL DEFAULT 0
bytes_completed INTEGER
bytes_total INTEGER
started_at INTEGER
completed_at INTEGER
updated_at INTEGER
```

`mode`:

```text
stream-only
keep
download
```

---

# 39. Download Status

```text
queued
active
paused
completed
error
cancelled
```

---

# 40. Torrent Runtime

Runtime normalmente vive em memória, mas snapshot útil pode ser persistido.

Tabela:

```text
torrent_runtime
```

Campos:

```text
source_id TEXT PRIMARY KEY
runtime_id TEXT
state TEXT
download_bps INTEGER
upload_bps INTEGER
peers_connected INTEGER
peers_useful INTEGER
progress REAL
buffer_seconds REAL
last_seen_at INTEGER
```

Não é fonte de verdade permanente.

---

# 41. Resume Entries

Tabela:

```text
resume_entries
```

Campos:

```text
source_id TEXT PRIMARY KEY
resume_file_path TEXT NOT NULL
content_hash TEXT
saved_at INTEGER NOT NULL
```

O payload de libtorrent deve ficar fora do DB quando binário for mais adequado.

---

# 42. Cache Entries

Tabela:

```text
cache_entries
```

Campos:

```text
id TEXT PRIMARY KEY
source_id TEXT
file_id TEXT
path TEXT NOT NULL
kind TEXT NOT NULL
size INTEGER NOT NULL
bytes_available INTEGER
retention_mode TEXT
protected INTEGER NOT NULL DEFAULT 0
last_access_at INTEGER
created_at INTEGER
```

---

# 43. Cache Kind

Valores:

```text
torrent-data
poster
backdrop
metadata
subtitle
temporary
```

---

# 44. Cache Retention

Valores:

```text
temporary
stream-only
keep
permanent
```

---

# 45. Health Snapshots

Tabela:

```text
health_snapshots
```

Pode armazenar apenas último estado por source.

Campos:

```text
source_id TEXT PRIMARY KEY
score REAL
displayed_score REAL
bars INTEGER
label TEXT
confidence REAL
streaming_ratio REAL
startup_estimate_ms INTEGER
sustainable_throughput_bps INTEGER
required_bitrate_bps INTEGER
useful_peers INTEGER
connected_peers INTEGER
wanted_piece_availability REAL
stability_score REAL
state TEXT
measured_at INTEGER
algorithm_version INTEGER
```

---

# 46. Health History

Tabela:

```text
health_history
```

Campos:

```text
id INTEGER PRIMARY KEY AUTOINCREMENT
source_id TEXT NOT NULL
measured_at INTEGER NOT NULL
startup_ms INTEGER
sustainable_throughput_bps INTEGER
average_ratio REAL
useful_peers INTEGER
stalls INTEGER
score REAL
confidence REAL
algorithm_version INTEGER
```

---

# 47. Retenção de Health History

Não crescer indefinidamente.

Estratégia:

```text
dados recentes detalhados
↓
agregação
↓
expiração
```

Exemplo:

```text
24h detalhado
30d agregado
```

A política exata pode mudar.

---

# 48. Playback Sessions

Tabela:

```text
playback_sessions
```

Campos:

```text
id TEXT PRIMARY KEY
content_id TEXT NOT NULL
source_id TEXT NOT NULL
stream_session_id TEXT
player_session_id TEXT
started_at INTEGER NOT NULL
ended_at INTEGER
start_position REAL
end_position REAL
startup_ms INTEGER
seek_count INTEGER DEFAULT 0
buffer_events INTEGER DEFAULT 0
status TEXT
```

---

# 49. Playback History

Pode ser derivada de `playback_sessions`.

Se necessário, manter tabela agregada separada.

---

# 50. Buffer Events

Tabela opcional para diagnóstico:

```text
playback_buffer_events
```

Campos:

```text
id INTEGER PRIMARY KEY
playback_session_id TEXT
started_at INTEGER
ended_at INTEGER
duration_ms INTEGER
```

---

# 51. Source Decisions

Tabela útil para debug:

```text
source_selection_decisions
```

Campos:

```text
id TEXT PRIMARY KEY
content_id TEXT NOT NULL
selected_source_id TEXT NOT NULL
strategy TEXT NOT NULL
score REAL
reason_codes_json TEXT
algorithm_version INTEGER
created_at INTEGER NOT NULL
```

---

# 52. Settings

Tabela genérica:

```text
settings
```

Campos:

```text
key TEXT PRIMARY KEY
value_json TEXT NOT NULL
updated_at INTEGER NOT NULL
```

Usar para preferências não suficientemente estruturadas.

---

# 53. Migrations

Tabela:

```text
schema_migrations
```

Campos:

```text
version INTEGER PRIMARY KEY
name TEXT NOT NULL
applied_at INTEGER NOT NULL
```

---

# 54. FTS

Busca local deve utilizar:

```text
SQLite FTS5
```

Tabela virtual sugerida:

```text
content_search
```

Indexar:

- title;
- original_title;
- description;
- library names;
- series title;
- episode title.

---

# 55. FTS Rebuild

Não reconstruir em todo startup.

Atualizar incrementalmente via aplicação.

---

# 56. Índices principais

```text
contents(type)

episodes(series_content_id, season_number, episode_number)

torrent_sources(info_hash)

content_sources(content_id)
content_sources(source_id)

library_memberships(library_id, position)
library_memberships(content_id)

library_sections(library_id, position)

library_section_items(library_id, section_id, position)

source_origins(source_id)

health_history(source_id, measured_at)

playback_sessions(content_id, started_at)

cache_entries(last_access_at)
cache_entries(source_id)
```

---

# 57. Foreign Keys

SQLite deve rodar com:

```text
PRAGMA foreign_keys = ON
```

FKs devem ser usadas onde fizer sentido.

---

# 58. Cascades

Usar `ON DELETE CASCADE` apenas quando ownership for inequívoco.

Exemplo adequado:

```text
library
→ sections
```

Exemplo perigoso:

```text
library
→ content
```

Não usar cascade nesse caso.

---

# 59. Content Ownership

Content é global.

Apagar library nunca apaga Content automaticamente.

---

# 60. Source Ownership

Source também pode ter múltiplas origins.

Apagar uma library remove apenas a origin/membership correspondente.

---

# 61. Garbage Collection de Content

Content só pode ser considerado órfão quando:

```text
sem library memberships
+
sem personal library membership
+
sem favorite
+
sem progress relevante
+
sem downloads
+
sem sources locais relevantes
```

Mesmo assim, GC deve ser conservador.

---

# 62. Garbage Collection de Source

Source pode ser removida quando:

```text
sem content_sources
ou
sem origins
+
sem active runtime
+
sem download
+
sem protected cache
```

---

# 63. Soft Delete

Para algumas entidades remotas, preferir:

```text
active = 0
```

antes de remoção física imediata.

Ajuda em rollback e sync.

---

# 64. Timestamps

Usar timestamps em:

```text
UTC
```

Formato recomendado no DB:

```text
INTEGER epoch milliseconds
```

ou segundos, desde que consistente.

---

# 65. IDs

Preferir:

```text
UUIDv7
ou
ULID
```

para entidades locais sem external ID.

---

# 66. IDs determinísticos

Contents com provider podem usar string determinística:

```text
movie:tmdb:157336
```

---

# 67. Source IDs

Source ID pode ser local:

```text
source:<uuid>
```

Mesmo quando infoHash existe.

O infoHash não deve necessariamente ser o PK porque:

- selectors podem diferir;
- mesma source torrent pode servir múltiplos conteúdos;
- versão futura pode ter outros source types.

---

# 68. Library IDs

Local:

```text
library:<uuid>
```

Remoto pode preservar ID publicado.

---

# 69. Transaction Boundaries

Operações críticas devem ser transacionais.

Exemplos:

```text
import library
apply update
fork library
remove subscription
create content + source
```

---

# 70. Import Transaction

Fluxo:

```text
BEGIN
↓
insert/update contents
↓
insert/update sources
↓
insert library
↓
insert memberships
↓
insert sections
↓
COMMIT
```

Se falhar:

```text
ROLLBACK
```

---

# 71. Sync Staging

Versão nova pode ser persistida em staging fora das tabelas ativas ou com flag.

Somente após validação completa:

```text
activate version
```

---

# 72. Atomic Active Version

Atualizar:

```text
libraries.active_version
```

na mesma transação que aplica memberships/sections ativas.

---

# 73. WAL

Configuração recomendada:

```text
PRAGMA journal_mode = WAL
```

Benefícios:

- leitura durante escrita;
- melhor concorrência local;
- boa integração com UI + background workers.

---

# 74. Busy Timeout

Configurar:

```text
PRAGMA busy_timeout
```

para evitar falhas imediatas em lock temporário.

---

# 75. Write Serialization

Mesmo com WAL, preferir camada única de escrita ou fila de comandos quando necessário.

---

# 76. Repository Layer

A aplicação não deve espalhar SQL pela UI.

Estrutura:

```text
repositories/
├── content.repository
├── source.repository
├── library.repository
├── playback.repository
├── health.repository
└── cache.repository
```

---

# 77. Domain Services

Acima dos repositories:

```text
LibraryService
ContentService
SourceService
PlaybackStateService
SubscriptionService
```

---

# 78. ORM

Pode usar:

```text
Prisma
Drizzle
Kysely
SQL direto
```

A escolha deve respeitar:

- SQLite;
- migrations;
- performance;
- FTS;
- transactions;
- baixo overhead.

---

# 79. Recomendação

Para esse projeto:

```text
Drizzle ou Kysely
```

podem oferecer mais controle de SQLite/FTS do que abstrações mais pesadas.

A decisão final pode ser tomada na spec de implementação.

---

# 80. JSON Fields

Usar JSON apenas para dados:

- extensíveis;
- pouco consultados;
- snapshots;
- reason codes.

Não usar JSON para substituir relacionamentos centrais.

---

# 81. Raw Provider JSON

Pode ser persistido em:

```text
content_metadata.raw_json
```

para evitar perda de informação.

---

# 82. Runtime Data

Não persistir cada alteração de:

```text
download speed
peer count
buffer
```

em alta frequência no DB.

Isso causaria write amplification.

---

# 83. Snapshot Frequency

Persistir runtime apenas:

```text
periodicamente
ou
em eventos significativos
```

---

# 84. In-memory State

Alta frequência fica em memória:

```text
torrent status
buffer
current health samples
player time
```

Persistência recebe agregados.

---

# 85. Playback Progress Writes

Não escrever a cada frame.

Exemplo:

```text
5–10s
+
pause
+
seek
+
exit
```

---

# 86. Health Writes

Health snapshot pode atualizar:

```text
cada 5–30s
```

dependendo do contexto.

History pode ser ainda menos frequente.

---

# 87. Cache Index vs Filesystem

Filesystem é fonte física.

DB é índice operacional.

Se divergirem:

```text
filesystem validation
↓
repair index
```

---

# 88. Startup Recovery

No startup:

```text
open DB
↓
run migrations
↓
validate critical paths
↓
load catalog
↓
load user state
↓
restore runtimes in background
```

---

# 89. Não bloquear startup

Reconciliation pesado:

```text
cache scan
full torrent recheck
asset verification
```

deve ocorrer em background.

---

# 90. Backup

Arquivos importantes:

```text
app.db
library manifests
resume data
user config
```

devem poder ser copiados para backup.

---

# 91. Backup consistente

Se fizer backup do SQLite em runtime:

```text
usar backup API
```

ou checkpoint apropriado.

---

# 92. Restore

Restaurar banco deve recuperar:

- catalog;
- user state;
- subscriptions;
- settings.

Assets/cache podem ser reconstruídos.

---

# 93. Dados reconstruíveis

Podem ser descartados/recriados:

```text
posters cache
backdrops cache
health snapshots
runtime snapshots
search index
```

---

# 94. Dados não reconstruíveis facilmente

Preservar:

```text
user state
favorites
local libraries
local mappings
source overrides
subscriptions
trusted keys
```

---

# 95. Encryption

Não é obrigatório criptografar todo DB na v1.

Secrets/tokens remotos devem usar armazenamento seguro do sistema operacional quando existirem.

---

# 96. Tokens

Nunca guardar token sensível em:

```text
plain settings JSON
```

quando houver alternativa de credential store.

---

# 97. Privacy

Playback history e favorites permanecem locais por default.

---

# 98. Data Retention

Usuário deve poder limpar:

- health history;
- playback history;
- cache;
- logs.

Sem apagar necessariamente biblioteca.

---

# 99. Delete User Data

Ações devem ser específicas.

Exemplo:

```text
Limpar histórico
Limpar cache
Remover biblioteca
Apagar arquivos baixados
```

Nunca misturar silenciosamente.

---

# 100. Schema Versioning

DB possui versão independente de:

```text
Manifest Schema
Registry API
IPC Protocol
```

---

# 101. Migration Policy

Cada release que muda DB:

```text
migration forward
```

Deve evitar migrations destrutivas sem backup/compatibilidade.

---

# 102. Expand-and-Contract

Para mudanças grandes:

```text
add new column/table
↓
migrate data
↓
switch reads
↓
remove old later
```

---

# 103. Migration Failure

Se falhar:

```text
não iniciar parcialmente
```

Mostrar erro recuperável e preservar DB original quando possível.

---

# 104. Migration Backup

Para migrations críticas:

```text
backup before apply
```

é recomendado.

---

# 105. Integrity Checks

Pode usar:

```text
PRAGMA integrity_check
```

em diagnóstico/recovery.

Não precisa rodar a cada startup.

---

# 106. Search Model

FTS deve refletir:

```text
Content global
```

e memberships podem ser retornadas separadamente.

Não duplicar o mesmo título por library sem necessidade.

---

# 107. Search Result

Modelo:

```ts
interface SearchResult {
  contentId: string;
  title: string;
  type: string;
  memberships: string[];
}
```

---

# 108. Continue Watching Query

Exemplo conceitual:

```sql
WHERE watched = 0
AND position_seconds > 0
ORDER BY last_played_at DESC
```

---

# 109. Recent Contents

Pode usar:

```text
library_memberships.added_in_version
```

ou timestamps locais.

---

# 110. Favorites Query

```text
user_content_state.favorite = 1
```

---

# 111. Library Render Query

Pipeline:

```text
library_sections
↓
section_items
↓
contents
↓
metadata
↓
user_state
↓
overrides
```

Pode ser materializado em View/DTO no repository layer.

---

# 112. Avoid N+1

Queries de Home devem carregar dados em lote.

---

# 113. Pagination

Grandes grids devem usar:

```text
limit / cursor
```

mesmo que UI virtualize.

---

# 114. Cursor

Preferir cursor por:

```text
position + id
```

onde fizer sentido.

---

# 115. Content Merge

Se Content local depois for identificado como TMDB conhecido:

```text
local id
→ canonical external id
```

precisa de operação de merge.

---

# 116. Merge Operation

Deve migrar:

- memberships;
- sources;
- user state;
- favorites;
- history;
- overrides.

---

# 117. Merge Safety

Se ambos já existirem:

```text
merge conservador
```

não sobrescrever estado melhor sem regra explícita.

---

# 118. Source Merge

Duas sources descobertas com mesmo infoHash podem ser consolidadas.

Mas selectors/content relationships devem ser preservados.

---

# 119. Episode Merge

Nunca unir episódios apenas porque arquivos são semelhantes.

Identidade de episódio depende de série + season + episode/provider.

---

# 120. Local Content

Conteúdo sem provider continua totalmente suportado.

---

# 121. Custom Metadata

Pode existir tabela:

```text
content_local_overrides
```

se o usuário editar metadata global localmente.

Não confundir com:

```text
library-specific overrides
```

---

# 122. Data Ownership Matrix

```text
Content
→ global local catalog

Source
→ global local catalog

Library
→ local or remote layer

User State
→ user local

Health
→ runtime/local

Manifest Version
→ remote/local snapshot

Cache
→ rebuildable local
```

---

# 123. Runtime Ownership Matrix

```text
torrentd
→ torrent runtime state

Core
→ domain state

MPV
→ player runtime

SQLite
→ persistent state
```

---

# 124. Data Flow — Playback

```text
Content
↓
ContentSources
↓
Source Selection
↓
Torrent Runtime
↓
Playback Session
↓
User State
```

---

# 125. Data Flow — Shared Library

```text
Manifest
↓
Library Version
↓
Memberships
↓
Contents
↓
Sources
↓
Local Overrides
↓
Final View
```

---

# 126. Data Flow — Health

```text
torrentd metrics
↓
in-memory samples
↓
Health Snapshot
↓
optional persistent snapshot
↓
Health History aggregate
```

---

# 127. Data Flow — Search

```text
Content Metadata
↓
FTS index
↓
Search Result
↓
Membership lookup
```

---

# 128. Data Flow — Cache

```text
Torrent/Metadata/Asset
↓
filesystem
↓
cache_entries
↓
LRU
↓
eviction
```

---

# 129. Data Consistency Rule

DB nunca deve apontar para:

```text
active library version
```

que não possui manifest local válido.

---

# 130. File Path Rule

Persistir caminhos canônicos controlados pelo app.

Remote manifests nunca escrevem paths locais arbitrários diretamente no DB operacional.

---

# 131. Manifest Path Resolution

Manifest:

```text
assets/logo.webp
```

vira:

```text
<library-cache>/<id>/<version>/assets/logo.webp
```

após sandbox/validation.

---

# 132. Source Torrent Files

`.torrent` importado deve ser copiado para área gerenciada quando necessário.

Não depender eternamente de arquivo original em Desktop/Downloads.

---

# 133. Library Export

Export lê do modelo persistente e gera manifest novamente.

Não exportar DB bruto.

---

# 134. Deterministic Export

Mesma versão lógica deve produzir conteúdo canonicalmente equivalente.

---

# 135. Diagnóstico

Tela técnica pode ler:

```text
DB size
content count
source count
library count
cache size
health history size
WAL size
```

---

# 136. Maintenance Jobs

Jobs possíveis:

```text
cache GC
orphan source GC
old health cleanup
old version cleanup
FTS optimize
WAL checkpoint
```

---

# 137. Maintenance Priority

Nunca competir com playback.

Ordem:

```text
playback
torrent streaming
user interaction
sync
maintenance
```

---

# 138. WAL Checkpoint

Executar de forma controlada.

Evitar checkpoint pesado durante playback crítico.

---

# 139. VACUUM

Não rodar automaticamente com frequência.

Pode ser ação de manutenção ocasional.

---

# 140. Acceptance Criteria — Catalog

Considerado funcional quando:

1. Content existe separado de Source;
2. múltiplas libraries reutilizam Content;
3. múltiplas sources podem pertencer ao mesmo Content;
4. séries/episódios são representáveis;
5. metadata pode vir de provider ou local;
6. busca funciona sem depender da rede.

---

# 141. Acceptance Criteria — User State

Considerado funcional quando:

1. progresso sobrevive restart;
2. favorite sobrevive unsubscribe;
3. watched não depende da library;
4. source override sobrevive update remoto;
5. hidden item é scoped por library;
6. estado não é exportado no manifest.

---

# 142. Acceptance Criteria — Sharing

Considerado funcional quando:

1. library version é persistida;
2. active version troca atomicamente;
3. memberships podem ser removidas sem apagar Content;
4. trusted key é persistida;
5. sync jobs são auditáveis;
6. fork reutiliza Contents/Sources.

---

# 143. Acceptance Criteria — Runtime/Cache

Considerado funcional quando:

1. runtime de alta frequência não causa write storm;
2. resume data é persistido;
3. cache possui índice;
4. cache pode ser limpo sem perder user state;
5. active playback nunca é removido pelo GC;
6. health history tem retenção.

---

# 144. Relação com Functional Requirements

Atende principalmente:

```text
FR-001–037
Library, Content, Metadata, Sources

FR-045–060
Cache e Resume

FR-114–128
History e User State

FR-133–167
Shared Libraries

FR-168–180
Search e Indexação
```

---

# 145. Relação com NFRs

Atende principalmente:

```text
NFR-014–017
Large libraries

NFR-043–060
Cache, persistence e atomicidade

NFR-079–082
Local scalability

NFR-128–136
Hydration e schema evolution

NFR-149–154
Resources e shutdown
```

---

# 146. Decisões fechadas

```text
Primary DB
= SQLite

Journal
= WAL

Search
= FTS5

Content
= global entity

Source
= separate global entity

Library membership
= relation

User State
= independent of library

Remote version
= immutable snapshot

Runtime metrics
= mostly memory

Cache
= filesystem + DB index

Manifest
= interchange format, not DB model
```

---

# 147. Próxima Etapa

Após o Data Model, os próximos documentos recomendados são:

```text
07-ipc-contracts.md
08-security-model.md
09-ux-navigation-spec.md
```

Depois disso, o projeto estará pronto para derivar:

```text
Epics
↓
Milestones
↓
Stories
↓
Goal files
```

---

# 148. Regra central

> **O banco deve preservar identidade e estado, mas nunca transformar dados temporários de runtime em acoplamento permanente.**
