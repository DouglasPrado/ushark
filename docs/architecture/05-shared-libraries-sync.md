# Ushark — Architecture 05: Shared Libraries & Sync

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

---

# 1. Objetivo

Este documento define como bibliotecas Ushark podem ser:

- criadas;
- exportadas;
- publicadas;
- compartilhadas;
- importadas;
- assinadas;
- sincronizadas;
- atualizadas;
- removidas;
- duplicadas;
- versionadas;
- verificadas.

O objetivo é permitir que uma biblioteca como:

```text
Compartilhado por Douglas
```

seja vista por outro usuário exatamente com:

- identidade;
- seções;
- ordem;
- destaques;
- conteúdos;
- fontes;
- apresentação;

definidos pelo autor, sem remover o controle local do assinante.

---

# 2. Princípio central

Biblioteca compartilhada é:

```text
curadoria versionada
```

e não:

```text
cópia da biblioteca inteira do computador do autor
```

O compartilhamento deve transferir prioritariamente:

```text
manifest
metadata declarativa
referências de Content
referências de Source
assets autorizados
versionamento
assinatura
```

Não deve depender de transferir arquivos audiovisuais pelo serviço central.

---

# 3. Modelo conceitual

```text
AUTHOR
   │
   ▼
Library Draft
   │
   ▼
Publish
   │
   ▼
Immutable Version
   │
   ▼
Library Registry / File
   │
   ▼
Subscriber
   │
   ▼
Validate
   │
   ▼
Import / Subscribe
   │
   ▼
Local Catalog
   │
   ├── Remote Structure
   ├── Local Metadata Cache
   ├── User Overrides
   └── User State
```

---

# 4. Entidades principais

O domínio de compartilhamento deve possuir pelo menos:

```text
Library
LibraryVersion
LibrarySubscription
LibraryAuthor
LibraryIdentity
LibraryAsset
LibrarySyncState
LibraryOverride
```

---

# 5. Library

Representa identidade lógica da biblioteca.

Exemplo:

```text
library:douglas:main
```

Não muda entre versões.

---

# 6. LibraryVersion

Representa uma publicação imutável.

Exemplo:

```text
library:douglas:main
v14
```

e:

```text
library:douglas:main
v15
```

são versões distintas da mesma biblioteca.

---

# 7. Versionamento

Cada publicação incrementa:

```text
version
```

Exemplo:

```text
v11
+ Blade Runner

v12
+ Duna

v13
reorganização

v14
nova source 4K
```

---

# 8. Imutabilidade

Depois de publicada:

```text
v14
```

nunca deve mudar.

Qualquer alteração:

```text
v14
↓
novo draft
↓
v15
```

---

# 9. Draft

Biblioteca editável deve existir como:

```text
draft
```

separada da versão publicada.

Fluxo:

```text
Published v14
↓
Create/Edit Draft
↓
Preview
↓
Validate
↓
Publish
↓
Published v15
```

---

# 10. Draft não sincroniza automaticamente

Alterações de draft não devem aparecer para assinantes até publicação explícita.

---

# 11. Library Identity

Modelo conceitual:

```ts
interface LibraryIdentity {
  libraryId: string;
  authorId: string;
  name: string;
}
```

---

# 12. Library Version Model

```ts
interface LibraryVersion {
  libraryId: string;
  version: number;
  schemaVersion: string;
  contentHash: string;
  createdAt: string;
  signature?: LibrarySignature;
}
```

---

# 13. Library Subscription

Representa vínculo local com biblioteca remota.

```ts
interface LibrarySubscription {
  libraryId: string;
  installedVersion: number;
  autoUpdate: boolean;
  source: SubscriptionSource;
  identityKey?: string;
  createdAt: string;
  lastCheckedAt?: string;
}
```

---

# 14. Formas de compartilhamento

V1 deve suportar conceitualmente duas formas:

```text
arquivo
link/código remoto
```

---

# 15. Export por arquivo

Formato sugerido:

```text
.tslib
```

Pode internamente ser:

```text
ZIP
```

com estrutura controlada.

---

# 16. Estrutura de pacote

Exemplo:

```text
douglas-library.tslib
│
├── manifest.json
├── assets/
│   ├── logo.webp
│   └── banner.webp
├── sources/
│   └── optional.torrent
└── signature.json
```

