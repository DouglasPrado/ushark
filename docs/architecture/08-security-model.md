# TorrentStream — Architecture 08: Security Model

**Status:** Draft v1  
**Produto:** TorrentStream  
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
- `docs/architecture/06-data-model.md`
- `docs/architecture/07-ipc-contracts.md`

---

# 1. Objetivo

Este documento define o modelo de segurança do TorrentStream.

O produto manipula entradas potencialmente não confiáveis: arquivos `.torrent`, magnet links, manifests, pacotes `.tslib`, assets remotos, deep links, bibliotecas compartilhadas, metadata remota, paths, arquivos de legenda e IPC entre processos.

O objetivo é garantir que:

> **Conteúdo externo possa descrever mídia e curadoria, mas nunca ganhe autoridade para executar código, escapar do sandbox ou controlar o sistema operacional.**

---

# 2. Princípio central

Tudo que vem de fora do processo local confiável deve ser considerado:

```text
UNTRUSTED INPUT
```

até passar por validação explícita.

---

# 3. Trust Boundaries

Principais fronteiras:

```text
Internet
├── Registry
├── TMDB / metadata provider
├── Trackers / DHT / peers
└── Remote assets

User Filesystem
├── .torrent
├── .tslib
├── subtitles
└── local media

Local Processes
├── UI
├── Core
├── torrentd
└── MPV
```

---

# 4. Trust Levels

## Trusted

```text
Core domain logic
validated local DB
bundled application code
```

## Semi-trusted

```text
torrentd
MPV
local filesystem under managed directories
```

## Untrusted

```text
remote manifests
.tslib
.torrent metadata
magnet inputs
remote assets
deep links
external subtitles
provider payloads
```

---

# 5. Security Goals

O sistema deve impedir:

- arbitrary code execution;
- shell injection;
- path traversal;
- writing outside managed directories;
- SSRF;
- ZIP bombs;
- oversized payload attacks;
- malicious asset execution;
- protocol abuse;
- IPC spoofing;
- privilege escalation;
- silent identity replacement;
- destructive sync;
- remote control through manifests.

---

# 6. Non-goals

Este documento não tenta resolver anonimato de rede, DRM, anti-piracy enforcement ou segurança do sistema operacional fora do escopo do aplicativo.

---

# 7. Manifest Security

Manifest deve ser declarativo.

Permitido:

```text
strings
numbers
booleans
arrays
objects
references
```

Proibido:

```text
JavaScript
Lua
shell
PowerShell
HTML arbitrário
CSS arbitrário
executáveis
plugins executáveis
macros
templates com code execution
```

Nunca utilizar `eval()`, `new Function()` ou qualquer forma de execução dinâmica sobre conteúdo de manifest.

---

# 8. Schema e limites

Todo manifest deve passar por:

```text
JSON parse
↓
schema validation
↓
semantic validation
↓
security validation
```

Devem existir limites para profundidade, arrays, objetos, strings, número de itens e tamanho total.

Sugestões iniciais:

```text
manifest size   10–50 MB
items           <= 100,000
sections        <= 1,000
name            <= 256 chars
title           <= 512 chars
description     <= 20,000 chars
URI             <= 4,096 chars
```

---

# 9. Path Security

Todos os paths vindos de pacote ou manifest devem ser relativos, normalizados e sandboxed.

Rejeitar:

```text
../
..\
%2e%2e/
C:\...
\\server\share
/file
file://
```

Após resolução:

```text
resolvedPath.startsWith(sandboxRoot)
```

deve ser verdadeiro.

Não seguir symlinks para fora do sandbox; preferencialmente rejeitar symlinks em `.tslib`.

---

# 10. Managed Directories

Separar:

```text
app-data/
library-data/
cache/
temp/
imports/
versions/
resume/
logs/
```

Conteúdo remoto nunca escolhe path final arbitrário.

---

# 11. `.tslib` Security

Tratar `.tslib` como arquivo não confiável.

Pipeline:

```text
open
↓
inspect archive
↓
validate entries
↓
apply limits
↓
extract to temp sandbox
↓
validate manifest
↓
verify signature
↓
stage
↓
commit
```

Se usar ZIP, limitar tamanho comprimido e expandido, ratio, número de arquivos, profundidade e tempo de extração.

Exemplo conceitual:

```text
max compressed   100 MB
max expanded     500 MB
max files        10,000
```

---

# 12. File Type Allowlist

Preferir allowlist.

Permitidos inicialmente:

```text
.json
.webp
.jpg
.jpeg
.png
.torrent
.srt
.ass
.vtt
```

Rejeitar executáveis como `.exe`, `.dll`, `.bat`, `.cmd`, `.ps1`, `.vbs`, `.js`, `.msi`, `.scr`, `.com`.

Não confiar apenas em extensão; comparar extensão, MIME e magic bytes quando aplicável.

---

# 13. Remote Assets e SSRF

Preferir assets gerenciados pelo Registry em vez de URLs arbitrárias.

Remote assets devem preferir HTTPS e ter connect/read/total timeout.

Bloquear por default destinos:

```text
127.0.0.1
localhost
link-local
RFC1918/private ranges
169.254.169.254
file://
ftp://
gopher://
```

Resolver hostname e validar o IP final; revalidar redirects e limitar quantidade de redirects.

---

# 14. Registry Trust

TLS não substitui assinatura do manifest.

Toda versão baixada deve ter `contentHash` esperado e ser rejeitada se houver mismatch.

Assinatura planejada:

```text
Ed25519
```

Modelo inicial de confiança:

```text
TOFU — Trust On First Use
```

Após a primeira importação assinada, `libraryId + public key` ficam registrados localmente. Mudança inesperada de chave bloqueia update e exige ação explícita.

---

# 15. Deep Links

`torrentstream://` deve ser tratado como input não confiável.

Deep link pode sugerir import/open, mas nunca executar ação destrutiva automaticamente.

Fluxo:

```text
parse
↓
validate
↓
fetch
↓
preview
↓
user confirm
```

---

# 16. Magnet e `.torrent`

Magnet deve validar tamanho, scheme, campos obrigatórios e params suportados. Não logar magnet completo por default porque pode conter trackers privados/passkeys.

`.torrent` deve validar bencode size, depth, file count, paths, total declared size e piece count.

Nunca respeitar path absoluto declarado por torrent e rejeitar traversal.

---

# 17. Disk Safety

Preallocation deve ser controlada para evitar disk exhaustion.

Cache/download deve respeitar limite configurado e espaço livre real.

Ao detectar disco cheio:

```text
pause write-heavy operations
```

e tentar recovery/cleanup de forma segura.

---

# 18. MPV Security

MPV é processo externo semi-trusted.

Nunca passar argumentos montados por shell string concatenation. Usar array/estrutura segura.

MPV IPC deve ser local, randomizado e com permissões restritas.

Exemplo:

```text
\\.\pipe\torrentstream-mpv-<random>
```

---

# 19. Subtitle Security

Arquivos de legenda são untrusted data.

Allowlist inicial:

```text
.srt
.ass
.ssa
.vtt
```

Legendas externas remotas devem seguir as mesmas regras de remote asset.

---

# 20. Core ↔ torrentd

Named Pipe deve restringir ao usuário atual.

Se localhost TCP for usado, secret efêmero por startup é obrigatório.

Todo payload deve passar por schema validation e method allowlist. Nenhum payload pode virar shell command.

---

# 21. Electron Hardening

Se Electron for usado:

```text
contextIsolation: true
nodeIntegration: false
```

Renderer não deve ter Node amplo.

Expor apenas API mínima via preload.

Aplicar CSP restritiva, bloquear navegação remota não permitida, interceptar `window.open`, evitar `webview` e restringir DevTools em release.

---

# 22. Secrets

Secrets possíveis:

```text
Registry token
API keys
auth tokens
private signing keys
```

Usar storage seguro do Windows quando possível:

```text
Credential Manager / DPAPI
```

Não guardar secrets em SQLite plaintext ou logs.

Private signing key deve usar secure storage ou arquivo criptografado.

---

# 23. Registry Security

Authorization deve validar quem pode publicar cada `libraryId`.

Servidor deve impor size/rate/type/quota limits.

Auth e assinatura têm papéis diferentes:

```text
Auth
→ quem pode publicar no Registry

Signature
→ quem assinou este manifest
```

---

# 24. Sync Security

Remote update nunca deve editar tabelas ativas diretamente.

Sempre:

```text
download
↓
stage
↓
validate
↓
verify hash
↓
verify signature
↓
semantic validation
↓
atomic commit
```

Remote update nunca pode apagar favorite, progress, local download ou user override.

Downgrade automático deve ser bloqueado.

Se mesmo `libraryId + version` aparecer com hash diferente:

```text
security error
```

---

# 25. Cache e Temp Safety

Cache deve usar identidade/hash quando possível para evitar poisoning.

Temporary directories devem ser dedicados, restritos ao usuário e limpos após sucesso, falha e crash recovery.

Para evitar TOCTOU em arquivos importados:

```text
copy
↓
validate managed copy
↓
use managed copy
```

---

# 26. Local HTTP Adapter

Se existir adapter HTTP para playback:

```text
bind 127.0.0.1 only
token aleatório por sessão
TTL curto
```

Não aceitar path arbitrário como query param.

Endpoint resolve internamente apenas `sessionId` autorizado e valida Range.

---

# 27. Sunshine/Moonlight

TorrentStream não deve construir comandos Sunshine a partir de input externo sem validação.

Inputs Moonlight equivalem a input local de UI, não a comandos privilegiados do SO.

Ações destrutivas via gamepad devem exigir confirmação.

---

# 28. Logs e Diagnóstico

Logs devem ser estruturados, redacted, rotacionados e bounded.

Não logar:

- tokens;
- private keys;
- auth headers;
- full magnets;
- private tracker URLs.

Export de diagnóstico deve remover dados sensíveis e caminhos pessoais quando possível.

---

# 29. Network Exposure

Nenhum serviço deve escutar em `0.0.0.0` por default.

