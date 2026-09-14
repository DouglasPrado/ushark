# M02 — Contrato da experiência

S00 implementada em 2026-09-12. Direção e defaults propostos até aprovação UX. Autorização: `EXECUTE_MILESTONE M02`; execução frontend S00–S02, sem persistência real.

## Jornada e navegação

Home de M01 → Filmes (`#/movies`) no mesmo cabeçalho de navegação → ícone `+` → Adicionar filme (`#/movies/new`, diálogo) → Buscar filme / Criar manualmente / Partir de uma fonte → Revisar → Confirmar → Detalhes (`#/content/:contentId`). O detalhe de Filme é uma página canônica em largura total: Home/busca M04 e catálogo M02 renderizam o mesmo componente, estrutura cinematográfica e rota. A entrada por Filmes acrescenta somente ferramentas contextuais de catálogo, sem criar outra variante visual. Importar, downloads, adicionar e opções ficam como ícones no cabeçalho; filtros e ferramentas secundárias de detalhe usam ícones com nome acessível e tooltip. Editar identificação reutiliza a revisão. Fontes, remoções e edição abrem diálogo sobre a página de detalhes. Voltar restaura card e scroll da superfície de origem; remover membership retorna ao vizinho ou Adicionar. B/Escape fecha somente a camada mais alta; revisão possui Voltar explícito. Rascunho de cadastro sobrevive ao cancelamento durante a sessão; concluir limpa o rascunho.

A superfície principal usa linguagem de produto. Informações de engenharia sobre mocks, provisoriedade, adapters futuros e persistência ficam nos artefatos de execução, não em barras ou avisos permanentes para o usuário. Estados operacionais reais para a jornada, como offline, carregamento, erro e origem indisponível, continuam visíveis e recuperáveis.

Teclado Tab/Enter e setas, gamepad A/B/D-pad/analógico reutilizam M01, com um único listener ativo por superfície. Campos de texto usam teclado nativo; não prometemos teclado virtual. Modais prendem foco e restauram origem; fontes abrem com foco no botão de fechar visível, e o modo gamepad força contorno de foco mesmo após mouse; se a origem desaparecer, focar a ação segura mais próxima. Operação em andamento não aceita repetição; falha mantém rascunho e permite retry.

## Campos e propostas de validação

| Campo               | Default    | Regra / mensagem                                                                    |
| ------------------- | ---------- | ----------------------------------------------------------------------------------- |
| Tipo                | Filme      | Fixo em M02                                                                         |
| Busca               | Vazia      | Título obrigatório, até 160 caracteres; “Digite um título para buscar.”             |
| Ano de busca/manual | Vazio      | Opcional; inteiro 1888–2100; “Use um ano entre 1888 e 2100.” (limite de fixture/UX) |
| Título manual       | Vazio      | Trim não vazio, até 160; “Dê um título ao filme.”                                   |
| Sinopse manual      | Vazia      | Opcional, até 2000 caracteres; ausência tem fallback                                |
| Poster manual       | Sem imagem | Escolha entre artes locais de exemplo; sem upload/URL real                          |
| Source declarada    | Nenhuma    | Escolha entre arquivos fictícios, não leitura de .torrent/magnet                    |
| Favorito            | Desativado | Estado pessoal, independente da biblioteca                                          |

Metadata exibida quando disponível: título/original, ano, sinopse, duração, gêneros, elenco, poster/backdrop e IDs externos na revisão. Metadados técnicos da source podem conter resolução/codecs/HDR/canais/tamanho/bitrate; desconhecido aparece como “Não informado”. Health não medido: “Ainda não avaliada”. Assistir permanece indisponível e conteúdo sem fonte continua válido.

## Estados e recuperação

| Estado / entrada                 | Saída e recuperação                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Lista inicial preenchida         | Oito filmes reais do snapshot IMDb aparecem por padrão; o cenário Vazio mantém o CTA Adicionar filme para revisão |
| Lista loading / erro             | Indicador acessível; erro oferece Tentar novamente, sem limpar dados                                              |
| Offline / provider indisponível  | Catálogo em memória segue acessível; cadastro manual sempre disponível                                            |
| Busca loading / vazia / ambígua  | Resultados selecionáveis; sem resultado oferece manual; outra busca cancela/invalida resposta antiga              |
| Manual / revisão                 | Valida antes de avançar; voltar preserva campos; confirmar realiza operação única                                 |
| Duplicata                        | Reutilizar Content existente; não criar segunda entidade nem membership repetida                                  |
| Correção com destino existente   | Mostrar conflito e política de preservação antes de confirmar união simulada                                      |
| Saving / falha / retry / sucesso | Travar repetição; falha mantém campos; sucesso abre item ou atualiza superfície e anuncia feedback                |
| Imagem ausente / quebrada        | Arte tipográfica local, sem layout shift ou bloqueio do card                                                      |
| Zero / uma / múltiplas fontes    | Lista declarativa e adição de exemplo; última remoção mantém Content                                              |
| Remover source                   | Confirma apenas vínculo, não arquivo nem Content                                                                  |
| Remover da biblioteca            | Confirma membership, mantém arquivo, Content e estado pessoal                                                     |
| Apagar arquivo                   | Confirmação separada nomeia arquivo de exemplo; altera somente disponibilidade simulada, mantém entidade e source |
| Cancelar                         | Nenhuma mutação; rascunho e foco preservados                                                                      |

