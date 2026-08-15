// ─── db.js ────────────────────────────────────────────────────────────────────
// Replaces mockDb.js with real Supabase-backed async functions.
// All functions are async and return data / throw errors.
// ─────────────────────────────────────────────────────────────────────────────
import { supabase } from './supabase';

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Register a new user with email & password.
 * Supabase sends a confirmation email automatically.
 */
export const registerUser = async (name, email, password, requestSeller = false) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role: 'customer',
        request_seller_status: requestSeller,
      },
    },
  });
  if (error) throw new Error(error.message);

  // Create the profile row in public.profiles
  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name,
      email,
      role: 'customer',
      bio: 'New mama on the platform. Loving handmade crafts!',
      tags: 'Newcomer',
      profile_image_url: '/assets/default_avatar.jpg',
      request_seller_status: requestSeller,
    });
    if (profileError) throw new Error(profileError.message);
  }

  return data.user;
};

/**
 * Sign in with email & password.
 * Returns the profile object from public.profiles.
 */
export const loginUser = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  const profile = await getProfileById(data.user.id);
  return profile;
};

/**
 * Sign out the current user.
 */
export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
};

/**
 * Returns the currently authenticated Supabase session (or null).
 */
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

/**
 * Subscribe to auth state changes.
 * callback receives (event, session).
 */
export const onAuthStateChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
};

/**
 * Send a password reset email.
 */
export const resetPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw new Error(error.message);
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILES (Users)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get a single profile by user id.
 */
export const getProfileById = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

/**
 * Get all profiles (admin only — RLS must allow this).
 */
export const getUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

/**
 * Update a user's profile (bio, name, tags, profile_image_url).
 */
export const updateSellerBio = async (userId, bioData) => {
  const updates = {};
  if (bioData.name !== undefined) updates.name = bioData.name;
  if (bioData.bio !== undefined) updates.bio = bioData.bio;
  if (bioData.tags !== undefined) updates.tags = bioData.tags;
  if (bioData.profileImage !== undefined) updates.profile_image_url = bioData.profileImage;

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

/**
 * Admin: Approve a seller application.
 */
export const approveSeller = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'seller', request_seller_status: false })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

/**
 * Admin: Reject a seller application.
 */
export const rejectSellerRequest = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ request_seller_status: false })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

/**
 * Admin: Change a user's role.
 */
export const changeUserRole = async (userId, newRole) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

/**
 * Customer: Submit a request to become a seller.
 */
export const requestSellerStatus = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ request_seller_status: true })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch all products (for shop display — returns only approved ones publicly).
 */
export const getProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      seller:profiles!seller_id (
        id,
        name,
        profile_image_url
      )
    `)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  // Normalize for backwards compatibility with existing components
  return data.map(p => ({
    ...p,
    sellerId: p.seller_id,
    sellerName: p.seller?.name || 'Unknown Seller',
    imageUrl: p.image_url,
    profileImage: p.seller?.profile_image_url,
  }));
};

/**
 * Add a new product (seller action — image upload handled separately).
 */
export const addProduct = async (productData) => {
  const { data, error } = await supabase
    .from('products')
    .insert({
      seller_id: productData.sellerId,
      name: productData.name,
      description: productData.description,
      price: parseFloat(productData.price) || 0,
      category: productData.category,
      image_url: productData.imageUrl || '/assets/placeholder_product.jpg',
      stock: parseInt(productData.stock) >= 0 ? parseInt(productData.stock) : 5,
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

/**
 * Admin: Approve a product.
 */
export const approveProduct = async (productId) => {
  const { data, error } = await supabase
    .from('products')
    .update({ status: 'approved' })
    .eq('id', productId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

/**
 * Admin: Reject a product.
 */
export const rejectProduct = async (productId) => {
  const { data, error } = await supabase
    .from('products')
    .update({ status: 'rejected' })
    .eq('id', productId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch all orders. Admin sees all; seller sees their items; customer sees own orders.
 */
export const getOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items (
        *,
        product:products (name, image_url, category)
      ),
      customer:profiles!customer_id (name)
    `)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  // Normalize for backwards compatibility
  return data.map(order => ({
    ...order,
    customerId: order.customer_id,
    customerName: order.customer?.name || 'Guest',
    date: order.created_at,
    total: order.total_amount,
    shippingAddress: order.shipping_address,
    items: (order.items || []).map(item => ({
      ...item,
      id: item.product_id,
      sellerId: item.seller_id,
      name: item.product?.name || 'Product',
      imageUrl: item.product?.image_url || '',
      price: item.price_at_purchase,
    })),
  }));
};

