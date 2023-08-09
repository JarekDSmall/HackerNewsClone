"use strict";

// global to hold the User instance of the currently-logged-in user
let currentUser;

/******************************************************************************
 * User login/signup/login
 */

// ... (existing login and signup functions)

/** Handle click of logout button
 *
 * Remove their credentials from localStorage and refresh page
 */

function logout(evt) {
  console.debug("logout", evt);
  localStorage.clear();
  location.reload();
}



/******************************************************************************
 * Storing/recalling previously-logged-in-user with localStorage
 */

/** If there are user credentials in local storage, use those to log in
 * that user. This is meant to be called on page load, just once.
 */

async function checkForRememberedUser() {
  console.debug("checkForRememberedUser");
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  if (!token || !username) return false;

  // try to log in with these credentials (will be null if login failed)
  currentUser = await User.loginViaStoredCredentials(token, username);
}

/** Sync current user information to localStorage.
 *
 * We store the username/token in localStorage so when the page is refreshed
 * (or the user revisits the site later), they will still be logged in.
 */

function saveUserCredentialsInLocalStorage() {
  console.debug("saveUserCredentialsInLocalStorage");
  if (currentUser) {
    localStorage.setItem("token", currentUser.loginToken);
    localStorage.setItem("username", currentUser.username);
  }
}

/******************************************************************************
 * General UI stuff about users
 */

/** When a user signs up or registers, we want to set up the UI for them:
 *
 * - show the stories list
 * - update nav bar options for logged-in user
 * - generate the user profile part of the page
 */

function updateUIOnUserLogin() {
  console.debug("updateUIOnUserLogin");

  $allStoriesList.show();

  updateNavOnLogin();

  // Display user's favorites
  putFavoritesOnPage();
}

/******************************************************************************
 * Favorites
 */

// ... (existing toggleFavorite and putFavoritesOnPage functions)

/******************************************************************************
 * Removing Stories
 */

function putRemoveButtonsOnPage() {
  console.debug("putRemoveButtonsOnPage");

  if (!currentUser) return;

  for (let story of currentUser.ownStories) {
    const $story = $userStoriesList.find(`#${story.storyId}`);
    const $removeButton = $(`
      <i class="fas fa-trash-alt remove-button"></i>
    `);
    $story.append($removeButton);
  }
}

async function removeStory(evt) {
  console.debug("removeStory", evt);

  const $target = $(evt.target);
  const $closestLi = $target.closest("li");
  const storyId = $closestLi.attr("id");

  await storyList.removeStory(currentUser, storyId);

  $closestLi.remove();
}

/******************************************************************************
 * Initialization on page load
 */

const $userStoriesList = $("#user-stories-list"); // Define $userStoriesList

/** Once the DOM is entirely loaded, begin the app */
$(async function () {
  console.warn(
    "HEY STUDENT: This program sends many debug messages to the console. If you don't see the message 'start' below this, you're not seeing those helpful debug messages. In your browser console, click on menu 'Default Levels' and add Verbose"
  );

  await checkForRememberedUser();
  await getAndShowStoriesOnStart();

  // if we got a logged-in user
  if (currentUser) updateUIOnUserLogin();
  if (currentUser) putRemoveButtonsOnPage();

  // Click event for remove buttons
  $userStoriesList.on("click", ".remove-button", removeStory);
});

