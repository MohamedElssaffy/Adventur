import { post } from "axios";
import { showAlert } from "./alerts";

export const signUp = async (data, btn) => {
  try {
    btn.setAttribute("disabled", "disabled");

    const res = await post("/api/v1/users/signup", data);

    if (res.data.status === "success") {
      showAlert("success", "Account Created Successfuly");

      window.setTimeout(() => {
        location.assign("/");
      }, 500);
    }
  } catch (err) {
    showAlert("error", "Email is Already Taken");
    btn.removeAttribute("disabled");
  }
};