---

# 17. O pacote não deve incluir mídia automaticamente

Não incluir:

```text
.mkv
.mp4
.avi
```

por default.

O pacote é de:

```text
biblioteca
```

não de:

```text
conteúdo audiovisual
```

---

# 18. Remote Sharing

Uma biblioteca publicada remotamente pode usar:

```text
ushark://library/<id>
```

ou uma URL HTTPS associada.

---

# 19. Library Registry

Serviço opcional responsável por:

```text
resolver library ID
informar latest version
entregar manifest
entregar assets
entregar assinatura
```

---

# 20. O Registry não deve ser necessário para biblioteca local

O Ushark deve continuar funcionando sem Registry.

---

# 21. Registry mínimo

API conceitual:

```text
GET /libraries/:id
GET /libraries/:id/versions/:version
GET /libraries/:id/latest
GET /libraries/:id/assets/:asset
```

---

# 22. Publicação

Fluxo:

```text
Draft
↓
Validate Schema
↓
Validate References
↓
Validate Assets
↓
Canonicalize Manifest
↓
Generate Hash
↓
Sign
↓
Create Version
↓
Publish
```

---

# 23. Canonicalização

Antes de calcular hash e assinatura, o manifest deve possuir representação determinística.

Objetivo:

```text
mesmo conteúdo
=
mesmo hash
```

---

# 24. Content Hash

Exemplo:

```text
SHA-256(canonical manifest)
```

Serve para:

- integridade;
- cache;
- assinatura;
- debug;
- detectar alteração.

---

# 25. Assinatura

Bibliotecas podem ser assinadas usando:

```text
Ed25519
```

como proposta inicial.

---

# 26. O que deve ser assinado

Assinar pelo menos:

```text
libraryId
version
contentHash
schemaVersion
author identity
```

---

# 27. Signature Model

```ts
interface LibrarySignature {
  algorithm: 'ed25519';
  keyId: string;
  value: string;
}
```

---

# 28. Identidade do autor

Primeira publicação assinada pode estabelecer:

```text
author public key
```

localmente para aquela subscription.

---

# 29. Trust on First Use

Modelo possível:

```text
TOFU
Trust On First Use
```

Ao importar pela primeira vez:

```text
esta biblioteca é assinada por esta chave
```

Usuário aceita.

Depois:

```text
mesma libraryId
+
outra key
```

não deve ser aceita silenciosamente.

---

# 30. Key Change

Se chave mudar:

```text
A identidade desta biblioteca mudou.
```

Exigir ação explícita.

---

# 31. Verificação da importação

Antes de persistir:

```text
parse
↓
schema validate
↓
size limits
↓
path validation
↓
hash verification
↓
signature verification
↓
semantic validation
```

---

# 32. Semantic Validation

Além do JSON Schema, validar:

- IDs duplicados;
- referências inexistentes;
- sections inválidas;
- source IDs inexistentes;
- circularidade proibida;
- asset refs inválidas;
- versões inconsistentes.

---

# 33. Import Preview

Antes de confirmar:

```text
Compartilhado por Douglas

Versão 14

82 filmes
14 séries
18 seções

Assinatura válida

[ Importar ]
```

---

# 34. Import sem assinatura

Permitido, mas indicar:

```text
Biblioteca não assinada
```

Não tratar automaticamente como maliciosa apenas por isso.

---

# 35. Import com assinatura inválida

Default:

```text
bloquear
```

e informar claramente.

---

# 36. Subscription Creation

Após import remoto confirmado:

```text
create subscription
↓
install version
↓
index
↓
hydrate metadata
↓
render
```

---

# 37. Instalação local

O manifest remoto não deve ser usado diretamente a cada abertura.

Após validar:

```text
persist locally
```

---

# 38. Local Snapshot

Guardar cópia exata da versão instalada.

Exemplo:

```text
data/libraries/<libraryId>/versions/14/manifest.json
```

---

# 39. Active Version Pointer

Manter referência local:

```text
activeVersion = 14
```

---

# 40. Sync Check

Fluxo:

```text
subscription
↓
check latest
↓
remote v15
local v14
↓
update available
```

---

# 41. Auto Update

Configuração:

```text
autoUpdate = true
```

