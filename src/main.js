const STORAGE_KEY = "srbohr-ranking-v3";
const MAX_RANKING_PER_LEVEL = 5;
const ROUNDS_PER_SESSION = 4;
const CLUE_POINTS = 35;
const ENIGMA_BONUS = 220;
const LEVELS = {
  iniciante: { label: "Iniciante" },
  intermediario: { label: "Intermediário" },
  avancado: { label: "Avançado" }
};

const app = document.querySelector("#app");

const state = {
  audio: null,
  data: null,
  ranking: loadRanking(),
  session: null,
  screen: "loading"
};

boot();

async function boot() {
  try {
    state.data = await fetch("./data/themes.json").then((response) => response.json());
    state.screen = "ready";
    render();
    hydrateAudio();
  } catch (error) {
    state.screen = "error";
    render({ error });
  }
}

function hydrateAudio() {
  const audio = new Audio("./assets/audio/menu-theme.ogg");
  audio.loop = true;
  audio.volume = 0.18;
  state.audio = audio;
}

function render(context = {}) {
  if (state.screen === "loading") {
    app.innerHTML = loadingTemplate();
    return;
  }

  if (state.screen === "error") {
    app.innerHTML = errorTemplate(context.error);
    return;
  }

  if (!state.session) {
    app.innerHTML = homeTemplate();
    bindHomeEvents();
    return;
  }

  if (state.session.finished) {
    app.innerHTML = resultTemplate();
    bindResultEvents();
    return;
  }

  app.innerHTML = gameTemplate();
  bindGameEvents();
}

function homeTemplate() {
  const themeCount = state.data?.totalThemes || 0;
  return `
    <section class="panel panel--intro">
      <div class="stats-grid">
        <article class="stat-card">
          <span class="stat-card__label">Temas preservados</span>
          <strong class="stat-card__value">${themeCount}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-card__label">Build</span>
          <strong class="stat-card__value">Docker nativo</strong>
        </article>
        <article class="stat-card">
          <span class="stat-card__label">Ranking</span>
          <strong class="stat-card__value">Local no navegador</strong>
        </article>
      </div>

      <div class="menu-grid">
        <section class="card">
          <h2>Novo jogo</h2>
          <p>Escolha um nível, informe o nome do jogador e resolva os enigmas recuperados do projeto original.</p>
          <form id="start-form" class="stack">
            <label class="field">
              <span>Nome do jogador</span>
              <input id="player-name" name="playerName" type="text" maxlength="24" placeholder="Digite seu nome" required>
            </label>
            <label class="field">
              <span>Nível</span>
              <select id="player-level" name="level">
                ${Object.entries(LEVELS)
                  .map(([value, level]) => `<option value="${value}">${level.label}</option>`)
                  .join("")}
              </select>
            </label>
            <button class="button button--primary" type="submit">Começar</button>
          </form>
          <p class="muted">
            Os documentos descrevem 30 questões distribuídas em 3 níveis. O fonte legado disponível hoje preserva 10 temas em XML, sem a marcação explícita dessa classificação, então o acervo recuperado é compartilhado entre os níveis.
          </p>
        </section>

        <section class="card">
          <div class="card__header">
            <h2>Ranking</h2>
            <button class="button button--ghost" type="button" data-action="clear-ranking">Limpar</button>
          </div>
          ${rankingTemplate()}
        </section>

        <section class="card">
          <h2>Como jogar</h2>
          <ul class="plain-list">
            <li>Cada rodada possui 4 enigmas, como descrito no artigo do WIE 2014.</li>
            <li>Cada pista correta vale 35 pontos e o enigma completo vale 220 pontos.</li>
            <li>A resposta do enigma só é liberada depois que todas as pistas forem resolvidas.</li>
            <li>Se você já tentou todas as pistas, pode pular para o próximo enigma.</li>
          </ul>
        </section>

        <section class="card">
          <h2>Créditos</h2>
          <p>Reconstrução web do projeto educacional de 2014.</p>
          <div class="credit-columns">
            <div>
              <h3>Desenvolvimento</h3>
              <p>Viviane Lima Carvalho</p>
              <p>Assayá Fernandes Santos</p>
              <p>Yara Teixeira Costa</p>
            </div>
            <div>
              <h3>Apoio</h3>
              <p>Breno Antonivaldo L. Andrade</p>
              <p>Pablo Freire Matos</p>
              <p>Wdson Costa Santos</p>
            </div>
          </div>
          <div class="logo-row">
            <img src="./assets/images/logo-ifba.png" alt="IFBA">
            <img src="./assets/images/logo-gse.png" alt="GSE">
            <img src="./assets/images/logo-fapesb.png" alt="FAPESB">
            <img src="./assets/images/logo-pibid.png" alt="PIBID">
          </div>
        </section>
      </div>
    </section>
  `;
}

