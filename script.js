
// Firebase config
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase settings
const firebaseConfig = {
  apiKey: "AIzaSyBFynS9-iYS7GxTeCzq-QPi9HRJr4qIRzY",
  authDomain: "ptech-warranty-website.firebaseapp.com",
  projectId: "ptech-warranty-website",
  storageBucket: "ptech-warranty-website.firebasestorage.app",
  messagingSenderId: "335295749830",
  appId: "1:335295749830:web:2ba5d66219eb6f04d6c1c7",
  measurementId: "G-NFKHFN19LZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Handle Warranty Check
const warrantyForm = document.getElementById("warrantyCheckForm");
const resultDiv = document.getElementById("warrantyResult");

warrantyForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  resultDiv.classList.remove("hidden");
  resultDiv.innerHTML = `<p style="text-align:center;font-weight:bold;color:#888;">Checking warranty...</p>`;

  const serialNumber = document.getElementById("serialNumber").value.trim();
  const studentId = document.getElementById("idNumber").value.trim();

  let q;

  if (serialNumber !== "") {
    q = query(collection(db, "warranty_claim"), where("serialNumber", "==", serialNumber));
  } else if (studentId !== "") {
    q = query(collection(db, "warranty_claim"), where("studentId", "==", studentId));
  } else {
    resultDiv.innerHTML = `<p style="color:red;text-align:center;">Please enter Serial Number or ID.</p>`;
    return;
  }

  try {
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      resultDiv.innerHTML = `<p style="color:red;text-align:center;">No warranty found. Please verify your details.</p>`;
    } else {
      const doc = querySnapshot.docs[0].data();

      resultDiv.innerHTML = `
        <div style="border:1px solid #ccc; padding:20px; border-radius:8px;">
          <h3>Warranty Found ✅</h3>
          <p><strong>Name:</strong> ${doc.fullName}</p>
          <p><strong>Email:</strong> ${doc.email}</p>
          <p><strong>Phone:</strong> ${doc.phone}</p>
          <p><strong>Device Model:</strong> ${doc.deviceModel}</p>
          <p><strong>Serial Number:</strong> ${doc.serialNumber}</p>
          <p><strong>Is Student:</strong> ${doc.isStudent ? "Yes" : "No"}</p>
          ${doc.studentId ? `<p><strong>Student ID:</strong> ${doc.studentId}</p>` : ""}
          <p><strong>Problem:</strong> ${doc.problemDescription}</p>
          <p style="margin-top:10px;color:green;"><strong>Status:</strong> Your warranty is valid and under review or service.</p>
        </div>
      `;
    }
  } catch (error) {
    resultDiv.innerHTML = `<p style="color:red;text-align:center;">An error occurred: ${error.message}</p>`;
  }
});
