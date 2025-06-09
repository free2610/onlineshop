// Backend API URL (Render yoki Heroku’dan olinadi)
const API_URL = `http://localhost:5000/api/auth/${isRegister ? 'register' : 'login'}`;

// Ma'lumotlarni localStorage dan olish faqat currentUser uchun
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let map, marker;

// Ma'lumotlarni localStorage ga saqlash (faqat savat uchun)
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Tablar logikasi
function showLogin() {
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("registerForm").style.display = "none";
  document.querySelectorAll(".tab")[0].classList.add("active");
  document.querySelectorAll(".tab")[1].classList.remove("active");
}
function showRegister() {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "block";
  document.querySelectorAll(".tab")[0].classList.remove("active");
  document.querySelectorAll(".tab")[1].classList.add("active");
}

// Menu logikasi
function toggleMenu() {
  const menu = document.getElementById("dropdownMenu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

// Sozlash modalini ochish
function openSettings() {
  const modal = document.getElementById("settingsModal");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  document.getElementById("settingsUsername").value = currentUser.username;
  document.getElementById("settingsPassword").value = currentUser.password;
  modal.style.display = "flex";
  toggleMenu();
}

// Sozlash modalini yopish
function closeSettings() {
  document.getElementById("settingsModal").style.display = "none";
}

// Manzil qidirish va geokodlash
async function searchAddress(query) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
    const data = await response.json();
    if (data.length > 0) {
      const { lat, lon } = data[0];
      map.setView([lat, lon], 13);
      if (marker) marker.setLatLng([lat, lon]);
      else marker = L.marker([lat, lon], { draggable: true }).addTo(map);
    }
  } catch (error) {
    console.error("Manzil qidirishda xato:", error);
  }
}

// Teskari geokodlash
async function getAddress(lat, lng) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
    const data = await response.json();
    return data.display_name || "Noma'lum manzil";
  } catch (error) {
    console.error("Teskari geokodlashda xato:", error);
    return "Noma'lum manzil";
  }
}