permite update automático após validação.

---

# 42. Manual Update

Usuário também pode exigir:

```text
Verificar atualizações
```

---

# 43. Update Pipeline

```text
Fetch Metadata
↓
Fetch Manifest
↓
Validate
↓
Verify Hash
↓
Verify Signature
↓
Semantic Validation
↓
Prepare Diff
↓
Stage
↓
Commit
```

---

# 44. Staging

Nova versão deve ser armazenada em área separada.

Exemplo:

```text
staging/v15
```

Nunca sobrescrever v14 diretamente.

---

# 45. Commit Atômico

Depois de validar:

```text
activeVersion: 14
↓
atomic switch
↓
activeVersion: 15
```

---

# 46. Falha antes do commit

Resultado:

```text
v14 continua ativa
```

---

# 47. Falha depois do commit

Se persistência indicar commit concluído:

```text
v15 é ativa
```

Operação deve ser idempotente ao reabrir.

---

# 48. Update Diff

Antes de aplicar, calcular:

```text
added contents
removed contents
updated contents
added sources
removed sources
changed sections
changed assets
```

---

# 49. UI de atualização

Exemplo:

```text
Compartilhado por Douglas foi atualizado

+ 3 filmes
+ 1 série
- 1 item removido
```

---

# 50. Delta Download

Registry pode futuramente enviar diff.

V1 pode baixar manifest completo.

Como manifests são pequenos:

```text
simplicidade > otimização prematura
```

---

# 51. Metadata Reuse

Novo manifest não deve forçar redownload de metadata já cacheada quando contentId não mudou.

---

# 52. Asset Reuse

Assets identificados por hash podem ser reutilizados.

---

# 53. Content Deduplication

Import:

```text
remote contentId
↓
lookup local
```

Se já existe:

```text
reuse Content
```

Criar apenas membership.

---

# 54. Source Deduplication

Se infoHash e selector representarem mesma source:

```text
reuse source runtime/catalog entry
```

---

# 55. Membership

Biblioteca não é dona exclusiva do Content.

Modelo:

```text
Library
↕
LibraryContent
↕
Content
```

---

# 56. Source Origin

Pode existir relação:

```text
source_origin
```

indicando:

```text
local
library:douglas:main
library:scifi-br
```

---

# 57. Source Lifetime

Se uma subscription remover source:

```text
remover origin
```

Mas só remover source global quando:

```text
nenhuma origin
+
não salva localmente
+
não necessária por download
```

---

# 58. User State é separado

Nunca aplicar do manifest:

```text
watched
position
favorite
lastPlayed
```

---

# 59. User Override é separado

Nunca sobrescrever:

```text
preferred source
hidden item
local title override
local retention mode
```

durante sync.

---

# 60. Resolution Pipeline

UI final:

```text
Remote Manifest
+
Global Content Metadata
+
Library Display Overrides
+
User Overrides
+
User State
+
Runtime Health
=
Final View
```

---

# 61. Prioridade das camadas

Para comportamento local:

```text
1. User Override
2. Runtime detected data
3. Manifest
4. Provider data
```

Para apresentação da biblioteca:

```text
1. Library display override
2. Provider metadata
3. fallback
```

---

# 62. Item removido remotamente

Quando v15 remove Content:

```text
remove membership
```

Não remover:

- Content global;
- progresso;
- favorito;
- download;
- cache protegido;
- membership em outra biblioteca.

---

# 63. Content local preservado

Se usuário marcou:

```text
Adicionar à Minha Biblioteca
```

ele permanece após remoção remota.

---

# 64. Hidden Item

Usuário pode ocultar item dentro de uma subscription.

Persistir:

```text
libraryId
contentId
hidden = true
```

---

# 65. Hidden Item e update

Se o autor reorganizar o item:

```text
hidden continua true
```

---

# 66. Source Override

Se usuário preferiu source X:

```text
update remoto não deve apagar
```

---

# 67. Override órfão

Se source X deixar de existir:

```text
preservar referência histórica
+
marcar como unavailable
+
usar fallback temporário
```

Usuário pode remover override depois.

---

# 68. Unsubscribe

Fluxo:

```text
Library Settings
↓
Remove Subscription
↓
Confirm
↓
remove membership/origins
↓
preserve local state
```

---

