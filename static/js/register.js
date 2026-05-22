const courses = [
  "Computer Science",
  "Software Engineering",
  "Digital Marketing",
  "Business Management",
  "Psychology",
];

const inputv = document.querySelector(".course-input");
const dropdown = document.querySelector(".course-dropdown");

inputv.addEventListener("input", () => {
  const value = inputv.value.toLowerCase();

  dropdown.innerHTML = "";

  if (!value) {
    dropdown.classList.remove("active");
    return;
  }

  const filtered = courses.filter((c) => c.toLowerCase().includes(value));

  filtered.forEach((course) => {
    const li = document.createElement("li");
    li.textContent = course;

    li.addEventListener("click", () => {
      inputv.value = course;
      dropdown.classList.remove("active");
    });

    dropdown.appendChild(li);
  });

  dropdown.classList.toggle("active", filtered.length > 0);
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".course-wrapper")) {
    dropdown.classList.remove("active");
  }
});

// Continue buuton handler and validation for step 1
const firstName = document.querySelector("input[name='firstName']");
const lastName = document.querySelector("input[name='lastName']");
const role = document.querySelector("select[name='role']");
const buttons = document.querySelectorAll(".continue-btn");

function getActiveButton() {
  return buttons[currentStep];
}

function validateStep1() {
  if (currentStep != 0) return true;
  console.log("Validating step 1...");
  const firstValid = firstName.value.trim().length > 0;
  const lastValid = lastName.value.trim().length > 0;
  const roleValid = role.value.trim().length > 0;

  // ERROR
  firstName.classList.toggle("error", !firstValid);
  lastName.classList.toggle("error", !lastValid);
  role.classList.toggle("error", !roleValid);

  // SUCCESS
  firstName.classList.toggle("success", firstValid);
  lastName.classList.toggle("success", lastValid);
  role.classList.toggle("success", roleValid);

  // color select
  role.classList.toggle("filled", roleValid);

  const isValid = firstValid && lastValid && roleValid;

  getActiveButton().disabled = !isValid;
  getActiveButton().classList.toggle("active", isValid);

  return isValid;
}

[firstName, lastName, role].forEach((el) => {
  console.log("Loading step 1 items...");
  el.addEventListener("input", validateStep1);
  el.addEventListener("change", validateStep1);
});

// Switching steps
const steps = document.querySelectorAll(".step");
let currentStep = 0;

function isStepValid() {
  if (currentStep === 0) return validateStep1();
  if (currentStep === 1) return validateStep2();
  if (currentStep === 2) return true;
}

buttons.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    if (index !== currentStep) return;

    if (!isStepValid()) return;

    steps[currentStep].classList.remove("active");
    currentStep++;
    steps[currentStep].classList.add("active");

    updateProgressBar();

    if (currentStep === 1) {
      step2Btn.disabled = true;
      step2Btn.classList.remove("active");
    }
  });
});

// Progress bar
const dots = document.querySelectorAll(".dot-step");

function updateProgressBar() {
  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index === currentStep);
    dot.classList.toggle("done", index < currentStep);
  });
}

// Back button handler
const backBtn = document.querySelector(".back-btn");

backBtn.addEventListener("click", () => {
  if (currentStep === 0) {
    window.location.href = "/login";
    return;
  }

  steps[currentStep].classList.remove("active");
  currentStep--;

  steps[currentStep].classList.add("active");

  updateProgressBar();
});
const step2 = document.querySelector(".step-2");
const email = step2.querySelector("input[name='email']");
const password = step2.querySelector("input[name='password']");
const confirmPassword = step2.querySelector("input[name='confirmPassword']");

function isValidUniversityEmail(email) {
  return /^[^\s@]+@roehampton\.ac\.uk$/.test(email);
}

function isValidPassword(password) {
  return /^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(password);
}

function validateStep2() {
  const step2 = document.querySelector(".step-2");
  const step2Btn = document.querySelector(".step.step-2 button");
  const emailValid = isValidUniversityEmail(email.value.trim());
  const passwordValid = isValidPassword(password.value.trim());
  const match =
    password.value === confirmPassword.value && password.value.length > 0;

  email.classList.toggle("error", !emailValid);
  password.classList.toggle("error", !passwordValid);
  confirmPassword.classList.toggle("error", !match);

  email.classList.toggle("success", emailValid);
  password.classList.toggle("success", passwordValid);
  confirmPassword.classList.toggle("success", match);

  if (!emailValid) {
    email.setCustomValidity("Use your university email");
  } else {
    email.setCustomValidity("");
  }

  const isValid = emailValid && passwordValid && match;

  step2Btn.disabled = !isValid;
  step2Btn.classList.toggle("active", isValid);

  return isValid;
}

[email, password, confirmPassword].forEach((el) => {
  console.log("Loading step 2 items...");
  el.addEventListener("input", validateStep2);
  el.addEventListener("change", validateStep2);
});

// Avatar upload and preview
const container = document.querySelector(".avatar-container");
const avatarBtn = container.querySelector(".add-avatar");
const avatarInput = container.querySelector(".avatar-input");
const avatarImg = container.querySelector(".avatar-container img");

// open file dialog
avatarBtn.addEventListener("click", () => {
  avatarInput.click();
});

// show preview
avatarInput.addEventListener("change", () => {
  const file = avatarInput.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    avatarImg.src = e.target.result;
  };

  reader.readAsDataURL(file);
});

// community selection
let selectedCommunities = new Set();
const communityElements = document.querySelectorAll(".community");
const counter = document.querySelector(".counter");
const finishBtn = document.querySelector(".step-4 .continue-btn");

function updateUI() {
  const count = selectedCommunities.size;

  counter.textContent = count;

  const isValid = count >= 4;
  finishBtn.disabled = !isValid;
  finishBtn.classList.toggle("active", isValid);
}

communityElements.forEach((el) => {
  const btn = el.querySelector(".select-btn");
  const id = Number(el.dataset.id);

  btn.addEventListener("click", () => {
    if (selectedCommunities.has(id)) {
      selectedCommunities.delete(id);
      el.classList.remove("selected");
    } else {
      selectedCommunities.add(id);
      el.classList.add("selected");
    }

    btn.textContent = selectedCommunities.has(id) ? "Leave" : "Join";

    updateUI();
  });
});

// search
const searchInput = document.querySelector(".community-search");

searchInput.addEventListener("input", () => {
  const value = searchInput.value.toLowerCase();

  communityElements.forEach((el) => {
    const name = el.querySelector(".name").textContent.toLowerCase();

    el.style.display = name.includes(value) ? "flex" : "none";
  });
});

// submit
finishBtn.addEventListener("click", () => {
  const form = document.querySelector("#registerForm");

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "communities";
  input.value = JSON.stringify([...selectedCommunities]);

  form.appendChild(input);

  form.submit();
});
