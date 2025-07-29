// Firebase config and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBFynS9-iYS7GxTeCzq-QPi9HRJr4qIRzY",
  authDomain: "ptech-warranty-website.firebaseapp.com",
  projectId: "ptech-warranty-website",
  storageBucket: "ptech-warranty-website.appspot.com",
  messagingSenderId: "335295749830",
  appId: "1:335295749830:web:2ba5d66219eb6f04d6c1c7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const form = document.getElementById("warrantyCheckForm");
const resultDiv = document.getElementById("warrantyResult");

// Form submit handler
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  // Check if resultDiv exists before modifying it
  if (!resultDiv) {
    console.error("No element with id 'warrantyResult' found.");
    return;
  }

  // Show loading spinner while checking warranty
  resultDiv.classList.remove("show");
  resultDiv.innerHTML = `
    <div style="text-align:center; padding:20px;">
      <div class="spinner-border text-danger" role="status"></div>
      <p style="margin-top:10px; font-weight:bold;">Checking your warranty...</p>
    </div>
  `;
  resultDiv.classList.add("show");

  // Get user input from form
  const phone = form.phoneNumber.value.trim();
  const id = form.idNumber.value.trim();

  // Ensure at least one field is filled
  if (!phone && !id) {
    resultDiv.innerHTML = ` 
      <div style="color:red; font-weight:bold; padding:15px;">❌ Please enter Phone Number or Student ID.</div>
    `;
    return;
  }

  try {
    const ref = collection(db, "warranty_claims");
    let snap;
    let searchType = "";

    // Search by Phone Number
    if (phone) {
      searchType = "phone";
      const q = query(ref, where("phone", "==", phone));
      snap = await getDocs(q);
    }

    // Search by ID Number if no match found for Phone
    if ((!snap || snap.empty) && id) {
      searchType = "studentId";
      const q = query(ref, where("studentId", "==", id));
      snap = await getDocs(q);
    }

    // If no result, show message and exit
    if (!snap || snap.empty) {
      resultDiv.innerHTML = `
        <div style="color:red; padding:15px; border:1px solid #ffcccc; background:#fff0f0; border-radius:6px;">
          ❌ No matching warranty record found using ${searchType === "phone" ? "phone number" : "student ID"}.
        </div>
      `;
      return;
    }

    // Loop through each document and render the result
    snap.forEach((doc) => {
      const data = doc.data();

      const createdAt = data.timestamp?.toDate
        ? data.timestamp.toDate().toLocaleString()
        : "N/A";

      const expiry = data.expiryDate?.toDate
        ? data.expiryDate.toDate()
        : null;

      const expiryDate = expiry
        ? expiry.toLocaleDateString()
        : "Not set";

      const today = new Date();
      const isActive = expiry ? expiry > today : false;

      const statusColor = isActive ? "#28a745" : "#dc3545";
      const activeLabel = isActive
        ? `<span style="display:inline-block; padding:4px 10px; color:white; font-weight:bold; background:#28a745; border-radius:6px; font-size:14px;">ACTIVE</span>`
        : `<span style="display:inline-block; padding:4px 10px; color:white; font-weight:bold; background:#dc3545; border-radius:6px; font-size:14px;">EXPIRED</span>`;

      const terminationReminder = data.status === "Terminated"
        ? `<div style="margin-top:15px; padding:10px; background:#f8d7da; border:1px solid rgb(220, 53, 69); border-radius:5px; color:#721c24;">
            ⚠️ Your warranty has been terminated due to: <strong>${data.terminationReason || "Screen or Battery Replacement"}</strong> .
        </div>`
        : "";

      const renewalReminder = !isActive
        ? `<div style="margin-top:15px; padding:10px; background:#fff3cd; border:1px solid rgb(235, 8, 76); border-radius:5px; color:#856404;">
            ⚠️ Your warranty has expired. <a href="warranty.html" style="font-weight:bold; color:#FF0000;">Click here to renew</a>.
          </div>`
        : "";

      const claimStatus = data.status || "Pending";
      const claimStatusColor = {
        "Pending": "#6c757d",
        "Approved": "#28a745",
        "Rejected": "#dc3545",
        "Repaired": "#007bff"
      }[claimStatus] || "#6c757d";

      const claimStatusLabel = `
        <span style="display:inline-block; padding:4px 10px; color:white; font-weight:bold; background:${claimStatusColor}; border-radius:6px; font-size:14px;">
          ${claimStatus}
        </span>`;

      // Render the warranty details into the result container
      resultDiv.innerHTML = `
        <div class="result-container">
          <div class="result-header">
            <h3>Warranty Details</h3>
            <button class="close-btn">×</button> <!-- Close button without inline JS -->
          </div>
          <div class="result-body">
            <div class="result-row">
              <strong>Name:</strong> ${data.name}
            </div>
            <div class="result-row">
              <strong>Device Model:</strong> ${data.model}
            </div>
            <div class="result-row">
              <strong>Registered On:</strong> ${createdAt}
            </div>
            <div class="result-row">
              <strong>Warranty Expiry:</strong> ${expiryDate}
            </div>
            <div class="result-row">
              <strong>Status:</strong> ${activeLabel}
            </div>
            ${terminationReminder}
            ${renewalReminder}
          </div>
        </div>
      `;

      // Add event listener to the close button
      const closeBtn = document.querySelector('.close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          resultDiv.classList.remove('show');  // Hide the result container when close is clicked
        });
      }
    });
  } catch (error) {
    console.error("Error checking warranty:", error);
    resultDiv.innerHTML = `
      <div style="color:red; padding:15px; border:1px solid #ffcccc; background:#fff0f0; border-radius:6px;">
        ❌ Error searching warranty: ${error.message}
      </div>
    `;
  }
});
