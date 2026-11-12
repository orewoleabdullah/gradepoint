# GradePoint

GradePoint is a lightweight, responsive GPA and CGPA calculator for university students. It runs in a browser without an account or backend and saves data in the browser's LocalStorage.

## Features

- Calculate semester GPA from course units and letter grades.
- Switch between default 5.0 and 4.0 grading scales or configure a custom scale.
- Add and remove courses; incomplete course rows are ignored unless started, in which case they must be completed.
- Track, edit, and delete semester results for a weighted CGPA.
- Include earlier weighted grade points and credit units in a CGPA calculation.
- Save course entries, scale settings, semester records, previous records, and recent calculation history on the device.
- Reset academic records or clear calculation history with confirmation.
- Responsive layout and accessible, keyboard-operable controls.

## Run

Open `index.html` in a modern browser. No installation, build step, or server is required. LocalStorage must be enabled for persistence.

## Calculation methodology

For course-level GPA, each course's grade point is multiplied by its course units:

`GPA = sum(course units × grade point) / sum(course units)`

For CGPA, saved semester GPAs are weighted by their credit units. Any previous cumulative weighted grade points and credit units are added to the same totals:

`CGPA = (previous weighted points + sum(semester GPA × semester units)) / (previous units + sum(semester units))`

Default points are A–F = 5, 4, 3, 2, 1, 0 on the 5.0 scale and A, B, C, D, F = 4, 3, 2, 1, 0 on the 4.0 scale. A custom scale accepts grade labels and point values from zero up to the configured maximum (maximum allowed: 10). Classification is based on the calculated score as a proportion of the selected scale maximum; it is a general guide, not an official university classification.

The brief's sample course values produce 43 weighted points (15 + 12 + 10 + 6) and a GPA of 4.30; the stated total of 42 and GPA of 4.20 do not match those inputs.
