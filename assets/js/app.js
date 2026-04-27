(function () {
  const PROGRESS_KEY = "deled-progress";
  const app = document.getElementById("app");
  let sidebarCollapsed = window.matchMedia("(max-width: 860px)").matches;

  function t(key) {
    const language = Settings.read().language;
    return window.I18N[language][key] || window.I18N.en[key] || key;
  }

  function label(value) {
    const language = Settings.read().language;
    return value[language] || value.en;
  }

  function readProgress() {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
    } catch (error) {
      return {};
    }
  }

  function writeProgress(progress) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }

  function topicKey(semesterId, subjectId, topicId) {
    return `${semesterId}/${subjectId}/${topicId}`;
  }

  function parseRoute() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    return {
      semesterId: parts[1] || null,
      subjectId: parts[3] || null,
      topicId: parts[5] || null
    };
  }

  function findSemester(id) {
    return window.COURSE_CATALOG.semesters.find((semester) => semester.id === id);
  }

  function findSubject(semester, id) {
    return semester?.subjects.find((subject) => subject.id === id);
  }

  function findTopic(subject, id) {
    return subject?.topics.find((topic) => topic.id === id);
  }

  function firstTopicHref(semester, subject) {
    const firstTopic = subject.topics[0];
    if (!firstTopic) return `#/semester/${semester.id}`;
    return `#/semester/${semester.id}/subject/${subject.id}/topic/${firstTopic.id}`;
  }

  function subjectHighlights(subject) {
    if (subject.highlights) return label(subject.highlights);
    const topicSummaries = subject.topics.map((topic) => label(topic.summary)).filter(Boolean);
    return [label(subject.summary), ...topicSummaries].filter(Boolean).slice(0, 5);
  }

  function renderHome() {
    app.innerHTML = `
      <section class="home">
        <div class="home-hero">
          <h1>${t("homeTitle")}</h1>
          <p>${t("homeIntro")}</p>
        </div>
        <div class="semester-grid">
          ${window.COURSE_CATALOG.semesters.map((semester) => `
            <a class="semester-card" href="#/semester/${semester.id}" aria-label="${t("openSemester")} ${label(semester.title)}">
              <span>${label(semester.title)}</span>
              <h2>${label(semester.title)}</h2>
              <p>${label(semester.summary)}</p>
            </a>
          `).join("")}
        </div>
      </section>
    `;
  }

  function semesterProgress(semester) {
    const progress = readProgress();
    const topics = semester.subjects.flatMap((subject) =>
      subject.topics.map((topic) => topicKey(semester.id, subject.id, topic.id))
    );
    const done = topics.filter((key) => progress[key]).length;
    return { done, total: topics.length, percent: topics.length ? Math.round((done / topics.length) * 100) : 0 };
  }

  function renderSidebar({ semester, subject, topic }) {
    const progress = semesterProgress(semester);
    const listMode = subject ? "topics" : "subjects";
    const items = subject ? subject.topics : semester.subjects;
    const title = subject ? label(subject.title) : label(semester.title);

    return `
      <aside class="reader-sidebar" id="readerSidebar">
        <div class="sidebar-inner">
          <div class="sidebar-main">
            ${subject ? `<a class="crumb" href="#/semester/${semester.id}">${t("backToSubjects")}</a>` : ""}
            <h2 class="sidebar-title">${title}</h2>
            <ul class="sidebar-list">
              ${items.map((item, index) => {
              const isTopic = listMode === "topics";
              const href = isTopic
                ? `#/semester/${semester.id}/subject/${subject.id}/topic/${item.id}`
                : firstTopicHref(semester, item);
              const active = isTopic ? topic?.id === item.id : subject?.id === item.id;
              const done = isTopic && readProgress()[topicKey(semester.id, subject.id, item.id)];
              const itemTitle = isTopic ? `${index + 1}. ${label(item.title)}` : label(item.title);
              return `
                <li>
                  <a class="nav-item ${active ? "active" : ""}" href="${href}">
                    <strong>${itemTitle}</strong>
                    <span class="status-icon ${done ? "done" : ""}" aria-hidden="true">${done ? "✓" : "›"}</span>
                  </a>
                </li>
              `;
              }).join("")}
            </ul>
          </div>
          <div class="sidebar-progress">
            <div class="progress-row">
              <span>${progress.done}/${progress.total} ${t("completed")}</span>
              <button class="reset-button" type="button" id="resetProgress">${t("reset")}</button>
            </div>
            <div class="progress-track" aria-hidden="true"><div class="progress-fill" style="width:${progress.percent}%"></div></div>
          </div>
        </div>
      </aside>
    `;
  }

  function renderSemesterOverview(semester) {
    return `
      <article class="content-shell">
        <p class="kicker">${label(semester.title)} / ${t("subjects")}</p>
        <h1>${label(semester.title)}</h1>
        <p>${label(semester.summary)} ${t("selectSubject")}</p>
        <div class="subject-overview-grid">
          ${semester.subjects.map((subject) => `
            <a class="topic-preview subject-card" href="${firstTopicHref(semester, subject)}">
              <span>
                <h3>${label(subject.title)}</h3>
                <ul>
                  ${subjectHighlights(subject).map((point) => `<li>${point}</li>`).join("")}
                </ul>
              </span>
              <strong>›</strong>
            </a>
          `).join("")}
        </div>
      </article>
    `;
  }

  async function renderTopicContent(semester, subject, topic) {
    const language = Settings.read().language;
    const shell = app.querySelector(".content-shell");
    shell.innerHTML = `<p>${t("loading")}</p>`;

    try {
      const response = await fetch(topic.file[language] || topic.file.en);
      if (!response.ok) throw new Error("Missing content");
      const markdown = await response.text();
      const key = topicKey(semester.id, subject.id, topic.id);
      const isDone = Boolean(readProgress()[key]);
      shell.innerHTML = `
        ${Markdown.render(markdown)}
        <div class="complete-panel">
          <button class="complete-button ${isDone ? "done" : ""}" type="button" id="completeButton">
            <span class="box">${isDone ? "✓" : ""}</span>
            <span>${isDone ? t("completedLabel") : t("markComplete")}</span>
          </button>
        </div>
      `;

      document.getElementById("completeButton").addEventListener("click", () => {
        const progress = readProgress();
        progress[key] = !progress[key];
        writeProgress(progress);
        render();
      });
    } catch (error) {
      shell.innerHTML = `
        <h1>${label(topic.title)}</h1>
        <p>${t("contentMissing")}</p>
      `;
    }
  }

  function bindReaderActions() {
    const toggle = document.getElementById("sidebarToggle");
    const reset = document.getElementById("resetProgress");

    toggle?.addEventListener("click", () => {
      sidebarCollapsed = !sidebarCollapsed;
      document.querySelector(".reader").classList.toggle("collapsed", sidebarCollapsed);
      toggle.textContent = sidebarCollapsed ? "›" : "‹";
      toggle.setAttribute("aria-expanded", String(!sidebarCollapsed));
    });

    reset?.addEventListener("click", () => {
      const { semesterId } = parseRoute();
      const semester = findSemester(semesterId);
      const progress = readProgress();
      semester.subjects.forEach((subject) => {
        subject.topics.forEach((topic) => delete progress[topicKey(semester.id, subject.id, topic.id)]);
      });
      writeProgress(progress);
      render();
    });
  }

  function renderReader(route) {
    const semester = findSemester(route.semesterId);
    const subject = findSubject(semester, route.subjectId);
    const topic = findTopic(subject, route.topicId);

    if (!semester) {
      renderHome();
      return;
    }

    if (subject && !topic) {
      const firstTopic = subject.topics[0];
      if (firstTopic) {
        location.replace(`#/semester/${semester.id}/subject/${subject.id}/topic/${firstTopic.id}`);
        return;
      }
    }

    const content = topic
      ? `<article class="content-shell"></article>`
      : renderSemesterOverview(semester);

    app.innerHTML = `
      <section class="reader ${sidebarCollapsed ? "collapsed" : ""}">
        ${renderSidebar({ semester, subject, topic })}
        <button class="sidebar-toggle" id="sidebarToggle" type="button" aria-controls="readerSidebar" aria-expanded="${!sidebarCollapsed}">${sidebarCollapsed ? "›" : "‹"}</button>
        <main class="reader-content">${content}</main>
      </section>
    `;

    bindReaderActions();
    if (topic) renderTopicContent(semester, subject, topic);
  }

  function render() {
    const route = parseRoute();
    if (!route.semesterId) {
      renderHome();
      return;
    }
    renderReader(route);
  }

  window.addEventListener("hashchange", render);
  window.addEventListener("settingschange", render);
  Settings.init();
  render();
})();
