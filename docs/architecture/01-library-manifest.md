# Ushark — Documento 01: Library Manifest v1

## 1. Objetivo

O **Library Manifest** é o formato que descreve uma biblioteca do Ushark.

Ele não é responsável por baixar torrents, reproduzir vídeos ou guardar o progresso do usuário.

Sua responsabilidade é responder:

> **O que existe nesta biblioteca, como os conteúdos estão organizados e quais fontes podem ser usadas para reproduzi-los?**

A arquitetura deve permitir que a mesma biblioteca seja usada localmente, exportada, compartilhada, publicada, assinada, atualizada, clonada, personalizada localmente e sincronizada sem perder dados do usuário.

## 2. Princípio fundamental

Devemos separar quatro conceitos:

```text
CONTENT
Filme / Série / Episódio

SOURCE
Torrent utilizado para reproduzir o conteúdo

LIBRARY
Conjunto de conteúdos

PRESENTATION
Como a biblioteca deve ser exibida
```

O mesmo conteúdo pode existir em várias bibliotecas sem ser duplicado internamente.

## 3. O torrent NÃO é a identidade do conteúdo

A identidade do filme deve ser separada da fonte:

```text
contentId = filme
sourceId = torrent
```

Isso permite trocar a fonte sem perder progresso, favoritos, histórico, metadata, coleções ou avaliações.

Exemplo:

```json
{
  "id": "movie:tmdb:157336",
  "type": "movie"
}
```

## 4. Identidade dos conteúdos

Preferencialmente:

```text
movie:tmdb:157336
tv:tmdb:1396
episode:tmdb:62085
```

Quando não houver TMDB:

```text
movie:local:01J8ZX...
```

O identificador deve ser imutável.

## 5. Estrutura física

```text
library/
├── manifest.json
├── items/
├── sources/
└── assets/
```

Arquivos separados são opcionais; bibliotecas pequenas podem estar descritas apenas por `manifest.json`.

## 6. Manifest raiz

```json
{
  "schema": "ushark.library",
  "schemaVersion": "1.0.0",
  "id": "library:douglas:main",
  "name": "Compartilhado por Douglas",
  "description": "Minha seleção de filmes e séries.",
  "version": 14,
  "author": {
    "id": "author:douglas",
    "name": "Douglas"
  },
  "metadata": {},
  "appearance": {},
  "items": [],
  "sections": [],
  "settings": {}
}
```

## 7. Schema

Todo manifest começa com:

```json
{
  "schema": "ushark.library",
  "schemaVersion": "1.0.0"
}
```

O versionamento do schema deve permitir evolução sem quebrar clientes antigos.

## 8. Versionamento da biblioteca

Além da versão do schema, cada biblioteca possui:

```json
{
  "version": 14
}
```

Exemplo:

```text
v11 + Blade Runner
v12 + Duna
v13 - reorganização das categorias
v14 + nova fonte 4K
```

## 9. Autor

```json
{
  "author": {
    "id": "author:douglas",
    "name": "Douglas",
    "avatar": "asset://author-avatar",
    "description": "Cinema, sci-fi e séries."
  }
}
```

Futuramente: `publicKey`, `signature` e `verified`.

## 10. Appearance

```json
{
  "appearance": {
    "logo": "asset://library-logo",
    "banner": "asset://library-banner",
    "accentColor": "#58A6FF"
  }
}
```

Não permitir CSS arbitrário, scripts ou HTML executável.

## 11. Item

```json
{
  "id": "movie:tmdb:157336",
  "type": "movie",
  "metadata": {
    "tmdbId": 157336,
    "imdbId": "tt0816692"
  },
  "sources": [
    "source:interstellar:4k",
    "source:interstellar:1080p"
  ]
}
```

## 12. Metadata externa

TMDB será o provider principal na v1; IMDb fica como external ID.

```json
{
  "metadata": {
    "providers": {
      "tmdb": { "id": 157336 },
      "imdb": { "id": "tt0816692" }
    }
  }
}
```

## 13. Metadata customizada

```json
{
  "metadata": {
    "tmdbId": 157336,
    "overrides": {
      "title": "Interestelar",
      "description": "Um dos meus favoritos."
    }
  }
}
```