function rankingTemplate() {
  const groups = groupRankingByLevel();

  if (!Object.values(groups).some((entries) => entries.length)) {
    return `<p class="muted">Nenhuma pontuação registrada ainda.</p>`;
  }

  return Object.entries(LEVELS)
    .map(([levelKey, level]) => {
      const entries = groups[levelKey];
      return `
        <section class="ranking-group">
          <h3>${level.label}</h3>
          ${
            entries.length
              ? `<div class="ranking-list">
                  ${entries
                    .map(
                      (entry, index) => `
                        <article class="ranking-entry">
                          <strong>#${index + 1} ${escapeHtml(entry.name)}</strong>
                          <span>${entry.score} pts</span>
                          <span>${entry.time}</span>
                        </article>
                      `
                    )
                    .join("")}
                </div>`
              : `<p class="muted">Sem registros neste nível.</p>`
          }
        </section>
      `;
    })
    .join("");
}

function gameTemplate() {
  const round = currentRound();
  const totalRounds = state.session.rounds.length;
  const solvedLetters = round.clues
    .map((clue) => (clue.solved ? clue.highlightLetter : "_"))
    .join(" ");
  const allCluesSolved = round.clues.every((clue) => clue.solved);
  const allCluesAttempted = round.clues.every((clue) => clue.attempts > 0);

  return `
    <section class="panel">
      <div class="session-bar">
        <div>
          <p class="eyebrow">Jogador</p>
          <strong>${escapeHtml(state.session.playerName)}</strong>
        </div>
        <div>
          <p class="eyebrow">Nível</p>
          <strong>${escapeHtml(LEVELS[state.session.level]?.label || state.session.level)}</strong>
        </div>
        <div>
          <p class="eyebrow">Pontuação</p>
          <strong>${state.session.score}</strong>
        </div>
        <div>
          <p class="eyebrow">Tempo</p>
          <strong>${formatDuration(Date.now() - state.session.startedAt)}</strong>
        </div>
      </div>

      <div class="progress-header">
        <div>
          <p class="eyebrow">Enigma ${state.session.currentRound + 1} de ${totalRounds}</p>
          <h2>${escapeHtml(round.title)}</h2>
        </div>
        <button class="button button--ghost" type="button" data-action="skip-round" ${allCluesAttempted ? "" : "disabled"}>
          Pular tema
        </button>
      </div>

      <div class="game-grid">
        <section class="card">
          <h3>Pistas secundárias</h3>
          <div class="clue-list">
            ${round.clues
              .map(
                (clue, index) => `
                  <form class="clue-card ${clue.solved ? "is-solved" : ""}" data-clue-form="${clue.id}">
                    <div>
                      <span class="clue-card__index">${index + 1}</span>
                      <p>${escapeHtml(clue.clue)}</p>
                    </div>
                    <div class="clue-card__answer">
                      <input
                        name="answer"
                        type="text"
                        autocomplete="off"
                        ${clue.solved ? "disabled" : ""}
                        placeholder="${clue.solved ? "Resolvida" : "Sua resposta"}"
                      >
                      <button class="button button--small" type="submit" ${clue.solved ? "disabled" : ""}>
                        ${clue.solved ? "OK" : "Validar"}
                      </button>
                    </div>
                  </form>
                `
              )
              .join("")}
          </div>
        </section>

        <section class="card">
          <h3>Enigma principal</h3>
          <p class="muted">As letras reveladas abaixo são herdadas das respostas corretas das pistas.</p>
          <div class="letter-strip" aria-label="Letras reveladas">${escapeHtml(solvedLetters)}</div>
          <form id="main-answer-form" class="stack">
            <label class="field">
              <span>Resposta do enigma</span>
              <input
                id="main-answer"
                name="mainAnswer"
                type="text"
                autocomplete="off"
                placeholder="${allCluesSolved ? "Digite sua resposta" : "Resolva todas as pistas primeiro"}"
                ${allCluesSolved ? "" : "disabled"}
              >
            </label>
            <button class="button button--primary" type="submit" ${allCluesSolved ? "" : "disabled"}>Responder</button>
          </form>
          <div class="score-note">
            <span>Pista correta: ${CLUE_POINTS} pts</span>
            <span>Enigma completo: ${ENIGMA_BONUS} pts</span>
          </div>
          ${round.feedback ? `<p class="feedback">${escapeHtml(round.feedback)}</p>` : ""}
        </section>
      </div>
    </section>
  `;
}

