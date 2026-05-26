let users = JSON.parse(localStorage.getItem('users')) || [];
let orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
let prescriptions = JSON.parse(localStorage.getItem('prescriptions')) || [];
let deliveries = JSON.parse(localStorage.getItem('deliveries')) || [];
let stock = JSON.parse(localStorage.getItem('stock')) || {
    Paracetamol: 100,
    Ibuprofen: 50,
    Aspirin: 75,
    Amoxicillin: 60,
    Cetirizine: 80,
    Omeprazole: 45,
    Metformin: 90,
    Losartan: 70,
    Atorvastatin: 65,
    Salbutamol: 55,
    Doxycycline: 40,
    Ciprofloxacin: 30,
    Loratadine: 85,
    Ranitidine: 50,
    Clopidogrel: 60,
    Amlodipine: 95,
    Gabapentin: 70,
    Prednisone: 35,
    Fluoxetine: 50,
    Sertraline: 45,
    Tramadol: 25,
    Lisinopril: 80,
    Hydrochlorothiazide: 60,
    Pantoprazole: 55,
    Azithromycin: 40
};
let supplies = JSON.parse(localStorage.getItem('supplies')) || [];
let addedUsers = JSON.parse(localStorage.getItem('addedUsers')) || [];
let paymentMethods = JSON.parse(localStorage.getItem('paymentMethods')) || {};

const rolePermissions = {
    patient: ['patient', 'patient-stock', 'container', 'patient-delivery', 'patient-payment'],
    doctor: ['doctor', 'container'],
    delivery: ['delivery', 'container'],
    pharmacist: ['pharmacist', 'container'],
    supplier: ['supplier', 'container'],
    admin: ['admin', 'admin-users', 'admin-orders', 'admin-prescriptions', 'admin-deliveries', 'admin-stock', 'admin-supplies', 'container']
};

const LOW_STOCK_THRESHOLD = 20;

function updateNavigation() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    const nav = document.getElementById('nav');
    nav.innerHTML = '';
    const allowed = rolePermissions[user.role] || [];

    if (allowed.includes('container')) nav.innerHTML += '<a href="#container" onclick="showSection(\'container\')">Dashboard</a>';
    if (allowed.includes('patient')) {
        nav.innerHTML += '<a href="#patient" onclick="showSection(\'patient\')">Patient</a>';
        nav.innerHTML += '<a href="#patient-stock" onclick="showSection(\'patient-stock\')">View Stock</a>';
        nav.innerHTML += '<a href="#patient-delivery" onclick="showSection(\'patient-delivery\')">Delivery Status</a>';
        nav.innerHTML += '<a href="#patient-payment" onclick="showSection(\'patient-payment\')">Manage Payment</a>';
    }
    if (allowed.includes('doctor')) nav.innerHTML += '<a href="#doctor" onclick="showSection(\'doctor\')">Doctor</a>';
    if (allowed.includes('delivery')) nav.innerHTML += '<a href="#delivery" onclick="showSection(\'delivery\')">Delivery</a>';
    if (allowed.includes('pharmacist')) nav.innerHTML += '<a href="#pharmacist" onclick="showSection(\'pharmacist\')">Pharmacist</a>';
    if (allowed.includes('supplier')) nav.innerHTML += '<a href="#supplier" onclick="showSection(\'supplier\')">Supplier</a>';
    if (allowed.includes('admin')) {
        nav.innerHTML += '<a href="#admin" onclick="showSection(\'admin\')">Admin Dashboard</a>';
        nav.innerHTML += '<a href="#admin-users" onclick="showSection(\'admin-users\')">Users</a>';
        nav.innerHTML += '<a href="#admin-orders" onclick="showSection(\'admin-orders\')">Orders</a>';
        nav.innerHTML += '<a href="#admin-prescriptions" onclick="showSection(\'admin-prescriptions\')">Prescriptions</a>';
        nav.innerHTML += '<a href="#admin-deliveries" onclick="showSection(\'admin-deliveries\')">Deliveries</a>';
        nav.innerHTML += '<a href="#admin-stock" onclick="showSection(\'admin-stock\')">Stock</a>';
        nav.innerHTML += '<a href="#admin-supplies" onclick="showSection(\'admin-supplies\')">Supplies</a>';
    }
    nav.innerHTML += '<a href="#" onclick="logout()">Logout</a>';
}

function updateDashboard() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    const allowed = rolePermissions[user.role] || [];
    document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('active');
        if (allowed.includes(card.id)) card.classList.add('active');
    });
}