Overrides alteram apenas a apresentação daquela biblioteca.

## 14. Source

```json
{
  "id": "source:interstellar:4k-hevc",
  "type": "torrent",
  "torrent": {
    "magnet": "magnet:?xt=urn:btih:..."
  },
  "media": {
    "resolution": "2160p",
    "videoCodec": "hevc",
    "audioCodec": "eac3",
    "hdr": "hdr10",
    "size": 28472938472
  }
}
```

## 15. Torrent embutido

```json
{
  "torrent": {
    "file": "sources/interstellar-4k.torrent"
  }
}
```

Uma source pode usar magnet ou `.torrent`.

## 16. Info Hash

```json
{
  "torrent": {
    "infoHash": "abcdef123456..."
  }
}
```

Útil para deduplicação, cache, health history e resume data.

## 17. Multiple Sources

```json
{
  "sources": [
    "source:interstellar:4k-remux",
    "source:interstellar:4k-hevc",
    "source:interstellar:1080p",
    "source:interstellar:720p"
  ]
}
```

A escolha será feita pelo Source Selection Engine.

## 18. Source Preference

```json
{
  "sourcePreferences": {
    "preferred": "source:interstellar:4k-hevc"
  }
}
```

A preferência do autor não deve superar disponibilidade real.

## 19. Quality metadata

```json
{
  "media": {
    "resolution": "2160p",
    "width": 3840,
    "height": 2160,
    "videoCodec": "hevc",
    "hdr": "dolby-vision",
    "audioCodec": "truehd",
    "audioChannels": "7.1",
    "size": 72000000000,
    "bitrate": 58000000
  }
}
```

Dados detectados localmente devem ter precedência sobre dados declarativos.

## 20. Arquivo dentro do torrent

```json
{
  "selector": {
    "type": "filename",
    "value": "Interstellar.2014.2160p.mkv"
  }
}
```

Ou:

```json
{
  "selector": {
    "type": "largest-video"
  }
}
```

## 21. Série

```json
{
  "id": "tv:tmdb:1396",
  "type": "series",
  "metadata": {
    "tmdbId": 1396
  }
}
```

## 22. Episódios

```json
{
  "id": "episode:tmdb:62085",
  "type": "episode",
  "parent": "tv:tmdb:1396",
  "season": 1,
  "episode": 1,
  "sources": [
    "source:breakingbad:s01"
  ]
}
```

## 23. Torrent de temporada

Uma source pode servir vários episódios. O selector resolve o arquivo correspondente:

```json
{
  "source": "source:breakingbad:s01",
  "selector": {
    "type": "episode",
    "season": 1,
    "episode": 3
  }
}
```

## 24. Sections

```json
{
  "id": "section:highlights",
  "title": "Comece por aqui",
  "type": "carousel",
  "items": [
    "movie:tmdb:157336",
    "movie:tmdb:329865"
  ]
}
```

## 25. Tipos iniciais de seção

```text
hero
carousel
grid
continue-watching
```

`continue-watching` é determinado pelo usuário local.

## 26. Hero

```json
{
  "id": "section:hero",
  "type": "hero",
  "items": [
    "movie:tmdb:157336"
  ]
}
```

## 27. Carousel

```json
{
  "id": "section:scifi",
  "type": "carousel",
  "title": "Ficção científica",
  "items": [
    "movie:tmdb:157336",
    "movie:tmdb:329865",
    "movie:tmdb:78"
  ]
}
```

## 28. Grid

```json
{
  "id": "section:classics",
  "type": "grid",
  "title": "Clássicos",
  "items": []
}
```

## 29. Ordem das seções

A ordem no array define a apresentação.

## 30. Coleções

Collection = grupo lógico de conteúdos.

Section = forma de apresentar conteúdos.

## 31. Smart Collections

Ficam para versões futuras. A v1 usa coleções determinísticas.

## 32. Assets

```json
{
  "assets": {
    "library-logo": {
      "type": "image",
      "path": "assets/logo.webp"
    }
  }
}
```

Assets remotos devem passar por cache e validação.

## 33. O que NÃO fica no Manifest

