(function () {
  const optionLetters = ["A", "B", "C", "D"];
  const messages = {
    en: {
      choose: "Choose one option first.",
      correct: "Correct.",
      incorrect: "Not quite. Correct answer:"
    },
    hi: {
      choose: "पहले एक विकल्प चुनें।",
      correct: "सही।",
      incorrect: "अभी सही नहीं। सही उत्तर:"
    }
  };

  function t(key) {
    const language = window.Settings?.read().language || "en";
    return messages[language]?.[key] || messages.en[key];
  }

  function selectedOption(question) {
    return question.querySelector("input[type='radio']:checked");
  }

  function optionText(question, value) {
    const input = question.querySelector(`input[type='radio'][value='${value}']`);
    const label = input?.closest("label");
    return label?.querySelector(".option-text")?.textContent.trim() || label?.textContent.trim() || "";
  }

  function updateFeedback(question, message, correct) {
    const feedback = question.querySelector(".test-feedback");
    if (!feedback) return;
    feedback.textContent = message;
    feedback.classList.toggle("correct", correct);
    feedback.classList.toggle("incorrect", !correct);
  }

  function checkAnswer(question) {
    const answer = question.dataset.answer;
    const choice = selectedOption(question);
    if (!answer || !choice) {
      updateFeedback(question, t("choose"), false);
      return;
    }

    const correct = choice.value === answer;
    const answerText = optionText(question, answer);
    const answerLine = answerText ? `${answer}: ${answerText}` : answer;
    const explanation = question.dataset.explanation ? ` — ${question.dataset.explanation}` : "";
    updateFeedback(
      question,
      correct ? `${t("correct")} ${answerLine}${explanation}` : `${t("incorrect")} ${answerLine}${explanation}`,
      correct
    );
  }

  function prepareQuestion(question) {
    question.querySelectorAll("input[type='radio']").forEach((input, index) => {
      if (!input.value) input.value = optionLetters[index] || String(index + 1);
    });
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".test-check-answer");
    if (!button) return;
    const question = button.closest(".test-mcq");
    if (question) checkAnswer(question);
  });

  document.addEventListener("change", (event) => {
    const input = event.target.closest(".test-mcq input[type='radio']");
    if (!input) return;
    const question = input.closest(".test-mcq");
    question?.querySelector(".test-feedback")?.replaceChildren();
  });

  window.TestYourself = {
    init(root = document) {
      root.querySelectorAll(".test-mcq").forEach(prepareQuestion);
    }
  };
})();