function showSection(sectionId) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!user && sectionId !== 'register' && sectionId !== 'login') {
        showSection('login');
        return;
    }

    if (user && !rolePermissions[user.role].includes(sectionId)) {
        alert('Access Denied: You lack permission for this section!');
        showSection('container');
        return;
    }

    document.querySelectorAll('.section, .container').forEach(el => el.classList.remove('active'));
    const section = document.getElementById(sectionId + '-section');
    if (section) section.classList.add('active');

    document.querySelector('.container').style.display = sectionId === 'container' ? 'flex' : 'none';
    document.getElementById('nav').style.display = (user && sectionId !== 'register' && sectionId !== 'login') ? 'block' : 'none';

    if (sectionId === 'container') updateDashboard();
    if (user) updateNavigation();
    updateSectionContent(sectionId);
}

function register() {
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;
    const error = document.getElementById('regError');
    const success = document.getElementById('regSuccess');

    if (!username || !/^[a-zA-Z0-9_]{3,15}$/.test(username)) {
        error.textContent = 'Username must be 3-15 characters (letters, numbers, underscores).';
        error.style.display = 'block';
        success.style.display = 'none';
        return;
    }
    if (password.length < 6) {
        error.textContent = 'Password must be at least 6 characters.';
        error.style.display = 'block';
        success.style.display = 'none';
        return;
    }
    if (users.find(u => u.username === username)) {
        error.textContent = 'Username already taken!';
        error.style.display = 'block';
        success.style.display = 'none';
        return;
    }

    users.push({ username, password, role });
    localStorage.setItem('users', JSON.stringify(users));
    error.style.display = 'none';
    success.textContent = 'Registered successfully! Redirecting to login...';
    success.style.display = 'block';
    setTimeout(() => showSection('login'), 1500);
}

function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        document.getElementById('loginError').style.display = 'none';
        localStorage.setItem('currentUser', JSON.stringify(user));
        document.getElementById('welcomeMessage').textContent = `Welcome, ${user.username} (${user.role})!`;
        showSection('container');
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.reload();
}

function validatePayment(paymentMethod, paymentDetails) {
    if (paymentMethod === 'UPI') {
        return paymentDetails.includes('@') && paymentDetails.length > 5;
    } else {
        return /^\d{16}$/.test(paymentDetails);
    }
}

function savePaymentMethod(e) {
    e.preventDefault();
    const paymentMethod = document.getElementById('paymentMethod').value;
    const paymentDetails = document.getElementById('paymentDetails').value.trim();
    const result = document.getElementById('paymentResult');
    const user = JSON.parse(localStorage.getItem('currentUser'));

    if (!paymentDetails) {
        result.textContent = 'Please enter payment details!';
        result.style.color = '#e74c3c';
        return;
    }

    if (!validatePayment(paymentMethod, paymentDetails)) {
        result.textContent = `Invalid ${paymentMethod} details!`;
        result.style.color = '#e74c3c';
        return;
    }

    paymentMethods[user.username] = { method: paymentMethod, details: paymentDetails };
    localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods));
    result.textContent = `Payment method saved: ${paymentMethod}`;
    result.style.color = '#00c4b4';
    document.getElementById('paymentForm').reset();
}

function handlePurchase(e) {
    e.preventDefault();
    const medicine = document.getElementById('medicineName').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value);
    const result = document.getElementById('orderResult');
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const payment = paymentMethods[user.username];

    if (!payment) {
        result.textContent = 'Please set a payment method first!';
        result.style.color = '#e74c3c';
        showSection('patient-payment');
        return;
    }

    if (!medicine || !quantity || quantity < 1) {
        result.textContent = 'Please fill all fields correctly!';
        result.style.color = '#e74c3c';
        return;
    }

    if (stock[medicine] && stock[medicine] >= quantity) {
        stock[medicine] -= quantity;
        localStorage.setItem('stock', JSON.stringify(stock));
        const order = { 
            medicine, 
            quantity, 
            payment: payment.method, 
            timestamp: new Date().toLocaleString(),
            username: user.username
        };
        orderHistory.push(order);
        localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
        
        const deliveryOrder = `Order: ${medicine} (${quantity} units)`;
        deliveries.push({
            order: deliveryOrder,
            status: 'Ordered',
            username: user.username,
            medicine,
            quantity
        });
        localStorage.setItem('deliveries', JSON.stringify(deliveries));

        result.textContent = `Purchased ${quantity} units of ${medicine}! Payment via ${payment.method}.`;
        result.style.color = '#00c4b4';
        updateSectionContent('patient');
        updateSectionContent('patient-stock');
        document.getElementById('purchaseForm').reset();
    } else {
        result.textContent = `${medicine} is out of stock or insufficient!`;
        result.style.color = '#e74c3c';
    }
}

