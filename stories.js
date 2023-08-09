"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

// Define $addStoryForm element
const $addStoryForm = $("#add-story-form");

// Define $allStoriesList element
const $allStoriesList = $("#all-stories-list");

/** Get and show stories when the site first loads. */
async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/** A render method to render HTML for an individual Story instance */
function generateStoryMarkup(story, isFavorite, showRemove) {
  const hostName = story.getHostName();
  const favoriteClass = isFavorite ? "favorited" : "";
  const removeButton = showRemove ? '<i class="fas fa-trash remove-button"></i>' : '';

  return $(`
    <li id="${story.storyId}">
      <a href="${story.url}" target="_blank" class="story-link">
        ${story.title}
      </a>
      <small class="story-hostname">(${hostName})</small>
      <small class="story-author">by ${story.author}</small>
      <small class="story-user">posted by ${story.username}</small>
      <i class="fas fa-heart favorite-heart ${favoriteClass}"></i>
      ${removeButton}
    </li>
  `);
}

/** Gets list of stories from the server, generates their HTML, and puts on the page. */
function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const isFavorited = currentUser ? currentUser.isFavorite(story) : false;
    const showRemove = currentUser && currentUser.username === story.username;
    const $story = generateStoryMarkup(story, isFavorited, showRemove);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

/** Handles the form submission for adding a new story. */
async function handleStoryFormSubmit(event) {
  event.preventDefault();

  const title = $("#story-title").val();
  const author = $("#story-author").val();
  const url = $("#story-url").val();

  const newStory = await storyList.addStory(currentUser, { title, author, url });

  // Clear the form inputs
  $("#story-title").val("");
  $("#story-author").val("");
  $("#story-url").val("");

  // Add the new story to the page
  const $newStory = generateStoryMarkup(newStory, false, true); // New stories have the remove button
  $allStoriesList.prepend($newStory);
}

$addStoryForm.on("submit", handleStoryFormSubmit);

// Event listener for marking/unmarking a story as favorite
$allStoriesList.on("click", ".favorite-heart", async function (evt) {
  const $target = $(evt.target);
  const $story = $target.closest("li");
  const storyId = $story.attr("id");

  if ($target.hasClass("favorited")) {
    await currentUser.removeFavorite(storyId);
    $target.removeClass("favorited");
  } else {
    await currentUser.addFavorite(storyId);
    $target.addClass("favorited");
  }
});

// Add an event listener to handle story removal
$allStoriesList.on("click", ".remove-button", async function (evt) {
  const $target = $(evt.target);
  const $story = $target.closest("li");
  const storyId = $story.attr("id");

  // Remove the story from the DOM
  $story.remove();

  // Remove the story from the story list
  await storyList.removeStory(currentUser, storyId);
});
