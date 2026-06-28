// Mock Database using localStorage for Mama's Crafts - translated to English with Stock, Orders & Chats

const INITIAL_USERS = [
  {
    id: "admin",
    email: "admin@mamascrafts.com",
    password: "admin123",
    role: "admin",
    name: "Admin",
    bio: "Platform Administrator for Mama's Crafts.",
    tags: "Moderation, Support",
    profileImage: "/assets/admin_avatar.jpg",
    requestSellerStatus: false
  },
  {
    id: "luna_mama",
    email: "luna@mamascrafts.com",
    password: "luna123",
    role: "seller",
    name: "Luna Mama",
    bio: "Lover of stars, moons, and sunsets. I create celestial art and guide our spiritual journeys through handmade dreamcatchers, moon hangings, and cosmic room decor.",
    tags: "Astrology, Moon Magic, Intuition",
    profileImage: "/assets/luna_mama.jpg",
    requestSellerStatus: false
  },
  {
    id: "bloom_mama",
    email: "bloom@mamascrafts.com",
    password: "bloom123",
    role: "seller",
    name: "Bloom Mama",
    bio: "Mushroom enthusiast and free spirit. I craft whimsical, magical home decor filled with colors, joy, and childlike wonder, perfect for fairy gardens or cozy nursery rooms.",
    tags: "Mushrooms, Flowers, Creativity",
    profileImage: "/assets/bloom_mama.jpg",
    requestSellerStatus: false
  },
  {
    id: "earth_mama",
    email: "earth@mamascrafts.com",
    password: "earth123",
    role: "seller",
    name: "Earth Mama",
    bio: "Plant whisperer and healer. I create organic craft items with crystals, stones, dried plants, and clay, passing on the warmth of nature and cozy bohemian vibes.",
    tags: "Plants, Stones, Healing",
    profileImage: "/assets/earth_mama.jpg",
    requestSellerStatus: false
  }
];

const INITIAL_PRODUCTS = [
  {
    id: "prod_1",
    name: "Moon Wall Hanging",
    price: 45,
    description: "A gorgeous handmade macrame crescent moon wall hanging featuring delicate crystal beads and hanging feathers. Brings cosmic vibes and peace to any bedroom or nursery.",
    category: "Wall Decor",
    imageUrl: "/assets/moon_hanging.jpg",
    sellerId: "luna_mama",
    sellerName: "Luna Mama",
    status: "approved",
    stock: 3 // preseeded stock
  },
  {
    id: "prod_2",
    name: "Magic Mushroom Decor",
    price: 38,
    description: "Hand-sculpted clay forest mushrooms adorned with soft natural moss and subtle gold glitter. The perfect whimsical addition to your fairy garden or bookshelf.",
    category: "Home Decor",
    imageUrl: "/assets/mushroom_decor.jpg",
    sellerId: "bloom_mama",
    sellerName: "Bloom Mama",
    status: "approved",
    stock: 5 // preseeded stock
  },
  {
    id: "prod_3",
    name: "Healing Stone Set",
    price: 28,
    description: "A curated set of 5 hand-selected raw crystals (amethyst, rose quartz, tiger's eye, clear quartz, and lapis lazuli) for meditation and relaxation. Comes in a soft velvet pouch with a guide card.",
    category: "Crystals & Stones",
    imageUrl: "/assets/stone_set.jpg",
    sellerId: "earth_mama",
    sellerName: "Earth Mama",
    status: "approved",
    stock: 2 // preseeded stock
  },
  {
    id: "prod_4",
    name: "Botanical Art Print",
    price: 22,
    description: "Original linocut print featuring forest ferns and wild foliage, printed on thick, premium handmade organic paper.",
    category: "Posters & Prints",
    imageUrl: "/assets/botanical_print.jpg",
    sellerId: "bloom_mama",
    sellerName: "Bloom Mama",
    status: "approved",
    stock: 10 // preseeded stock
  },
  {
    id: "prod_5",
    name: "Mama Ritual Candle",
    price: 26,
    description: "Hand-poured natural soy wax candle in an amber glass jar, decorated with real lavender buds, chamomile, and amethyst crystal chips. Calming lavender and vanilla scent.",
    category: "Candles",
    imageUrl: "/assets/ritual_candle.jpg",
    sellerId: "earth_mama",
    sellerName: "Earth Mama",
    status: "approved",
    stock: 1 // low stock to test going out of stock!
  }
];

// LocalStorage helpers
export const initDb = () => {
  if (!localStorage.getItem("mamas_users")) {
    localStorage.setItem("mamas_users", JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem("mamas_products")) {
    localStorage.setItem("mamas_products", JSON.stringify(INITIAL_PRODUCTS));
  }
  if (!localStorage.getItem("mamas_orders")) {
    localStorage.setItem("mamas_orders", JSON.stringify([]));
  }
  if (!localStorage.getItem("mamas_chats")) {
    localStorage.setItem("mamas_chats", JSON.stringify([]));
  }
};

export const getUsers = () => {
  initDb();
  return JSON.parse(localStorage.getItem("mamas_users"));
};

export const saveUsers = (users) => {
  localStorage.setItem("mamas_users", JSON.stringify(users));
};

export const getProducts = () => {
  initDb();
  return JSON.parse(localStorage.getItem("mamas_products"));
};

export const saveProducts = (products) => {
  localStorage.setItem("mamas_products", JSON.stringify(products));
};

// Orders database helpers
export const getOrders = () => {
  initDb();
  return JSON.parse(localStorage.getItem("mamas_orders"));
};

export const saveOrders = (orders) => {
  localStorage.setItem("mamas_orders", JSON.stringify(orders));
};

// Place Order and deduct stock
export const placeOrder = (customerId, customerName, address, phone, items) => {
  const products = getProducts();

  // Verify and deduct stock
  items.forEach(item => {
    const pIdx = products.findIndex(p => p.id === item.id);
    if (pIdx !== -1) {
      if (products[pIdx].stock <= 0) {
        throw new Error(`Product "${products[pIdx].name}" is out of stock!`);
      }
      products[pIdx].stock -= 1;
    }
  });

  saveProducts(products);

  // Save the order
  const orders = getOrders();
  const newOrder = {
    id: "ord_" + Date.now() + Math.floor(Math.random() * 100),
    customerId: customerId || "guest",
    customerName,
    shippingAddress: address,
    phone,
    date: new Date().toISOString(),
    items: items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      sellerId: item.sellerId,
      imageUrl: item.imageUrl
    })),
    total: items.reduce((sum, item) => sum + item.price, 0),
    status: "Pending" // 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled'
  };

  orders.unshift(newOrder); // Add to the top
  saveOrders(orders);
  return newOrder;
};

