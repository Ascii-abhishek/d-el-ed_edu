(function () {
  const PROGRESS_KEY = "deled-progress";
  const MOBILE_QUERY = "(max-width: 860px)";
  const app = document.getElementById("app");
  const mobileMedia = window.matchMedia(MOBILE_QUERY);
  let sidebarCollapsed = mobileMedia.matches;

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
    return `v1:semester:${semesterId}:subject:${subjectId}:topic:${topicId}`;
  }

  function legacyTopicKey(semesterId, subjectId, topicId) {
    return `${semesterId}/${subjectId}/${topicId}`;
  }

  function isTopicDone(progress, semesterId, subjectId, topicId) {
    return Boolean(
      progress[topicKey(semesterId, subjectId, topicId)] ||
      progress[legacyTopicKey(semesterId, subjectId, topicId)]
    );
  }

  function parseRoute() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    return {
      semesterId: parts[1] || null,
      subjectId: parts[3] || null,
      topicId: parts[4] === "topic" ? parts[5] || null : null,
      chapterTest: parts[6] === "test",
      subjectTestId: parts[4] === "test" ? parts[5] || null : null
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

  function findSubjectTest(subject, id) {
    return subject?.tests?.find((test) => test.id === id);
  }

  function isMobileReader() {
    return mobileMedia.matches;
  }

  function subjectHref(semester, subject) {
    return `#/semester/${semester.id}/subject/${subject.id}`;
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
      subject.topics.map((topic) => ({
        semesterId: semester.id,
        subjectId: subject.id,
        topicId: topic.id
      }))
    );
    return progressStats(progress, topics);
  }

  function subjectProgress(semester, subject) {
    const progress = readProgress();
    const topics = subject.topics.map((topic) => ({
      semesterId: semester.id,
      subjectId: subject.id,
      topicId: topic.id
    }));
    return progressStats(progress, topics);
  }

  function progressStats(progress, topics) {
    const done = topics.filter(({ semesterId, subjectId, topicId }) =>
      isTopicDone(progress, semesterId, subjectId, topicId)
    ).length;
    return {
      done,
      total: topics.length,
      percent: topics.length ? Math.round((done / topics.length) * 100) : 0
    };
  }

  function renderSidebar({ semester, subject, topic, subjectTest }) {
    const progress = subject ? subjectProgress(semester, subject) : null;
    const progressScopeLabel = subject ? label(subject.title) : "";
    const listMode = subject ? "topics" : "subjects";
    const items = subject ? subject.topics : semester.subjects;
    const title = subject ? label(subject.title) : label(semester.title);
    const subjectTests = subject?.tests || [];

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
                : subjectHref(semester, item);
              const navKind = isTopic ? "topic" : "subject";
              const active = isTopic ? topic?.id === item.id : subject?.id === item.id;
              const done = isTopic && isTopicDone(readProgress(), semester.id, subject.id, item.id);
              const itemTitle = isTopic ? `${index + 1}. ${label(item.title)}` : label(item.title);
              return `
                <li>
                  <a class="nav-item ${active ? "active" : ""}" href="${href}" data-nav-kind="${navKind}">
                    <strong>${itemTitle}</strong>
                    <span class="status-icon ${done ? "done" : ""}" aria-hidden="true">${done ? "✓" : "›"}</span>
                  </a>
                </li>
              `;
              }).join("")}
            </ul>
            ${subjectTests.length ? `
              <p class="sidebar-section-label">${t("subjectTests")}</p>
              <ul class="sidebar-list">
                ${subjectTests.map((test) => `
                  <li>
                    <a class="nav-item ${subjectTest?.id === test.id ? "active" : ""}" href="#/semester/${semester.id}/subject/${subject.id}/test/${test.id}" data-nav-kind="test">
                      <strong>${label(test.title)}</strong>
                      <span class="status-icon" aria-hidden="true">›</span>
                    </a>
                  </li>
                `).join("")}
              </ul>
            ` : ""}
          </div>
          ${progress ? `
            <div class="sidebar-progress">
              <p class="progress-scope">${progressScopeLabel}</p>
              <div class="progress-row">
                <span>${progress.done}/${progress.total} ${t("completed")}</span>
                <button class="reset-button" type="button" id="resetProgress">${t("reset")}</button>
              </div>
              <div class="progress-track" aria-hidden="true"><div class="progress-fill" style="width:${progress.percent}%"></div></div>
            </div>
          ` : ""}
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
            <a class="topic-preview subject-card" href="${subjectHref(semester, subject)}">
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
      const contentPath = topic.file[language] || topic.file.en;
      const content = await fetchContent(contentPath);
      const key = topicKey(semester.id, subject.id, topic.id);
      const isDone = isTopicDone(readProgress(), semester.id, subject.id, topic.id);
      shell.innerHTML = `
        ${normalizeContentAssets(content, contentPath)}
        <div class="lesson-actions">
          ${topic.test ? `<a class="test-yourself-button" href="#/semester/${semester.id}/subject/${subject.id}/topic/${topic.id}/test">${t("testYourself")}</a>` : "<span></span>"}
          <button class="complete-button ${isDone ? "done" : ""}" type="button" id="completeButton">
            <span class="box">${isDone ? "✓" : ""}</span>
            <span>${isDone ? t("completedLabel") : t("markComplete")}</span>
          </button>
        </div>
      `;
      window.TestYourself?.init(shell);
      scheduleMathTypeset(shell);

      document.getElementById("completeButton").addEventListener("click", () => {
        const progress = readProgress();
        const legacyKey = legacyTopicKey(semester.id, subject.id, topic.id);
        const nextDone = !isTopicDone(progress, semester.id, subject.id, topic.id);
        delete progress[legacyKey];
        if (nextDone) progress[key] = true;
        else delete progress[key];
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

  async function renderChapterTestContent(semester, subject, topic) {
    const language = Settings.read().language;
    const shell = app.querySelector(".content-shell");
    shell.innerHTML = `<p>${t("loading")}</p>`;

    try {
      const contentPath = topic.test?.[language] || topic.test?.en;
      if (!contentPath) throw new Error("Missing chapter test");
      const content = await fetchContent(contentPath);
      shell.innerHTML = `
        ${normalizeContentAssets(content, contentPath)}
        <div class="lesson-actions">
          <a class="test-yourself-button" href="#/semester/${semester.id}/subject/${subject.id}/topic/${topic.id}">${t("backToChapter")}</a>
          <span></span>
        </div>
      `;
      window.TestYourself?.init(shell);
      scheduleMathTypeset(shell);
    } catch (error) {
      shell.innerHTML = `
        <h1>${label(topic.title)}</h1>
        <p>${t("contentMissing")}</p>
      `;
    }
  }

  async function renderSubjectTestContent(subjectTest) {
    const language = Settings.read().language;
    const shell = app.querySelector(".content-shell");
    shell.innerHTML = `<p>${t("loading")}</p>`;

    try {
      const contentPath = subjectTest.file[language] || subjectTest.file.en;
      const content = await fetchContent(contentPath);
      shell.innerHTML = normalizeContentAssets(content, contentPath);
      window.TestYourself?.init(shell);
      scheduleMathTypeset(shell);
    } catch (error) {
      shell.innerHTML = `
        <h1>${label(subjectTest.title)}</h1>
        <p>${t("contentMissing")}</p>
      `;
    }
  }

  async function fetchContent(contentPath) {
    const response = await fetch(contentPath);
    if (!response.ok) throw new Error("Missing content");
    return response.text();
  }

  function normalizeContentAssets(html, contentPath) {
    const template = document.createElement("template");
    const baseUrl = new URL(contentPath, location.href);
    template.innerHTML = html;

    const urlAttributes = [
      ["img", "src"],
      ["video", "src"],
      ["video", "poster"],
      ["source", "src"],
      ["track", "src"],
      ["iframe", "src"],
      ["embed", "src"],
      ["object", "data"],
      ["a", "href"]
    ];

    urlAttributes.forEach(([selector, attribute]) => {
      template.content.querySelectorAll(`${selector}[${attribute}]`).forEach((element) => {
        const value = element.getAttribute(attribute);
        if (!value || isExternalOrSpecialUrl(value)) return;
        element.setAttribute(attribute, new URL(value, baseUrl).href);
      });
    });

    return template.innerHTML;
  }

  function isExternalOrSpecialUrl(value) {
    return /^(?:[a-z][a-z0-9+.-]*:|#|\/)/i.test(value);
  }

  function scheduleMathTypeset(root) {
    if (!root) return;

    const tryTypeset = () => {
      if (!window.MathJax?.typesetPromise) return false;
      window.MathJax.typesetClear?.([root]);
      window.MathJax.typesetPromise([root]).catch(() => {});
      return true;
    };

    if (tryTypeset()) return;

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (tryTypeset() || attempts > 20) {
        window.clearInterval(timer);
      }
    }, 250);
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

    document.querySelectorAll(".reader-sidebar .nav-item").forEach((item) => {
      item.addEventListener("click", () => {
        if (!isMobileReader()) return;
        const navKind = item.dataset.navKind;
        sidebarCollapsed = navKind === "topic" || navKind === "test";
      });
    });

    reset?.addEventListener("click", () => {
      const { semesterId, subjectId } = parseRoute();
      const semester = findSemester(semesterId);
      const subject = findSubject(semester, subjectId);
      const progress = readProgress();
      const subjects = subject ? [subject] : semester.subjects;
      subjects.forEach((currentSubject) => {
        currentSubject.topics.forEach((topic) => {
          delete progress[topicKey(semester.id, currentSubject.id, topic.id)];
          delete progress[legacyTopicKey(semester.id, currentSubject.id, topic.id)];
        });
      });
      writeProgress(progress);
      render();
    });
  }

  function renderReader(route) {
    const semester = findSemester(route.semesterId);
    const subject = findSubject(semester, route.subjectId);
    const topic = findTopic(subject, route.topicId);
    const subjectTest = findSubjectTest(subject, route.subjectTestId);

    if (!semester) {
      renderHome();
      return;
    }

    if (subject && route.subjectTestId && !subjectTest) {
      location.replace(firstTopicHref(semester, subject));
      return;
    }

    if (subject && route.topicId && !topic) {
      location.replace(firstTopicHref(semester, subject));
      return;
    }

    if (subject && !topic && !subjectTest && !isMobileReader()) {
      const firstTopic = subject.topics[0];
      if (firstTopic) {
        location.replace(`#/semester/${semester.id}/subject/${subject.id}/topic/${firstTopic.id}`);
        return;
      }
    }

    if (isMobileReader() && !topic && !subjectTest) {
      sidebarCollapsed = false;
    }

    const content = topic || subjectTest
      ? `<article class="content-shell"></article>`
      : renderSemesterOverview(semester);

    app.innerHTML = `
      <section class="reader ${sidebarCollapsed ? "collapsed" : ""}">
        ${renderSidebar({ semester, subject, topic, subjectTest })}
        <button class="sidebar-toggle" id="sidebarToggle" type="button" aria-controls="readerSidebar" aria-expanded="${!sidebarCollapsed}">${sidebarCollapsed ? "›" : "‹"}</button>
        <main class="reader-content">${content}</main>
      </section>
    `;

    bindReaderActions();
    if (topic && route.chapterTest) renderChapterTestContent(semester, subject, topic);
    else if (topic) renderTopicContent(semester, subject, topic);
    else if (subjectTest) renderSubjectTestContent(subjectTest);
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
  mobileMedia.addEventListener("change", (event) => {
    sidebarCollapsed = event.matches;
    render();
  });
  Settings.init();
  render();
})();
