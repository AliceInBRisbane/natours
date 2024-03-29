/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const writeReview = async (review, rating, tour) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/reviews/',
      data: {
        review: review,
        rating: rating,
        tour: tour
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Created a review successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
