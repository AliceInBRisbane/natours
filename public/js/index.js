/* eslint-disable */
import '@babel/polyfill';

import { login, logout } from './login';
import { signup } from './signup';
import { updateSetting } from './updateSetting';
import { bookTour } from './stripe';
import { deleteTour } from './manageTour';
import { deleteUser } from './manageUser';
import { writeReview } from './manageReview';

//Dom element
const loginForm = document.querySelector('.form--login');
const signupForm = document.querySelector('.form--signup');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');
const deleteBtn = document.getElementById('delete-tour');
const deleteUserBtn = document.getElementById('delete-user');
const reviewForm = document.querySelector('.form--review');

if (reviewForm)
  reviewForm.addEventListener('submit', e => {
    e.preventDefault();
    const review = document.getElementById('review').value;
    const rating = document.getElementById('rating').value;
    const tour = document.getElementById('tourId').innerText;
    writeReview(review, rating, tour);
  });

if (loginForm)
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (signupForm)
  signupForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    signup(name, email, password, passwordConfirm);
  });
if (logOutBtn) logOutBtn.addEventListener('click', logout);
if (userDataForm)
  userDataForm.addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    updateSetting(form, 'data');
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSetting(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );
    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

if (bookBtn)
  bookBtn.addEventListener('click', e => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });

if (deleteBtn)
  deleteBtn.addEventListener('click', e => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    deleteTour(tourId);
  });

if (deleteUserBtn)
  deleteUserBtn.addEventListener('click', e => {
    e.target.textContent = 'Processing...';
    const { userId } = e.target.dataset;
    deleteUser(userId);
  });