# 69. Unsubscribe não apaga

Por padrão, preservar:

- progress;
- favorites;
- personal library contents;
- downloaded files;
- local sources.

---

# 70. Limpeza pós-unsubscribe

Dados exclusivos da subscription podem virar candidatos:

```text
unused manifests
unused assets
unused sources
```

para garbage collection.

---

# 71. Garbage Collection

Nunca deve executar antes de verificar referências.

Exemplo:

```text
asset referenced by library B
→ keep
```

---

# 72. Fork

Permitir:

```text
subscription
↓
fork
↓
new local library
```

---

# 73. Fork Identity

Gerar:

```text
new libraryId
```

---

# 74. Fork Content

Reutilizar Content e Sources locais.

Não duplicar objetos desnecessariamente.

---

# 75. Fork Presentation

Copiar:

- sections;
- ordem;
- appearance;
- memberships;
- overrides de apresentação do autor.

---

# 76. Fork Subscription

Novo fork:

```text
não possui vínculo automático
```

com origem.

---

# 77. Fork Provenance

Opcionalmente registrar:

```text
forkedFromLibraryId
forkedFromVersion
```

para auditoria.

---

# 78. Republishing Fork

Usuário pode futuramente publicar seu fork como biblioteca nova.

---

# 79. Conflitos

Como remote e local são camadas distintas, evitar merge destrutivo.

A maioria dos conflitos é resolvida por:

```text
layer precedence
```

---

# 80. Exemplo de conflito — Source

Remote:

```text
preferredSource = A
```

Local:

```text
sourceOverride = B
```

Resultado:

```text
B
```

---

# 81. Exemplo de conflito — Título

Provider:

```text
Interstellar
```

Library override:

```text
Interestelar
```

User local override:

```text
Meu filme favorito
```

Se existir suporte a user title override:

```text
Meu filme favorito
```

---

# 82. Exemplo de conflito — Removal

Remote remove Content.

User adicionou à My Library.

Resultado:

```text
remove apenas remote membership
```

---

# 83. Conflitos de versão

Se local active version:

```text
15
```

e Registry responde:

```text
14
```

não fazer downgrade automático.

---

# 84. Rollback

Rollback deve ser ação explícita.

Exemplo:

```text
Restaurar versão 14
```

---

# 85. Local Version History

Manter últimas versões conforme política.

Exemplo:

```text
14
15
16
```

---

# 86. Retention de versões

Pode configurar:

```text
keep last 3
```

ou tamanho máximo.

---

# 87. Version Garbage Collection

Nunca remover:

```text
active version
staging version
rollback protected version
```

---

# 88. Publish Permissions

Somente autor/editor autorizado pode publicar nova versão em Registry.

---

# 89. Authentication do Registry

Se houver serviço central:

```text
login/token
```

é separado da assinatura criptográfica.

---

# 90. Auth ≠ Signature

Autenticação responde:

> Quem pode publicar neste Registry?

Assinatura responde:

> Este manifest foi assinado por esta identidade?

---

# 91. Registry Storage

Serviço central precisa armazenar principalmente:

```text
library metadata
versions
manifest blobs
asset blobs
author public keys
```

---

# 92. Registry não armazena mídia por default

Evitar:

```text
video hosting
```

como responsabilidade central.

---

# 93. Remote `.torrent` files

Se manifest incluir `.torrent` permitido:

```text
Registry pode armazenar pequenos source artifacts
```

sujeitos às regras legais/políticas do operador.

---

# 94. Magnet-only Mode

Uma biblioteca pode conter somente magnets, reduzindo tamanho de pacote.

---

# 95. Privacy Modes

Biblioteca pode futuramente possuir:

```text
private
unlisted
public
```

---

# 96. Private

Requer autorização para obter manifest.

---

# 97. Unlisted

Quem possui link/código pode importar.

Não aparece em descoberta pública.

---

# 98. Public

Pode aparecer em catálogo público, se feature existir.

Descoberta pública fica fora da v1 obrigatória.

---

# 99. Share Code

Registry pode mapear:

```text
ABC123
```

para:

```text
libraryId
```

---

# 100. Deep Link

Aplicativo pode registrar:

```text
ushark://
```

para abrir import.

---

# 101. Deep Link Security

