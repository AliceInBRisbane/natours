/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51OrfzBDVgmYdt98Nv7ZILxqMQorQrvnMpeqwOgtNjFbC0dyeLGKg2Cl2V7yhvY1smIAiY6ok2JhXjoRSq7ptQr8R00VF2hX44t'
);

export const bookTour = async tourId => {
  //1) get the checkout session from api
  try {
    const session = await axios({
      method: 'GET',
      url: `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    });

    console.log(session);
    //2) create checkout form  + charge credit card page
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('err', err);
  }
};
