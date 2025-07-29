// Firebase & EmailJS Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-storage.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBFynS9-iYS7GxTeCzq-QPi9HRJr4qIRzY",
  authDomain: "ptech-warranty-website.firebaseapp.com",
  projectId: "ptech-warranty-website",
  storageBucket: "ptech-warranty-website.appspot.com",
  messagingSenderId: "335295749830",
  appId: "1:335295749830:web:2ba5d66219eb6f04d6c1c7",
  measurementId: "G-NFKHFN19LZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize EmailJS
emailjs.init("fbVNsTIoBvJGuvFnZ");

// DOM Elements
const form = document.getElementById("shopPartnerForm");
const submitBtn = document.getElementById("submitBtn");
const submitText = document.getElementById("submitText");
const submitSpinner = document.getElementById("submitSpinner");

// Form Submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Check form validity
  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    return;
  }

  // UI: Show loading spinner
  submitBtn.disabled = true;
  submitSpinner.classList.remove("d-none");
  submitText.textContent = "Submitting...";

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  const referenceNumber = "PT-" + Date.now();
  let paymentProofURL = "";

  try {
    const file = formData.get("paymentProof");

    // Upload payment proof (if attached)
    if (file && file.size > 0) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Payment proof is too large (max 2MB).");
        resetSubmitButton();
        return;
      }

      try {
        console.log("Uploading proof...");
        const storageRef = ref(storage, `shop_sales_receipts/${Date.now()}_${file.name}`);
      
        // Timeout if stuck for 15 seconds
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
      
        const snapshot = await uploadBytes(storageRef, file);
        clearTimeout(timeout);
      
        paymentProofURL = await getDownloadURL(snapshot.ref);
        console.log("✅ Upload complete:", paymentProofURL);
      } catch (uploadError) {
        console.error("❌ Upload failed:", uploadError.message || uploadError);
        alert("Failed to upload payment proof. It may be a network error or unsupported file type.");
        resetSubmitButton();
        return;
      }
    }

    // Calculate commission (25% of amount)
    const amount = Number(data.amount);
    const commission = (amount * 0.25).toFixed(2);

    // Sale entry data to store in Firestore
    const saleEntry = {
      referenceNumber,
      shopName: data.shopName,
      sellerName: data.sellerName,
      sellerPhone: data.sellerPhone,
      location: data.location,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      deviceModel: data.deviceModel,
      serialNumber: data.serialNumber,
      isStudent: data.isStudent,
      studentId: data.studentId || "",
      warrantyPlan: data.warrantyPlan,
      amount,
      referralCode: data.referralCode || "",
      paymentProofURL,
      createdAt: serverTimestamp(),
    };

    // Save sale data to Firestore
    await addDoc(collection(db, "shop_sales"), saleEntry);
    console.log("Saved to Firestore:", referenceNumber);

    // Send EmailJS notification
    await emailjs.send("service_ptech", "warranty_notification", {
      reference_number: referenceNumber,
      shop_name: data.shopName,
      seller_name: data.sellerName,
      seller_phone: data.sellerPhone,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      device_model: data.deviceModel,
      serial_number: data.serialNumber,
      is_student: data.isStudent,
      student_id: data.studentId || "N/A",
      warranty_plan: data.warrantyPlan,
      amount: data.amount,
      commission: commission,
      referral_code: data.referralCode || "",
      payment_proof: paymentProofURL || "No file uploaded",
    });
    console.log("Email notification sent.");

    // Done: Clear form + redirect
    localStorage.setItem("shopWarrantyRef", referenceNumber);
    form.reset();
    document.getElementById("commissionAmount").value = "";
    document.getElementById("studentIdContainer").classList.add("d-none");
    window.location.href = "thanks.html";

  } catch (error) {
    console.error("Submission failed:", error);
    alert("Something went wrong. Try again.");
  } finally {
    resetSubmitButton();
  }
});

// 🎓 Handle Commission & Student
const amountInput = document.getElementById("amountPaid");
const commissionField = document.getElementById("commissionAmount");
const warrantySelect = document.getElementById("warrantyPlan");
const isStudentSelect = document.querySelector('select[name="isStudent"]');
const studentIdContainer = document.getElementById("studentIdContainer");

amountInput.addEventListener("input", updateCommission);

warrantySelect.addEventListener("change", () => {
  const selected = warrantySelect.options[warrantySelect.selectedIndex];
  const price = selected.getAttribute("data-price");
  if (price) {
    amountInput.value = price;
    updateCommission();
  }
});

function updateCommission() {
  const value = parseFloat(amountInput.value);
  const commission = !isNaN(value) ? (value * 0.25).toFixed(2) : "";
  commissionField.value = commission ? `KES ${commission}` : "";
}

// Handle student ID visibility based on selection
isStudentSelect.addEventListener("change", () => {
  if (isStudentSelect.value === "Yes") {
    studentIdContainer.classList.remove("d-none");
    studentIdContainer.querySelector("input").required = true;
  } else {
    studentIdContainer.classList.add("d-none");
    studentIdContainer.querySelector("input").required = false;
  }
});

// Reset submit button
function resetSubmitButton() {
  submitBtn.disabled = false;
  submitSpinner.classList.add("d-none");
  submitText.textContent = "Submit & Register Warranty";
}
