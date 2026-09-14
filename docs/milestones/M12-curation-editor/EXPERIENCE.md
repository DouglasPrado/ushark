# M12 — Experiência frontend

S00 concluída. Bibliotecas na navegação → criar/editar rascunho. Etapas identidade, conteúdos/fontes, coleções, seções, prévia. Nome obrigatório, descrição/autor/accent/arte sintética opcionais. Imagem ausente mostra fallback. Rascunho privado: salvar em memória não publica e não inicia torrents. IDs/revisão estáveis; erro de gravação preserva edição, cancelamento descarta só alterações não confirmadas com dialog quando sujo.

Conteúdo existente vem de boundary de leitura; opções sintéticas explícitas para catálogo vazio. Membership escolhe sources e override de título local à biblioteca, sem mudar Content global. Collection é conjunto lógico ordenado de itens; Section é apresentação (hero/carousel/grid/Continuar local) apontando coleção. Reordenar por botões mantém ids; excluir conteúdo limpa referências em coleções, não exclui catálogo. Renomear coleção não altera id/seções. Seção Continuar usa estado local do leitor, nunca serializa progresso no rascunho.

Prévia usa componente de leitura reaproveitável, id/ordem/override da versão editada, click abre detalhe; reprodução exige ação explícita M08/M05. Vazio/inválido/salvando/salvo/erro/offline/sem arte são reproduzíveis. Cancelar save invalida escrita tardia. D19/precedência definitiva e experiência física de editor TV permanecem revisão; teclado e foco básicos preservados.

FR-026/027/133–143/225, NFR-109, RX-030/031: manifestações frontend e isolamento de dados pessoais. Persistência/compartilhamento/exportação real e S03–S08 adiados. UX PENDING para revisão final por instrução explícita.