function resultTemplate() {
  return `
    <section class="panel panel--result">
      <div class="card card--center">
        <p class="eyebrow">Sessão concluída</p>
        <h2>${escapeHtml(state.session.playerName)}, sua pontuação final foi ${state.session.score}.</h2>
        <p>Tempo total: <strong>${state.session.finishedAt ? formatDuration(state.session.finishedAt - state.session.startedAt) : "00:00"}</strong></p>
        <div class="button-row">
          <button class="button button--primary" type="button" data-action="play-again">Jogar novamente</button>
          <button class="button button--ghost" type="button" data-action="back-home">Voltar ao menu</button>
        </div>
      </div>
      <section class="card">
        <h3>Ranking atualizado</h3>
        ${rankingTemplate()}
      </section>
    </section>
  `;
}

function loadingTemplate() {
  return `
    <section class="panel panel--center">
      <div class="card card--center">
        <h2>Carregando acervo do Sr. Bohr</h2>
        <p>Extraindo enigmas e montando a experiência web.</p>
      </div>
    </section>
  `;
}

function errorTemplate(error) {
  return `
    <section class="panel panel--center">
      <div class="card card--center">
        <h2>Falha ao abrir o jogo</h2>
        <p>${escapeHtml(error instanceof Error ? error.message : String(error))}</p>
      </div>
    </section>
  `;
}

function bindHomeEvents() {
  document.querySelector("#start-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const playerName = String(form.get("playerName") || "").trim();
    const level = String(form.get("level") || "iniciante");

    if (!playerName) {
      window.alert("Informe o nome do jogador para começar.");
      return;
    }

    startSession(playerName, level);
  });

  document.querySelector('[data-action="clear-ranking"]')?.addEventListener("click", () => {
    state.ranking = [];
    localStorage.removeItem(STORAGE_KEY);
    render();
  });
}

function bindGameEvents() {
  document.querySelectorAll("[data-clue-form]").forEach((formElement) => {
    formElement.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const clueId = form.getAttribute("data-clue-form");
      const answer = String(new FormData(form).get("answer") || "");
      solveClue(clueId, answer);
    });
  });

  document.querySelector("#main-answer-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const answer = String(new FormData(event.currentTarget).get("mainAnswer") || "");
    solveMainAnswer(answer);
  });

  document.querySelector('[data-action="skip-round"]')?.addEventListener("click", () => {
    advanceRound();
  });
}

