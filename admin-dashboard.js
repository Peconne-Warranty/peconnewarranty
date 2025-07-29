// ================================
// Firebase Imports
// ================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, collection, getDocs, onSnapshot, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

// ================================
// Firebase Config
// ================================
const firebaseConfig = {
    apiKey: "AIzaSyBFynS9-iYS7GxTeCzq-QPi9HRJr4qIRzY",
    authDomain: "ptech-warranty-website.firebaseapp.com",
    projectId: "ptech-warranty-website",
    storageBucket: "ptech-warranty-website.appspot.com",
    messagingSenderId: "335295749830",
    appId: "1:335295749830:web:2ba5d66219eb6f04d6c1c7",
    measurementId: "G-NFKHFN19LZ"
};

// ================================
// Initialize Firebase
// ================================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


// Wait for DOM to load
// Authentication Check
// ================================
onAuthStateChanged(auth, user => {
    setTimeout(() => {
      const loadingEl = document.getElementById('loadingScreen');
  
      if (user) {
        if (user.uid === "W8Mz4wWOM4Nkof4h55si8VS4uXC3") {
          console.log("✅ Admin authenticated");
  
          // Hide loading screen smoothly
          loadingEl.style.opacity = '0';
  
          setTimeout(() => {
            loadingEl.style.display = 'none';
            document.body.classList.remove('auth-loading');
  
            fetchClaims();
            inactivityTime();
          }, 600); 
  
        } else {
          alert("⛔ Access denied. Admins only.");
          window.location.href = "admin-login.html";
        }
      } else {
        window.location.href = "admin-login.html";
      }
    }, 5000); 
  });
 
  
// ================================
// Auto Logout on Inactivity
// ================================
function inactivityTime() {
    let time;
    const maxInactiveMinutes = 5; 

    const resetTimer = () => {
        clearTimeout(time);
        time = setTimeout(logout, maxInactiveMinutes * 60 * 1000);
    };

    const logout = () => {
        alert("Session expired due to inactivity. Logging out.");
        signOut(auth).then(() => {
            window.location.href = "admin-login.html";
        });
    };

    // Reset timer on these actions
    window.onload = resetTimer;
    document.onmousemove = resetTimer;
    document.onkeypress = resetTimer;
    document.onscroll = resetTimer;
    document.onclick = resetTimer;
}

// ================================
// Logout Button
// ================================
document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = "admin-login.html";
    });
});

// ================================
// DOM Elements
// ================================
const totalClaimsEl = document.getElementById('total-claims-count');
const approvedEl = document.getElementById('approved-count');
const rejectedEl = document.getElementById('rejected-count');
const pendingEl = document.getElementById('pending-count');
const claimsContainer = document.getElementById('claimsContainer');

const searchName = document.getElementById('searchName');
const searchSerial = document.getElementById('searchSerial');
const statusFilter = document.getElementById('statusFilter');
const exportBtn = document.getElementById('exportBtn');


// ================================
// Fetch Data from Firestore
// ================================
let claimsData = [];
let shopWarrantiesData = [];

const fetchClaims = async () => {
    const claimsSnapshot = await getDocs(collection(db, "warranty_claims"));

    const seen = {
        names: new Set(),
        serials: new Set(),
        ids: new Set()
    };

    claimsData = claimsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(claim =>
            claim.name &&
            claim.name.toLowerCase() !== "test user" &&
            claim.email?.toLowerCase() !== "testuser@gmail.com" &&
            claim.status
        )
        .map(claim => {
            const nameKey = claim.name?.trim().toLowerCase();
            const serialKey = claim.serial?.trim().toUpperCase();
            const idKey = claim.idNumber?.trim();

            const isDuplicate =
                (nameKey && seen.names.has(nameKey)) ||
                (serialKey && seen.serials.has(serialKey)) ||
                (idKey && seen.ids.has(idKey));

            // Add to seen sets
            if (nameKey) seen.names.add(nameKey);
            if (serialKey) seen.serials.add(serialKey);
            if (idKey) seen.ids.add(idKey);

            return { ...claim, isDuplicate };
        });

    renderDashboard();
};

