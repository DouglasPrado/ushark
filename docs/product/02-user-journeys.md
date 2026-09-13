# Ushark — Documento 02: User Journeys

**Status:** Draft v1  
**Produto:** Ushark\
**Documento:** User Journeys  
**Dependência:** `01-prd-master.md`

---

# 1. Objetivo

Este documento descreve as principais jornadas do usuário dentro do Ushark.

O objetivo é transformar a visão do PRD em fluxos claros de uso, definindo:

- ponto de entrada;
- intenção do usuário;
- ações;
- decisões;
- feedback da interface;
- estados intermediários;
- condições de sucesso;
- cenários de falha;
- comportamento esperado do sistema.

Estas jornadas servirão como base para:

```text
Functional Requirements
↓
Acceptance Criteria
↓
Milestones
↓
Stories
↓
Goal files
```

---

# 2. Perfis envolvidos

## 2.1 Usuário principal

Mantém sua própria biblioteca.

Deseja:

- adicionar torrents;
- organizar conteúdo;
- navegar visualmente;
- assistir rapidamente;
- usar o app na TV;
- evitar gerenciamento manual de arquivos.

## 2.2 Curador

Cria bibliotecas compartilháveis.

Deseja:

- selecionar conteúdo;
- organizar seções;
- definir ordem;
- recomendar fontes;
- publicar;
- atualizar a biblioteca posteriormente.

## 2.3 Assinante

Importa bibliotecas de outras pessoas.

Deseja:

- navegar exatamente pela curadoria publicada;
- receber atualizações;
- manter preferências locais;
- assistir usando a melhor source disponível.

---

# 3. Princípios das jornadas

Toda jornada deve seguir os princípios:

```text
1. Interface primeiro.
2. Feedback imediato.
3. Trabalho pesado em background.
4. Nenhuma operação longa deve bloquear a navegação.
5. O usuário não precisa entender BitTorrent.
6. Ações destrutivas devem ser explícitas.
7. Estado local do usuário nunca depende da biblioteca remota.
8. O sistema deve preferir automação, mas permitir correção manual.
```

---

# 4. Jornada 01 — Primeiro acesso

## Objetivo

Permitir que o usuário abra o Ushark pela primeira vez e chegue rapidamente a uma biblioteca utilizável.

## Entrada

```text
Ushark iniciado
```

## Fluxo

```text
Abrir app
↓
Ver onboarding curto
↓
Selecionar pasta da biblioteca
↓
Selecionar pasta de cache
↓
Configurar preferência de qualidade
↓
Detectar Sunshine/Moonlight opcionalmente
↓
Entrar na Home
```

## Tela 1 — Boas-vindas

Exemplo:

```text
Ushark

Sua biblioteca.
Suas fontes.
Seu streaming.

[ Começar ]
```

## Tela 2 — Biblioteca

Usuário escolhe:

```text
Pasta da biblioteca
C:\Ushark\Library
```

O app cria:

```text
library/
cache/
data/
```

## Tela 3 — Cache

Configurações iniciais:

```text
Limite de cache
[ 100 GB ]

Limpar automaticamente
[ Sim ]

Manter conteúdos parcialmente assistidos
[ Sim ]
```

## Tela 4 — Preferência de reprodução

Exemplos:

```text
Prioridade:
( ) Melhor qualidade
(x) Melhor equilíbrio
( ) Iniciar o mais rápido possível

Resolução máxima:
[ 4K ]
```

## Tela 5 — Sunshine

Se Sunshine for detectado:

```text
Sunshine encontrado.

Deseja preparar o Ushark para uso no Moonlight?

[ Configurar ]
[ Depois ]
```

## Estado final

Usuário entra na Home.

Se não houver conteúdo:

```text
Sua biblioteca está vazia.

[ Adicionar torrent ]
[ Importar biblioteca ]
```

## Sucesso

- configuração persistida;
- diretórios válidos;
- UI pronta;
- nenhuma indexação longa bloqueando a Home.

---

# 5. Jornada 02 — Abrir pelo Moonlight

## Objetivo

Entrar no Ushark pela TV sem interagir com o desktop.

## Fluxo

```text
Abrir Moonlight
↓
Selecionar Ushark
↓
Sunshine inicia aplicativo
↓
App detecta sessão de TV
↓
Abre fullscreen
↓
Foco inicial vai para Home
```

