# S02 — Identificar e organizar filmes

Status: IMPLEMENTED — fase frontend pronta para checkpoint UX. Verificação física pendente; sem aceite humano implícito.

## Objetivo

Completar interações e recuperação de falhas antes do aceite UX.

## Contexto e dependências

Ler [M02](../README.md) e apenas as fontes aplicáveis: S01 concluída e contrato S00.

## Escopo

Implementar busca cancelável, escolha ambígua, cadastro manual, confirmação idempotente, editar identificação, favorito local, adicionar/remover source declarada e remover membership. Simular refresh de metadata preservando identidade e override; duplicatas reutilizam Content e conflito exige revisão. Delete físico é apenas confirmação e resultado simulados sobre fixture. Rascunho, erro ao salvar e retry não perdem dados; a página de detalhes e seus diálogos restauram foco após Voltar, player ou remoção.

## Fora de escopo

Persistência, merge real, exclusão física, importação real e funcionalidades de milestones futuros.

## Critérios de aceite

Duplo confirmar não cria duplicatas; resposta atrasada não substitui busca atual. Favorito é pessoal e aparece consistentemente nas superfícies. Pôster, overlays e metadata permanecem dentro da superfície responsiva de cada card, inclusive em breakpoints estreitos. Remover última source mantém Content; remover membership não apaga arquivo ou estado pessoal. Cancelar qualquer confirmação não muda dados. Teclado/gamepad não perdem foco nem disparam duas ações com B/Escape.

## Validação

Executar testes focados para caminhos feliz/manual/offline, resposta fora de ordem, duplicata, cancelamento e remoções; lint/typecheck/build. Inspeção visual e sessão Electron; registrar separadamente controle físico/Windows/TV pendentes.

## Evidências

[Validação](../evidence/VALIDATION.md): doze testes de jornada, cinco de invariantes do mock, três de layout e um de Electron para M02. Os casos adicionais protegem o shell limpo, navegação ativa, ícones acessíveis, ausência das mensagens internas removidas e o seed padrão com pôster/backdrop local, IMDb ID, nota, votos, duração e gêneros visíveis. Regressão completa atual: 123 casos aprovados. Lint, typecheck e build Vite direto aprovados; inspeção visual registrada.

Ajuste posterior: a lista busca termos sem acento/caixa em título localizado, original e gêneros e ordena por votos ou A–Z, preservando a ordem de destaque como default. O filme agora usa a mesma página canônica `#/content/:contentId` da Home/busca, com retorno ao card e scroll de origem; os diálogos de gestão continuam em uma camada acima. A validação focada M02/M04 passou 48/48 e a regressão completa passou 136/136; [captura](../evidence/details-1920.png). O aceite histórico permanece preservado, sem aprovação automática deste ajuste.

## Conclusão

Roteiro UX reproduzível e evidências registradas; parar no checkpoint UX, sem aprovação implícita.

Estado consolidado da fase: S00–S02 implementadas; aceite UX já existente de M02 preservado em ../UX_CHECKPOINT.md. Referências a revisão pendente acima registram o estágio histórico anterior ao aceite. S03–S08 adiadas.