function cancelOrder(orderIndex) {
    const order = orderHistory[orderIndex];
    const delivery = deliveries.find(d => d.order === `Order: ${order.medicine} (${order.quantity} units)` && d.username === order.username && d.status === 'Ordered');

    if (!delivery) {
        alert('Order cannot be cancelled: Already in transit or delivered!');
        return;
    }

    stock[order.medicine] += order.quantity;
    localStorage.setItem('stock', JSON.stringify(stock));
    orderHistory.splice(orderIndex, 1);
    deliveries.splice(deliveries.indexOf(delivery), 1);
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
    localStorage.setItem('deliveries', JSON.stringify(deliveries));
    updateSectionContent('patient');
    updateSectionContent('patient-stock');
    alert('Order cancelled successfully!');
}

function handleRestock(e) {
    e.preventDefault();
    const medicine = document.getElementById('restockMedicine').value.trim();
    const quantity = parseInt(document.getElementById('restockQuantity').value);
    const result = document.getElementById('restockResult');

    if (!medicine || !quantity || quantity < 1) {
        result.textContent = 'Please enter valid medicine and quantity!';
        result.style.color = '#e74c3c';
        return;
    }

    stock[medicine] = (stock[medicine] || 0) + quantity;
    localStorage.setItem('stock', JSON.stringify(stock));
    supplies.push({ medicine, quantity, timestamp: new Date().toLocaleString(), source: 'Pharmacist' });
    localStorage.setItem('supplies', JSON.stringify(supplies));
    result.textContent = `Restocked ${quantity} units of ${medicine}!`;
    result.style.color = '#00c4b4';
    updateSectionContent('pharmacist');
    updateSectionContent('patient-stock');
    document.getElementById('restockForm').reset();
}

function generateReport() {
    const result = document.getElementById('reportResult');
    const stockList = Object.entries(stock).map(([med, qty]) => {
        const lowStock = qty < LOW_STOCK_THRESHOLD ? ' (Low Stock!)' : '';
        return `<li class="${qty < LOW_STOCK_THRESHOLD ? 'low-stock' : ''}">${med}: ${qty} units${lowStock}</li>`;
    }).join('');
    result.innerHTML = `Stock Report: <ul class="history">${stockList}</ul>`;
    result.style.color = '#00c4b4';
    updateSectionContent('pharmacist');
}

function handleUserAdd(e) {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value.trim();
    const role = document.getElementById('adminRole').value;
    const result = document.getElementById('userResult');

    if (!username || !/^[a-zA-Z0-9_]{3,15}$/.test(username)) {
        result.textContent = 'Invalid username!';
        result.style.color = '#e74c3c';
        return;
    }

    if (!users.find(u => u.username === username)) {
        users.push({ username, password: 'default123', role });
        localStorage.setItem('users', JSON.stringify(users));
        addedUsers.push({ username, role, timestamp: new Date().toLocaleString() });
        localStorage.setItem('addedUsers', JSON.stringify(addedUsers));
        result.textContent = `Added ${username} as ${role}!`;
        result.style.color = '#00c4b4';
        updateSectionContent('admin-users');
        document.getElementById('userForm').reset();
    } else {
        result.textContent = 'Username already exists!';
        result.style.color = '#e74c3c';
    }
}

function removeUser(username) {
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) {
        alert('User not found!');
        return;
    }
    if (users[userIndex].role === 'admin') {
        alert('Cannot remove admin users!');
        return;
    }

    orderHistory = orderHistory.filter(o => o.username !== username);
    deliveries = deliveries.filter(d => d.username !== username);
    prescriptions = prescriptions.filter(p => p.patient !== username);
    addedUsers = addedUsers.filter(u => u.username !== username);
    delete paymentMethods[username];

    users.splice(userIndex, 1);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
    localStorage.setItem('deliveries', JSON.stringify(deliveries));
    localStorage.setItem('prescriptions', JSON.stringify(prescriptions));
    localStorage.setItem('addedUsers', JSON.stringify(addedUsers));
    localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods));

    updateSectionContent('admin-users');
    alert(`User ${username} removed successfully!`);
}

