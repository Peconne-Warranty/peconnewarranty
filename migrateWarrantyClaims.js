const admin = require("firebase-admin");
const fs = require("fs");

// Initialize Firebase Admin SDK
const serviceAccount = require("./serviceAccountKey.json"); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Calculate expiry date based on whether the user is a student and the payment amount.
 */
function calculateExpiryDate(paymentDate, isStudent, paymentAmount) {
  const date = new Date(paymentDate);
  const amount = parseInt(paymentAmount);

  let months = 0;

  if (isStudent) {
    if (amount === 500) months = 6;
    else if (amount === 800) months = 12;
  } else {
    if (amount === 600) months = 6;
    else if (amount === 1000 || amount === 2500) months = 12;
  }

  date.setMonth(date.getMonth() + months);
  return date;
}

/**
 * Update warranty claim to "Terminated" and add termination reason.
 */
async function terminateWarranty(claimId, terminationReason) {
  const claimRef = db.collection("warranty_claims").doc(claimId);
  
  try {
    const claimSnapshot = await claimRef.get();
    if (!claimSnapshot.exists) {
      console.log(`Claim with ID ${claimId} does not exist.`);
      return;
    }

    const claimData = claimSnapshot.data();
    const expiryDate = claimData.expiryDate?.toDate ? claimData.expiryDate.toDate() : null;

    // Check if warranty is still active, if not, skip the termination process
    if (!expiryDate || expiryDate < new Date()) {
      console.log(`Warranty for claim ${claimId} has already expired.`);
      return;
    }

    // Update warranty to "Terminated"
    await claimRef.update({
      status: "Terminated",
      terminationReason: terminationReason,  // Add termination reason
      isActive: false,  // Mark warranty as inactive
      expiryDate: admin.firestore.Timestamp.fromDate(new Date()) // Set expiry date to current date
    });

    console.log(`✅ Warranty with ID ${claimId} has been terminated.`);
  } catch (error) {
    console.error("❌ Error terminating warranty:", error);
  }
}

/**
 * Add a sample warranty claim with the new expiry date and active status fields.
 */
async function addSampleWarrantyClaim() {
  const isStudent = false;
  const paymentAmount = "2500";
  const paymentDate = "2025-06-29";

  const expiryDate = calculateExpiryDate(paymentDate, isStudent, paymentAmount);
  const isActive = expiryDate > new Date();

  const data = {
    name: "John Doe",
    email: "testuser@gmail.com",
    phone: "0700123654",
    model: "Infinix Hot8",
    serial: "987651234567",
    isStudent: isStudent,
    studentId: "",
    paymentMethod: "M-PESA",
    transactionCode: "SH729AFFPT",
    paymentAmount: paymentAmount,
    paymentDate: paymentDate,
    status: "Pending",
    formattedTimestamp: "6/29/2025, 2:50:36 PM",
    timestamp: admin.firestore.FieldValue.serverTimestamp(),

    // New Fields
    expiryDate: admin.firestore.Timestamp.fromDate(expiryDate),
    isActive: isActive
  };

  await db.collection("warranty_claims").add(data);
  console.log("✅ Added a sample warranty claim with expiry date and active status.");
}

/**
 * Main migration function
 */
async function migrate() {
  try {
    await addSampleWarrantyClaim();
    console.log("🚀 Migration complete.");
    process.exit();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Example: Terminate a warranty (provide claim ID and termination reason)
terminateWarranty('your-claim-id-here', 'Screen replaced by customer');

// Run migration to add sample warranty
migrate();
