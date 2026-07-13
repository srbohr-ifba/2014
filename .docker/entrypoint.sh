#!/bin/sh
set -eu

APP_ROOT="/app"
PUBLIC_ROOT="/usr/share/nginx/html"

find_export_dir() {
    for dir in \
        "$APP_ROOT" \
        "$APP_ROOT/export" \
        "$APP_ROOT/dist" \
        "$APP_ROOT/build" \
        "$APP_ROOT/public"
    do
        if [ -f "$dir/index.html" ]; then
            printf '%s' "$dir"
            return 0
        fi
    done

    return 1
}

rm -rf "${PUBLIC_ROOT:?}/"*

if EXPORT_DIR="$(find_export_dir)"; then
    cp -R "$EXPORT_DIR"/. "$PUBLIC_ROOT"/
else
    cat <<'EOF' > "$PUBLIC_ROOT/index.html"
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Exportacao HTML5 pendente</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Arial, sans-serif;
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f5f1e8;
        color: #1e293b;
      }
      main {
        max-width: 640px;
        margin: 24px;
        padding: 32px;
        background: #fffdf8;
        border: 1px solid #d6c7a1;
        border-radius: 16px;
        box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
      }
      h1 {
        margin-top: 0;
      }
      code {
        background: #f1e6c8;
        padding: 2px 6px;
        border-radius: 6px;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Exportacao HTML5 nao encontrada</h1>
      <p>Este repositorio contem o projeto-fonte do Construct 2, mas o build web ainda nao foi exportado.</p>
      <p>Exporte o jogo para HTML5 e envie os arquivos gerados para uma destas pastas:</p>
      <p><code>/</code>, <code>/export</code>, <code>/dist</code>, <code>/build</code> ou <code>/public</code>.</p>
      <p>Assim que existir um <code>index.html</code> em uma delas, o container do Coolify vai servir a aplicacao automaticamente.</p>
    </main>
  </body>
</html>
EOF
fi

exec nginx -g 'daemon off;'