`torrentd` RPC nunca deve ser exposto à LAN.

Não desativar TLS verification em produção.

---

# 30. Dependency e Supply Chain Security

Manter Electron, MPV, libtorrent, FFmpeg/ffprobe e dependências atualizadas.

CI deve poder executar dependency audit/SCA/CVE checks.

Fixar dependências com lockfiles e evitar baixar/executar binários arbitrários em runtime.

---

# 31. Fail Closed vs Fail Open

Fail closed para:

```text
signature
hash
path
schema crítico
IPC auth
```

Fail open/fallback aceitável para:

```text
metadata visual
poster ausente
provider timeout
```

---

# 32. Security Error Taxonomy

Exemplos:

```text
SEC_MANIFEST_INVALID
SEC_SIGNATURE_INVALID
SEC_HASH_MISMATCH
SEC_PATH_TRAVERSAL
SEC_ARCHIVE_BOMB
SEC_FILE_TYPE_BLOCKED
SEC_REMOTE_URL_BLOCKED
SEC_RPC_UNAUTHORIZED
SEC_PROTOCOL_INVALID
SEC_KEY_CHANGED
```

A UI mostra mensagem amigável e mantém o código em detalhes técnicos.

---

# 33. Threat Models

## Malicious Library

Tenta path traversal, code execution, huge asset, SSRF ou identity replacement.

Mitigações:

```text
sandbox
allowlist
limits
signature
staging
```

## Malicious Torrent

Tenta path traversal, milhões de arquivos, tamanho absurdo ou disk exhaustion.

Mitigações:

```text
path validation
limits
quota
storage root enforcement
```

## Malicious Deep Link

Tenta importar/agregar ações sem consentimento.

Mitigação:

```text
preview + confirm
```

## IPC Spoofing

Mitigação:

```text
pipe permissions
session secret
protocol handshake
```

## Registry Compromise

Mitigação:

```text
content hash
signature
identity pinning
```

---

# 34. Security Testing

Testes mínimos:

```text
path traversal
zip bomb
oversized JSON
deep nesting
invalid signature
hash mismatch
SSRF
malformed magnet
malformed torrent
RPC invalid payload
IPC unauthorized
```

Fuzzing é recomendado para manifest parser, `.tslib` extractor, torrent metadata adapter, deep link parser e schemas RPC.

---

# 35. Release Gates

Milestones que alteram import, sync, IPC, filesystem, deep links ou auth devem incluir security review.

Release não deve sair com:

- known critical dependency CVE;
- broken signature verification;
- known sandbox bypass;
- arbitrary command execution path.

---

# 36. Acceptance Criteria — Manifest/Package

Considerado funcional quando:

1. path traversal é rejeitado;
2. executáveis no `.tslib` são rejeitados;
3. size/depth limits existem;
4. malformed manifest não altera DB ativo;
5. assinatura inválida bloqueia update;
6. hash mismatch bloqueia update;
7. extraction ocorre em sandbox;
8. deep link exige preview.

---

# 37. Acceptance Criteria — IPC

Considerado funcional quando:

1. torrentd não escuta LAN;
2. IPC possui permissões locais;
3. payloads são validados;
4. métodos possuem allowlist;
5. nenhum payload vira shell command;
6. MPV IPC é session-scoped;
7. unknown methods são rejeitados.

---

# 38. Acceptance Criteria — Desktop

Considerado funcional quando:

1. Electron renderer não possui Node amplo;
2. context isolation está habilitado;
3. preload expõe API mínima;
4. CSP existe;
5. navegação remota é bloqueada;
6. `window.open` é controlado;
7. secrets não ficam em logs.

---

# 39. Acceptance Criteria — Sync

Considerado funcional quando:

1. updates usam staging;
2. commit é atômico;
3. downgrade automático é bloqueado;
4. mutable version é detectada;
5. user state nunca é apagado por sync;
6. identity change exige confirmação.

---

# 40. Relação com Functional Requirements

Atende principalmente:

```text
FR-194–203
Security e assinatura

FR-149–167
Import/Sync

FR-211–213
Ações destrutivas

FR-223–227
Regras de domínio
```

---

# 41. Relação com NFRs

Atende principalmente:

```text
NFR-091–110
Security e privacy

NFR-105–110
Identity e secrets

NFR-131–136
Updates e schemas

NFR-148
Security regression gate
```

---

# 42. Decisões fechadas

```text
Manifest
= declarative only

.tslib
= untrusted archive

Extraction
= sandboxed

Remote paths
= never trusted

IPC
= local only

Electron
= hardened renderer

Signature
= Ed25519 planned

Identity
= persistent trust

Sync
= staged + atomic

Secrets
= OS secure storage

Remote URLs
= SSRF-protected

No shell
= strict rule
```

---

# 43. Próxima Etapa

O próximo documento recomendado é:

```text
09-ux-navigation-spec.md
```

Ele definirá Home, Details, Player, foco, navegação por gamepad, estados, overlays e flows de TV.

---

# 44. Regra central

> **Tudo que vem de fora pode descrever dados, mas nunca ganhar autoridade para executar comportamento privilegiado.**
