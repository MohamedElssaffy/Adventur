import { get } from "axios";
import { showAlert } from "./alerts";
const stripe = () => {
  return Stripe(
    "pk_test_51IrZdcAxUj6rVyviAJNHWEWcyrbGoN0ymEJVEE248vLM0j35gCxujloQOPYGIru2g3tC5i1Ae4t0wCNlhyQmA6UW00BaodFuNa"
  );
};

export const bookTour = async (tourId) => {
  try {
    const res = await get(`/api/v1/booking/checkout-session/${tourId}`);
    const session = res.data.session;
    await stripe().redirectToCheckout({
      sessionId: session.id,
    });
  } catch (err) {
    showAlert("error", "SomeThing Went Wrong Please Try Again");
  }
};