// ================================
// Fetch Shop Sales Data & Render
// ================================
async function fetchShopSales() {
    const shopSalesRef = collection(db, "shop_sales");
    const snapshot = await getDocs(shopSalesRef);
    const tableBody = document.getElementById("shopSalesTableBody");
    const leaderboardBody = document.getElementById("shopLeaderboardBody");
  
    let shopStats = {};
    let totalCommission = 0;
  
    tableBody.innerHTML = "";
    leaderboardBody.innerHTML = "";
  
    snapshot.forEach(doc => {
      const sale = doc.data();
      const {
        shopName, sellerName, customerName, deviceModel, warrantyPlan,
        amount, paymentProofURL, createdAt
      } = sale;
  
      // 🧮 Leaderboard stats
      if (!shopStats[shopName]) {
        shopStats[shopName] = { total: 0, commission: 0, sales: 0 };
      }
      shopStats[shopName].total += amount;
      shopStats[shopName].sales += 1;
      const commission = amount * 0.25;
      shopStats[shopName].commission += commission;
      totalCommission += commission;
  
      const dateFormatted = createdAt?.toDate
        ? createdAt.toDate().toLocaleString()
        : "-";
  
      const row = `
        <tr>
          <td>${sale.referenceNumber || "-"}</td>
          <td>${customerName}</td>
          <td>${deviceModel}</td>
          <td>${warrantyPlan}</td>
          <td>KES ${amount}</td>
          <td>${sellerName}</td>
          <td>${paymentProofURL ? `<a href="${paymentProofURL}" target="_blank">View</a>` : "None"}</td>
          <td>${dateFormatted}</td>
        </tr>
      `;
      tableBody.innerHTML += row;
    });
  
    // 🏆 Leaderboard
    const sortedShops = Object.entries(shopStats).sort((a, b) => b[1].sales - a[1].sales);
    sortedShops.forEach(([shop, stats]) => {
      leaderboardBody.innerHTML += `
        <tr>
          <td>${shop}</td>
          <td>${stats.sales}</td>
          <td>KES ${stats.total}</td>
          <td>KES ${stats.commission.toFixed(2)}</td>
        </tr>
      `;
    });
  
    // 💰 Totals
    document.getElementById("totalShops").textContent = Object.keys(shopStats).length;
    document.getElementById("totalCommissions").textContent = `KES ${totalCommission.toFixed(2)}`;
    document.getElementById("topShop").textContent = sortedShops[0]?.[0] || "-";
  }
  

//Calculating Payments
const totalPaymentsEl = document.getElementById('total-payments').querySelector('p');

function calculateTotalPayments(data) {
    const total = data.reduce((sum, claim) => {
        const amount = parseFloat(claim.paymentAmount);
        return !isNaN(amount) ? sum + amount : sum;
    }, 0);

    totalPaymentsEl.textContent = `KES ${total.toLocaleString()}`;
}


//Monthly Revenue Graph
let stackedComboChart;

function getColor(index) {
    const colors = [
        '#007bff', // blue
        '#28a745', // green
        '#ffc107', // yellow
        '#dc3545', // red
        '#6f42c1', // purple
        '#20c997', // teal
        '#fd7e14'  // orange
    ];
    return colors[index % colors.length];
}

