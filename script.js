
const coursesBox = document.getElementById("courses");

function addCourse(name = "", credit = "", min = 60, max = 75) {
  const course = document.createElement("div");
  course.className = "course";

  course.innerHTML = `
    <label>Course Name</label>
    <input class="courseName" placeholder="Course name">

    <div class="fields">
      <div>
        <label>Credit</label>
        <input class="credit" type="number"
          min="0.01" step="0.01" placeholder="3.00">
      </div>

      <div>
        <label>Minimum Expected Marks</label>
        <input class="minMark" type="number"
          min="0" max="100" placeholder="60">
      </div>

      <div>
        <label>Maximum Expected Marks</label>
        <input class="maxMark" type="number"
          min="0" max="100" placeholder="75">
      </div>
    </div>

    <button class="remove">Remove Course</button>
  `;

  course.querySelector(".courseName").value = name;
  course.querySelector(".credit").value = credit;
  course.querySelector(".minMark").value = min;
  course.querySelector(".maxMark").value = max;

  course.querySelector(".remove").onclick = () => course.remove();

  coursesBox.appendChild(course);
}

function getScale() {
  const lines = document.getElementById("grading")
    .value.trim().split("\n");

  const scale = lines.map(line => {
    const parts = line.split(",");
    return {
      mark: Number(parts[0]),
      point: Number(parts[1])
    };
  });

  if (!scale.length || scale.some(x =>
    !Number.isFinite(x.mark) ||
    !Number.isFinite(x.point) ||
    x.mark < 0 || x.mark > 100 ||
    x.point < 0 || x.point > 10
  )) {
    throw new Error("Invalid grading scale.");
  }

  scale.sort((a,b) => b.mark-a.mark);

  if (scale[scale.length-1].mark !== 0 ||
      new Set(scale.map(x=>x.mark)).size !== scale.length) {
    throw new Error("Grading scale needs unique marks and a 0 mark rule.");
  }

  return scale;
}

function getPoint(mark, scale) {
  const rule = scale.find(item => mark >= item.mark);
  return rule ? rule.point : 0;
}

function saveSettings() {
  try {
    getScale();

    const settings = {
      university: document.getElementById("university").value,
      grading: document.getElementById("grading").value
    };

    localStorage.setItem("cgpaSettings", JSON.stringify(settings));
    alert("University settings saved successfully!");
  } catch(error) {
    alert(error.message);
  }
}

function loadSettings() {
  const saved = localStorage.getItem("cgpaSettings");

  if (saved) {
    try {
      const data = JSON.parse(saved);
      document.getElementById("university").value =
        data.university || "";
      document.getElementById("grading").value =
        data.grading || document.getElementById("grading").value;
    } catch(error) {
      console.log("Could not load settings.");
    }
  }
}

function calculate() {
  try {
    const scale = getScale();
    const courseElements =
      [...document.querySelectorAll(".course")];

    if (courseElements.length === 0) {
      throw new Error("Please add at least one course.");
    }

    let credits = 0;
    let minimumPoints = 0;
    let maximumPoints = 0;
    let likelyPoints = 0;

    for (const course of courseElements) {
      const name = course.querySelector(".courseName").value.trim();
      const credit = Number(course.querySelector(".credit").value);
      const minInput = course.querySelector(".minMark").value;
      const maxInput = course.querySelector(".maxMark").value;
      const min = Number(minInput);
      const max = Number(maxInput);

      if (!name || !credit || credit <= 0 ||
          minInput === "" || maxInput === "" ||
          !Number.isFinite(min) || !Number.isFinite(max) ||
          min < 0 || max > 100 || min > max) {
        throw new Error("Please check all course details.");
      }

      const lowGP = getPoint(min, scale);
      const highGP = getPoint(max, scale);
      const likelyGP = getPoint((min + max) / 2, scale);

      credits += credit;
      minimumPoints += credit * lowGP;
      maximumPoints += credit * highGP;
      likelyPoints += credit * likelyGP;
    }

    const minGPA = minimumPoints / credits;
    const maxGPA = maximumPoints / credits;
    const likelyGPA = likelyPoints / credits;

    const previousGPAInput =
      document.getElementById("previousGPA").value;
    const previousCreditsInput =
      document.getElementById("previousCredits").value;

    let previousGPA = 0;
    let previousCredits = 0;

    if (previousGPAInput !== "" || previousCreditsInput !== "") {
      if (previousGPAInput === "" || previousCreditsInput === "") {
        throw new Error("Enter both previous CGPA and credits.");
      }

      previousGPA = Number(previousGPAInput);
      previousCredits = Number(previousCreditsInput);

      const maxGP = Math.max(...scale.map(x => x.point));

      if (!Number.isFinite(previousGPA) ||
          !Number.isFinite(previousCredits) ||
          previousGPA < 0 || previousGPA > maxGP ||
          previousCredits < 0) {
        throw new Error("Invalid previous academic record.");
      }
    }

    const totalCredits = previousCredits + credits;
    const cumulativeMin =
      (previousGPA * previousCredits + minimumPoints) / totalCredits;
    const cumulativeMax =
      (previousGPA * previousCredits + maximumPoints) / totalCredits;
    const cumulativeLikely =
      (previousGPA * previousCredits + likelyPoints) / totalCredits;

    const fixed = n => n.toFixed(2);

    document.getElementById("range").textContent =
      fixed(minGPA) + " - " + fixed(maxGPA);

    document.getElementById("minimum").textContent = fixed(minGPA);
    document.getElementById("likely").textContent = fixed(likelyGPA);
    document.getElementById("maximum").textContent = fixed(maxGPA);

    document.getElementById("totalCredits").textContent =
      "Semester Credits: " + fixed(credits);

    document.getElementById("cumulative").textContent =
      "Estimated Overall CGPA: " +
      fixed(cumulativeMin) + " - " +
      fixed(cumulativeMax) +
      " | Most Likely: " + fixed(cumulativeLikely);

    document.getElementById("result").hidden = false;
    document.getElementById("result").scrollIntoView({
      behavior: "smooth"
    });

  } catch(error) {
    alert(error.message);
  }
}

loadSettings();
addCourse("Digital Logic Design", 3, 75, 85);
addCourse("DBMS", 3, 65, 75);
addCourse("Mathematics", 4, 60, 70);
