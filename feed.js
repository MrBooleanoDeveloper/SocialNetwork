import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

let currentUser = null;
let currentProfile = null;
let feedLoaded = false;

const postForm = document.getElementById("postForm");
const postText = document.getElementById("postText");
const charCount = document.getElementById("charCount");
const postMessage = document.getElementById("postMessage");
const postsContainer = document.getElementById("postsContainer");

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  currentUser = user;

  const profileRef = doc(db, "users", user.uid);
  const profileSnap = await getDoc(profileRef);

  currentProfile = profileSnap.exists()
    ? profileSnap.data()
    : {
        username: user.displayName || "Usuario"
      };

  if (!feedLoaded) {
    feedLoaded = true;
    loadFeed();
  }
});

if (postText) {
  postText.addEventListener("input", () => {
    charCount.textContent = `${postText.value.length}/400`;
  });
}

if (postForm) {
  postForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const text = postText.value.trim();

    if (!text) return;

    postMessage.textContent = "Publicando...";

    try {
      await addDoc(collection(db, "posts"), {
        uid: currentUser.uid,
        username: currentProfile.username || currentUser.displayName || "Usuario",
        text,
        createdAt: serverTimestamp()
      });

      postText.value = "";
      charCount.textContent = "0/400";
      postMessage.textContent = "Publicado.";
    } catch (error) {
      postMessage.textContent = "No se pudo publicar.";
    }
  });
}

function loadFeed() {
  const postsQuery = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  onSnapshot(postsQuery, (snapshot) => {
    postsContainer.innerHTML = "";

    if (snapshot.empty) {
      postsContainer.innerHTML = `<p class="empty">Todavía no hay publicaciones.</p>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const postCard = createPostCard(docSnap.id, docSnap.data());
      postsContainer.appendChild(postCard);
    });
  });
}

function createPostCard(postId, post) {
  const card = document.createElement("article");
  card.className = "post card";

  const header = document.createElement("div");
  header.className = "post-header";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = getInitial(post.username);

  const userBox = document.createElement("div");

  const username = document.createElement("strong");
  username.textContent = post.username || "Usuario";

  const date = document.createElement("span");
  date.className = "date";
  date.textContent = formatDate(post.createdAt);

  userBox.appendChild(username);
  userBox.appendChild(date);

  header.appendChild(avatar);
  header.appendChild(userBox);

  const text = document.createElement("p");
  text.className = "post-text";
  text.textContent = post.text;

  const actions = document.createElement("div");
  actions.className = "post-actions";

  const likeBtn = document.createElement("button");
  likeBtn.className = "mini-btn";
  likeBtn.textContent = "❤️ 0";

  actions.appendChild(likeBtn);

  const commentsBox = document.createElement("div");
  commentsBox.className = "comments";

  const commentForm = document.createElement("form");
  commentForm.className = "comment-form";

  const commentInput = document.createElement("input");
  commentInput.placeholder = "Escribir comentario...";
  commentInput.maxLength = 200;
  commentInput.required = true;

  const commentBtn = document.createElement("button");
  commentBtn.type = "submit";
  commentBtn.textContent = "Enviar";

  commentForm.appendChild(commentInput);
  commentForm.appendChild(commentBtn);

  commentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const commentText = commentInput.value.trim();

    if (!commentText) return;

    await addDoc(collection(db, "posts", postId, "comments"), {
      uid: currentUser.uid,
      username: currentProfile.username || currentUser.displayName || "Usuario",
      text: commentText,
      createdAt: serverTimestamp()
    });

    commentInput.value = "";
  });

  card.appendChild(header);
  card.appendChild(text);
  card.appendChild(actions);
  card.appendChild(commentsBox);
  card.appendChild(commentForm);

  setupLikes(postId, likeBtn);
  setupComments(postId, commentsBox);

  return card;
}

function setupLikes(postId, likeBtn) {
  const likesRef = collection(db, "posts", postId, "likes");
  const userLikeRef = doc(db, "posts", postId, "likes", currentUser.uid);

  onSnapshot(likesRef, async (snapshot) => {
    likeBtn.textContent = `❤️ ${snapshot.size}`;

    const likedSnap = await getDoc(userLikeRef);

    if (likedSnap.exists()) {
      likeBtn.classList.add("liked");
    } else {
      likeBtn.classList.remove("liked");
    }
  });

  likeBtn.addEventListener("click", async () => {
    const likedSnap = await getDoc(userLikeRef);

    if (likedSnap.exists()) {
      await deleteDoc(userLikeRef);
    } else {
      await setDoc(userLikeRef, {
        uid: currentUser.uid,
        createdAt: serverTimestamp()
      });
    }
  });
}

function setupComments(postId, commentsBox) {
  const commentsQuery = query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "asc"),
    limit(20)
  );

  onSnapshot(commentsQuery, (snapshot) => {
    commentsBox.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const comment = docSnap.data();

      const item = document.createElement("div");
      item.className = "comment";

      const name = document.createElement("strong");
      name.textContent = comment.username || "Usuario";

      const text = document.createElement("span");
      text.textContent = ` ${comment.text}`;

      item.appendChild(name);
      item.appendChild(text);

      commentsBox.appendChild(item);
    });
  });
}

function getInitial(username) {
  return username ? username.charAt(0).toUpperCase() : "U";
}

function formatDate(timestamp) {
  if (!timestamp || !timestamp.toDate) return "Ahora";

  return timestamp.toDate().toLocaleString("es-UY", {
    dateStyle: "short",
    timeStyle: "short"
  });
}