// DOM yuklanganda
document.addEventListener("DOMContentLoaded", () => {
  // Foydalanuvchi rasmini ko'rsatish
  const userImage = document.getElementById("userImage");
  if (userImage) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser && currentUser.image) {
      userImage.src = currentUser.image;
    }
  }

  // Login logikasi
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const userType = document.getElementById("userType").value;
      const errorMessage = document.getElementById("errorMessage");

      try {
        const response = await fetch(`${API_URL}/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, type: userType })
        });
        const user = await response.json();
        if (response.ok) {
          errorMessage.style.display = "none";
          localStorage.setItem("currentUser", JSON.stringify(user));
          window.location.href = user.type === "admin" ? "admin.html" : "user.html";
        } else {
          errorMessage.textContent = user.message || "Noto'g'ri foydalanuvchi nomi yoki parol!";
          errorMessage.style.display = "block";
        }
      } catch (error) {
        errorMessage.textContent = "Server xatosi!";
        errorMessage.style.display = "block";
      }
    });
  }

  // Ro'yxatdan o'tish logikasi
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = document.getElementById("regUsername").value;
      const password = document.getElementById("regPassword").value;
      const imageInput = document.getElementById("regImage");
      const errorMessage = document.getElementById("errorMessage");
      const successMessage = document.getElementById("successMessage");

      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);
      formData.append("type", "user");
      if (imageInput.files[0]) {
        formData.append("image", imageInput.files[0]);
      }

      try {
        const response = await fetch(`${API_URL}/users`, {
          method: "POST",
          body: formData
        });
        if (response.ok) {
          errorMessage.style.display = "none";
          successMessage.style.display = "block";
          registerForm.reset();
        } else {
          const data = await response.json();
          errorMessage.textContent = data.message || "Xatolik yuz berdi!";
          errorMessage.style.display = "block";
          successMessage.style.display = "none";
        }
      } catch (error) {
        errorMessage.textContent = "Server xatosi!";
        errorMessage.style.display = "block";
      }
    });
  }

  // Sozlash logikasi
  const settingsForm = document.getElementById("settingsForm");
  if (settingsForm) {
    settingsForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = document.getElementById("settingsUsername").value;
      const password = document.getElementById("settingsPassword").value;
      const imageInput = document.getElementById("settingsImage");
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));

      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);
      if (imageInput.files[0]) {
        formData.append("image", imageInput.files[0]);
      }

      try {
        const response = await fetch(`${API_URL}/users/${currentUser._id}`, {
          method: "PUT",
          body: formData
        });
        const updatedUser = await response.json();
        if (response.ok) {
          localStorage.setItem("currentUser", JSON.stringify(updatedUser));
          document.getElementById("userImage").src = updatedUser.image;
          closeSettings();
        }
      } catch (error) {
        console.error("Sozlashda xato:", error);
      }
    });
  }

  // Foydalanuvchi sahifasi logikasi
  const productList = document.getElementById("productList");
  const cartList = document.getElementById("cartList");
  const sellForm = document.getElementById("sellForm");
  const orderButton = document.getElementById("orderButton");
  const addressSearch = document.getElementById("addressSearch");
  const myOrders = document.getElementById("myOrders");
  if (productList) {
    renderProducts();
  }
  if (sellForm) {
    sellForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = document.getElementById("productName").value;
      const price = parseInt(document.getElementById("productPrice").value);
      const quantity = parseInt(document.getElementById("productQuantity").value);
      const description = document.getElementById("productDescription").value;
      const imageInput = document.getElementById("productImage");

      const formData = new FormData();
      formData.append("name", name);
      formData.append("price", price);
      formData.append("quantity", quantity);
      formData.append("description", description);
      if (imageInput.files[0]) {
        formData.append("image", imageInput.files[0]);
      }

      try {
        await fetch(`${API_URL}/products`, {
          method: "POST",
          body: formData
        });
        renderProducts();
        sellForm.reset();
      } catch (error) {
        console.error("Mahsulot qo'shishda xato:", error);
      }
    });
  }
  if (cartList) {
    renderCart();
  }
  if (orderButton) {
    orderButton.addEventListener("click", () => {
      document.getElementById("orderForm").style.display = "block";
      initMap();
    });
  }
  if (addressSearch) {
    addressSearch.addEventListener("input", (event) => {
      const query = event.target.value;
      if (query.length > 3) {
        searchAddress(query);
      }
    });
  }
  if (myOrders) {
    renderUserOrders();
  }

  // Xarita logikasi
  function initMap() {
    if (map) map.remove();
    map = L.map("map").setView([41.2995, 69.2401], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);
    marker = L.marker([41.2995, 69.2401], { draggable: true }).addTo(map);
    map.on("click", (e) => {
      if (marker) marker.setLatLng(e.latlng);
      else marker = L.marker(e.latlng, { draggable: true }).addTo(map);
    });
  }

  // Buyurtmani tasdiqlash (foydalanuvchi)
  window.confirmOrder = async function() {
    const phoneNumber = document.getElementById("phoneNumber").value;
    const addressSearch = document.getElementById("addressSearch").value;
    if (!phoneNumber || !marker) return;

    for (let item of cart) {
      const response = await fetch(`${API_URL}/products/${item._id}`);
      const product = await response.json();
      if (!product || product.quantity <= 0) {
        alert(`${item.name} mahsuloti zahirada mavjud emas!`);
        return;
      }
    }

    const location = marker.getLatLng();
    const address = addressSearch || await getAddress(location.lat, location.lng);
    const order = {
      user: JSON.parse(localStorage.getItem("currentUser"))._id,
      items: cart.map(item => ({ productId: item._id, orderQuantity: item.orderQuantity })),
      phoneNumber,
      location: { lat: location.lat, lng: location.lng },
      address,
      status: "pending",
      date: new Date().toISOString()
    };

    try {
      await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order)
      });
      cart = [];
      saveCart();
      renderCart();
      renderUserOrders();
      document.getElementById("orderForm").style.display = "none";
      document.getElementById("orderMessage").style.display = "block";
      setTimeout(() => document.getElementById("orderMessage").style.display = "none", 3000);
    } catch (error) {
      console.error("Buyurtma yuborishda xato:", error);
    }
  };

  // Admin sahifasi logikasi
  const addProductForm = document.getElementById("addProductForm");
  const adminProductList = document.getElementById("adminProductList");
  const userList = document.getElementById("userList");
  const orderList = document.getElementById("orderList");
  if (addProductForm) {
    addProductForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = document.getElementById("adminProductName").value;
      const price = parseInt(document.getElementById("adminProductPrice").value);
      const quantity = parseInt(document.getElementById("adminProductQuantity").value);
      const description = document.getElementById("adminProductDescription").value;
      const imageInput = document.getElementById("adminProductImage");

      const formData = new FormData();
      formData.append("name", name);
      formData.append("price", price);
      formData.append("quantity", quantity);
      formData.append("description", description);
      if (imageInput.files[0]) {
        formData.append("image", imageInput.files[0]);
      }

      try {
        await fetch(`${API_URL}/products`, {
          method: "POST",
          body: formData
        });
        renderAdminProducts();
        addProductForm.reset();
      } catch (error) {
        console.error("Mahsulot qo'shishda xato:", error);
      }
    });
  }
  if (adminProductList) {
    renderAdminProducts();
  }
  if (userList) {
    renderUsers();
  }
  if (orderList) {
    renderOrders();
  }

  // Chiqish tugmasi
  const logout = document.getElementById("logout");
  if (logout) {
    logout.addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("cart");
      window.location.href = "index.html";
    });
  }
});

// Mahsulotlarni ko'rsatish
async function renderProducts() {
  const productList = document.getElementById("productList");
  productList.innerHTML = "";
  try {
    const response = await fetch(`${API_URL}/products`);
    const products = await response.json();
    products.forEach(product => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>Narxi: ${product.price.toLocaleString()} UZS</p>
        <p>Zahira: ${product.quantity} dona</p>
        <p>${product.description}</p>
        <button onclick="addToCart('${product._id}')" ${product.quantity <= 0 ? "disabled" : ""}>Savatga qo'shish</button>
      `;
      productList.appendChild(card);
    });
  } catch (error) {
    console.error("Mahsulotlarni yuklashda xato:", error);
  }
}