function renderStackedComboChart(data) {
    const dayMap = {};
    const paymentMethods = new Set();

    data.forEach(claim => {
        const dateStr = claim.paymentDate;
        const method = claim.paymentMethod || "Unknown";

        if (dateStr) {
            const date = dateStr.toDate ? dateStr.toDate() : new Date(dateStr); // Handles Firestore Timestamp or string
            const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

            paymentMethods.add(method);

            if (!dayMap[dayKey]) {
                dayMap[dayKey] = {};
            }

            const amount = parseFloat(claim.paymentAmount);
            if (!isNaN(amount)) {
                dayMap[dayKey][method] = (dayMap[dayKey][method] || 0) + amount;
            }
        }
    });

    const sortedDays = Object.keys(dayMap).sort();
    const methods = Array.from(paymentMethods);

    // Bar datasets for each payment method
    const datasets = methods.map((method, index) => ({
        type: 'bar',
        label: method,
        data: sortedDays.map(day => dayMap[day][method] || 0),
        backgroundColor: getColor(index),
        stack: 'payment'
    }));

    // Line dataset for total daily revenue
    const totalRevenue = sortedDays.map(day => {
        const payments = Object.values(dayMap[day] || {});
        return payments.reduce((a, b) => a + b, 0);
    });

    datasets.push({
        type: 'line',
        label: 'Total Revenue',
        data: totalRevenue,
        borderColor: '#dc3545',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: '#dc3545',
        fill: false,
    });

    const ctx = document.getElementById('stackedComboChart').getContext('2d');

    if (stackedComboChart) stackedComboChart.destroy();

    stackedComboChart = new Chart(ctx, {
        data: {
            labels: sortedDays,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Daily Payments by Method + Total Revenue Line'
                },
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                x: {
                    stacked: true,
                    barPercentage: 0.5,
                    categoryPercentage: 0.6,
                    ticks: {
                        autoSkip: true,
                        maxRotation: 45,
                        minRotation: 0
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return 'KES ' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// =============== Helper to Get Week Number =================
function getWeekNumber(date) {
    const firstJan = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date - firstJan) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + firstJan.getDay() + 1) / 7);
}

// Real-time listener for updates
onSnapshot(collection(db, "warranty_claims"), () => {
    fetchClaims();
});


//AI Summary
function renderSummaryBlock(data) {
    const total = data.length;
    const approved = data.filter(c => c.status === "Approved").length;
    const rejected = data.filter(c => c.status === "Rejected").length;
    const pending = data.filter(c => c.status === "Pending").length;

    const totalPayments = data.reduce((sum, claim) => {
        const amount = parseFloat(claim.paymentAmount);
        return !isNaN(amount) ? sum + amount : sum;
    }, 0);

    const paymentMethodCount = {};
    data.forEach(claim => {
        const method = claim.paymentMethod || "Unknown";
        paymentMethodCount[method] = (paymentMethodCount[method] || 0) + 1;
    });

    const topMethod = Object.entries(paymentMethodCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const summaryText = `
        <span class="d-block mb-2">
          ✅ <strong>${approved}</strong> Approved &nbsp; | &nbsp;
          ❌ <strong>${rejected}</strong> Rejected &nbsp; | &nbsp;
          ⏳ <strong>${pending}</strong> Pending
        </span>
        <span class="d-block mb-2">
          💰 <strong>KES ${totalPayments.toLocaleString()}</strong> collected in total payments.
        </span>
        <span class="d-block mb-2">
          📦 A total of <strong>${total}</strong> claims received.
        </span>
        <span class="d-block">
          🔥 Top payment method: <strong>${topMethod}</strong>
        </span>
    `;

    document.getElementById('summaryBlock').innerHTML = summaryText;
}

//User/Customer Overview Panel
const totalCustomersEl = document.getElementById('totalCustomers');
const activeWarrantiesEl = document.getElementById('activeWarranties');
const expiredWarrantiesEl = document.getElementById('expiredWarranties');

async function loadDashboardSummary() {
    const ref = collection(db, "warranty_claims");
    const snapshot = await getDocs(ref);

    const customersSet = new Set();
    let activeCount = 0;
    let expiredCount = 0;

    const today = new Date();

    snapshot.forEach(doc => {
        const data = doc.data();

        // ✅ Skip test/demo data
        const isTestData =
            (data.email && data.email.includes('test')) ||
            (data.name && data.name.toLowerCase().includes('test')) ||
            (data.serial && data.serial.toLowerCase().includes('demo'));

        if (isTestData) {
            return; // Skip this document
        }

        // Count unique customers
        if (data.email) {
            customersSet.add(data.email);
        }

        // Check expiry date
        const expiry = data.expiryDate?.toDate ? data.expiryDate.toDate() : null;
        if (expiry) {
            if (expiry > today) {
                activeCount++;
            } else {
                expiredCount++;
            }
        }
    });

    totalCustomersEl.innerText = customersSet.size;
    activeWarrantiesEl.innerText = activeCount;
    expiredWarrantiesEl.innerText = expiredCount;
}

// Run on load
loadDashboardSummary();

// ================================
// Render Dashboard
// ================================
function renderDashboard() {
    const filteredClaims = applyFilters(claimsData);
    calculateTotalPayments(filteredClaims);
             
    // Counters
    totalClaimsEl.textContent = filteredClaims.length;
    approvedEl.textContent = filteredClaims.filter(c => c.status === "Approved").length;
    rejectedEl.textContent = filteredClaims.filter(c => c.status === "Rejected").length;
    pendingEl.textContent = filteredClaims.filter(c => c.status === "Pending").length;

    // Claims
    renderClaims(filteredClaims);

    // Charts
    renderCharts(filteredClaims);
    renderStackedComboChart(filteredClaims);
    renderSummaryBlock(filteredClaims);
    }

// ================================
// Apply Filters
// ================================
function applyFilters(data) {
    return data.filter(claim => {
        const nameMatch = claim.name.toLowerCase().includes(searchName.value.toLowerCase());
        const serialMatch = claim.serial.toLowerCase().includes(searchSerial.value.toLowerCase());
        const statusMatch = statusFilter.value === "" || claim.status === statusFilter.value;
        return nameMatch && serialMatch && statusMatch;
    });
}

function renderClaims(data) {
    claimsContainer.innerHTML = '';

    if (data.length === 0) {
        claimsContainer.innerHTML = `<div class="col-12 text-center text-muted">No matching claims found.</div>`;
        return;
    }

    data.forEach(claim => {
        const expiry = claim.expiryDate?.toDate ? claim.expiryDate.toDate() : null;
        const expiryDate = expiry ? expiry.toLocaleDateString() : 'N/A';

        const today = new Date();
        const isActive = expiry ? expiry > today : false;

        const activeBadge = isActive
            ? `<span class="badge bg-success">Active</span>`
            : `<span class="badge bg-danger">Expired</span>`;

        const duplicateWarning = claim.isDuplicate
            ? `<span class="badge bg-warning text-dark">⚠ Duplicate</span>`
            : '';

        const claimCard = document.createElement('div');
        claimCard.className = 'col-md-4';
        claimCard.innerHTML = `
            <div class="glass-card p-3">
                <h5>${claim.name} ${duplicateWarning}</h5>
                <p><strong>Device:</strong> ${claim.model}</p>
                <p><strong>Serial:</strong> ${claim.serial}</p>
                <p><strong>ID Number:</strong> ${claim.idNumber || "-"}</p>
                <p><strong>Payment:</strong> ${claim.paymentAmount} via ${claim.paymentMethod}</p>
                <p><strong>Phone:</strong> ${claim.phone}</p>
                <p><strong>Status:</strong> 
                    <span class="status-${claim.status.toLowerCase()}">${claim.status}</span>
                </p>
                <p><strong>Warranty Expiry:</strong> ${expiryDate} ${activeBadge}</p>
                ${claim.isDuplicate ? `<p class="text-danger fw-bold">⚠ Duplicate detected. Review before approval.</p>` : ''}
                <div class="actions mt-2 d-flex flex-wrap gap-1">
                    <button class="btn btn-info btn-sm view" data-id="${claim.id}">View</button>
                    <button class="btn btn-success btn-sm approve" data-id="${claim.id}" ${claim.isDuplicate ? "disabled" : ""}>Approve</button>
                    <button class="btn btn-danger btn-sm reject" data-id="${claim.id}">Reject</button>
                    <button class="btn btn-warning btn-sm terminate" data-id="${claim.id}" ${claim.status === 'Terminated' ? "disabled" : ""}>Terminate</button>
                    <button class="btn btn-danger btn-sm delete" data-id="${claim.id}">Delete</button>
                </div>
            </div>
        `;
        claimsContainer.appendChild(claimCard);
    });

    // Attach Event Listeners
    document.querySelectorAll('.view').forEach(btn => {
        btn.addEventListener('click', handleView);
    });
    document.querySelectorAll('.approve').forEach(btn => {
        btn.addEventListener('click', handleApprove);
    });
    document.querySelectorAll('.reject').forEach(btn => {
        btn.addEventListener('click', handleReject);
    });
    document.querySelectorAll('.terminate').forEach(btn => {
        btn.addEventListener('click', handleTerminate);
    });
    document.querySelectorAll('.delete').forEach(btn => {
        btn.addEventListener('click', handleDelete);
    });
}


// ================================
// Button Handlers
// ================================

// View Details
function handleView(event) {
    const id = event.target.getAttribute('data-id');
    const claim = claimsData.find(c => c.id === id);

    if (claim) {
        const body = `
            <ul class="list-group">
              <li class="list-group-item"><strong>Name:</strong> ${claim.name}</li>
              <li class="list-group-item"><strong>Email:</strong> ${claim.email}</li>
              <li class="list-group-item"><strong>Phone:</strong> ${claim.phone}</li>
              <li class="list-group-item"><strong>Device Model:</strong> ${claim.model}</li>
              <li class="list-group-item"><strong>Serial:</strong> ${claim.serial}</li>
              <li class="list-group-item"><strong>Status:</strong> ${claim.status}</li>
              <li class="list-group-item"><strong>Payment:</strong> ${claim.paymentAmount} via ${claim.paymentMethod}</li>
              <li class="list-group-item"><strong>Transaction Code:</strong> ${claim.transactionCode}</li>
              <li class="list-group-item"><strong>Payment Date:</strong> ${claim.paymentDate}</li>
              <li class="list-group-item"><strong>Timestamp:</strong> ${claim.formattedTimestamp}</li>
              ${claim.isStudent ? `<li class="list-group-item"><strong>Student ID:</strong> ${claim.studentId}</li>` : ""}
            </ul>
        `;

        document.getElementById('detailsBody').innerHTML = body;

        const detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));
        detailsModal.show();
    }
}


// Approve Claim
function handleApprove(event) {
    const id = event.target.getAttribute('data-id');
    const claim = claimsData.find(c => c.id === id);

    Swal.fire({
        title: 'Approve Claim?',
        text: `Are you sure you want to approve ${claim.name}'s claim for ${claim.model}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, Approve'
    }).then((result) => {
        if (result.isConfirmed) {
            updateDoc(doc(db, "warranty_claims", id), { status: "Approved" })
                .then(() => {
                    Swal.fire(
                        'Approved!',
                        `${claim.name}'s claim has been approved.`,
                        'success'
                    );
                })
                .catch(err => {
                    Swal.fire('Error', 'Something went wrong!', 'error');
                });
        }
    });
}

