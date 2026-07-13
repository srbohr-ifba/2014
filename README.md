# 2014
O Sr. Bohr é uma aplicação web educacional, desenvolvido em 2014, que utiliza gamificação para apoiar o ensino e a aprendizagem de Química por meio de desafios interativos, recompensas e conteúdos relacionados ao cotidiano.

## Docker / Coolify

Este repositório guarda o projeto-fonte do Construct 2 (`.caproj`). Para publicar no Coolify, é preciso primeiro exportar o jogo para HTML5 e versionar os arquivos gerados com `index.html`.

O `Dockerfile` deste projeto:

- usa `nginx`;
- procura automaticamente uma exportação HTML5 nas pastas `/`, `export`, `dist`, `build` ou `public`;
- publica a aplicação assim que encontrar um `index.html`;
- mostra uma página informativa caso a exportação ainda não exista.

Fluxo sugerido:

1. Exporte o projeto no Construct 2 para HTML5.
2. Salve os arquivos exportados em `export/` (ou outra das pastas suportadas).
3. Faça o deploy no Coolify usando o `Dockerfile` da raiz do projeto.