// Savatga qo'shish
async function addToCart(productId) {
  try {
    const response = await fetch(`${API_URL}/products/${productId}`);
    const product = await response.json();
    if (product.quantity <= 0) {
      alert("Bu mahsulot zahirada mavjud emas!");
      return;
    }
    cart.push({ ...product, orderQuantity: 1 });
    saveCart();
    renderCart();
  } catch (error) {
    console.error("Savatga qo'shishda xato:", error);
  }
}

// Savatni ko'rsatish
function renderCart() {
  const cartList = document.getElementById("cartList");
  const orderButton = document.getElementById("orderButton");
  cartList.innerHTML = "";
  cart.forEach((item, index) => {
    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";
    cartItem.innerHTML = `
      <span>${item.name} - ${item.price.toLocaleString()} UZS (Soni: ${item.orderQuantity})</span>
      <button onclick="removeFromCart(${index})">O'chirish</button>
    `;
    cartList.appendChild(cartItem);
  });
  orderButton.style.display = cart.length > 0 ? "block" : "none";
}

// Savatdan o'chirish
function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

// Admin mahsulotlarini ko'rsatish
async function renderAdminProducts() {
  const adminProductList = document.getElementById("adminProductList");
  adminProductList.innerHTML = "";
  try {
    const response = await fetch(`${API_URL}/products`);
    const products = await response.json();
    products.forEach(product => {
      const card = document.createElement("div");
      card.className = "cart-item";
      card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px;">
        <span>${product.name} - ${product.price.toLocaleString()} UZS - Zahira: ${product.quantity} - ${product.description}</span>
        <div>
          <button onclick="editProduct('${product._id}')">Tahrirlash</button>
          <button onclick="deleteProduct('${product._id}')">O'chirish</button>
        </div>
      `;
      adminProductList.appendChild(card);
    });
  } catch (error) {
    console.error("Mahsulotlarni yuklashda xato:", error);
  }
}

// Mahsulotni tahrirlash
async function editProduct(id) {
  try {
    const response = await fetch(`${API_URL}/products/${id}`);
    const product = await response.json();
    const name = prompt("Yangi nom:", product.name);
    const price = parseInt(prompt("Yangi narx:", product.price));
    const quantity = parseInt(prompt("Yangi zahira soni:", product.quantity));
    const description = prompt("Yangi tavsif:", product.description);
    if (name && price && quantity >= 0 && description) {
      await fetch(`${API_URL}/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price, quantity, description })
      });
      renderAdminProducts();
      renderProducts();
    }
  } catch (error) {
    console.error("Mahsulotni tahrirlashda xato:", error);
  }
}

// Mahsulotni o'chirish
async function deleteProduct(id) {
  try {
    await fetch(`${API_URL}/products/${id}`, {
      method: "DELETE"
    });
    renderAdminProducts();
    renderProducts();
  } catch (error) {
    console.error("Mahsulotni o'chirishda xato:", error);
  }
}