function bindResultEvents() {
  document.querySelector('[data-action="play-again"]')?.addEventListener("click", () => {
    startSession(state.session.playerName, state.session.level);
  });
  document.querySelector('[data-action="back-home"]')?.addEventListener("click", () => {
    state.session = null;
    render();
  });
}

function startSession(playerName, level) {
  const rounds = shuffle(state.data.themes)
    .slice(0, Math.min(ROUNDS_PER_SESSION, state.data.themes.length))
    .map((theme) => ({
      ...theme,
      feedback: "",
      attempts: 0,
      clues: theme.clues.map((clue) => ({ ...clue, solved: false, attempts: 0 }))
    }));

  state.session = {
    playerName,
    level,
    rounds,
    currentRound: 0,
    score: 0,
    startedAt: Date.now(),
    finished: false
  };

  tryPlayAudio();
  render();
}

function solveClue(clueId, rawAnswer) {
  const round = currentRound();
  const clue = round.clues.find((item) => item.id === clueId);

  if (!clue || clue.solved) {
    return;
  }

  clue.attempts += 1;

  if (matchesAny(rawAnswer, clue.alternatives)) {
    clue.solved = true;
    state.session.score += CLUE_POINTS;
    round.feedback = `Pista resolvida: a letra ${clue.highlightLetter.toUpperCase()} foi revelada.`;
  } else {
    round.feedback = "Resposta incorreta para a pista. Tente novamente.";
  }

  render();
}

function solveMainAnswer(rawAnswer) {
  const round = currentRound();

  if (!round.clues.every((clue) => clue.solved)) {
    round.feedback = "O enigma principal só é liberado após resolver todas as pistas.";
    render();
    return;
  }

  round.attempts += 1;

  if (matchesAny(rawAnswer, round.acceptedAnswers)) {
    state.session.score += ENIGMA_BONUS;
    round.feedback = `Enigma resolvido: ${round.answer}.`;
    advanceRound();
    return;
  }

  round.feedback = "O enigma principal ainda não está correto.";
  render();
}

function advanceRound() {
  if (state.session.currentRound >= state.session.rounds.length - 1) {
    finishSession();
    return;
  }

  state.session.currentRound += 1;
  render();
}

function finishSession() {
  state.session.finished = true;
  state.session.finishedAt = Date.now();
  const entry = {
    name: state.session.playerName,
    level: state.session.level,
    score: state.session.score,
    time: formatDuration(state.session.finishedAt - state.session.startedAt),
    createdAt: new Date().toISOString()
  };
  state.ranking = trimRankingPerLevel([...state.ranking, entry]);
  persistRanking();
  render();
}

function currentRound() {
  return state.session.rounds[state.session.currentRound];
}

function tryPlayAudio() {
  if (!state.audio) {
    return;
  }

  state.audio.play().catch(() => {
    /* O navegador pode bloquear autoplay; mantemos o jogo funcional sem áudio. */
  });
}

function loadRanking() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function persistRanking() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.ranking));
}

function groupRankingByLevel() {
  return Object.keys(LEVELS).reduce((groups, levelKey) => {
    groups[levelKey] = state.ranking
      .filter((entry) => entry.level === levelKey)
      .sort((left, right) => right.score - left.score || left.time.localeCompare(right.time))
      .slice(0, MAX_RANKING_PER_LEVEL);
    return groups;
  }, {});
}

function trimRankingPerLevel(entries) {
  return Object.entries(LEVELS).flatMap(([levelKey]) =>
    entries
      .filter((entry) => entry.level === levelKey)
      .sort((left, right) => right.score - left.score || left.time.localeCompare(right.time))
      .slice(0, MAX_RANKING_PER_LEVEL)
  );
}


function matchesAny(value, acceptedAnswers) {
  const normalizedValue = normalizeAnswer(value);
  return acceptedAnswers.some((answer) => normalizeAnswer(answer) === normalizedValue);
}

function normalizeAnswer(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}