Nunca importar automaticamente sem preview/validação.

---

# 102. Export File Security

`.tslib` deve ser tratado como input não confiável.

---

# 103. ZIP Bomb Protection

Se `.tslib` usar ZIP:

- limitar tamanho expandido;
- limitar quantidade de arquivos;
- limitar profundidade;
- rejeitar path traversal;
- rejeitar links perigosos.

---

# 104. Asset Security

Assets permitidos inicialmente:

```text
image
torrent file
json
```

Não permitir executáveis.

---

# 105. MIME e Magic Bytes

Validar conteúdo por mais de uma fonte quando possível.

---

# 106. Path Sandbox

Dentro do pacote, paths devem ser relativos.

Válido:

```text
assets/logo.webp
```

Inválido:

```text
../../AppData/...
```

---

# 107. Remote Asset Policy

Downloads remotos:

- HTTPS por default;
- timeout;
- size limit;
- MIME validation;
- cache local.

---

# 108. SSRF Protection

Se o cliente aceitar URLs arbitrárias de assets, deve bloquear destinos locais/sensíveis quando aplicável.

Preferível:

```text
Registry-managed asset IDs
```

em vez de URLs irrestritas.

---

# 109. Manifest Size Limit

Definir na implementação.

Exemplo inicial:

```text
10–50 MB
```

dependendo do formato e quantidade de itens.

---

# 110. Asset Size Limit

Imagens individuais devem possuir limite.

---

# 111. Item Limit

Parser deve definir teto operacional.

Exemplo:

```text
100k items
```

muito acima do uso normal, mas finito.

---

# 112. Section Limit

Também finito.

Exemplo:

```text
1k sections
```

---

# 113. String Limits

Campos como:

```text
name
description
title
```

devem possuir limites.

---

# 114. Sync State Machine

```text
idle
↓
checking
↓
update-available
↓
downloading
↓
validating
↓
staging
↓
applying
↓
ready
```

Erro:

```text
error
```

---

# 115. Subscription Status

```text
active
paused
error
removed
```

---

# 116. Pause Sync

Usuário pode pausar updates automáticos.

Biblioteca instalada continua utilizável.

---

# 117. Offline Sync

Sem internet:

```text
skip update check
```

Não marcar biblioteca como quebrada.

---

# 118. Backoff

Falhas remotas devem utilizar retry com backoff.

---

# 119. Não bloquear startup

Sync nunca deve bloquear Home.

---

# 120. Sync Scheduler

Checks podem ocorrer:

```text
startup delayed
manual
periodic
```

Sem necessidade de consulta a cada navegação.

---

# 121. Conditional Requests

Registry pode suportar:

```text
ETag
If-None-Match
```

ou versão numérica simples.

---

# 122. Latest Endpoint

Resposta mínima:

```json
{
  "libraryId": "library:douglas:main",
  "latestVersion": 15,
  "contentHash": "..."
}
```

---

# 123. Idempotência de Sync

Aplicar v15 duas vezes deve produzir mesmo estado.

---

# 124. Concurrent Sync

Evitar duas sincronizações simultâneas da mesma library.

---

# 125. Multi-Library Sync

Diferentes libraries podem sincronizar em paralelo com limite global.

---

# 126. Sync Priority

Prioridade:

```text
manual sync
active library
background subscriptions
```

---

# 127. Asset Downloads

Podem ocorrer depois do manifest estar ativo.

Exemplo:

```text
manifest ready
↓
library renders
↓
missing posters hydrate
```

---

# 128. Progressive Hydration

Não esperar:

```text
all images
all provider metadata
all health scores
```

para mostrar biblioteca.

---

# 129. Metadata Provider Resolution

Content com TMDB ID:

```text
local cache
↓
provider refresh if needed
```

---

# 130. Provider Failure

Não invalida manifest.

---

# 131. Missing Content Metadata

Pode usar fallback do próprio manifest.

---

# 132. Library Display Overrides

Curador pode definir:

- custom title;
- custom description;
- custom image;
- section placement.

---

# 133. Override Scope

Override deve ser escopado:

```text
libraryId + contentId
```

Não alterar Content global.

---

# 134. Shared Layout

Author controla:

```text
hero
sections
order
collections
```

---

# 135. Subscriber não altera remote layout