function fillMedicineField(medicine) {
    showSection('patient');
    document.getElementById('medicineName').value = medicine;
}

function fillRestockMedicineField(medicine) {
    showSection('pharmacist');
    document.getElementById('restockMedicine').value = medicine;
}

function updateSectionContent(sectionId) {
    switch (sectionId) {
        case 'patient':
            document.getElementById('orderHistory').innerHTML = orderHistory.map((o, index) => `
                <li>
                    ${o.timestamp} - ${o.quantity} x ${o.medicine} (${o.payment})
                    ${deliveries.find(d => d.order === `Order: ${o.medicine} (${o.quantity} units)` && d.username === o.username && d.status === 'Ordered') ? 
                        `<button class="cancel-btn" onclick="cancelOrder(${index})">Cancel</button>` : ''}
                </li>
            `).join('');
            break;
        case 'patient-stock':
            document.getElementById('patientStockList').innerHTML = Object.entries(stock)
                .filter(([_, qty]) => qty > 0)
                .map(([med, qty]) => `<li onclick="fillMedicineField('${med}')">${med}: ${qty} units</li>`).join('');
            break;
        case 'patient-delivery':
            const user = JSON.parse(localStorage.getItem('currentUser'));
            document.getElementById('patientDeliveryList').innerHTML = deliveries
                .filter(d => d.username === user.username)
                .map(d => `<li>${d.order} - ${d.status}</li>`).join('');
            break;
        case 'doctor':
            document.getElementById('prescriptionHistory').innerHTML = prescriptions.map(p => `<li>${p.timestamp} - ${p.dosage}mg ${p.medicine} for ${p.patient}</li>`).join('');
            break;
        case 'delivery':
            document.getElementById('deliveryList').innerHTML = deliveries.map(d => `<li>${d.order} - ${d.status}</li>`).join('');
            const orderSelect = document.getElementById('orderSelect');
            orderSelect.innerHTML = '<option value="">Select an order</option>' + 
                deliveries.map(d => `<option value="${d.order}">${d.order}</option>`).join('');
            break;
        case 'pharmacist':
            document.getElementById('stockReport').innerHTML = Object.entries(stock).map(([med, qty]) => {
                const lowStock = qty < LOW_STOCK_THRESHOLD ? ' (Low Stock!)' : '';
                return `<li class="${qty < LOW_STOCK_THRESHOLD ? 'low-stock' : ''}" onclick="fillRestockMedicineField('${med}')">${med}: ${qty} units${lowStock}</li>`;
            }).join('');
            break;
        case 'supplier':
            document.getElementById('supplyHistory').innerHTML = supplies.map(s => `<li>${s.timestamp} - ${s.quantity} units of ${s.medicine} (${s.source || 'Supplier'})</li>`).join('');
            break;
        case 'admin':
            const lowStockCount = Object.values(stock).filter(qty => qty < LOW_STOCK_THRESHOLD).length;
            document.getElementById('adminDashboard').innerHTML = `
                <div class="dashboard-metrics">
                    <div class="metric-card">
                        <h4>Total Users</h4>
                        <p>${users.length}</p>
                    </div>
                    <div class="metric-card">
                        <h4>Total Orders</h4>
                        <p>${orderHistory.length}</p>
                    </div>
                    <div class="metric-card">
                        <h4>Pending Deliveries</h4>
                        <p>${deliveries.filter(d => d.status !== 'Delivered').length}</p>
                    </div>
                    <div class="metric-card">
                        <h4>Low Stock Items</h4>
                        <p>${lowStockCount}</p>
                    </div>
                </div>
            `;
            break;
        case 'admin-users':
            document.getElementById('userList').innerHTML = users.map(u => `
                <li>
                    ${u.username} (${u.role})
                    ${u.role !== 'admin' ? `<button class="remove-btn" onclick="removeUser('${u.username}')">Remove</button>` : ''}
                </li>
            `).join('');
            break;
        case 'admin-orders':
            document.getElementById('adminOrderList').innerHTML = orderHistory.map(o => `<li>${o.timestamp} - ${o.username}: ${o.quantity} x ${o.medicine} (${o.payment})</li>`).join('');
            break;
        case 'admin-prescriptions':
            document.getElementById('adminPrescriptionList').innerHTML = prescriptions.map(p => `<li>${p.timestamp} - ${p.dosage}mg ${p.medicine} for ${p.patient}</li>`).join('');
            break;
        case 'admin-deliveries':
            document.getElementById('adminDeliveryList').innerHTML = deliveries.map(d => `<li>${d.order} - ${d.status} (by ${d.username})</li>`).join('');
            break;
        case 'admin-stock':
            document.getElementById('adminStockList').innerHTML = Object.entries(stock).map(([med, qty]) => {
                const lowStock = qty < LOW_STOCK_THRESHOLD ? ' (Low Stock!)' : '';
                return `<li class="${qty < LOW_STOCK_THRESHOLD ? 'low-stock' : ''}">${med}: ${qty} units${lowStock}</li>`;
            }).join('');
            break;
        case 'admin-supplies':
            document.getElementById('adminSupplyList').innerHTML = supplies.map(s => `<li>${s.timestamp} - ${s.quantity} units of ${s.medicine} (${s.source || 'Supplier'})</li>`).join('');
            break;
    }
}

