/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const deleteTour = async tourId => {
  try {
    const res = await axios({
      method: 'DELETE',
      url: `http://127.0.0.1:3000/api/v1/tours/${tourId}`
    });

    showAlert('success', 'Deleted successfully!');
    window.setTimeout(() => {
      location.assign('/');
    }, 500);
  } catch (err) {
    showAlert('error', 'Error Delete failed! Try again later.');
  }
};