Mudanças pessoais devem existir como:

```text
local customization
```

sem editar manifest remoto.

---

# 136. Local Reordering

Fora da v1 obrigatória para subscriptions.

Usuário pode criar coleção própria em vez de alterar layout remoto.

---

# 137. Search Integration

Contents importados entram no índice global.

---

# 138. Search Membership

Busca pode mostrar:

```text
Presente em:
Compartilhado por Douglas
```

---

# 139. Discovery

Catálogo público de libraries é feature futura.

Não é necessário para sharing básico.

---

# 140. Ratings e Comments

Fora da v1.

Shared library não deve depender de camada social.

---

# 141. User Accounts

Aplicativo local pode funcionar sem conta.

Conta só deve ser obrigatória para features remotas que realmente precisem dela.

---

# 142. Export sem conta

`.tslib` deve funcionar offline.

---

# 143. Import sem conta

Arquivo local também.

---

# 144. Remote Publish com conta

Registry pode exigir conta para publicação.

---

# 145. Remote Subscription sem conta

Pode ser permitida para libraries públicas/unlisted, dependendo do Registry.

---

# 146. Author Profile

Opcional:

```text
name
avatar
description
```

Não deve ser necessário para funcionamento técnico.

---

# 147. Delete Remote Library

Autor pode remover publicação do Registry.

---

# 148. Subscriber após Remote Delete

Versão já instalada continua localmente.

Estado:

```text
remote unavailable
```

---

# 149. Remote Delete não apaga local

Nunca apagar silenciosamente subscription snapshot ou user state.

---

# 150. Author Deprecation

Autor pode marcar:

```text
deprecated
```

e indicar biblioteca sucessora no futuro.

---

# 151. Library Migration

Feature futura pode permitir:

```text
library A
→ library B
```

com aprovação do usuário.

---

# 152. Integrity Audit

Cliente pode verificar periodicamente:

```text
manifest hash
asset hashes
```

---

# 153. Repair

Se asset corrompido:

```text
redownload asset
```

Se manifest ativo corrompido:

```text
restore local previous version
ou
redownload same immutable version
```

---

# 154. Backup

Como manifests são pequenos, manter snapshots facilita recuperação.

---

# 155. Database Model

Tabelas conceituais:

```text
libraries
library_versions
library_subscriptions
library_memberships
library_sections
library_section_items
library_assets
library_source_origins
library_user_overrides
library_sync_jobs
library_keys
```

---

# 156. libraries

Campos:

```text
id
name
author_id
kind
created_at
```

`kind`:

```text
local
remote
fork
```

---

# 157. library_versions

Campos:

```text
library_id
version
schema_version
content_hash
manifest_path
signature
created_at
```

---

# 158. library_subscriptions

Campos:

```text
library_id
installed_version
auto_update
status
source_type
source_uri
last_checked_at
```

---

# 159. library_memberships

Campos:

```text
library_id
content_id
position
```

---

# 160. library_sections

Campos:

```text
library_id
section_id
type
title
position
```

---

# 161. library_source_origins

Campos:

```text
library_id
source_id
version_added
version_removed
```

---

# 162. library_user_overrides

Campos:

```text
library_id
content_id
hidden
preferred_source_id
```

---

# 163. library_keys

Campos:

```text
library_id
key_id
public_key
trusted_at
status
```

---

# 164. Sync Job Model

```ts
interface LibrarySyncJob {
  id: string;
  libraryId: string;
  fromVersion: number;
  toVersion: number;
  state: SyncState;
  startedAt: string;
  finishedAt?: string;
  errorCode?: string;
}
```

---

# 165. Sync Logs

Registrar:

- fromVersion;
- toVersion;
- hash;
- signature result;
- added items;
- removed items;
- duration;
- failure reason.

---

# 166. Error Codes

Exemplos:

```text
LIBRARY_FETCH_FAILED
LIBRARY_SCHEMA_INVALID
LIBRARY_SIGNATURE_INVALID
LIBRARY_HASH_MISMATCH
LIBRARY_PATH_INVALID
LIBRARY_ASSET_TOO_LARGE
LIBRARY_VERSION_ROLLBACK
LIBRARY_IDENTITY_CHANGED
LIBRARY_SEMANTIC_INVALID
LIBRARY_SYNC_CONFLICT
```