Nunca colocar no manifest:

- posição atual do filme;
- assistido/não assistido;
- favoritos do usuário;
- último acesso;
- progresso de download;
- runtime state do torrent;
- peers;
- velocidade;
- health atual;
- buffer;
- configurações pessoais.

Esses dados pertencem ao banco local.

## 34. User State

SQLite local:

```text
user_state
content_id
position
duration
watched
favorite
last_played_at
```

## 35. Local Overrides

O usuário pode substituir uma source sugerida por uma source local. Atualizações da biblioteca não devem apagar essa escolha.

## 36. Camadas de resolução

```text
Remote Library
↓
Local Cache
↓
User Overrides
↓
Runtime State
↓
UI
```

## 37. Biblioteca compartilhada

Ao importar uma biblioteca, o aplicativo cria uma subscription:

```json
{
  "libraryId": "library:douglas:main",
  "currentVersion": 14,
  "autoUpdate": true
}
```

## 38. Atualização

Fluxo:

```text
download
↓
validate
↓
resolve
↓
commit
```

## 39. Atualização atômica

A biblioteca ativa só deve ser trocada após a nova versão passar por validação completa.

## 40. Remoção de conteúdo

Remover um item da biblioteca compartilhada não deve apagar torrent local, download, progresso ou favorito.

## 41. Fork

Uma biblioteca pode ser duplicada para um novo `libraryId`, deixando de acompanhar automaticamente o original.

## 42. Referências entre bibliotecas

Na v1, não permitir dependências entre bibliotecas.

## 43. Deduplicação

O mesmo `contentId` em múltiplas bibliotecas deve representar um único Content com múltiplas memberships.

## 44. Deduplicação de Sources

Sources com o mesmo `infoHash` devem ser deduplicadas no runtime.

## 45. Busca global

Um Content pode indicar em quais bibliotecas está presente.

## 46. Segurança do Manifest

O manifest deve ser puramente declarativo.

Nunca permitir:

- JavaScript;
- shell commands;
- executáveis;
- paths locais arbitrários;
- environment variables;
- HTML arbitrário;
- CSS arbitrário;
- plugins embutidos;
- scripts.

## 47. Filesystem sandbox

Paths devem ser relativos ao pacote. Path traversal deve ser rejeitado.

## 48. Limites

O parser deve impor limites de tamanho, profundidade, quantidade de itens, sections, assets e strings.

## 49. Assinatura

Futuramente:

```json
{
  "signature": {
    "algorithm": "ed25519",
    "keyId": "author:douglas",
    "value": "..."
  }
}
```

## 50. Conteúdo e direitos

O formato deve funcionar para conteúdo próprio, domínio público, Creative Commons e distribuição autorizada. O software não deve presumir que todo conteúdo referenciado pode ser redistribuído.

## 51. Exemplo completo — Filme

```json
{
  "id": "movie:tmdb:157336",
  "type": "movie",
  "metadata": {
    "tmdbId": 157336,
    "imdbId": "tt0816692"
  },
  "sources": [
    {
      "id": "source:interstellar:4k-hevc",
      "type": "torrent",
      "torrent": {
        "magnet": "magnet:?xt=urn:btih:EXAMPLE",
        "infoHash": "EXAMPLE"
      },
      "selector": {
        "type": "largest-video"
      },
      "media": {
        "resolution": "2160p",
        "videoCodec": "hevc",
        "size": 28000000000
      }
    }
  ]
}
```

## 52. Exemplo completo — Série

```json
{
  "id": "tv:tmdb:1396",
  "type": "series",
  "metadata": {
    "tmdbId": 1396
  },
  "children": [
    {
      "id": "episode:breakingbad:s01e01",
      "type": "episode",
      "season": 1,
      "episode": 1,
      "sources": [
        {
          "source": "source:breakingbad:s01",
          "selector": {
            "type": "episode",
            "season": 1,
            "episode": 1
          }
        }
      ]
    }
  ]
}
```

## 53. Exemplo de source compartilhada pela temporada

```json
{
  "id": "source:breakingbad:s01",
  "type": "torrent",
  "torrent": {
    "magnet": "magnet:?xt=urn:btih:EXAMPLE"
  },
  "media": {
    "resolution": "1080p"
  }
}
```

