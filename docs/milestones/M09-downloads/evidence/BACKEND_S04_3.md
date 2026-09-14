# M09 S04.3 — recovery, cancelamento e remoção

A fila é reidratada antes de reconectar o runtime. Itens queued/downloading são
rebinding em background; paused permanece paused. Falha de resume/source e
disco cheio afetam somente o item e são recuperáveis.

Cancelar altera apenas a transferência e preserva Content/Source. Remoção de
dados é outra operação, exige `confirmed: true` e é recusada enquanto playback
ou outro download protege o mesmo torrent. O teste SQLite confirmou o Content
antes e depois de cancel/remove.

