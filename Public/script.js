

const search_btn = document.getElementById("search-btn");

search_btn.addEventListener("click", function () {
  searchBooks();
});

document.getElementById("search-input").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    searchBooks();
  }
});

function searchBooks() {
  const search_input = document.getElementById("search-input").value;
  const request_url = `https://openlibrary.org/search.json?q=${encodeURIComponent(search_input)}&limit=20`;

  fetch(request_url)
    .then((response) => response.json())
    .then((data) => {
      const resultsDiv = document.getElementById("search-results");

      resultsDiv.innerHTML = "";
      resultsDiv.style.display = "block";

      const books = data.docs.filter((book) => book.cover_i).slice(0, 5);

      books.forEach((book) => {
        const bookDiv = document.createElement("div");
        bookDiv.classList.add("result-item");

        bookDiv.innerHTML = `
          <img src="https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg" alt="${book.title}" />
          <div class="result-info">
            <p class="title">${book.title}</p>
            <p class="author">${book.author_name ? book.author_name[0] : "Unknown"}</p>
          </div>
          <button 
            class="add-btn" 
            data-title="${book.title}" 
            data-author="${book.author_name ? book.author_name[0] : "Unknown"}" 
            data-cover="${book.cover_i}"
            data-key="${book.key}">
            + Add
          </button>
        `;

        resultsDiv.appendChild(bookDiv);
      });
    })
    .catch((error) => {
      console.error("Ошибка при поиске:", error);
    });
};


document.getElementById("search-results").addEventListener("click", function (e) {
  if (e.target.classList.contains("add-btn")) {

    
    const title = e.target.dataset.title;
    const author = e.target.dataset.author;
    const cover_id = e.target.dataset.cover;
    const work_key = e.target.dataset.key;

    fetch("/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, author, cover_id, work_key }),
    })
      .then((res) => {
        if (res.ok) {
          window.location.reload();
        }
      })
      .catch((error) => {
        console.error("Ошибка при добавлении:", error);
      });
  }
});


document.getElementById("book-list").addEventListener("click", function (e) {
  if (e.target.classList.contains("del-btn")) {
    const bookId = e.target.dataset.id;

    fetch("/delete/" + bookId, {
      method: "DELETE",
    })
      .then((res) => {
        if (res.ok) {
          window.location.reload();
        }
      })
      .catch((error) => {
        console.error("Ошибка при удалении:", error);
      });
  }
});


const edit_btn = document.getElementById("edit-btn");
const bookList = document.getElementById("book-list");
let isEditMode = false;

edit_btn.addEventListener("click", function () {
  isEditMode = !isEditMode;

  bookList.classList.toggle("edit-mode", isEditMode);
  edit_btn.textContent = isEditMode ? "Done" : "Edit";

  document.querySelectorAll(".del-btn").forEach((btn) => {
    btn.style.display = isEditMode ? "block" : "none";
  });

  document.querySelectorAll(".drag-handle").forEach((handle) => {
    handle.style.display = isEditMode ? "block" : "none";
  });
});


let draggedItem = null;

document.querySelectorAll(".book").forEach((book) => {
  book.addEventListener("dragstart", function () {
    draggedItem = this;
    setTimeout(() => this.classList.add("dragging"), 0);
  });

  book.addEventListener("dragend", function () {
    this.classList.remove("dragging");

    const order = [...bookList.querySelectorAll(".book")].map((b) => b.dataset.id);

    fetch("/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    }).catch((error) => {
      console.error("Ошибка при сохранении порядка:", error);
    });
  });

  book.addEventListener("dragover", function (e) {
    e.preventDefault();
    const afterElement = getDragAfterElement(bookList, e.clientY);
    if (afterElement == null) {
      bookList.appendChild(draggedItem);
    } else {
      bookList.insertBefore(draggedItem, afterElement);
    }
  });
});

function getDragAfterElement(container, y) {
  const elements = [...container.querySelectorAll(".book:not(.dragging)")];

  return elements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}


const themeToggle = document.getElementById("theme-toggle");

themeToggle.addEventListener("click", function () {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
  changeIconsForTheme();
});


const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.body.classList.add("dark-mode");
} else if (savedTheme === "light") {
  document.body.classList.remove("dark-mode");
} else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  document.body.classList.add("dark-mode");
}
changeIconsForTheme();

function changeIconsForTheme() {
  const isDarkMode = document.body.classList.contains("dark-mode");
  const themeToggleIcon = themeToggle.querySelector("svg path");

  if (isDarkMode) {
    themeToggleIcon.setAttribute(
      "d",
      "M21.9548 12.9564C20.5779 15.3717 17.9791 17.0001 15 17.0001C10.5817 17.0001 7 13.4184 7 9.00008C7 6.02072 8.62867 3.42175 11.0443 2.04492C5.96975 2.52607 2 6.79936 2 11.9998C2 17.5227 6.47715 21.9998 12 21.9998C17.2002 21.9998 21.4733 18.0305 21.9548 12.9564Z"
    );
  } else {
    themeToggleIcon.setAttribute(
      "d",
      "M12 2V4M12 20V22M4 12H2M6.31412 6.31412L4.8999 4.8999M17.6859 6.31412L19.1001 4.8999M6.31412 17.69L4.8999 19.1042M17.6859 17.69L19.1001 19.1042M22 12H20M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12Z"
    );
  }
};