## Identidade e apresentação (provisórias para mocks)

Content é independente de Source e Library. Refresh substitui somente metadata e nunca ID ou estado pessoal. Correção para outro ID é operação explícita; nunca renomeia PK silenciosamente. Ao unir local→canônico, unir sources, memberships e histórico sem duplicar; favorito é OR e progresso conserva o maior valor da fixture (não política definitiva de playback). Conservar overrides de cada biblioteca; quando ambas tiverem override na mesma biblioteca, manter o destino e arquivar o valor anterior nos dados da simulação, comunicando essa precedência na revisão. Preservar preferências pessoais de ambos em conflitos para decisão S03. S03 deve resolver D03/D19 definitivamente antes de integração real.

Override de biblioteca vence visualmente sobre metadata; refresh não o altera nem escreve o override na metadata global. M02 demonstra isso com fixtures; editor de curadoria é M12. Fixtures de progresso/histórico não implementam player. Membership pode ser removida e recolocada com o mesmo ID/estado.

## Corpus e inspeção

O catálogo padrão contém oito filmes reais identificados pelo IMDb: Interestelar, Duna: Parte Dois, Oppenheimer, Parasita, Batman: O Cavaleiro das Trevas, Tudo em Todo Lugar ao Mesmo Tempo, A Viagem de Chihiro e O Poderoso Chefão. IMDb ID, título original, ano, duração e gêneros vêm de um snapshot de desenvolvimento do `title.basics`; nota e quantidade de votos vêm do `title.ratings`, ambos consultados em 2026-09-13. Cards reúnem pôster, Health/favorito, título, ano, duração, fontes, qualidade, gêneros, nota, votos e ID numa única superfície responsiva; texto excedente trunca dentro da caixa sem deslocar badges. Detalhes também exibem título original. Os IDs primários continuam locais; o IMDb ID é externo. Títulos de apresentação em português, sinopses curtas e fontes de arquivo são fixtures locais. Pôsteres e backdrops são cópias locais das imagens exibidas nas páginas públicas desses títulos no IMDb, com licença comercial não estabelecida para este protótipo.

Os dados neutros Horizonte Azul, A Última Estação, Entre Marés e Noite de Papel permanecem isolados nos cenários de inspeção para estados vazios, conflitos e edge cases. Cenários normal, busca vazia, provider indisponível, offline, loading lento, erro de salvar, erro de lista e imagem quebrada continuam disponíveis. As consultas aos datasets e às páginas dos títulos ocorreram somente durante o desenvolvimento; o renderer não envia dados, não acessa a rede e carrega apenas assets locais.

## Cobertura por etapa

| Requisitos primários                               | Evidência frontend S01/S02                                                | Evidência definitiva adiada                   |
| -------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------- |
| FR-002/003/006/007/008/019/022/205/223; RX-005/006 | Cadastro, identidade, duplicata e merge em memória                        | S03–S06 transação, IDs duráveis, restart      |
| FR-021/023/024/025; RX-007                         | MetadataProvider mock, metadata e artes locais                            | S04.2/S04.3/S05 TMDB/cache real; séries M03   |
| FR-028/034/035/036/087/090                         | Detalhes, fontes declaradas, ausência/remoção                             | S03–S05 dados reais; torrent M06 e Health M08 |
| FR-091/127/224                                     | Favorito pessoal e preservação de fixtures                                | S04–S06 persistência/ownership                |
| FR-211/212                                         | Remoção de vínculo versus confirmação de arquivo                          | S04.3/S05 arquivo temporário real             |
| NFR-010/011/012/013/062/063/089/129                | Imagens locais/fallback, loading não bloqueante e offline simulado        | S04–S07 cache real, variantes e medição <50ms |
| NFR-051/052/132/133; RX-050                        | Sem alegação de persistência                                              | S04.1/S06/S07 migrações, WAL, rollback        |
| NFR-108/119/141/155                                | Estado em memória, boundary sem OS/provider obrigatório, regras testáveis | S03–S07 domínio real e segurança              |

Revalidar foco/legibilidade de M01. Capturas 1080p/1440p/4K, testes Chromium e Electron no macOS; teclado e gamepad sintético separados de hardware real. Windows/TV/gamepad físico seguem pendentes e não ganham aceite por testes sintéticos. Checkpoint UX humano necessário; não iniciar S03 após ele enquanto fase frontend M01–M22 não estiver aprovada.
