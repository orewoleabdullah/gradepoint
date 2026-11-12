(function () {
  "use strict";

  function calculateGpa(courses, grades) {
    let totalUnits = 0;
    let weightedPoints = 0;
    for (const course of courses) {
      const units = Number(course.units);
      const grade = grades.find((item) => item.letter === course.grade);
      if (!course.code.trim()) throw new Error("Enter a course code for every course you have started.");
      if (!Number.isFinite(units) || units <= 0) throw new Error("Course units must be a positive number.");
      if (!grade) throw new Error("Choose a grade for every course you have started.");
      totalUnits += units;
      weightedPoints += units * Number(grade.point);
    }
    if (courses.length === 0 || totalUnits <= 0) throw new Error("Add at least one complete course before calculating.");
    return { value: weightedPoints / totalUnits, totalUnits, weightedPoints };
  }

  function calculateCgpa(previous, semesters) {
    const previousUnits = Number(previous.units) || 0;
    const previousPoints = Number(previous.points) || 0;
    let totalUnits = previousUnits;
    let weightedPoints = previousPoints;
    for (const semester of semesters) {
      const units = Number(semester.units);
      const gpa = Number(semester.gpa);
      if (!semester.name.trim()) throw new Error("Enter a name for each semester.");
      if (!Number.isFinite(units) || units <= 0) throw new Error("Semester credit units must be a positive number.");
      if (!Number.isFinite(gpa) || gpa < 0) throw new Error("Semester GPA must be zero or higher.");
      totalUnits += units;
      weightedPoints += gpa * units;
    }
    if (totalUnits <= 0) throw new Error("Add a semester or previous record before calculating CGPA.");
    return { value: weightedPoints / totalUnits, totalUnits, weightedPoints };
  }

  function classify(value, maximum) {
    const ratio = value / maximum;
    if (ratio >= 0.8) return "Excellent";
    if (ratio >= 0.7) return "Very good";
    if (ratio >= 0.6) return "Good";
    if (ratio >= 0.5) return "Pass";
    return "Below pass";
  }

  window.GradePointCalculator = { calculateGpa, calculateCgpa, classify };
})();
