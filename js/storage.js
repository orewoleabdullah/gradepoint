(function () {
  "use strict";

  const KEY = "gradepoint-data-v1";
  const defaults = {
    scale: "5",
    custom: { maximum: 5, grades: [{ letter: "A", point: 5 }, { letter: "B", point: 4 }, { letter: "C", point: 3 }, { letter: "D", point: 2 }, { letter: "F", point: 0 }] },
    courses: Array.from({ length: 4 }, () => ({ code: "", units: "", grade: "" })),
    semesters: [],
    previous: { points: "", units: "" },
    history: []
  };

  function load() {
    const saved = localStorage.getItem(KEY);
    if (!saved) return structuredClone(defaults);
    let parsed;
    try {
      parsed = JSON.parse(saved);
    } catch (error) {
      console.error("GradePoint could not read saved data.", error);
      throw new Error("Saved data could not be read. Reset academic records to start again.");
    }
    return {
      ...structuredClone(defaults),
      ...parsed,
      custom: { ...defaults.custom, ...(parsed.custom || {}) },
      previous: { ...defaults.previous, ...(parsed.previous || {}) },
      courses: Array.isArray(parsed.courses) ? parsed.courses : structuredClone(defaults.courses),
      semesters: Array.isArray(parsed.semesters) ? parsed.semesters : [],
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, 10) : []
    };
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (error) {
      console.error("GradePoint could not save data.", error);
      throw new Error("Your browser could not save these changes. Check that local storage is available.");
    }
  }

  window.GradePointStorage = { load, save, defaults };
})();
