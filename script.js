const API_URL = "https://openlibrary.org";

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const bookList = document.getElementById("bookList");
const loading = document.getElementById("loading");
const error = document.getElementById("error");

const detailsSection = document.getElementById("detailsSection");
const bookDetails = document.getElementById("bookDetails");
const backButton = document.getElementById("backButton");

const loadCollections = document.getElementById("loadCollections");
const collectionsResult = document.getElementById("collectionsResult");

// Show loading state
function showLoading(isLoading) {
  loading.classList.toggle("hidden", !isLoading);
}

// Show error message
function showError(message) {
  error.textContent = message;
  error.classList.remove("hidden");
}

// Clear error message
function clearError() {
  error.textContent = "";
  error.classList.add("hidden");
}

// Safely display text in HTML
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const symbols = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return symbols[char];
  });
}

// Fetch JSON data from API
async function fetchJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return await response.json();
}

// Search books using query parameter
async function searchBooks(query) {
  showLoading(true);
  clearError();

  bookList.innerHTML = "";
  detailsSection.classList.add("hidden");

  try {
    const url =
      `${API_URL}/search.json?q=${encodeURIComponent(query)}&limit=12`;

    const data = await fetchJSON(url);

    displayBooks(data.docs);

  } catch (err) {
    showError("Failed to load books. Check your internet connection.");
    console.error(err);

  } finally {
    showLoading(false);
  }
}

// Render book cards
function displayBooks(books) {
  if (!books || books.length === 0) {
    bookList.textContent = "No books found.";
    return;
  }

  books.forEach((book) => {
    const card = document.createElement("div");
    card.className = "book-card";

    const cover = book.cover_i
  ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg?default=false`
  : "";

    const title = escapeHTML(book.title || "Unknown title");
    const author = escapeHTML(book.author_name?.[0] || "Unknown author");
    const year = escapeHTML(book.first_publish_year || "Unknown");

    card.innerHTML = `
      ${cover
        ? `<img src="${cover}" alt="${title} cover" loading="lazy">`
        : `<div class="no-cover">📚<span>No cover available</span></div>`}

      <h3>${title}</h3>
      <p>Author: ${author}</p>
      <p>Year: ${year}</p>
      <button type="button">View Details</button>
    `;

    const image = card.querySelector("img");

if (image) {
  image.addEventListener("error", () => {
    const placeholder = document.createElement("div");
    placeholder.className = "no-cover";
    placeholder.textContent = "📚 No cover available";
    image.replaceWith(placeholder);
  });
}

    card.addEventListener("click", () => {
      showBookDetails(book.key);
    });

    bookList.appendChild(card);
  });
}

// Second API request by book ID
async function showBookDetails(bookKey) {
  clearError();
  showLoading(true);
  detailsSection.classList.add("hidden");

  try {
    const id = bookKey.split("/").pop();

    if (!/^OL\d+W$/.test(id)) {
      throw new Error("Invalid book ID");
    }

    const data = await fetchJSON(
      `${API_URL}/works/${id}.json`
    );

    let description = data.description || "No description available.";

    if (typeof description === "object") {
      description = description.value || "No description available.";
    }

    bookDetails.innerHTML = "";

    const heading = document.createElement("h3");
    heading.textContent = data.title || "Unknown title";

    const text = document.createElement("p");
    text.textContent = description;

    const subjects = document.createElement("p");
    subjects.textContent = "Subjects: " +
      (data.subjects?.slice(0, 5).join(", ") || "Not available");

    bookDetails.append(heading, text, subjects);

    detailsSection.classList.remove("hidden");
    detailsSection.scrollIntoView({ behavior: "smooth" });

  } catch (err) {
    showError("Failed to load book details.");
    console.error(err);

  } finally {
    showLoading(false);
  }
}

// Search form event
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const query = searchInput.value.trim();

  if (query) {
    searchBooks(query);
  }
});

// Return to search results
backButton.addEventListener("click", () => {
  detailsSection.classList.add("hidden");
  document.querySelector(".results-section")
    .scrollIntoView({ behavior: "smooth" });
});

// Two parallel API requests with Promise.all
async function loadTwoCollections() {
  loadCollections.disabled = true;
  collectionsResult.textContent = "Loading two collections...";

  try {
    const [fantasy, science] = await Promise.all([
      fetchJSON(`${API_URL}/search.json?q=fantasy&limit=5`),
      fetchJSON(`${API_URL}/search.json?q=science&limit=5`)
    ]);

    collectionsResult.innerHTML = "";

    const collections = [
      { name: "Fantasy Books", data: fantasy.docs },
      { name: "Science Books", data: science.docs }
    ];

    collections.forEach((collection) => {
      const card = document.createElement("div");
      card.className = "collection-card";

      const title = document.createElement("h3");
      title.textContent = collection.name;

      const description = document.createElement("p");
      description.textContent = collection.data
        .map(book => book.title)
        .join(", ");

      card.append(title, description);
      collectionsResult.appendChild(card);
    });

  } catch (err) {
    collectionsResult.textContent =
      "Failed to load collections. Please try again.";
    console.error(err);

  } finally {
    loadCollections.disabled = false;
  }
}

loadCollections.addEventListener("click", loadTwoCollections);

// Initial books
searchBooks("Harry Potter");