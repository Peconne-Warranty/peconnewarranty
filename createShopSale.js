const admin = require("firebase-admin");
const path = require("path");

// Load service account
const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "ptech-warranty-website.appspot.com"
});

const db = admin.firestore();

// Define shop sale data
const amountPaid = 1800;
const commissionRate = 0.25;
const commission = parseFloat((amountPaid * commissionRate).toFixed(2));

const newSale = {
  shopName: "Gadget Point",
  sellerName: "Mary Njoki",
  sellerPhone: "0722123456",
  location: "Thika Road",

  customerName: "Samuel Kipkoech",
  customerPhone: "0799223344",
  deviceModel: "Infinix Hot 30",
  serialNumber: "359876543210001",

  isStudent: "Yes",
  studentId: "S123456789",

  warrantyPlan: "Regular - 1 Year",
  amount: amountPaid,
  commission: commission, // ✅ Include commission here (e.g. 450)

  referralCode: "GP-MJ25",
  paymentProofURL: "",
  createdAt: admin.firestore.FieldValue.serverTimestamp()
};

// Add to Firestore
async function saveShopSale() {
  try {
    const docRef = await db.collection("shop_sales").add(newSale);
    console.log(`✅ Shop sale added with ID: ${docRef.id}`);
    console.log(`💰 Commission: KES ${commission}`);
  } catch (error) {
    console.error("❌ Error adding document:", error.message);
  }
}

saveShopSale();