## Requisitos de experiência

Ao iniciar via Moonlight:

- não mostrar terminal;
- não mostrar desktop;
- não exigir mouse;
- não exigir teclado;
- entrar diretamente na UI;
- foco visível imediatamente.

## Saída

```text
Usuário escolhe "Sair"
↓
Ushark encerra UI
↓
processos são finalizados conforme política
↓
Sunshine encerra sessão
↓
Moonlight volta à biblioteca
```

## Sucesso

Experiência deve parecer a abertura de um aplicativo nativo de TV.

---

# 6. Jornada 03 — Adicionar um arquivo `.torrent`

## Objetivo

Transformar um torrent em conteúdo organizado na biblioteca.

## Entrada

```text
[ Adicionar ]
```

## Fluxo

```text
Selecionar .torrent
↓
Ler metadata
↓
Listar arquivos
↓
Identificar conteúdo provável
↓
Buscar metadata externa
↓
Mostrar correspondência
↓
Usuário confirma
↓
Criar Content + Source
↓
Indexar
↓
Exibir na biblioteca
```

## Caso de filme

Arquivo:

```text
Interstellar.2014.2160p.HEVC.mkv
```

Sistema infere:

```text
Título provável: Interstellar
Ano: 2014
Tipo: Filme
```

Depois:

```text
Possível correspondência:

Interestelar
2014
TMDB #157336

[ Confirmar ]
[ Pesquisar outro ]
```

## Após confirmação

Sistema cria:

```text
Content
movie:tmdb:157336

Source
source:...
```

e começa:

- metadata cache;
- poster cache;
- health probe opcional.

## Sucesso

Filme aparece na biblioteca sem exigir download completo.

---

# 7. Jornada 04 — Adicionar Magnet Link

## Objetivo

Adicionar conteúdo sem arquivo `.torrent` físico inicial.

## Fluxo

```text
Adicionar
↓
Colar magnet
↓
Resolver metadata do torrent
↓
Mostrar "Obtendo informações..."
↓
Receber file list
↓
Executar fluxo de identificação
↓
Confirmar
↓
Adicionar
```

## Estado intermediário

```text
Obtendo informações do torrent...

Peers encontrados: 12
Metadata: carregando
```

## Falha

Se metadata não chegar:

```text
Não foi possível obter os dados deste torrent.

[ Tentar novamente ]
[ Salvar para depois ]
[ Cancelar ]
```

---

# 8. Jornada 05 — Torrent com múltiplos arquivos

## Objetivo

Resolver corretamente qual arquivo ou quais arquivos representam o conteúdo.

## Exemplo

```text
Movie/
├── movie.mkv
├── sample.mkv
├── extras/
└── subtitles/
```

O sistema deve:

```text
Ignorar samples pequenos
↓
Priorizar maior arquivo de vídeo
↓
Detectar extras
↓
Selecionar arquivo principal
```

## Caso incerto

Mostrar:

```text
Qual arquivo deseja usar?

[x] Movie.2014.2160p.mkv
[ ] Sample.mkv
[ ] MakingOf.mkv
```

## Sucesso

Selector é persistido junto à source.

---

# 9. Jornada 06 — Adicionar uma série

## Objetivo

Importar um torrent contendo episódios ou temporada completa.

## Exemplo

```text
Breaking.Bad.S01/
├── S01E01.mkv
├── S01E02.mkv
├── S01E03.mkv
└── ...
```

## Fluxo

```text
Torrent importado
↓
Detectar padrões SxxExx
↓
Inferir série
↓
Consultar metadata
↓
Associar arquivos aos episódios
↓
Mostrar resumo
↓
Confirmar
↓
Adicionar série
```

## Tela de revisão

```text
Breaking Bad — Temporada 1

10 episódios encontrados

✓ E01
✓ E02
✓ E03
...
✓ E10

[ Confirmar ]
```

## Caso inconsistente

```text
9 episódios identificados
1 arquivo não reconhecido
```

Usuário poderá resolver manualmente.

---

# 10. Jornada 07 — Navegar pela Home

## Objetivo

Encontrar rapidamente algo para assistir.

## Estrutura prevista

```text
Hero

Continuar assistindo

Minha Biblioteca

Filmes

Séries

Bibliotecas compartilhadas

Adicionados recentemente
```

## Navegação por controle