export const updateOrderStatus = (orderId, newStatus) => {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    orders[idx].status = newStatus;
    saveOrders(orders);
    return orders[idx];
  }
  throw new Error("Order not found.");
};

// Auth Actions
export const loginUser = (email, password) => {
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) throw new Error("Invalid email or password.");
  return user;
};

export const registerUser = (name, email, password, requestSeller = false) => {
  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("A user with this email already exists.");
  }
  const newUser = {
    id: "user_" + Date.now(),
    email: email,
    password: password,
    role: "customer", // default
    name: name,
    bio: "New mama on the platform. Loving handmade crafts!",
    tags: "Newcomer",
    profileImage: "/assets/default_avatar.jpg",
    requestSellerStatus: requestSeller
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
};

// Seller Actions
export const updateSellerBio = (userId, bioData) => {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...bioData };
    saveUsers(users);
    // update sellerName in products to match new name
    if (bioData.name) {
      const products = getProducts();
      const updatedProducts = products.map(p => {
        if (p.sellerId === userId) {
          return { ...p, sellerName: bioData.name };
        }
        return p;
      });
      saveProducts(updatedProducts);
    }
    return users[idx];
  }
  throw new Error("User not found.");
};

export const addProduct = (productData) => {
  const products = getProducts();
  const newProduct = {
    id: "prod_" + Date.now(),
    name: productData.name,
    price: parseFloat(productData.price) || 0,
    description: productData.description,
    category: productData.category,
    imageUrl: productData.imageUrl || "/assets/placeholder_product.jpg",
    sellerId: productData.sellerId,
    sellerName: productData.sellerName,
    status: "pending", // requires admin approval
    stock: parseInt(productData.stock) >= 0 ? parseInt(productData.stock) : 5
  };
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
};

// Admin Actions
export const approveSeller = (userId) => {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    users[idx].role = "seller";
    users[idx].requestSellerStatus = false;
    // Set default avatar if it is the default
    if (users[idx].profileImage === "/assets/default_avatar.jpg") {
      users[idx].profileImage = "/assets/default_seller.jpg";
    }
    saveUsers(users);
    return users[idx];
  }
  throw new Error("User not found.");
};

export const rejectSellerRequest = (userId) => {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    users[idx].requestSellerStatus = false;
    saveUsers(users);
    return users[idx];
  }
  throw new Error("User not found.");
};

export const changeUserRole = (userId, newRole) => {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    users[idx].role = newRole;
    if (newRole === "seller" && users[idx].profileImage === "/assets/default_avatar.jpg") {
      users[idx].profileImage = "/assets/default_seller.jpg";
    }
    saveUsers(users);
    return users[idx];
  }
  throw new Error("User not found.");
};

export const approveProduct = (productId) => {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === productId);
  if (idx !== -1) {
    products[idx].status = "approved";
    saveProducts(products);
    return products[idx];
  }
  throw new Error("Product not found.");
};

export const rejectProduct = (productId) => {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === productId);
  if (idx !== -1) {
    products[idx].status = "rejected";
    saveProducts(products);
    return products[idx];
  }
  throw new Error("Product not found.");
};

// Chats database helpers
export const getChats = () => {
  initDb();
  return JSON.parse(localStorage.getItem("mamas_chats")) || [];
};

export const saveChats = (chats) => {
  localStorage.setItem("mamas_chats", JSON.stringify(chats));
};

export const getOrCreateThread = (user1Id, user2Id, name1, name2) => {
  const chats = getChats();
  const sortedIds = [user1Id, user2Id].sort();
  const threadId = `${sortedIds[0]}_${sortedIds[1]}`;

  let thread = chats.find(c => c.id === threadId);
  if (!thread) {
    thread = {
      id: threadId,
      participants: [user1Id, user2Id],
      participantNames: {
        [user1Id]: name1,
        [user2Id]: name2
      },
      messages: []
    };
    chats.push(thread);
    saveChats(chats);
  }
  return thread;
};

export const sendMessage = (threadId, senderId, senderName, text) => {
  const chats = getChats();
  const idx = chats.findIndex(c => c.id === threadId);
  if (idx !== -1) {
    const newMessage = {
      id: "msg_" + Date.now() + Math.floor(Math.random() * 100),
      senderId,
      senderName,
      text,
      timestamp: new Date().toISOString()
    };
    chats[idx].messages.push(newMessage);
    saveChats(chats);
    return chats[idx];
  }
  throw new Error("Chat thread not found.");
};