## 54. Exemplo completo — Biblioteca Douglas

```json
{
  "schema": "ushark.library",
  "schemaVersion": "1.0.0",
  "id": "library:douglas:main",
  "version": 14,
  "name": "Compartilhado por Douglas",
  "description": "Minha seleção pessoal de filmes e séries.",
  "author": {
    "id": "author:douglas",
    "name": "Douglas"
  },
  "appearance": {
    "accentColor": "#4BA3FF"
  },
  "sections": [
    {
      "id": "hero",
      "type": "hero",
      "items": [
        "movie:tmdb:157336"
      ]
    },
    {
      "id": "start",
      "type": "carousel",
      "title": "Comece por aqui",
      "items": [
        "movie:tmdb:157336",
        "movie:tmdb:329865"
      ]
    },
    {
      "id": "series",
      "type": "carousel",
      "title": "Séries",
      "items": [
        "tv:tmdb:1396"
      ]
    }
  ]
}
```

## 55. Modelo interno

```text
libraries
library_versions
contents
content_metadata
sources
content_sources
library_contents
sections
section_items
subscriptions
user_state
user_overrides
torrent_runtime
torrent_history
```

## 56. Fluxo de importação

```text
Fetch Manifest
↓
Validate Schema
↓
Verify Signature
↓
Parse
↓
Resolve Content IDs
↓
Resolve Sources
↓
Deduplicate
↓
Index
↓
Fetch Metadata
↓
Cache Posters
↓
Render Library
```

## 57. Progressive hydration

A UI nunca deve esperar tudo. Estrutura, cache, assets e metadata remota devem aparecer progressivamente.

## 58. Offline first

Depois da primeira sincronização, manifest, metadata, posters, sections e sources devem estar disponíveis localmente.

## 59. Manifest imutável por versão

Uma versão publicada nunca deve mudar. Qualquer alteração gera uma nova versão.

## 60. Rollback

O cliente deve conseguir voltar para uma versão anterior sem reconstruir toda a biblioteca.

## 61. Cache por hash

O manifest pode usar um `contentHash` SHA-256 para detectar corrupção, mudança indevida e cache hit.

## 62. Regra para conflitos

Prioridade:

```text
1. User Override
2. Runtime detected data
3. Manifest
4. Metadata provider
```

## 63. Regra para apresentação

Prioridade:

```text
Library-specific overrides
↓
provider metadata
↓
fallback
```

## 64. Extensibilidade

Objetos relevantes podem ter:

```json
{
  "extensions": {}
}
```

Extensões desconhecidas devem ser ignoradas, nunca executadas.

## 65. Compatibilidade futura

Clientes 1.x podem aceitar schemas 1.x compatíveis. Breaking changes devem exigir atualização.

## 66. Decisões fechadas para v1

Incluídos:

- Library;
- Author;
- Appearance;
- Sections;
- Movies;
- Series;
- Episodes;
- Torrent Sources;
- Multiple Sources;
- TMDB references;
- Local metadata overrides;
- Assets;
- Versioning;
- Subscriptions;
- Local overrides;
- Deduplication;
- Offline cache.

Ficam para versões posteriores:

- Smart Collections;
- social features;
- comentários;
- ratings compartilhados;
- remote plugins;
- scripts;
- extensões executáveis de terceiros.

## 67. Resultado

A biblioteca define **o conteúdo e a curadoria**.

O Source Selection Engine decide **como reproduzi-lo**.

O usuário mantém **controle sobre seu próprio estado e suas preferências**.

## 68. Arquitetura resultante

```text
SHARED LIBRARY
      ↓
Library Manifest
      ↓
Content + Layout
      ↓
Sources
      ↓
Source Selection
      ↓
Torrent Health
      ↓
libtorrent
      ↓
MPV
      ↓
Sunshine
      ↓
Moonlight
```

## 69. Regra central do domínio

> **Conteúdo é permanente. Fontes são substituíveis. Bibliotecas são curadoria. Estado pertence ao usuário.**

Essa separação deve orientar todo o restante da arquitetura.
