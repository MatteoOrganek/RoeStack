const input = document.querySelector(".main-answer");
const form = document.querySelector(".form-answer");
const button = document.querySelector(".answer-btn");

input.addEventListener("focus", () => {
  form.classList.add("active");
});

input.addEventListener("blur", () => {
  if (!input.value.trim()) {
    form.classList.remove("active");
  }
});

input.addEventListener("input", () => {
  if (input.value.trim().length > 0) {
    button.disabled = false;
  } else {
    button.disabled = true;
  }
});

// Send comment reply
// Send top-level comment
button.addEventListener("click", async () => {
  const text = input.value.trim();
  if (!text) return;

  const postId = window.location.pathname.split("/").pop();

  const res = await fetch("/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: text, postId, parentId: null }),
  });

  const html = await res.text();
  const container = document.querySelector(".answers-section");
  container.insertAdjacentHTML("afterbegin", html);

  input.value = "";
  button.disabled = true;
  form.classList.remove("active");
});

document.addEventListener("click", async (e) => {
  // ================= DELETE =================
  const deleteBtn = e.target.closest(".delete-comment");
  if (deleteBtn) {
    e.preventDefault();
    e.stopPropagation();

    const commentId = deleteBtn.dataset.commentId;

    if (!confirm("Delete this comment?")) return;

    const res = await fetch(`/comments/${commentId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      console.error("Delete failed");
      return;
    }

    const data = await res.json();

    const commentThread = deleteBtn.closest(".comment-thread");

    commentThread.classList.add("deleted");

    const textEl = commentThread.querySelector(".comment-text");
    textEl.textContent = data.text;

    const footer = commentThread.querySelector(".comment-footer");
    if (footer) footer.remove();

    const menu = deleteBtn.closest(".dropdown-menu");
    if (menu) menu.style.display = "none";

    return;
  }

  // ================= REPLY =================
  const replyBtn = e.target.closest(".answers");
  if (replyBtn) {
    e.preventDefault();

    const commentId = replyBtn.dataset.commentId;
    const commentThread = replyBtn.closest(".comment-thread");

    document.querySelectorAll(".reply-form").forEach((form) => {
      input = form.querySelector(".reply-input");
      if (!input.value.trim()) {
        form.remove();
      }
    });

    const template = document.querySelector("#reply-template");

    const form = template.content.cloneNode(true).firstElementChild;
    commentThread.appendChild(form);

    const input = form.querySelector(".reply-input");
    const button = form.querySelector(".reply-btn");

    if (!input) return;
    input.focus();

    input.addEventListener("input", () => {
      const hasText = input.value.trim().length > 0;

      button.disabled = !hasText;
      button.classList.toggle("active", hasText);
    });

    // Inside the REPLY handler, replace the button.addEventListener("click") block:
    button.addEventListener("click", async () => {
      const content = input.value.trim();
      if (!content) return;

      const postId = window.location.pathname.split("/").pop();

      const res = await fetch("/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, postId, parentId: commentId }),
      });

      const html = await res.text();

      // Find or create the .replies container inside this thread
      let repliesContainer = commentThread.querySelector(":scope > .replies");
      if (!repliesContainer) {
        repliesContainer = document.createElement("div");
        repliesContainer.className = "replies";
        commentThread.appendChild(repliesContainer);
        commentThread.classList.add("has-replies");
      }

      repliesContainer.insertAdjacentHTML("beforeend", html);
      form.remove();
    });

    return;
  }

  // ================= CLOSE EMPTY FORM =================
  const replyForm = document.querySelector(".reply-form");
  if (replyForm && !replyForm.contains(e.target)) {
    const input = replyForm.querySelector(".reply-input");
    if (!input.value.trim()) {
      replyForm.remove();
    }
  }
  // ================= SORT MENU =================
  const sortOption = e.target.closest("[data-sort]");
  if (sortOption) {
    e.preventDefault();

    const sort = sortOption.dataset.sort;
    const postId = window.location.pathname.split("/").pop();

    const sortLabel = document.querySelector(".sort-btn p");
    sortLabel.textContent = sortOption.textContent.trim();

    const res = await fetch(`/comments/${postId}?sort=${sort}`);
    const html = await res.text();

    const container = document.querySelector(".answers-section");
    container.innerHTML = html;

    return;
  }

});