// Reject Claim
function handleReject(event) {
    const id = event.target.getAttribute('data-id');
    const claim = claimsData.find(c => c.id === id);

    Swal.fire({
        title: 'Reject Claim?',
        text: `Are you sure you want to reject ${claim.name}'s claim for ${claim.model}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, Reject'
    }).then((result) => {
        if (result.isConfirmed) {
            updateDoc(doc(db, "warranty_claims", id), { status: "Rejected" })
                .then(() => {
                    Swal.fire(
                        'Rejected!',
                        `${claim.name}'s claim has been rejected.`,
                        'success'
                    );
                })
                .catch(err => {
                    Swal.fire('Error', 'Something went wrong!', 'error');
                });
        }
    });
}

// 🔴 DELETE CLAIM
function handleDelete(event) {
    const id = event.target.getAttribute('data-id');
    const claim = claimsData.find(c => c.id === id);

    Swal.fire({
        title: 'Delete Claim?',
        text: `Are you sure you want to permanently delete ${claim.name}'s claim for ${claim.model}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Delete'
    }).then((result) => {
        if (result.isConfirmed) {
            deleteDoc(doc(db, "warranty_claims", id))
                .then(() => {
                    Swal.fire('Deleted!', 'Claim has been removed.', 'success');
                    fetchClaims(); // Refresh after deletion
                })
                .catch(err => {
                    Swal.fire('Error', 'Failed to delete claim.', 'error');
                });
        }
    });
}

// Terminate Claim
function handleTerminate(event) {
    const id = event.target.getAttribute('data-id');
    const claim = claimsData.find(c => c.id === id);

    Swal.fire({
        title: 'Terminate Warranty?',
        text: `Are you sure you want to terminate ${claim.name}'s warranty for ${claim.model}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ffc107',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, Terminate'
    }).then((result) => {
        if (result.isConfirmed) {
            // Update Firestore document to mark warranty as terminated
            updateDoc(doc(db, "warranty_claims", id), {
                status: "Terminated",
                terminatedReason: "Screen or Battery Replacement", // or any reason you want
                terminatedAt: new Date() // Timestamp for when it was terminated
            })
            .then(() => {
                Swal.fire(
                    'Terminated!',
                    `${claim.name}'s warranty has been terminated.`,
                    'success'
                );
                fetchClaims(); // Refresh the claims list
            })
            .catch(err => {
                Swal.fire('Error', 'Failed to terminate the warranty.', 'error');
            });
        }
    });
}


