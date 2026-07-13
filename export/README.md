# Exportacao HTML5

Coloque nesta pasta os arquivos gerados pelo Construct 2 ao exportar o projeto para HTML5.

Estrutura esperada:

```text
export/
  index.html
  c2runtime.js
  data.js
  jquery-2.1.1.min.js
  offline.appcache            (se o Construct gerar)
  images/ ou Images/
  media/ ou Media/
```

Checklist rapido:

1. A pasta deve conter um `index.html` na raiz.
2. Os arquivos `.js` exportados devem ficar ao lado do `index.html`.
3. As pastas de imagens e audio devem ir completas, sem renomear arquivos.
4. Se o export gerar caminhos com `Images` e `Media`, preserve exatamente esses nomes.
5. Depois de versionar esta pasta, o Coolify vai servir automaticamente o jogo.

Observacao:

- Este repositorio hoje contem apenas o projeto-fonte do Construct 2.
- O container em producao so exibira o jogo quando a exportacao HTML5 estiver presente aqui.
