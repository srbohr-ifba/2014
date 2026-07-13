# 2014

O Sr. Bohr é uma aplicação web educacional criada em 2014 para apoiar o ensino de Química com enigmas, pistas secundárias e pontuação por desempenho.

## Reconstrução web

Este repositório agora reconstrói o projeto em uma stack web estática moderna, com build nativo no Docker.

O fluxo atual:

1. O script `scripts/build.mjs` lê o projeto legado do Construct 2.
2. Os enigmas embutidos em `Event sheets/Principal.xml` são extraídos automaticamente.
3. A aplicação web é gerada em `dist/` com HTML, CSS e JavaScript sem dependências externas.
4. O container final publica a pasta gerada com `nginx`.

## Comandos locais

Gerar o build:

```bash
npm run build
```

Servir o build localmente:

```bash
npm run dev
```

## Docker / Coolify

O `Dockerfile` da raiz já executa o build dentro do container.

Build local:

```bash
docker build -t sr-bohr-web .
```

Execução:

```bash
docker run --rm -p 8080:80 sr-bohr-web
```

## Estrutura principal

```text
src/                 aplicacao web reconstruida
scripts/build.mjs    extracao dos enigmas + geracao do dist
dist/                build final gerado localmente
Sr. Bohr.caproj      fonte original do Construct 2
Event sheets/        regras e dados legados
```

## Observações

- O conteúdo do jogo passa a nascer do fonte legado, sem exportação manual em HTML5.
- O ranking agora é persistido localmente no navegador, substituindo a dependência dos antigos endpoints PHP externos.
- As imagens e áudios usados pela nova interface são reaproveitados do acervo original sempre que possível.