```text
← → mover dentro da linha
↑ ↓ trocar de seção
A abrir
B voltar
```

## Foco

O card selecionado deverá:

- aumentar levemente;
- exibir borda/realce;
- mostrar informações adicionais;
- preservar posição ao voltar.

---

# 11. Jornada 08 — Abrir detalhes de um conteúdo

## Fluxo

```text
Selecionar card
↓
Abrir detalhes
↓
Mostrar metadata imediatamente
↓
Iniciar preflight das sources em background
↓
Atualizar Health Score progressivamente
```

## Tela

```text
Interestelar

2014 • Ficção científica • 2h49

████░ Muito bom
Pronto em ~2s

[ Assistir ]
[ Fontes ]
[ Adicionar aos favoritos ]
```

## Background

Enquanto o usuário lê:

```text
resolver peers
medir throughput
calcular availability
preparar pieces
```

O objetivo é reduzir o tempo percebido após clicar Play.

---

# 12. Jornada 09 — Assistir um filme

## Fluxo principal

```text
Abrir detalhes
↓
Health probe
↓
Selecionar melhor source
↓
Clicar Assistir
↓
Preparar startup buffer
↓
Abrir MPV
↓
Playback
```

## Feedback

Antes do player:

```text
Preparando...
Conectando peers
Bufferizando
```

Esse estado deve durar o mínimo possível.

## Player

Usuário deve poder:

- pausar;
- continuar;
- buscar;
- trocar áudio;
- trocar legenda;
- abrir opções;
- voltar aos detalhes.

## Sucesso

Playback começa sem aguardar download completo.

---

# 13. Jornada 10 — Source automática

## Cenário

Filme possui:

```text
4K Remux
4K HEVC
1080p
```

## Sistema mede

```text
4K Remux
██░░░ Instável

4K HEVC
█████ Excelente

1080p
█████ Excelente
```

## Decisão

Se preferência do usuário for:

```text
Melhor equilíbrio
```

o sistema escolhe:

```text
4K HEVC
```

## Feedback opcional

```text
Fonte selecionada automaticamente:
4K HEVC • Excelente
```

Usuário pode abrir:

```text
[ Trocar fonte ]
```

---

# 14. Jornada 11 — Trocar fonte manualmente

## Fluxo

```text
Detalhes
↓
Fontes
↓
Lista
↓
Selecionar source
↓
Health atualizado
↓
Definir como preferida localmente
```

## Exemplo

```text
4K Remux     72 GB   ██░░░
4K HEVC      28 GB   █████
1080p        12 GB   █████
```

## Persistência

A escolha deve ser um local override.

Atualizações da biblioteca compartilhada não devem apagá-la.

---

# 15. Jornada 12 — Seek durante playback

## Objetivo

Avançar rapidamente sem esperar download sequencial.

## Fluxo

```text
Usuário avança para 01:22:00
↓
Player informa seek
↓
Scheduler cancela prioridade antiga
↓
Calcula nova região
↓
Prioriza pieces
↓
Cria novo buffer
↓
Continua playback
```

## UI

Mostrar buffering somente se necessário.

Não mostrar detalhes técnicos na interface principal.

---

# 16. Jornada 13 — Torrent ficando lento durante reprodução

## Fluxo

```text
Throughput cai
↓
Streaming Ratio se aproxima de 1x
↓
Health runtime piora
↓
Buffer diminui
```

Sistema tenta:

```text
1. aumentar prioridade;
2. conectar peers melhores;
3. usar cache;
4. se necessário, procurar source alternativa.
```

## Se houver source melhor

Pode mostrar:

```text
Uma fonte mais estável está disponível.

[ Trocar automaticamente ]
[ Continuar nesta ]
```

Opcionalmente o usuário pode habilitar:

```text
Trocar automaticamente quando necessário
```

---

# 17. Jornada 14 — Source sem peers

## Cenário

```text
█████
↓
peer loss
↓
█░░░░
```

## Sistema

Tenta:

- tracker refresh;
- DHT;
- PEX;
- peers conhecidos;
- sources alternativas.

## UI

```text
Esta fonte está indisponível no momento.

Encontramos outra versão:

1080p • Muito bom

[ Usar esta fonte ]
```

Se não houver fallback:

```text
Não foi possível reproduzir este conteúdo agora.
```

---

# 18. Jornada 15 — Continuar assistindo

## Fluxo

