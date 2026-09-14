# M17 S03 — contrato

Fork recebe snapshot instalado, nome, opção de proveniência e operationId.
Retorna novo libraryId; IDs de coleção/seção são refeitos, Content/Source ficam
por referência e nenhuma subscription é criada. Assets usam ref-count local.
