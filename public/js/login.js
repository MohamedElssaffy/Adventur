import "@babel/polyfill";
import { post, patch } from "axios";
import { showAlert } from "./alerts";

const login = async ({ email, password }) => {
  try {
    const res = await post("/api/v1/users/login", {
      email,
      password,
    });

    if (res.data.status === "success") {
      showAlert("success", "Log in Successfuly");
      window.setTimeout(() => {
        location.assign("/");
      }, 1000);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};

const logout = async () => {
  try {
    const res = await patch("/api/v1/users/logout");
    if (res.data.status === "success") {
      showAlert("success", "Logout Successfully");
      window.setTimeout(() => {
        location.assign("/");
      }, 500);
    }
  } catch (err) {
    showAlert("error", "Cant Log out Please try again");
  }
};

export { login, logout };