Usuário assistiu até:

```text
01:02:17
```

Saiu.

Na próxima abertura:

```text
Continuar assistindo
↓
Interestelar
1h47 restantes
```

Ao clicar:

```text
[ Continuar de 01:02:17 ]
[ Recomeçar ]
```

O sistema deve preparar pieces próximos à posição salva, não começar do início do arquivo.

---

# 19. Jornada 16 — Finalizar conteúdo

Ao chegar próximo do final:

```text
watched = true
```

Regras de produto poderão considerar um threshold, por exemplo:

```text
> 90% ou últimos minutos
```

O conteúdo sai de:

```text
Continuar assistindo
```

e passa a:

```text
Assistido
```

Estado permanece local.

---

# 20. Jornada 17 — Favoritar

## Fluxo

```text
Detalhes
↓
Favoritar
```

Favorito deve continuar existindo independentemente:

- da biblioteca de origem;
- de atualização remota;
- de remoção da curadoria.

---

# 21. Jornada 18 — Stream Only

## Objetivo

Assistir sem manter o conteúdo permanentemente.

## Fluxo

```text
Play
↓
cache temporário
↓
assistir
↓
conteúdo elegível para limpeza
```

A limpeza respeita:

- LRU;
- limite de cache;
- proteção de itens ainda ativos.

---

# 22. Jornada 19 — Keep After Watching

Usuário escolhe:

```text
Manter após assistir
```

O conteúdo deixa de ser apenas cache temporário.

Sistema marca source/content como protegido contra limpeza automática.

---

# 23. Jornada 20 — Download completo

## Fluxo

```text
Detalhes
↓
Baixar
↓
Selecionar source
↓
Escolher destino
↓
Iniciar download
```

Pode continuar reproduzível durante o download.

---

# 24. Jornada 21 — Gerenciar downloads

Tela:

```text
Downloads

Véu de Cinzas
32%
18 MB/s
12 peers

Marés Sombrias
68%
12 MB/s
28 peers
```

Usuário pode:

- pausar;
- continuar;
- cancelar;
- alterar prioridade;
- abrir conteúdo.

---

# 25. Jornada 22 — Biblioteca local vazia

## Home

```text
Sua biblioteca está vazia.

Adicione seu primeiro conteúdo.

[ Adicionar torrent ]
[ Adicionar magnet ]
[ Importar biblioteca ]
```

Nada de telas vazias sem orientação.

---

# 26. Jornada 23 — Criar biblioteca compartilhada

## Fluxo

```text
Bibliotecas
↓
Criar biblioteca
↓
Nome
↓
Descrição
↓
Aparência
↓
Adicionar conteúdos
↓
Criar sections
↓
Ordenar
↓
Preview
↓
Publicar/exportar
```

## Dados básicos

```text
Nome:
Compartilhado por Douglas

Descrição:
Minha seleção de filmes e séries.
```

---

# 27. Jornada 24 — Adicionar conteúdo à biblioteca compartilhada

O curador pode selecionar conteúdos já existentes na biblioteca local.

```text
Adicionar conteúdo
↓
Selecionar Interestelar
↓
Escolher sources incluídas
↓
Adicionar
```

Uma mesma Content pode existir:

```text
Minha Biblioteca
+
Compartilhado por Douglas
```

sem duplicação.

---

# 28. Jornada 25 — Criar seções

Curador:

```text
+ Nova seção
```

Define:

```text
Título:
Ficção científica

Tipo:
Carousel
```

Depois adiciona conteúdos.

---

# 29. Jornada 26 — Definir Hero

Curador escolhe:

```text
Interestelar
```

como Hero.

Preview deve mostrar:

```text
Banner
Título
Descrição
Health/Source quando visualizado pelo assinante
Botão Assistir
```

---

# 30. Jornada 27 — Reordenar biblioteca

Usuário pode reorganizar:

```text
Hero
↓
Comece por aqui
↓
Ficção científica
↓
Séries
↓
Clássicos
```

A ordem publicada deve ser preservada no assinante.

---

# 31. Jornada 28 — Preview da biblioteca

Antes de publicar:

```text
[ Visualizar como assinante ]
```

O curador vê exatamente:

- hero;
- seções;
- ordem;
- cards;
- identidade visual.

---

# 32. Jornada 29 — Exportar biblioteca

## Arquivo