---

# 167. Recoverable Errors

Exemplo:

```text
network timeout
asset failure
provider metadata timeout
```

---

# 168. Fatal Import Errors

Exemplo:

```text
signature invalid
manifest malformed
path traversal
unsupported major schema
```

---

# 169. UI Error Example

```text
Não foi possível atualizar esta biblioteca.

A versão anterior continua disponível.

[ Tentar novamente ]
```

---

# 170. Security Error Example

```text
Esta biblioteca não pôde ser importada porque sua assinatura é inválida.
```

---

# 171. Preview Mode

Antes de publicar ou importar, usar renderer seguro baseado no modelo já validado.

Nunca renderizar HTML arbitrário do manifest.

---

# 172. Publish Preview

Curador deve ver:

```text
Visualizar como assinante
```

---

# 173. Diff Preview

Antes de publicar nova versão, mostrar:

```text
+ 5 contents
- 2 contents
3 sections reordered
1 source changed
```

---

# 174. Publish Confirmation

Publicação gera versão imutável.

Pode exigir confirmação:

```text
Publicar v15?
```

---

# 175. Publish Rollback Mental Model

Nunca "editar v15".

Para desfazer:

```text
criar v16
baseada em v14
```

ou reativar versão localmente conforme ferramenta.

---

# 176. Author Source Replacement

Se autor troca source A por B:

```text
Content identity permanece
```

Subscribers recebem nova origin/source.

---

# 177. Subscriber Override após Replacement

Se override apontava para A e A desapareceu:

```text
override fica unresolved
```

Sistema escolhe fallback temporário.

---

# 178. Source Health não sincroniza

Health Score é runtime local.

Nunca publicar como verdade global.

---

# 179. Playback State não sincroniza na v1

Sem sync cloud de progresso.

---

# 180. Favorites não sincronizam na v1

Continuam locais.

---

# 181. Health History não sincroniza

Local por default.

---

# 182. Shared Library não dita qualidade final

Curador define sources.

Cliente decide a melhor com:

```text
Source Selection Engine
```

---

# 183. Author Preferred Source

Pode existir:

```text
preferred
```

como recomendação.

Não força runtime.

---

# 184. Offline Subscription

Se Registry indisponível:

```text
installed version remains usable
```

---

# 185. Air-gapped Sharing

`.tslib` permite compartilhamento totalmente offline.

---

# 186. Library Portability

Biblioteca deve poder ser exportada e importada sem depender do banco interno original.

---

# 187. Stable IDs

IDs no manifest devem permanecer estáveis entre versões sempre que a entidade for a mesma.

---

# 188. Reorder não recria ID

Mover section ou item não muda:

```text
sectionId
contentId
```

---

# 189. Rename não recria ID

Renomear library/section também não.

---

# 190. Deleting and Re-adding

Se mesmo Content voltar depois:

```text
reutilizar contentId
```

---

# 191. Assets Content Addressed

Opcionalmente:

```text
asset hash
```

pode funcionar como ID/cache key.

---

# 192. CDN

Registry pode usar CDN para assets e manifests.

Não afeta formato.

---

# 193. Compression

Manifests podem ser comprimidos no transporte.

Conteúdo lógico permanece JSON/schema definido.

---

# 194. API Versioning

Registry API deve possuir versão independente do manifest schema.

Exemplo:

```text
/api/v1
```

---

# 195. Registry Scalability

Como não hospeda vídeo, demanda principal é:

```text
small JSON
images
torrent metadata artifacts
```

facilitando operação barata.

---

# 196. Registry Stateless API

Preferível separar:

```text
API
metadata database
blob/object storage
```

---

# 197. Registry Database

Pode conter:

```text
users
authors
libraries
versions
keys
share codes
permissions
```

---

# 198. Blob Storage

Pode armazenar:

```text
manifest snapshots
assets
optional torrent files
```

---

# 199. Library Publish Transaction

No servidor:

```text
upload/stage blobs
↓
validate
↓
create DB version record
↓
mark published
```

Evitar version record apontando para blobs incompletos.

---

# 200. Concurrency Control

Dois publishes simultâneos devem evitar duplicar mesmo version number.

---

# 201. Optimistic Version Check

Publish request pode incluir:

```text
expectedLatestVersion
```

Se mudou:

```text
409 conflict
```

---

# 202. Draft Collaboration

Fora da v1.

Um autor por fluxo de edição é suficiente inicialmente.

---

# 203. Moderation

Se existir catálogo público no futuro, moderação vira camada separada.

Não pertence ao manifest core.

---

# 204. Abuse Controls

Registry remoto pode impor:

- rate limits;
- size limits;
- quotas;
- malicious file scanning.

---

# 205. Legal Neutrality

O protocolo de shared libraries deve ser neutro e aplicável a:

- conteúdo próprio;
- domínio público;
- Creative Commons;
- distribuição autorizada.

---

# 206. Registry Policy

Operador de Registry pode definir políticas próprias sobre materiais que aceita hospedar.

---

# 207. Acceptance Criteria — Export/Import

Considerado funcional quando:

1. biblioteca pode ser exportada para `.tslib`;
2. pacote pode ser importado em outro cliente;
3. layout e sections são preservados;
4. Content é deduplicado;
5. user state não vem no pacote;
6. path traversal é rejeitado;
7. pacote inválido não altera catálogo ativo;
8. preview aparece antes da confirmação.

---

# 208. Acceptance Criteria — Subscription

Considerado funcional quando:

1. usuário pode assinar library remota;
2. versão instalada é persistida;
3. app abre sem Registry;
4. updates são detectáveis;
5. update é validado antes de aplicar;
6. commit é atômico;
7. falha mantém versão anterior;
8. overrides sobrevivem;
9. progresso sobrevive;
10. unsubscribe não apaga estado local.

---

# 209. Acceptance Criteria — Publishing

Considerado funcional quando:

1. draft pode ser criado;
2. preview funciona;
3. manifest é validado;
4. hash é calculado;
5. versão é imutável;
6. nova publicação incrementa versão;
7. assinatura pode ser gerada;
8. Registry recebe snapshot;
9. versão anterior não é modificada;
10. subscribers conseguem instalar nova versão.

---

# 210. Acceptance Criteria — Signature

Considerado funcional quando:

1. cliente verifica assinatura;
2. assinatura inválida bloqueia import/update;
3. chave original pode ser lembrada;
4. key change exige confirmação;
5. hash mismatch é detectado.

---

# 211. Relação com Functional Requirements

Atende principalmente:

```text
FR-133–167
Shared Libraries, Manifest, Import, Subscription, Fork

FR-194–203
Security e signatures

FR-128
Preservação de estado

FR-223–227
Domain rules
```

---

# 212. Relação com NFRs

Atende principalmente:

```text
NFR-055–060
Atomicidade e integridade

NFR-089–090
Provider/remote failure

NFR-091–110
Security e privacy

NFR-128–136
Hydration, updates e schemas
```

---

# 213. Decisões fechadas

```text
Shared Library
= curadoria versionada

Version
= imutável

Sync
= local snapshot + atomic swap

User State
= nunca vem do manifest

User Overrides
= preservados

Content
= deduplicado

Source
= deduplicável

Registry
= opcional

Registry media hosting
= não é responsabilidade core

Offline file sharing
= suportado

Signature
= Ed25519 planejado

Remote identity
= TOFU / persistent trust model

Fork
= nova library independente
```

---

# 214. Arquitetura final do compartilhamento

```text
                   AUTHOR

                     │
                     ▼
                  DRAFT
                     │
             validate/preview
                     │
                     ▼
                PUBLISH v15
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
       .tslib               Registry
                                │
                                ▼
                          Latest Version
                                │
                                ▼
                         SUBSCRIBER CLIENT
                                │
                                ▼
                              Fetch
                                │
                                ▼
                             Validate
                                │
                                ▼
                          Verify Signature
                                │
                                ▼
                              Stage
                                │
                                ▼
                           Atomic Commit
                                │
                                ▼
                     Remote Library Layer
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
          ▼                     ▼                     ▼
   Global Content         User Overrides          User State
          │                     │                     │
          └─────────────────────┴─────────────────────┘
                                │
                                ▼
                            Final View
```

---

# 215. Regra central

> **O autor controla a curadoria. O cliente controla o runtime. O usuário controla seu estado. A sincronização nunca deve confundir essas três responsabilidades.**
