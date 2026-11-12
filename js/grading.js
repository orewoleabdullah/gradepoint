(function () {
  "use strict";

  const builtInScales = {
    "5": { maximum: 5, grades: [{ letter: "A", point: 5 }, { letter: "B", point: 4 }, { letter: "C", point: 3 }, { letter: "D", point: 2 }, { letter: "E", point: 1 }, { letter: "F", point: 0 }] },
    "4": { maximum: 4, grades: [{ letter: "A", point: 4 }, { letter: "B", point: 3 }, { letter: "C", point: 2 }, { letter: "D", point: 1 }, { letter: "F", point: 0 }] }
  };

  function getScale(key, custom) {
    if (key === "custom") return custom;
    return builtInScales[key];
  }

  function validateCustomScale(maximum, grades) {
    const max = Number(maximum);
    if (!Number.isFinite(max) || max <= 0 || max > 10) return "Maximum grade point must be greater than 0 and no more than 10.";
    if (!Array.isArray(grades) || grades.length < 2) return "Add at least two grade options.";
    const seen = new Set();
    for (const grade of grades) {
      const letter = String(grade.letter || "").trim().toUpperCase();
      const point = Number(grade.point);
      if (!/^[A-Z][A-Z0-9+-]{0,5}$/.test(letter)) return "Each grade must be a short letter or label (for example A or A-).";
      if (seen.has(letter)) return "Each grade label must be unique.";
      if (!Number.isFinite(point) || point < 0 || point > max) return "Grade points must be between 0 and the maximum grade point.";
      seen.add(letter);
    }
    return "";
  }

  window.GradePointGrading = { getScale, validateCustomScale, builtInScales };
})();
