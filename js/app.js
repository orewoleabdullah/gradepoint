(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const state = window.GradePointStorage.load();
  let semesterDraft = null;
  let customDraft = { maximum: state.custom.maximum, grades: state.custom.grades.map((grade) => ({ ...grade })) };
  const scaleSelect = $("#grading-scale");

  function currentScale() {
    return window.GradePointGrading.getScale(state.scale, state.custom);
  }

  function gradeDefinition(letter) {
    const grade = currentScale().grades.find((item) => item.letter === letter);
    return grade ? `${letter}:${grade.point}` : "";
  }

  function persist(message) {
    try {
      window.GradePointStorage.save(state);
    } catch (error) {
      showAppMessage(error.message);
      return false;
    }
    if (message) showAppMessage(message);
    return true;
  }

  function showAppMessage(message) {
    const target = $("#app-message");
    target.textContent = message;
    window.clearTimeout(showAppMessage.timer);
    showAppMessage.timer = window.setTimeout(() => { target.textContent = ""; }, 3500);
  }

  function format(value) {
    return Number(value).toFixed(2);
  }

  function clearResult(type) {
    $(`#${type}-result`).hidden = true;
    $(`#${type}-result`).replaceChildren();
    $(`#${type}-message`).textContent = "";
  }

  function renderGrades(select, selected, course) {
    select.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select grade";
    select.append(placeholder);

    const scale = currentScale();
    const stale = Boolean(selected && course.gradeDefinition && course.gradeDefinition !== gradeDefinition(selected));
    const matching = scale.grades.some((grade) => grade.letter === selected);
    if (stale) {
      const oldGrade = document.createElement("option");
      oldGrade.value = "__reselect__";
      oldGrade.textContent = `Previously ${selected} — reselect`;
      oldGrade.selected = true;
      select.append(oldGrade);
    } else if (selected && !matching) {
      const oldGrade = document.createElement("option");
      oldGrade.value = selected;
      oldGrade.textContent = `${selected} — unavailable on this scale`;
      oldGrade.selected = true;
      select.append(oldGrade);
    }
    for (const grade of scale.grades) {
      const option = document.createElement("option");
      option.value = grade.letter;
      option.textContent = `${grade.letter} (${grade.point})`;
      option.selected = !stale && grade.letter === selected;
      select.append(option);
    }
    if (!selected) select.value = "";
  }

  function renderCourses() {
    const container = $("#course-rows");
    container.replaceChildren();
    state.courses.forEach((course, index) => {
      const row = document.createElement("div");
      row.className = "course-grid course-row";
      row.dataset.index = String(index);

      const code = document.createElement("input");
      code.type = "text";
      code.maxLength = 24;
      code.placeholder = "e.g. CSC 201";
      code.value = course.code;
      code.setAttribute("aria-label", `Course ${index + 1} code`);
      code.autocomplete = "off";

      const units = document.createElement("input");
      units.type = "number";
      units.min = "0.01";
      units.step = "0.5";
      units.inputMode = "decimal";
      units.placeholder = "e.g. 3";
      units.value = course.units;
      units.setAttribute("aria-label", `Course ${index + 1} units`);

      const grade = document.createElement("select");
      grade.setAttribute("aria-label", `Course ${index + 1} grade`);
      if (course.grade && !course.gradeDefinition) course.gradeDefinition = gradeDefinition(course.grade);
      renderGrades(grade, course.grade, course);
      const codeField = document.createElement("label");
      codeField.className = "course-field";
      const codeLabel = document.createElement("span");
      codeLabel.textContent = "Course code";
      codeField.append(codeLabel, code);
      const unitField = document.createElement("label");
      unitField.className = "course-field";
      const unitLabel = document.createElement("span");
      unitLabel.textContent = "Course unit";
      unitField.append(unitLabel, units);
      const gradeField = document.createElement("label");
      gradeField.className = "course-field";
      const gradeLabel = document.createElement("span");
      gradeLabel.textContent = "Grade";
      gradeField.append(gradeLabel, grade);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove-course";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Remove course ${index + 1}`);
      remove.addEventListener("click", () => {
        state.courses.splice(index, 1);
        persist();
        renderCourses();
        clearResult("gpa");
      });

      code.addEventListener("input", () => { course.code = code.value; persist(); clearResult("gpa"); });
      units.addEventListener("input", () => { course.units = units.value; persist(); clearResult("gpa"); });
      grade.addEventListener("change", () => {
        if (grade.value === "__reselect__") return;
        course.grade = grade.value;
        course.gradeDefinition = gradeDefinition(grade.value);
        persist();
        clearResult("gpa");
      });
      row.append(codeField, unitField, gradeField, remove);
      container.append(row);
    });
    const maximum = currentScale().maximum;
    $("#scale-note").textContent = `Grades on a ${Number.isInteger(maximum) ? maximum.toFixed(1) : maximum} scale`;
  }

  function renderCustomScale() {
    $("#custom-maximum").value = customDraft.maximum;
    const rows = $("#custom-grades");
    rows.replaceChildren();
    customDraft.grades.forEach((grade, index) => {
      const row = document.createElement("div");
      row.className = "custom-grade-row";
      const letter = document.createElement("input");
      letter.type = "text";
      letter.maxLength = 6;
      letter.value = grade.letter;
      letter.placeholder = "A";
      letter.setAttribute("aria-label", `Custom grade ${index + 1} label`);
      const point = document.createElement("input");
      point.type = "number";
      point.min = "0";
      point.step = "0.1";
      point.value = grade.point;
      point.setAttribute("aria-label", `Custom grade ${index + 1} point`);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "icon-button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Remove custom grade ${index + 1}`);
      remove.addEventListener("click", () => {
        if (customDraft.grades.length <= 2) {
          $("#grading-message").textContent = "Keep at least two grade options.";
          return;
        }
        customDraft.grades.splice(index, 1);
        renderCustomScale();
      });
      letter.addEventListener("input", () => { grade.letter = letter.value.toUpperCase(); });
      point.addEventListener("input", () => { grade.point = point.value; });
      row.append(letter, point, remove);
      rows.append(row);
    });
  }

  function addCustomGrade() {
    customDraft.grades.push({ letter: "", point: "" });
    renderCustomScale();
    const inputs = $("#custom-grades").querySelectorAll("input");
    inputs[inputs.length - 2].focus();
  }

  function saveCustomScale() {
    const maximum = Number($("#custom-maximum").value);
    const inputs = Array.from($("#custom-grades").querySelectorAll(".custom-grade-row"));
    const grades = inputs.map((row) => ({
      letter: row.querySelector('input[type="text"]').value.trim().toUpperCase(),
      point: row.querySelector('input[type="number"]').value.trim() === "" ? NaN : Number(row.querySelector('input[type="number"]').value)
    }));
    const error = window.GradePointGrading.validateCustomScale(maximum, grades);
    if (error) {
      $("#grading-message").textContent = error;
      return;
    }
    state.custom = { maximum, grades };
    customDraft = { maximum, grades: grades.map((grade) => ({ ...grade })) };
    state.scale = "custom";
    scaleSelect.value = "custom";
    persist("Custom grading scale saved.");
    $("#grading-message").textContent = "Custom grading scale saved. Reselect any course grade whose points changed.";
    renderCustomScale();
    renderCourses();
    renderSemesters();
    clearResult("gpa");
    clearResult("cgpa");
  }

  function makeResult(target, result) {
    const scale = currentScale();
    const left = document.createElement("div");
    left.className = "result-main";
    const label = document.createElement("span");
    label.className = "result-label";
    label.textContent = target.id === "gpa-result" ? "Your semester GPA" : "Your cumulative GPA";
    const value = document.createElement("strong");
    value.className = "result-value";
    value.textContent = format(result.value);
    const classification = document.createElement("span");
    classification.className = "classification";
    classification.textContent = window.GradePointCalculator.classify(result.value, scale.maximum);
    left.append(label, value, classification);

    const stats = document.createElement("div");
    stats.className = "result-stats";
    const units = document.createElement("div");
    units.className = "result-stat";
    const unitsValue = document.createElement("strong");
    unitsValue.textContent = format(result.totalUnits);
    const unitsLabel = document.createElement("span");
    unitsLabel.textContent = "Total course units";
    units.append(unitsValue, unitsLabel);
    const points = document.createElement("div");
    points.className = "result-stat";
    const pointsValue = document.createElement("strong");
    pointsValue.textContent = format(result.weightedPoints);
    const pointsLabel = document.createElement("span");
    pointsLabel.textContent = "Weighted grade points";
    points.append(pointsValue, pointsLabel);
    stats.append(units, points);
    target.replaceChildren(left, stats);
    target.hidden = false;
  }

  function addHistory(type, result) {
    const label = type === "gpa" ? "GPA" : "CGPA";
    state.history.unshift({
      type: label,
      value: format(result.value),
      units: format(result.totalUnits),
      date: new Date().toISOString()
    });
    state.history = state.history.slice(0, 10);
    persist();
    renderHistory();
  }

  function renderHistory() {
    const list = $("#history-list");
    list.replaceChildren();
    state.history.forEach((item) => {
      const entry = document.createElement("li");
      entry.className = "history-item";
      const result = document.createElement("strong");
      result.textContent = `${item.type}: ${item.value}`;
      const meta = document.createElement("span");
      meta.className = "history-meta";
      const date = new Date(item.date);
      const dateText = Number.isNaN(date.getTime()) ? "Saved calculation" : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
      meta.textContent = `${format(Number(item.units))} course units · ${dateText}`;
      entry.append(result, meta);
      list.append(entry);
    });
    $("#empty-history").hidden = state.history.length > 0;
  }

  function validatePrevious(pointsValue, unitsValue, maximum) {
    const pointsBlank = pointsValue.trim() === "";
    const unitsBlank = unitsValue.trim() === "";
    if (pointsBlank && unitsBlank) return { points: "", units: "" };
    if (pointsBlank || unitsBlank) throw new Error("Enter both previous weighted points and total credit units, or leave both blank.");
    const points = Number(pointsValue);
    const units = Number(unitsValue);
    if (!Number.isFinite(units) || units <= 0) throw new Error("Previous credit units must be a positive number.");
    if (!Number.isFinite(points) || points < 0 || points > units * maximum) throw new Error(`Previous weighted points must be between 0 and ${format(units * maximum)} for this scale.`);
    return { points: String(points), units: String(units) };
  }

  function renderPrevious() {
    $("#previous-points").value = state.previous.points;
    $("#previous-units").value = state.previous.units;
  }

  function renderSemesters() {
    const list = $("#semester-list");
    list.replaceChildren();
    state.semesters.forEach((semester) => {
      const item = document.createElement("article");
      item.className = "semester-item";
      const name = document.createElement("div");
      name.className = "semester-name";
      const nameLabel = document.createElement("span");
      nameLabel.className = "field-label";
      nameLabel.textContent = "Semester";
      const nameValue = document.createElement("strong");
      nameValue.textContent = semester.name;
      nameValue.style.display = "block";
      nameValue.style.paddingTop = "9px";
      name.append(nameLabel, nameValue);

      const gpa = document.createElement("div");
      const gpaLabel = document.createElement("span");
      gpaLabel.className = "field-label";
      gpaLabel.textContent = "Semester GPA";
      const gpaValue = document.createElement("span");
      gpaValue.textContent = format(Number(semester.gpa));
      gpaValue.style.display = "block";
      gpaValue.style.paddingTop = "10px";
      gpa.append(gpaLabel, gpaValue);

      const units = document.createElement("div");
      const unitsLabel = document.createElement("span");
      unitsLabel.className = "field-label";
      unitsLabel.textContent = "Credit units";
      const unitsValue = document.createElement("span");
      unitsValue.textContent = format(Number(semester.units));
      unitsValue.style.display = "block";
      unitsValue.style.paddingTop = "10px";
      units.append(unitsLabel, unitsValue);

      const buttons = document.createElement("div");
      buttons.className = "semester-buttons";
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "icon-button";
      edit.textContent = "✎";
      edit.setAttribute("aria-label", `Edit ${semester.name}`);
      edit.addEventListener("click", () => beginSemesterEdit(semester));
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "icon-button semester-delete";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Delete ${semester.name}`);
      remove.addEventListener("click", () => {
        if (!window.confirm(`Delete "${semester.name}"?`)) return;
        state.semesters = state.semesters.filter((record) => record.id !== semester.id);
        persist("Semester deleted.");
        renderSemesters();
        clearResult("cgpa");
      });
      buttons.append(edit, remove);
      item.append(name, gpa, units, buttons);
      list.append(item);
    });
    if (semesterDraft) renderSemesterEditor(list);
  }

  function beginSemesterEdit(semester) {
    semesterDraft = semester ? { ...semester } : { id: "", name: "", gpa: "", units: "" };
    $("#cgpa-message").textContent = "";
    renderSemesters();
    $("#semester-name").focus();
  }

  function renderSemesterEditor(list) {
    const form = document.createElement("form");
    form.className = "semester-item semester-editor";
    form.noValidate = true;
    const fields = [
      { key: "name", label: "Semester name", placeholder: "e.g. 100 Level First Semester", type: "text" },
      { key: "gpa", label: "Semester GPA", placeholder: `0 – ${currentScale().maximum}`, type: "number", min: "0", max: String(currentScale().maximum), step: "0.01" },
      { key: "units", label: "Total credit units", placeholder: "e.g. 18", type: "number", min: "0.01", step: "0.5" }
    ];
    fields.forEach((field, index) => {
      const label = document.createElement("label");
      label.className = `field-label${index === 0 ? " semester-name" : ""}`;
      label.textContent = field.label;
      const input = document.createElement("input");
      input.id = index === 0 ? "semester-name" : "";
      input.type = field.type;
      input.placeholder = field.placeholder;
      input.value = semesterDraft[field.key];
      input.dataset.key = field.key;
      if (field.min) input.min = field.min;
      if (field.max) input.max = field.max;
      if (field.step) input.step = field.step;
      if (field.type === "number") input.inputMode = "decimal";
      input.addEventListener("input", () => { semesterDraft[field.key] = input.value; });
      label.append(input);
      form.append(label);
    });
    const buttons = document.createElement("div");
    buttons.className = "semester-buttons";
    const save = document.createElement("button");
    save.type = "submit";
    save.className = "button button-primary button-small";
    save.textContent = "Save";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "icon-button";
    cancel.textContent = "×";
    cancel.setAttribute("aria-label", "Cancel semester edit");
    cancel.addEventListener("click", () => { semesterDraft = null; renderSemesters(); });
    buttons.append(save, cancel);
    form.append(buttons);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = semesterDraft.name.trim();
      const gpa = Number(semesterDraft.gpa);
      const units = Number(semesterDraft.units);
      if (!name) return showCgpaError("Enter a name for this semester.");
      if (String(semesterDraft.gpa).trim() === "" || !Number.isFinite(gpa) || gpa < 0 || gpa > currentScale().maximum) return showCgpaError(`Semester GPA must be between 0 and ${currentScale().maximum}.`);
      if (semesterDraft.units.trim() === "" || !Number.isFinite(units) || units <= 0) return showCgpaError("Semester credit units must be a positive number.");
      const saved = { id: semesterDraft.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, gpa: String(gpa), units: String(units) };
      const existing = state.semesters.findIndex((semester) => semester.id === saved.id);
      if (existing < 0) state.semesters.push(saved);
      else state.semesters[existing] = saved;
      semesterDraft = null;
      persist("Semester saved.");
      renderSemesters();
      clearResult("cgpa");
      $("#cgpa-message").textContent = "";
    });
    list.append(form);
  }

  function showCgpaError(message) {
    $("#cgpa-message").textContent = message;
  }

  function renderTabs(tab) {
    const isGpa = tab === "gpa";
    $("#gpa-panel").hidden = !isGpa;
    $("#cgpa-panel").hidden = isGpa;
    $("#gpa-tab").classList.toggle("is-active", isGpa);
    $("#cgpa-tab").classList.toggle("is-active", !isGpa);
    $("#gpa-tab").setAttribute("aria-selected", String(isGpa));
    $("#cgpa-tab").setAttribute("aria-selected", String(!isGpa));
  }

  scaleSelect.value = state.scale;
  renderCustomScale();
  renderCourses();
  renderPrevious();
  renderSemesters();
  renderHistory();

  $("#add-course").addEventListener("click", () => {
    state.courses.push({ code: "", units: "", grade: "" });
    persist();
    renderCourses();
    const rows = $("#course-rows").querySelectorAll("input[type=text]");
    rows[rows.length - 1].focus();
  });
  $("#calculate-gpa").addEventListener("click", () => {
    clearResult("gpa");
    const activeCourses = state.courses.filter((course) => course.code.trim() || String(course.units).trim() || course.grade);
    try {
      if (activeCourses.some((course) => course.grade && course.gradeDefinition && course.gradeDefinition !== gradeDefinition(course.grade))) {
        throw new Error("The grading scale changed. Reselect each course grade marked for review before calculating.");
      }
      const result = window.GradePointCalculator.calculateGpa(activeCourses, currentScale().grades);
      makeResult($("#gpa-result"), result);
      addHistory("gpa", result);
      showAppMessage("GPA calculated successfully.");
    } catch (error) {
      $("#gpa-message").textContent = error.message;
    }
  });
  $("#gpa-tab").addEventListener("click", () => renderTabs("gpa"));
  $("#cgpa-tab").addEventListener("click", () => renderTabs("cgpa"));
  $("#grading-scale").addEventListener("change", () => {
    state.scale = scaleSelect.value;
    persist();
    $("#grading-message").textContent = "Scale updated. Existing grades were kept; reselect any course grade whose points changed.";
    renderCourses();
    renderSemesters();
    clearResult("gpa");
    clearResult("cgpa");
  });
  $("#toggle-grading-settings").addEventListener("click", (event) => {
    const panel = $("#grading-settings");
    panel.hidden = !panel.hidden;
    event.currentTarget.setAttribute("aria-expanded", String(!panel.hidden));
    if (!panel.hidden) renderCustomScale();
  });
  $("#add-custom-grade").addEventListener("click", addCustomGrade);
  $("#save-custom-scale").addEventListener("click", saveCustomScale);

  $("#previous-record").addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      state.previous = validatePrevious($("#previous-points").value, $("#previous-units").value, currentScale().maximum);
      persist("Previous cumulative record saved.");
      $("#previous-message").textContent = state.previous.units ? "Previous record saved." : "Previous record cleared.";
      clearResult("cgpa");
    } catch (error) {
      $("#previous-message").textContent = error.message;
    }
  });
  $("#add-semester").addEventListener("click", () => {
    if (semesterDraft) {
      $("#semester-name").focus();
      return;
    }
    beginSemesterEdit(null);
  });
  $("#calculate-cgpa").addEventListener("click", () => {
    clearResult("cgpa");
    try {
      const previous = validatePrevious(state.previous.points, state.previous.units, currentScale().maximum);
      const maximum = currentScale().maximum;
      if (state.semesters.some((semester) => Number(semester.gpa) > maximum)) throw new Error(`A saved semester GPA is above the current ${maximum} scale. Edit that semester or choose a compatible scale.`);
      const result = window.GradePointCalculator.calculateCgpa(previous, state.semesters);
      makeResult($("#cgpa-result"), result);
      addHistory("cgpa", result);
      showAppMessage("CGPA calculated successfully.");
    } catch (error) {
      showCgpaError(error.message);
    }
  });
  $("#clear-history").addEventListener("click", () => {
    if (state.history.length === 0) return;
    if (!window.confirm("Clear all calculation history?")) return;
    state.history = [];
    persist("Calculation history cleared.");
    renderHistory();
  });
  $("#reset-records").addEventListener("click", () => {
    if (!window.confirm("Reset courses, semester records, previous results and calculation history? Your grading scale settings will be kept.")) return;
    state.courses = window.GradePointStorage.defaults.courses.map((course) => ({ ...course }));
    state.semesters = [];
    state.previous = { points: "", units: "" };
    state.history = [];
    semesterDraft = null;
    persist("Academic records reset.");
    renderCourses();
    renderSemesters();
    renderPrevious();
    renderHistory();
    clearResult("gpa");
    clearResult("cgpa");
  });
})();