```text
Exportar
↓
Ushark Library
↓
douglas-library.tslib
```

O pacote contém apenas os dados permitidos pelo formato.

Não deve incluir automaticamente conteúdo audiovisual.

---

# 33. Jornada 30 — Publicar biblioteca por link

## Fluxo

```text
Publicar
↓
Gerar versão
↓
Validar manifest
↓
Assinar
↓
Upload metadata/manifest
↓
Gerar link
```

Resultado:

```text
ushark://library/ABC123
```

Usuário pode copiar e compartilhar.

---

# 34. Jornada 31 — Importar biblioteca por arquivo

## Fluxo

```text
Abrir .tslib
↓
Validar
↓
Mostrar preview
↓
Importar
↓
Indexar
↓
Renderizar
```

Preview:

```text
Compartilhado por Douglas

82 filmes
14 séries
18 seções

[ Importar ]
```

---

# 35. Jornada 32 — Importar biblioteca por link

## Fluxo

```text
Adicionar biblioteca
↓
Colar URL/código
↓
Fetch manifest
↓
Validar
↓
Verificar assinatura
↓
Mostrar preview
↓
Assinar biblioteca
```

Após aceitar:

```text
Bibliotecas compartilhadas
↓
Compartilhado por Douglas
```

---

# 36. Jornada 33 — Navegar em biblioteca compartilhada

O usuário deve ver a organização publicada pelo autor.

```text
Compartilhado por Douglas

Hero

Comece por aqui

Sci-Fi espacial

Séries

Clássicos
```

Mas estados locais aparecem sobre essa estrutura:

- assistido;
- continuar;
- favorito;
- source override.

---

# 37. Jornada 34 — Assistir a partir de biblioteca compartilhada

## Fluxo

```text
Biblioteca Douglas
↓
Selecionar filme
↓
Resolver Content global
↓
Carregar sources da biblioteca
↓
Adicionar overrides locais
↓
Health probe
↓
Source Selection
↓
Play
```

A source escolhida pelo curador é recomendação, não imposição.

---

# 38. Jornada 35 — Atualização de biblioteca compartilhada

## Cenário

Usuário possui:

```text
v14
```

Servidor informa:

```text
v15
```

## Fluxo

```text
Download v15
↓
Validate
↓
Verify signature
↓
Resolve changes
↓
Apply atomically
```

UI:

```text
Compartilhado por Douglas foi atualizado.

+ 3 filmes
+ 1 série
```

---

# 39. Jornada 36 — Atualização com erro

Se v15 falhar:

```text
v14 permanece ativa
```

Usuário pode ver:

```text
Não foi possível atualizar esta biblioteca.

A versão anterior continua disponível.
```

Nunca deixar estado parcial.

---

# 40. Jornada 37 — Autor remove conteúdo

## Cenário

Douglas remove um filme na v16.

No assinante:

```text
item deixa de aparecer naquela biblioteca
```

Mas preservar:

- progresso;
- favorito;
- download;
- conteúdo na biblioteca pessoal;
- overrides.

---

# 41. Jornada 38 — Adicionar item compartilhado à biblioteca pessoal

## Fluxo

```text
Detalhes
↓
Adicionar à Minha Biblioteca
```

Resultado:

```text
Content permanece localmente
```

mesmo que:

- unsubscribe;
- autor remova;
- biblioteca desapareça.

---

# 42. Jornada 39 — Ocultar item compartilhado

Usuário pode:

```text
Ocultar desta biblioteca
```

Esse é um override local.

A biblioteca remota não é alterada.

---

# 43. Jornada 40 — Fork de biblioteca

## Fluxo

```text
Compartilhado por Douglas
↓
Opções
↓
Duplicar biblioteca
↓
Nova biblioteca local
```

Resultado:

- novo libraryId;
- sections copiadas;
- memberships copiadas;
- subscriptions removidas da cópia;
- usuário passa a editar livremente.

---

# 44. Jornada 41 — Mesmo conteúdo em múltiplas bibliotecas

Busca por:

```text
Interestelar
```

Resultado:

```text
Interestelar

Presente em:
• Minha Biblioteca
• Compartilhado por Douglas
• Sci-Fi Brasil
```

Não criar três Contents.

---

# 45. Jornada 42 — Mesma source em múltiplas bibliotecas

Se infoHash for igual:

```text
Source A
=
Source A
```