function handlePrescription(e) {
    e.preventDefault();
    const patient = document.getElementById('patientName').value.trim();
    const medicine = document.getElementById('prescriptionMedicine').value.trim();
    const dosage = parseInt(document.getElementById('dosage').value);
    const result = document.getElementById('prescriptionResult');

    if (!patient || !medicine || !dosage || dosage < 1) {
        result.textContent = 'Please fill all fields correctly!';
        result.style.color = '#e74c3c';
        return;
    }

    if (stock[medicine] && stock[medicine] > 0) {
        prescriptions.push({ patient, medicine, dosage, timestamp: new Date().toLocaleString() });
        localStorage.setItem('prescriptions', JSON.stringify(prescriptions));
        result.textContent = `Prescribed ${dosage}mg of ${medicine} to ${patient}!`;
        result.style.color = '#00c4b4';
        updateSectionContent('doctor');
        document.getElementById('prescriptionForm').reset();
    } else {
        result.textContent = `${medicine} is out of stock!`;
        result.style.color = '#e74c3c';
    }
}

function updateDelivery() {
    const order = document.getElementById('orderSelect').value;
    const status = document.getElementById('deliveryStatus').value;
    const result = document.getElementById('deliveryResult');
    const delivery = deliveries.find(d => d.order === order);

    if (delivery) {
        delivery.status = status;
        localStorage.setItem('deliveries', JSON.stringify(deliveries));
        result.textContent = `Updated ${order} to ${status}!`;
        result.style.color = '#00c4b4';
        updateSectionContent('delivery');
    } else {
        result.textContent = 'Invalid order selected!';
        result.style.color = '#e74c3c';
    }
}

function handleSupply(e) {
    e.preventDefault();
    const medicine = document.getElementById('supplyMedicine').value.trim();
    const quantity = parseInt(document.getElementById('supplyQuantity').value);
    const result = document.getElementById('supplyResult');

    if (!medicine || !quantity || quantity < 1) {
        result.textContent = 'Please enter valid medicine and quantity!';
        result.style.color = '#e74c3c';
        return;
    }

    stock[medicine] = (stock[medicine] || 0) + quantity;
    localStorage.setItem('stock', JSON.stringify(stock));
    supplies.push({ medicine, quantity, timestamp: new Date().toLocaleString(), source: 'Supplier' });
    localStorage.setItem('supplies', JSON.stringify(supplies));
    result.textContent = `Supplied ${quantity} units of ${medicine}!`;
    result.style.color = '#00c4b4';
    updateSectionContent('supplier');
    updateSectionContent('patient-stock');
    document.getElementById('supplyForm').reset();
}

function setupEventListeners() {
    const forms = {
        purchaseForm: handlePurchase,
        prescriptionForm: handlePrescription,
        supplyForm: handleSupply,
        userForm: handleUserAdd,
        restockForm: handleRestock,
        paymentForm: savePaymentMethod
    };
    Object.entries(forms).forEach(([id, handler]) => {
        const form = document.getElementById(id);
        if (form) {
            form.removeEventListener('submit', handler);
            form.addEventListener('submit', handler);
        }
    });
}

window.onload = () => {
    setupEventListeners();
    const user = localStorage.getItem('currentUser');
    if (user) {
        const parsedUser = JSON.parse(user);
        document.getElementById('welcomeMessage').textContent = `Welcome, ${parsedUser.username} (${parsedUser.role})!`;
        showSection('container');
    } else {
        showSection('register');
    }
};
