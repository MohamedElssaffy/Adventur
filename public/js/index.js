import { showAlert } from "./alerts";
import { login, logout } from "./login";
import { displayMap } from "./mapbox";
import { signUp } from "./sign-up";
import { bookTour } from "./stripe";
import { updateStting } from "./updateUser";
// Dom Elements
const singUpForm = document.querySelector(".sign-up .form");
const logInForm = document.querySelector(".log-in .form");
const updateForm = document.querySelector(".form-user-data");
const updatePasswordForm = document.querySelector(".form-user-password");
const logOutBtn = document.querySelector(".nav__el--logout");
const mapBox = document.getElementById("map");
const bookBtn = document.getElementById("book-tour");

if (singUpForm) {
  singUpForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const btn = e.target.querySelector("button");

    btn.setAttribute("disabled", "disabled");

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("passwordConfirm").value;

    if (password !== passwordConfirm) {
      btn.removeAttribute("disabled");
      return showAlert("error", "Password Should Match");
    }

    signUp({ name, email, password }, btn);
  });
}

if (logInForm) {
  logInForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    login({ email, password });
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener("click", logout);
}

if (updateForm) {
  updateForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append("name", document.querySelector("#name").value);
    form.append("email", document.querySelector("#email").value);
    form.append("photo", document.querySelector("#photo").files[0]);

    updateStting(form, "me");
  });
}
if (updatePasswordForm) {
  updatePasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    document.querySelector(".form-user-password .btn").textContent =
      "...updatting";
    const currentPassword = document.querySelector("#password-current").value;
    const password = document.querySelector("#password").value;
    const passwordConfirm = document.querySelector("#password-confirm").value;

    await updateStting(
      { currentPassword, password, passwordConfirm },
      "password"
    );

    document.querySelector(".form-user-password .btn").textContent =
      "Update Password";
    document.querySelector("#password-current").value = "";
    document.querySelector("#password").value = "";
    document.querySelector("#password-confirm").value = "";
  });
}

if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (bookBtn) {
  const { tourId } = bookBtn.dataset;
  bookBtn.addEventListener("click", () => {
    bookBtn.textContent = "Processing...";
    bookTour(tourId);
  });
}