// Foydalanuvchilarni ko'rsatish
async function renderUsers() {
  const userList = document.getElementById("userList");
  userList.innerHTML = "";
  try {
    const response = await fetch(`${API_URL}/users`);
    const users = await response.json();
    users.forEach((user, index) => {
      if (user.type !== "admin") {
        const userItem = document.createElement("div");
        userItem.className = "user-item";
        userItem.innerHTML = `
          <span>${user.username} (${user.type})</span>
          <div>
            <button onclick="editUser('${user._id}')">Tahrirlash</button>
            <button onclick="deleteUser('${user._id}')">O'chirish</button>
          </div>
        `;
        userList.appendChild(userItem);
      }
    });
  } catch (error) {
    console.error("Foydalanuvchilarni yuklashda xato:", error);
  }
}

// Foydalanuvchini tahrirlash
async function editUser(id) {
  try {
    const response = await fetch(`${API_URL}/users/${id}`);
    const user = await response.json();
    const username = prompt("Yangi foydalanuvchi nomi:", user.username);
    const password = prompt("Yangi parol:", user.password);
    if (username && password) {
      await fetch(`${API_URL}/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      renderUsers();
    }
  } catch (error) {
    console.error("Foydalanuvchini tahrirlashda xato:", error);
  }
}

// Foydalanuvchini o'chirish
async function deleteUser(id) {
  try {
    await fetch(`${API_URL}/users/${id}`, {
      method: "DELETE"
    });
    renderUsers();
  } catch (error) {
    console.error("Foydalanuvchini o'chirishda xato:", error);
  }
}

// Buyurtmalarni ko'rsatish (admin)
async function renderOrders() {
  const orderList = document.getElementById("orderList");
  orderList.innerHTML = "";
  try {
    const response = await fetch(`${API_URL}/orders`);
    const orders = await response.json();
    orders.forEach(order => {
      const items = order.items.map(item => `${item.productId.name} (${item.orderQuantity} dona)`).join(", ");
      const orderItem = document.createElement("div");
      orderItem.className = "order-item";
      orderItem.innerHTML = `
        <span>Foydalanuvchi: ${order.user.username}, Mahsulotlar: ${items}, Telefon: ${order.phoneNumber}, Manzil: ${order.address}, Holat: ${order.status === "pending" ? "Kutilmoqda" : "Tasdiqlangan"}</span>
        <button onclick="confirmAdminOrder('${order._id}')" ${order.status === "confirmed" ? "disabled" : ""}>Tasdiqlash</button>
      `;
      orderList.appendChild(orderItem);
    });
  } catch (error) {
    console.error("Buyurtmalarni yuklashda xato:", error);
  }
}

// Admin buyurtmani tasdiqlash
window.confirmAdminOrder = async function(id) {
  try {
    const response = await fetch(`${API_URL}/orders/${id}`);
    const order = await response.json();
    for (let item of order.items) {
      const productResponse = await fetch(`${API_URL}/products/${item.productId}`);
      const product = await productResponse.json();
      if (product) {
        const newQuantity = product.quantity - item.orderQuantity;
        if (newQuantity <= 0) {
          await fetch(`${API_URL}/products/${product._id}`, { method: "DELETE" });
        } else {
          await fetch(`${API_URL}/products/${product._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: newQuantity })
          });
        }
      }
    }
    await fetch(`${API_URL}/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "confirmed" })
    });
    renderOrders();
    renderUserOrders();
    renderProducts();
    renderAdminProducts();
  } catch (error) {
    console.error("Buyurtmani tasdiqlashda xato:", error);
  }
};

// Foydalanuvchi buyurtmalarini ko'rsatish
async function renderUserOrders() {
  const myOrders = document.getElementById("myOrders");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!myOrders || !currentUser) return;
  myOrders.innerHTML = "";
  try {
    const response = await fetch(`${API_URL}/orders?user=${currentUser._id}`);
    const orders = await response.json();
    orders.forEach(order => {
      const items = order.items.map(item => `${item.productId.name} (${item.orderQuantity} dona)`).join(", ");
      const statusText = order.status === "pending" ? "Buyurtma berildi" : "Buyurtma keltirildi";
      const orderItem = document.createElement("div");
      orderItem.className = "order-item";
      orderItem.innerHTML = `
        <span>Mahsulotlar: ${items}, Telefon: ${order.phoneNumber}, Manzil: ${order.address}, Holat: ${statusText}</span>
      `;
      myOrders.appendChild(orderItem);
    });
  } catch (error) {
    console.error("Buyurtmalarni yuklashda xato:", error);
  }
}