O sistema deve reutilizar:

- torrent session;
- cache;
- resume data;
- health history.

---

# 46. Jornada 43 — Busca global

## Fluxo

```text
Busca
↓
Digite "inter"
↓
Resultados locais instantâneos
↓
Interestelar
```

Busca deve funcionar em:

- título;
- título original;
- série;
- episódio;
- biblioteca;
- coleção.

---

# 47. Jornada 44 — Modo offline

## Cenário

Sem internet.

Usuário abre app.

Sistema carrega:

- biblioteca;
- metadata;
- posters;
- histórico;
- conteúdos já baixados.

Pode mostrar:

```text
Offline
```

Features indisponíveis:

- atualização de metadata;
- novos peers;
- sync remoto.

Conteúdo local continua reproduzível.

---

# 48. Jornada 45 — Falta de espaço

Quando cache se aproxima do limite:

```text
Cache: 98 GB / 100 GB
```

Sistema tenta limpeza conforme política.

Se não for possível:

```text
Espaço insuficiente.

[ Gerenciar cache ]
[ Alterar limite ]
[ Escolher outra pasta ]
```

Nunca remover conteúdo protegido sem confirmação.

---

# 49. Jornada 46 — Cache automático

Exemplo de prioridade de limpeza:

```text
1. itens não assistidos antigos;
2. stream-only já concluídos;
3. conteúdo não favorito;
4. conteúdo não protegido.
```

Nunca limpar:

- arquivo em playback;
- download ativo;
- conteúdo marcado Keep;
- arquivo explicitamente protegido.

---

# 50. Jornada 47 — Player com legenda

Durante playback:

```text
Y
↓
Opções
↓
Legendas
```

Usuário pode:

- ativar/desativar;
- trocar faixa;
- selecionar arquivo externo se permitido.

A interação deve funcionar integralmente via controle.

---

# 51. Jornada 48 — Trocar áudio

Mesmo fluxo:

```text
Opções
↓
Áudio
↓
Português 5.1
English TrueHD 7.1
```

Mudança sem sair do player.

---

# 52. Jornada 49 — Diagnóstico técnico

Usuário avançado abre:

```text
Opções
↓
Informações técnicas
```

Exemplo:

```text
Source
4K HEVC

Download
82 Mbps

Bitrate
18 Mbps

Streaming Ratio
4.5x

Peers
23

Buffer
4m32s

Decoder
HEVC / GPU
```

Essa tela não faz parte do fluxo normal.

---

# 53. Jornada 50 — Health sendo medido

Ao abrir conteúdo:

```text
◌ Medindo...
```

Depois:

```text
███░░ Bom
Pronto em ~3s
```

O usuário não deve ficar bloqueado enquanto o score é medido.

Pode apertar Play antes, caso deseje.

---

# 54. Jornada 51 — Biblioteca grande

Com milhares de itens:

```text
Home
↓
render somente cards visíveis
```

Scroll/navegação deve permanecer suave.

Nenhuma jornada deve degradar significativamente por tamanho de biblioteca.

---

# 55. Jornada 52 — Reabrir após reinicialização

## Fluxo

```text
Abrir app
↓
SQLite carrega índice
↓
UI aparece
↓
resume data é restaurado em background
↓
health/runtime atualizam progressivamente
```

Não fazer scan completo antes de mostrar a Home.

---

# 56. Jornada 53 — Alteração externa de arquivo

Usuário adiciona manualmente:

```text
library/movies/...
```

Watcher detecta:

```text
novo/alterado
↓
indexar somente item afetado
```

UI atualiza sem rebuild global.

---

# 57. Jornada 54 — Metadata errada

Usuário:

```text
Detalhes
↓
Editar identificação
```

Pode pesquisar outro resultado.

Após correção:

- contentId atualizado conforme política;
- metadata recarregada;
- source preservada.

---

# 58. Jornada 55 — Episódio identificado incorretamente

Tela de revisão permite:

```text
Arquivo:
Show.01.mkv

Mapear para:
S01E01
```

A correção fica persistida.

---

# 59. Jornada 56 — Segurança na importação

Ao importar biblioteca externa:

```text
Validate
↓
Sandbox paths
↓
Reject executable content
↓
Verify limits
↓
Verify schema
```

Se inválida:

```text
Esta biblioteca não pôde ser importada porque contém dados inválidos ou não permitidos.
```