/**
 * Place an order — deducts stock and creates order + order_items.
 */
export const placeOrder = async (customerId, customerName, address, phone, cartItems) => {
  // 1. Verify and deduct stock for each item
  for (const item of cartItems) {
    const { data: product, error: fetchErr } = await supabase
      .from('products')
      .select('stock, name')
      .eq('id', item.id)
      .single();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!product || product.stock <= 0) {
      throw new Error(`Product "${product?.name || item.name}" is out of stock!`);
    }
    const { error: stockErr } = await supabase
      .from('products')
      .update({ stock: product.stock - 1 })
      .eq('id', item.id);
    if (stockErr) throw new Error(stockErr.message);
  }

  // 2. Create the order
  const total = cartItems.reduce((sum, item) => sum + item.price, 0);
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      customer_id: customerId,
      status: 'pending',
      total_amount: total,
      shipping_address: address,
      phone,
    })
    .select()
    .single();
  if (orderErr) throw new Error(orderErr.message);

  // 3. Create order_items rows
  const orderItems = cartItems.map(item => ({
    order_id: order.id,
    product_id: item.id,
    seller_id: item.sellerId,
    quantity: 1,
    price_at_purchase: item.price,
  }));
  const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
  if (itemsErr) throw new Error(itemsErr.message);

  return order;
};

/**
 * Update an order's status (seller/admin action).
 */
export const updateOrderStatus = async (orderId, newStatus) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

// ═══════════════════════════════════════════════════════════════════════════════
// STORAGE — Image Upload
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Upload a product image to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export const uploadProductImage = async (file, sellerId) => {
  const ext = file.name.split('.').pop();
  const fileName = `${sellerId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
  return data.publicUrl;
};

/**
 * Upload a profile/avatar image.
 * Returns the public URL.
 */
export const uploadAvatarImage = async (file, userId) => {
  const ext = file.name.split('.').pop();
  const fileName = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { cacheControl: '3600', upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
  return data.publicUrl;
};

// ═══════════════════════════════════════════════════════════════════════════════
// CHAT — Realtime (Supabase Realtime Channels)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get or create a chat thread between two users.
 * Returns the thread object.
 */
export const getOrCreateThread = async (user1Id, user2Id) => {
  // Try to find existing thread
  const { data: existing } = await supabase
    .from('chat_threads')
    .select('*')
    .or(
      `and(customer_id.eq.${user1Id},seller_id.eq.${user2Id}),and(customer_id.eq.${user2Id},seller_id.eq.${user1Id})`
    )
    .maybeSingle();

  if (existing) return existing;

  // Create new thread
  const { data: newThread, error } = await supabase
    .from('chat_threads')
    .insert({ customer_id: user1Id, seller_id: user2Id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return newThread;
};

/**
 * Get all messages for a thread, ordered by time.
 */
export const getMessages = async (threadId) => {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!sender_id (name, profile_image_url)
    `)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data.map(m => ({
    ...m,
    senderId: m.sender_id,
    senderName: m.sender?.name || 'Unknown',
    text: m.content,
    timestamp: m.created_at,
  }));
};

/**
 * Send a message in a thread.
 */
export const sendMessage = async (threadId, senderId, content) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({ thread_id: threadId, sender_id: senderId, content })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

/**
 * Get all threads for a user (as customer or seller).
 */
export const getThreadsForUser = async (userId) => {
  const { data, error } = await supabase
    .from('chat_threads')
    .select(`
      *,
      customer:profiles!customer_id (id, name, profile_image_url),
      seller:profiles!seller_id (id, name, profile_image_url)
    `)
    .or(`customer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

/**
 * Subscribe to new messages in a thread using Supabase Realtime.
 * Returns the channel (call channel.unsubscribe() to clean up).
 */
export const subscribeToMessages = (threadId, onNewMessage) => {
  const channel = supabase
    .channel(`thread:${threadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => {
        onNewMessage(payload.new);
      }
    )
    .subscribe();

  return channel;
};

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO (kept from mockDb — no server needed)
// ═══════════════════════════════════════════════════════════════════════════════
export const playChime = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gainNode.gain.setValueAtTime(0, now + idx * 0.1);
      gainNode.gain.linearRampToValueAtTime(0.15, now + idx * 0.1 + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.4);
    });
  } catch (e) {
    console.error('Audio Context failed to play chime:', e);
  }
};
