# Experiência frontend M14

A revisão de arquivo M13 recebe painel de autoria. Verificação simulada cancelável inicia ao abrir; não assinado é claramente informado e pode ser importado explicitamente. Assinatura válida identifica chave pública demonstrativa; primeiro contato pede aceitar identidade; contato posterior reconhece pin em memória. Chave alterada mostra antiga/nova e exige checkbox de ciência mais confirmação, ou cancelamento preserva pin. Inválida/hash divergente bloqueiam importação. Erro/retry e indisponibilidade do armazenamento seguro simulados não recebem sucesso.

Exportação de pacote próprio oferece Assinar simulação; envelope acompanha o snapshot para reimportação. Nenhuma chave privada é criada ou salva; nenhuma criptografia/secure storage é executada. Identidade/authenticidade não prova direitos sobre mídia. Cenários válidos/inválidos/tamper/changed/storage/offline são fixtures selecionáveis no painel. Fechar descarta operação e não aceita identidade. Offline verifica a fixture local; pin apenas nesta sessão.

FR-201–203/NFR-105–107/RX-036 têm representação visual nesse painel e no bloqueio de commit. Algoritmo real Ed25519 planejado, bytes canônicos, rotação/recuperação/backup e persistência de pin ficam S03–S08, sem decisão definitiva nesta fase.
