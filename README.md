# Conecty — R41

Ambiente de testes: [administração](https://horizes.github.io/Conecty/) e [demonstração do cliente](https://horizes.github.io/Conecty/cliente-demo.html).

A R41 consolida a limpeza do repositório público: somente os arquivos do manifesto são publicados, assets antigos e pacotes ZIP/PDF internos foram removidos, os links locais passaram a ser relativos (compatíveis com domínio próprio) e o workflow ganhou verificação de higiene e execução em pull requests.

O GitHub contém somente arquivos públicos. As chaves Omie e de servidor permanecem no Supabase. O pacote de publicação é gerado pelo workflow como artifact; não substitui backup do banco.

Os guias anteriores são históricos: para segurança, acesso e operação, prevalece o guia R11. O workflow confere o manifesto antes de publicar. A suíte completa roda no projeto-fonte privado.