// Update Firestore Status
async function updateClaimStatus(id, newStatus) {
    const claimRef = doc(db, "warranty_claims", id);
    await updateDoc(claimRef, { status: newStatus });
}

// ================================
// Charts
// ================================
let statusChart, modelChart;

function renderCharts(data) {
    const statusCounts = {
        Approved: data.filter(c => c.status === "Approved").length,
        Rejected: data.filter(c => c.status === "Rejected").length,
        Pending: data.filter(c => c.status === "Pending").length
    };

    const modelCounts = {};
    data.forEach(c => {
        modelCounts[c.model] = (modelCounts[c.model] || 0) + 1;
    });

    // Destroy previous charts if exist
    if (statusChart) statusChart.destroy();
    if (modelChart) modelChart.destroy();

    // Status Chart
    const ctx1 = document.getElementById('statusChart').getContext('2d');
    statusChart = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: ['Approved', 'Rejected', 'Pending'],
            datasets: [{
                label: 'Status',
                data: [statusCounts.Approved, statusCounts.Rejected, statusCounts.Pending],
                backgroundColor: ['green', 'red', 'orange'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true
        }
    });

    // Model Chart
    const ctx2 = document.getElementById('modelChart').getContext('2d');
    modelChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: Object.keys(modelCounts),
            datasets: [{
                label: 'Devices',
                data: Object.values(modelCounts),
                backgroundColor: '#007bff'
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y'
        }
    });
}

// ================================
// CSV Export
// ================================
exportBtn.addEventListener('click', () => {
    const rows = [
        ['Name', 'Model', 'Serial', 'Phone', 'Status', 'Payment Amount', 'Payment Method', 'Transaction Code', 'Payment Date']
    ];

    claimsData.forEach(claim => {
        rows.push([
            claim.name,
            claim.model,
            claim.serial,
            claim.phone,
            claim.status,
            claim.paymentAmount,
            claim.paymentMethod,
            claim.transactionCode,
            claim.paymentDate
        ]);
    });

    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "warranty_claims.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// ================================
// Filters
// ================================
searchName.addEventListener('input', renderDashboard);
searchSerial.addEventListener('input', renderDashboard);
statusFilter.addEventListener('change', renderDashboard);

// ================================
// INIT
// ================================
onAuthStateChanged(auth, user => {
  // your existing auth check...
  if (user && user.uid === "W8Mz4wWOM4Nkof4h55si8VS4uXC3") {
    // after fetchClaims();
    fetchClaims();
    fetchShopSales(); // 👈 add this line
  }
});

