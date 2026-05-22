import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

let currentUser = null;

const profileAvatar = document.getElementById("profileAvatar");
const profileForm = document.getElementById("profileForm");
const profileUsername = document.getElementById("profileUsername");
const profileBio = document.getElementById("profileBio");
const profileMessage = document.getElementById("profileMessage");
const myPostsContainer = document.getElementById("myPostsContainer");

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  currentUser = user;

  await loadProfile();
  loadMyPosts();
});

async function loadProfile() {
  const userRef = doc(db, "users", currentUser.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;

  const data = userSnap.data();

  profileUsername.value = data.username || "";
  profileBio.value = data.bio || "";
  profileAvatar.textContent = getInitial(data.username);
}

if (profileForm) {
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = profileUsername.value.trim();
    const bio = profileBio.value.trim();

    if (!username) return;

    profileMessage.textContent = "Guardando...";

    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        username,
        bio
      });

      await updateProfile(currentUser, {
        displayName: username
      });

      profileAvatar.textContent = getInitial(username);
      profileMessage.textContent = "Perfil actualizado.";
    } catch (error) {
      profileMessage.textContent = "No se pudo actualizar el perfil.";
    }
  });
}

function loadMyPosts() {
  const myPostsQuery = query(
    collection(db, "posts"),
    where("uid", "==", currentUser.uid)
  );

  onSnapshot(myPostsQuery, (snapshot) => {
    myPostsContainer.innerHTML = "";

    if (snapshot.empty) {
      myPostsContainer.innerHTML = `<p class="empty">Todavía no publicaste nada.</p>`;
      return;
    }

    const posts = [];

    snapshot.forEach((docSnap) => {
      posts.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    posts.sort((a, b) => {
      const dateA = a.createdAt?.toMillis?.() || 0;
      const dateB = b.createdAt?.toMillis?.() || 0;
      return dateB - dateA;
    });

    posts.forEach((post) => {
      const card = document.createElement("article");
      card.className = "post card";

      const text = document.createElement("p");
      text.className = "post-text";
      text.textContent = post.text;

      const date = document.createElement("span");
      date.className = "date";
      date.textContent = formatDate(post.createdAt);

      card.appendChild(text);
      card.appendChild(date);

      myPostsContainer.appendChild(card);
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