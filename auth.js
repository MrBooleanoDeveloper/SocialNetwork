import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const page = location.pathname.split("/").pop();

const protectedPages = ["feed.html", "profile.html"];

onAuthStateChanged(auth, async (user) => {
  if (!user && protectedPages.includes(page)) {
    location.href = "./login.html";
  }
});

const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("registerUsername").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const message = document.getElementById("registerMessage");

    message.textContent = "Creando cuenta...";

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: username
      });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username,
        email,
        bio: "",
        photoURL: "",
        createdAt: serverTimestamp()
      });

      message.textContent = "Cuenta creada correctamente.";
      location.href = "./feed.html";
    } catch (error) {
      message.textContent = getFirebaseError(error.code);
    }
  });
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const message = document.getElementById("loginMessage");

    message.textContent = "Entrando...";

    try {
      await signInWithEmailAndPassword(auth, email, password);
      location.href = "./feed.html";
    } catch (error) {
      message.textContent = getFirebaseError(error.code);
    }
  });
}

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    location.href = "./login.html";
  });
}

async function ensureUserProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      username: user.displayName || "Usuario",
      email: user.email,
      bio: "",
      photoURL: "",
      createdAt: serverTimestamp()
    });
  }
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    await ensureUserProfile(user);
  }
});

function getFirebaseError(code) {
  const errors = {
    "auth/email-already-in-use": "Ese email ya está registrado.",
    "auth/invalid-email": "Email inválido.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/user-not-found": "No existe una cuenta con ese email.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/invalid-credential": "Email o contraseña incorrectos.",
    "auth/missing-password": "Falta la contraseña."
  };

 console.error("Firebase error:", code);
return `Error real: ${code}`;
}