const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {
  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  getHostName() {
    const url = new URL(this.url);
    return url.hostname;
  }

  async toggleFavorite(user) {
    const isFavorited = user.isFavorite(this);

    if (isFavorited) {
      await user.removeFavorite(this.storyId);
    } else {
      await user.addFavorite(this.storyId);
    }
  }

  async remove() {
    await axios({
      url: `${BASE_URL}/stories/${this.storyId}`,
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${currentUser.loginToken}`,
      },
    });
  }
}

/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  static async getStories() {
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    const stories = response.data.stories.map(story => new Story(story));

    return new StoryList(stories);
  }

  async removeStory(user, storyId) {
    await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user.loginToken}`,
      },
    });

    this.stories = this.stories.filter(story => story.storyId !== storyId);
  }
}

/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  constructor({
    username,
    name,
    createdAt,
    favorites = [],
    ownStories = []
  }, token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    this.loginToken = token;
  }

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }

  async addFavorite(storyId) {
    await this._toggleFavorite(storyId, "POST");
  }

  async removeFavorite(storyId) {
    await this._toggleFavorite(storyId, "DELETE");
  }

  async _toggleFavorite(storyId, method) {
    const response = await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
      method,
      headers: { "Authorization": `Bearer ${this.loginToken}` }
    });

    this.favorites = response.data.user.favorites.map(s => new Story(s));
  }

  isFavorite(story) {
    return this.favorites.some(s => s.storyId === story.storyId);
  }

  async removeStory(storyId) {
    await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.loginToken}`,
      },
    });

    this.ownStories = this.ownStories.filter(story => story.storyId !== storyId);
  }
}
