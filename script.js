document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const navCta = document.querySelector('.nav-cta');

  if (menuToggle && navLinks && navCta) {
    menuToggle.addEventListener('click', () => {
      navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
      navCta.style.display = navCta.style.display === 'inline-flex' ? 'none' : 'inline-flex';
      navLinks.style.flexDirection = 'column';
      navLinks.style.position = 'absolute';
      navLinks.style.top = '78px';
      navLinks.style.right = '1rem';
      navLinks.style.background = 'rgba(255,255,255,0.96)';
      navLinks.style.padding = '1rem';
      navLinks.style.borderRadius = '1rem';
      navLinks.style.boxShadow = '0 16px 32px rgba(0,0,0,0.08)';
      navLinks.style.gap = '0.75rem';
    });
  }

  const form = document.querySelector('.contact-card');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const button = form.querySelector('button');
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Thank you!';
        button.disabled = true;
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
          form.reset();
        }, 2000);
      }
    });
  }

  const loginTrigger = document.getElementById('loginTrigger');
  const userMenuWrapper = document.getElementById('userMenuWrapper');
  const userDropdown = document.getElementById('userDropdown');
  const logoutBtnHeader = document.getElementById('logoutBtnHeader');
  const authModal = document.getElementById('authModal');
  const closeAuth = document.querySelector('.close-auth');
  const authBackDrop = document.querySelector('.auth-backdrop');
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  const googleStatus = document.getElementById('googleStatus');
  const productButtons = document.querySelectorAll('.product-book-btn');

  const PROFILE_STORAGE_KEY = 'farmhouse_profile';
  const SELECTED_BOOKING_KEY = 'farmhouse_selected_booking';
  const BOOKINGS_STORAGE_KEY = 'farmhouse_bookings';

  const supabaseUrl = 'https://mkcvowaencdbcwqaphrk.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rY3Zvd2FlbmNkYmN3cWFwaHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MDM2NjQsImV4cCI6MjEwNzE3OTY2NH0.UOabb-FffbPVsyMPIvLSJfo7pCAZP-G6ag_DSaSZd9I';
  const useSupabase = supabaseUrl.includes('YOUR_PROJECT_REF') === false && supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY') === false;

  const supabase = useSupabase ? window.supabase.createClient(supabaseUrl, supabaseAnonKey) : null;

  function getSavedProfile(userId) {
    if (!userId) return {};

    try {
      return JSON.parse(localStorage.getItem(`${PROFILE_STORAGE_KEY}:${userId}`) || '{}');
    } catch (error) {
      return {};
    }
  }

  function saveProfile(userId, profile) {
    if (!userId) return;
    localStorage.setItem(`${PROFILE_STORAGE_KEY}:${userId}`, JSON.stringify(profile));
  }

  function setGoogleStatus(message, isError = false) {
    if (!googleStatus) return;
    googleStatus.textContent = message;
    googleStatus.style.color = isError ? '#b23a3a' : '#2e6f3a';
  }

  function updateLoginButton(userName) {
    if (!loginTrigger) return;

    if (userName) {
      const displayName = userName.length > 12 ? `${userName.slice(0, 12)}...` : userName;
      loginTrigger.textContent = displayName;
      loginTrigger.setAttribute('data-logged-in', 'true');
      loginTrigger.classList.add('logged-in');
      if (userMenuWrapper) userMenuWrapper.classList.add('logged-in');
      return;
    }

    loginTrigger.textContent = 'Login';
    loginTrigger.removeAttribute('data-logged-in');
    loginTrigger.classList.remove('logged-in');
    if (userMenuWrapper) userMenuWrapper.classList.remove('logged-in');
    if (userDropdown) {
      userDropdown.classList.add('hidden');
      userDropdown.setAttribute('aria-expanded', 'false');
      if (userMenuWrapper) userMenuWrapper.classList.remove('is-open');
    }
  }

  function toggleUserDropdown(forceOpen) {
    if (!userDropdown || !loginTrigger || !userMenuWrapper) return;
    const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : userDropdown.classList.contains('hidden');
    userDropdown.classList.toggle('hidden', !shouldOpen);
    userDropdown.setAttribute('aria-expanded', String(shouldOpen));
    loginTrigger.setAttribute('aria-expanded', String(shouldOpen));
    userMenuWrapper.classList.toggle('is-open', shouldOpen);
  }

  function openAuthModal() {
    if (!authModal) return;
    authModal.classList.remove('hidden');
    authModal.setAttribute('aria-hidden', 'false');
  }

  function closeAuthModal() {
    if (!authModal) return;
    authModal.classList.add('hidden');
    authModal.setAttribute('aria-hidden', 'true');
  }

  function displayUserFromSession(session) {
    const user = session?.user;
    if (!user) {
      updateLoginButton('');
      return;
    }

    const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User';
    updateLoginButton(displayName);
    closeAuthModal();
  }

  async function handleSupabaseSignOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out failed:', error.message);
    }

    localStorage.removeItem(SELECTED_BOOKING_KEY);
    updateLoginButton('');

    if (window.location.pathname.endsWith('profile.html')) {
      window.location.href = 'index.html';
    }
  }

  async function handleGoogleLogin() {
    if (!supabase) {
      setGoogleStatus('Google login is not configured yet. Add your Supabase project URL and anon key.', true);
      return;
    }

    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const redirectTo = `${window.location.origin}/${currentPath}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.error('Google sign-in error:', error.message);
      setGoogleStatus(error.message || 'Google sign-in failed.', true);
    }
  }

  productButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedProduct = button.dataset.product || 'Farm product';
      const isLoggedIn = loginTrigger?.getAttribute('data-logged-in') === 'true';

      if (!isLoggedIn) {
        openAuthModal();
        return;
      }

      localStorage.setItem(SELECTED_BOOKING_KEY, selectedProduct);
      window.location.href = 'profile.html';
    });
  });

  loginTrigger?.addEventListener('click', async (event) => {
    event.preventDefault();
    const isLoggedIn = loginTrigger.getAttribute('data-logged-in') === 'true';

    if (isLoggedIn) {
      toggleUserDropdown();
      return;
    }

    openAuthModal();
  });

  document.addEventListener('click', (event) => {
    if (!userMenuWrapper) return;
    const clickedInsideMenu = userMenuWrapper.contains(event.target);
    if (!clickedInsideMenu) {
      toggleUserDropdown(false);
    }
  });

  closeAuth?.addEventListener('click', closeAuthModal);
  authBackDrop?.addEventListener('click', closeAuthModal);

  googleLoginBtn?.addEventListener('click', handleGoogleLogin);

  logoutBtnHeader?.addEventListener('click', async () => {
    toggleUserDropdown(false);
    await handleSupabaseSignOut();
  });

  if (supabase) {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        displayUserFromSession(session);
      }

      if (event === 'SIGNED_OUT') {
        updateLoginButton('');
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      const session = data?.session;
      if (session) {
        displayUserFromSession(session);
      } else {
        updateLoginButton('');
      }
    });
  }

  const profileForm = document.getElementById('profileForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const googleNameField = document.getElementById('googleFullName');
  const googleEmailField = document.getElementById('googleEmail');
  const googleAvatar = document.getElementById('profileAvatar');
  const profileStatus = document.getElementById('profileStatus');
  const bookingSelection = document.getElementById('selectedProduct');

  async function loadProfileFromSupabase(user) {
    if (!supabase || !user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Failed to load profile from Supabase:', error.message);
      return null;
    }

    return data;
  }

  async function saveProfileToSupabase(profileData) {
    if (!supabase) {
      return;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('No active user session for Supabase profile save.', userError?.message || 'Unknown error');
      return;
    }

    const payload = {
      id: user.id,
      user_id: user.id,
      google_name: profileData.googleName || '',
      google_email: profileData.googleEmail || '',
      google_avatar: profileData.googleAvatar || '',
      phone: profileData.phone || '',
      address: profileData.address || '',
      city: profileData.city || '',
      state: profileData.state || '',
      pincode: profileData.pincode || '',
      notes: profileData.notes || '',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Supabase profile save failed:', error.message);
      saveProfile(user.id, profileData);
      return;
    }

    saveProfile(user.id, profileData);
  }

  function populateProfilePage(user, savedProfile = null) {
    if (!profileForm) return;

    const data = savedProfile || getSavedProfile(user?.id);
    const nameValue = user?.user_metadata?.full_name || user?.user_metadata?.name || data.googleName || 'Google user';
    const emailValue = user?.email || data.googleEmail || '';
    const avatarUrl = user?.user_metadata?.avatar_url || data.googleAvatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80';

    if (googleNameField) googleNameField.value = nameValue;
    if (googleEmailField) googleEmailField.value = emailValue;
    if (googleAvatar) googleAvatar.src = avatarUrl;

    const profilePhone = document.getElementById('profilePhone');
    const profileAddress = document.getElementById('profileAddress');
    const profileCity = document.getElementById('profileCity');
    const profileState = document.getElementById('profileState');
    const profilePincode = document.getElementById('profilePincode');
    const profileNotes = document.getElementById('profileNotes');

    if (profilePhone) profilePhone.value = data.phone || '';
    if (profileAddress) profileAddress.value = data.address || '';
    if (profileCity) profileCity.value = data.city || '';
    if (profileState) profileState.value = data.state || '';
    if (profilePincode) profilePincode.value = data.pincode || '';
    if (profileNotes) profileNotes.value = data.notes || '';

    if (bookingSelection) {
      const selectedBooking = localStorage.getItem(SELECTED_BOOKING_KEY) || 'Farm product';
      bookingSelection.textContent = `Selected booking: ${selectedBooking}`;
    }
  }

  async function syncProfilePage() {
    if (!profileForm) return;

    if (!supabase) {
      if (profileStatus) {
        profileStatus.textContent = 'Google authentication is not configured yet.';
      }
      return;
    }

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      if (profileStatus) {
        profileStatus.textContent = 'Please sign in with Google to access your profile.';
      }
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1200);
      return;
    }

    const savedProfile = getSavedProfile(user.id);
    const dbProfile = await loadProfileFromSupabase(user);
    const profileData = {
      googleName: user.user_metadata?.full_name || user.user_metadata?.name || dbProfile?.google_name || savedProfile.googleName || 'Google user',
      googleEmail: user.email || dbProfile?.google_email || savedProfile.googleEmail || '',
      googleAvatar: user.user_metadata?.avatar_url || dbProfile?.google_avatar || savedProfile.googleAvatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      phone: dbProfile?.phone || savedProfile.phone || '',
      address: dbProfile?.address || savedProfile.address || '',
      city: dbProfile?.city || savedProfile.city || '',
      state: dbProfile?.state || savedProfile.state || '',
      pincode: dbProfile?.pincode || savedProfile.pincode || '',
      notes: dbProfile?.notes || savedProfile.notes || '',
    };

    saveProfile(user.id, {
      ...savedProfile,
      ...profileData,
    });

    populateProfilePage(user, profileData);
  }

  profileForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = {
      googleName: googleNameField?.value || '',
      googleEmail: googleEmailField?.value || '',
      googleAvatar: googleAvatar?.src || '',
      phone: document.getElementById('profilePhone')?.value || '',
      address: document.getElementById('profileAddress')?.value || '',
      city: document.getElementById('profileCity')?.value || '',
      state: document.getElementById('profileState')?.value || '',
      pincode: document.getElementById('profilePincode')?.value || '',
      notes: document.getElementById('profileNotes')?.value || '',
    };

    await saveProfileToSupabase(formData);

    if (profileStatus) {
      profileStatus.textContent = 'Profile saved successfully.';
      profileStatus.style.color = '#2e6f3a';
    }
  });

  logoutBtn?.addEventListener('click', async () => {
    await handleSupabaseSignOut();
  });

  if (window.location.pathname.endsWith('profile.html')) {
    syncProfilePage();
  }
});
