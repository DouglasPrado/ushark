# M10 — Experiência frontend

S00 concluída. Configurações → Espaço e retenção. Consultar uso simulado, política de cache/limite/pasta/limpeza automática/parciais/favoritos; apresentar volumes separados e preferência documental por SSD/NVMe sem detectar hardware real.

Calculando → lista/uso/estimativa; vazio/sem elegíveis → explicação, sem ação destrutiva. Plano de limpeza lista somente elegíveis em ordem LRU ilustrativa; confirmação revalida proteção, ativo, download, Keep/favorito/parcial retido. Cancelar não remove bytes. Estimado e liberado simulados separados. Corrida de uso entre plano e confirmação deve preservar o novo ativo.

Promover Stream Only→Keep move representação de volume sem redownload; falha/permissão/sem espaço conserva original; cancelar invalida operação. Demover exige confirmação explícita; não apaga imediatamente. Corrupção de cache → reparo simulado limitado ao cache sem alterar catálogo/progresso. Offline continua permitindo operações locais simuladas. Downloads M09 aparecem como entradas externas e ativos são protegidos.

D09/ordem/defaults físicos não decididos: defaults de prévia herdados de M01 e parâmetros ilustrativos. Política no store substituível, sem filesystem. FR-047–050/053/055/207/208, NFR/RX da cobertura representados; proteção física, disco livre real e reconciliação real S03–S08. UX PENDING adiada para revisão final por instrução explícita.

Auditoria final: aplicar limite sem mudar volume conserva caminho de cache; retenção de entradas externas também atualiza o volume apresentado na simulação.
