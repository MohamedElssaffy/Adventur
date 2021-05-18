import { patch } from "axios";
import { showAlert } from "./alerts";

const updateStting = async (data, type) => {
  try {
    const res = await patch(
      `http://localhost:3000/api/v1/users/update${type}`,
      data
    );
    if (res.data.status === "success") {
      showAlert("success", "Data is updated successfuly");
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};

export { updateStting };