---

# 60. Jornada 57 — Biblioteca assinada

Preview:

```text
Compartilhado por Douglas

✓ Assinatura válida
```

Se assinatura mudar:

```text
A identidade desta biblioteca não corresponde à assinatura anterior.

[ Cancelar ]
```

Mudanças de identidade não devem ser aceitas silenciosamente.

---

# 61. Jornada 58 — Unsubscribe

## Fluxo

```text
Biblioteca
↓
Opções
↓
Remover assinatura
```

Pergunta:

```text
Remover "Compartilhado por Douglas"?

Seu histórico, favoritos e conteúdos adicionados à Minha Biblioteca serão mantidos.

[ Remover ]
```

---

# 62. Jornada 59 — Remover conteúdo local

Ação separada de remover membership.

Usuário deve saber claramente se está:

```text
removendo da biblioteca
```

ou:

```text
apagando arquivo local
```

Nunca combinar ações destrutivas silenciosamente.

---

# 63. Jornada 60 — Sair do player para detalhes

Ao pressionar B:

```text
Player
↓
Detalhes
```

O estado de playback é salvo imediatamente.

Ao retornar:

```text
Continuar
```

---

# 64. Jornada 61 — Encerrar sessão Moonlight durante playback

Se a sessão for desconectada:

- salvar posição;
- manter ou pausar playback conforme configuração;
- manter torrent ativo conforme política;
- permitir retomada posterior.

Configuração possível:

```text
Ao desconectar Moonlight:
(x) Pausar reprodução
( ) Continuar
```

---

# 65. Jornada 62 — Preferências de playback

Usuário pode definir:

```text
Qualidade preferida
Resolução máxima
Troca automática de source
Autoplay próximo episódio
Idioma de áudio
Idioma de legenda
```

Essas preferências são locais.

---

# 66. Jornada 63 — Próximo episódio

Ao terminar episódio:

```text
Próximo episódio em 10s

[ Reproduzir agora ]
[ Cancelar ]
```

Sistema inicia preflight do próximo episódio antes do atual terminar quando possível.

---

# 67. Jornada 64 — Preflight do próximo episódio

Enquanto usuário está perto do final:

```text
resolver source do próximo episódio
↓
health probe
↓
prefetch inicial
```

Objetivo:

```text
Episódio 1 termina
↓
Episódio 2 começa rapidamente
```

---

# 68. Jornada 65 — Biblioteca compartilhada com múltiplas sources

Curador publica:

```text
Filme A

Sources:
4K
1080p
720p
```

No assinante:

```text
Source Selection Engine
↓
considera rede + hardware + preferência
↓
escolhe melhor source
```

A experiência visual da biblioteca é preservada, mas a source pode ser diferente da recomendação original.

---

# 69. Jornada 66 — Source override sobrevivendo atualização

Usuário escolhe:

```text
1080p
```

como source local.

Biblioteca recebe nova versão com source 4K adicional.

Resultado:

```text
override 1080p permanece
```

até usuário remover a preferência.

---

# 70. Jornada 67 — Atualização de metadata externa

TMDB altera poster ou sinopse.

Sistema pode atualizar cache sem alterar:

- contentId;
- progresso;
- library membership;
- source.

Overrides da biblioteca continuam tendo precedência visual.

---

# 71. Jornada 68 — Conteúdo sem provider externo

Usuário adiciona vídeo próprio.

Fluxo:

```text
Adicionar
↓
Nenhuma correspondência encontrada
↓
Criar conteúdo manual
↓
Título
↓
Tipo
↓
Poster opcional
```

ID:

```text
movie:local:...
```

O sistema não deve depender obrigatoriamente do TMDB.

---

# 72. Jornada 69 — Editar biblioteca compartilhada já publicada

Curador:

```text
Biblioteca v14
↓
Editar
↓
Adicionar/remover/reordenar
↓
Preview
↓
Publicar
↓
v15
```

Nunca alterar v14.

---

# 73. Jornada 70 — Rollback de biblioteca publicada

Curador ou sistema identifica problema na v15.

Pode publicar uma nova versão baseada em v14 ou definir v14 como referência de rollback conforme arquitetura.

No cliente, versões já validadas podem permitir recuperação rápida.

---

# 74. Jornada 71 — Health histórico melhorando decisão

Source já foi usada anteriormente.

Sistema conhece:

```text
startup médio
throughput
buffering
```

Novo health probe combina:

```text
histórico
+
medição atual
```

O usuário apenas vê o resultado simplificado.

---

# 75. Jornada 72 — Abrir app com downloads em andamento

Home aparece imediatamente.

Em background:

```text
resume torrent
↓
reconectar peers
↓
atualizar velocidades
```

Tela Downloads vai ganhando dados progressivamente.

---

# 76. Jornada 73 — Pausar torrent sem perder biblioteca

Pausar source não remove:

- Content;
- metadata;
- membership;
- histórico.

A UI continua mostrando o conteúdo.

---

# 77. Jornada 74 — Remover source

Usuário pode remover apenas uma source.

Se houver outras:

```text
Content continua reproduzível
```

Se for a última:

```text
Content permanece na biblioteca
mas fica sem source
```

UI:

```text
Nenhuma fonte disponível.

[ Adicionar fonte ]
```

---

# 78. Jornada 75 — Conteúdo sem source em biblioteca compartilhada

Pode ocorrer se:

- source removida;
- manifest incompleto;
- source bloqueada localmente.

UI deve preservar metadata e informar:

```text
Nenhuma fonte disponível neste dispositivo.
```

---

# 79. Jornada 76 — Reorganização pessoal sem alterar biblioteca compartilhada

Usuário pode criar sua própria coleção:

```text
Favoritos para assistir sábado
```

contendo Content originário de bibliotecas externas.

Isso não altera nenhuma library remota.

---

# 80. Jornada 77 — Busca e assistir sem entrar na biblioteca de origem

Fluxo:

```text
Busca global
↓
Interestelar
↓
Detalhes
↓
resolver todas sources disponíveis
↓
Health
↓
Play
```

O usuário não precisa saber de qual biblioteca veio a melhor source.

---

# 81. Jornada 78 — Múltiplas bibliotecas oferecem sources diferentes

Exemplo:

```text
Douglas
→ 4K HEVC

Sci-Fi Brasil
→ 1080p

Minha Biblioteca
→ 4K Remux
```

Content consolidado possui todas as sources permitidas.

Source Selection Engine pode comparar todas.

---

# 82. Jornada 79 — Configuração de comportamento automático

Usuário pode escolher:

```text
[x] Selecionar melhor source automaticamente
[x] Trocar source automaticamente em caso de buffering
[x] Pré-carregar próximo episódio
[x] Pré-carregar conteúdo selecionado
```

Essas opções alteram automação, não estrutura do domínio.

---

# 83. Jornada 80 — Restaurar defaults

Configurações:

```text
Restaurar preferências de reprodução
```

Não deve apagar:

- biblioteca;
- downloads;
- histórico;
- subscriptions.

---

# 84. Estados globais de UI

Toda operação deve caber em estados previsíveis:

```text
idle
loading
ready
degraded
offline
error
```

Exemplo para Health:

```text
idle
↓
measuring
↓
ready
```

Exemplo para library sync:

```text
idle
↓
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

# 85. Regras de feedback

## Operações rápidas

Não mostrar modal desnecessário.

## Operações médias

Usar feedback inline.

## Operações longas

Permitir continuar navegando.

## Erros recuperáveis

Oferecer ação clara.

## Erros técnicos

Detalhes ficam em área avançada.

---

# 86. Critério geral de sucesso das jornadas

O usuário deve conseguir usar o Ushark sem precisar entender:

```text
piece
infoHash
DHT
PEX
tracker
bitrate matemático
resume data
```

O sistema pode utilizar todos esses conceitos internamente.

Externamente, a experiência deve ser:

```text
Encontrar
↓
Escolher
↓
Assistir
```

---

# 87. Relação com os próximos documentos

Estas jornadas serão convertidas em:

```text
03-functional-requirements.md
```

Cada jornada relevante deve gerar:

- requisito funcional;
- critérios de aceite;
- estados;
- erros;
- dependências.

Depois:

```text
04-non-functional-requirements.md
```

definirá:

- performance;
- segurança;
- resiliência;
- compatibilidade;
- observabilidade;
- limites operacionais.

---

# 88. Regra central de UX

> **Toda complexidade do torrent deve existir abaixo da interface, nunca acima dela.**

O usuário deve experimentar um media center.

O sistema, internamente, pode operar como um engine distribuído sofisticado.
