# Export legado

Esta pasta nao e mais necessaria para o fluxo principal.

O projeto agora gera `dist/` diretamente a partir do fonte legado do Construct 2, usando:

```bash
npm run build
```

ou durante o build do container:

```bash
docker build -t sr-bohr-web .
```

Se uma exportacao HTML5 antiga for preservada aqui por motivos de acervo, ela nao e usada pela stack atual.
