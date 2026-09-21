/* ==========================================================================
   COMPRESSLY - CORE INTERACTION & CLIENT ENGINE
   UI/UX Pro Max Standard with Theme Engine & Single Photo Slider
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initThemeEngine();
  initNavbar();
  initLiveCompressor();
  initBeforeAfterSlider();
  initStorageCalculator();
  initFaqSearch();
  initModals();
  initCopyButtons();
  initStatsCounter();
  initDownloadFlow();
  initBackToTop();
  generateQrCode();
});

/* --------------------------------------------------------------------------
   THEME ENGINE (DARK / LIGHT MODE WITH LOCALSTORAGE)
   -------------------------------------------------------------------------- */
function initThemeEngine() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  
  // Detect saved preference or default to dark
  const savedTheme = localStorage.getItem('compressly_theme') || 'dark';
  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
      showToast(newTheme === 'dark' ? '🌙 Dark Mode Activated' : '☀️ Light Mode Activated');
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('compressly_theme', theme);
    
    if (themeIcon) {
      if (theme === 'light') {
        themeIcon.setAttribute('data-lucide', 'sun');
      } else {
        themeIcon.setAttribute('data-lucide', 'moon');
      }
      if (window.lucide) {
        lucide.createIcons();
      }
    }
  }
}

/* --------------------------------------------------------------------------
   NAVBAR & SCROLL SPY
   -------------------------------------------------------------------------- */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      const isHidden = mobileMenu.style.display === 'none' || !mobileMenu.style.display;
      mobileMenu.style.display = isHidden ? 'flex' : 'none';
    });
    
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.style.display = 'none';
      });
    });
  }

  // Active anchor link highlighter
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');
      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  });
}

/* --------------------------------------------------------------------------
   LIVE BROWSER IMAGE COMPRESSOR ENGINE (HTML5 CANVAS)
   -------------------------------------------------------------------------- */
function initLiveCompressor() {
  const dropzone = document.getElementById('compressDropzone');
  const fileInput = document.getElementById('compressFileInput');
  const qualitySlider = document.getElementById('compressQuality');
  const qualityVal = document.getElementById('compressQualityVal');
  const formatSelect = document.getElementById('compressFormat');
  
  const originalSizeEl = document.getElementById('compOrigSize');
  const newSizeEl = document.getElementById('compNewSize');
  const savingsPctEl = document.getElementById('compSavingsPct');
  const previewImg = document.getElementById('compPreviewImg');
  const downloadResultBtn = document.getElementById('downloadResultBtn');

  let currentImage = null;
  let originalFileSizeBytes = 0;
  let compressedBlob = null;

  // Load default demo sample image
  loadSampleImage('assets/images/samples/sample-photo-original.jpg', 'Mountain_Lake_4K.jpg');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    });
  }

  if (qualitySlider) {
    qualitySlider.addEventListener('input', () => {
      qualityVal.textContent = `${qualitySlider.value}%`;
      processCompression();
    });
  }

  if (formatSelect) {
    formatSelect.addEventListener('change', processCompression);
  }

  if (downloadResultBtn) {
    downloadResultBtn.addEventListener('click', () => {
      if (!compressedBlob) return;
      const url = URL.createObjectURL(compressedBlob);
      const a = document.createElement('a');
      a.href = url;
      const ext = formatSelect.value.split('/')[1] || 'jpg';
      a.download = `compressly_optimized.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('🎉 Optimized image downloaded successfully!');
    });
  }

  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('⚠️ Please select a valid photo file (JPG, PNG, WebP, HEIC).');
      return;
    }
    originalFileSizeBytes = file.size;
    originalSizeEl.textContent = formatBytes(originalFileSizeBytes);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        currentImage = img;
        processCompression();
        showToast(`📁 Loaded "${file.name}"`);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function loadSampleImage(url, name) {
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        originalFileSizeBytes = blob.size;
        originalSizeEl.textContent = formatBytes(originalFileSizeBytes);
        const img = new Image();
        img.onload = () => {
          currentImage = img;
          processCompression();
        };
        img.src = URL.createObjectURL(blob);
      })
      .catch(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 1200, 800);
        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 44px sans-serif';
        ctx.fillText('Compressly Demo Asset', 350, 400);
        const img = new Image();
        img.onload = () => {
          currentImage = img;
          processCompression();
        };
        img.src = canvas.toDataURL();
      });
  }

  function processCompression() {
    if (!currentImage) return;

    const quality = parseFloat(qualitySlider.value) / 100;
    const format = formatSelect.value || 'image/jpeg';

    const canvas = document.createElement('canvas');
    canvas.width = currentImage.width;
    canvas.height = currentImage.height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(currentImage, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      compressedBlob = blob;
      const newSizeBytes = blob.size;
      newSizeEl.textContent = formatBytes(newSizeBytes);

      const ratio = Math.max(0, Math.round(((originalFileSizeBytes - newSizeBytes) / originalFileSizeBytes) * 100));
      savingsPctEl.textContent = `-${ratio}%`;

      const previewUrl = URL.createObjectURL(blob);
      previewImg.src = previewUrl;
    }, format, quality);
  }
}

/* --------------------------------------------------------------------------
   SINGLE PHOTO BEFORE / AFTER SPLIT SLIDER
   -------------------------------------------------------------------------- */
function initBeforeAfterSlider() {
  const container = document.getElementById('beforeAfterSlider');
  const handle = document.getElementById('sliderHandle');
  const afterLayer = document.getElementById('layerAfter');

  if (!container || !handle || !afterLayer) return;

  let isDragging = false;

  const updateSlider = (clientX) => {
    const rect = container.getBoundingClientRect();
    let x = clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    const percent = (x / rect.width) * 100;

    afterLayer.style.width = `${percent}%`;
    handle.style.left = `${percent}%`;
  };

  handle.addEventListener('mousedown', () => (isDragging = true));
  window.addEventListener('mouseup', () => (isDragging = false));
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    updateSlider(e.clientX);
  });

  // Touch support for phones
  handle.addEventListener('touchstart', () => (isDragging = true));
  window.addEventListener('touchend', () => (isDragging = false));
  window.addEventListener('touchmove', (e) => {
    if (!isDragging || !e.touches[0]) return;
    updateSlider(e.touches[0].clientX);
  });

  container.addEventListener('click', (e) => {
    updateSlider(e.clientX);
  });
}

/* --------------------------------------------------------------------------
   STORAGE & BANDWIDTH ROI CALCULATOR
   -------------------------------------------------------------------------- */
function initStorageCalculator() {
  const countSlider = document.getElementById('calcCountSlider');
  const countVal = document.getElementById('calcCountVal');
  const sizeSlider = document.getElementById('calcSizeSlider');
  const sizeVal = document.getElementById('calcSizeVal');
  const ratioSelect = document.getElementById('calcRatioSelect');

  const totalOriginalEl = document.getElementById('calcTotalOriginal');
  const totalSavedEl = document.getElementById('calcTotalSaved');
  const gbSavedEl = document.getElementById('calcGbSaved');
  const speedSavedEl = document.getElementById('calcSpeedSaved');

  function calculate() {
    const count = parseInt(countSlider.value, 10);
    const avgMb = parseFloat(sizeSlider.value);
    const reductionFactor = parseFloat(ratioSelect.value);

    countVal.textContent = count.toLocaleString();
    sizeVal.textContent = `${avgMb.toFixed(1)} MB`;

    const totalRawMb = count * avgMb;
    const savedMb = totalRawMb * reductionFactor;

    if (totalRawMb >= 1024) {
      totalOriginalEl.textContent = `${(totalRawMb / 1024).toFixed(2)} GB`;
    } else {
      totalOriginalEl.textContent = `${totalRawMb.toFixed(0)} MB`;
    }

    if (savedMb >= 1024) {
      gbSavedEl.textContent = `${(savedMb / 1024).toFixed(2)} GB`;
      totalSavedEl.textContent = `${(savedMb / 1024).toFixed(2)} GB (${Math.round(reductionFactor * 100)}%)`;
    } else {
      gbSavedEl.textContent = `${savedMb.toFixed(0)} MB`;
      totalSavedEl.textContent = `${savedMb.toFixed(0)} MB (${Math.round(reductionFactor * 100)}%)`;
    }

    const secondsSaved = savedMb / 2.0;
    if (secondsSaved >= 60) {
      speedSavedEl.textContent = `~${(secondsSaved / 60).toFixed(1)} min upload time saved`;
    } else {
      speedSavedEl.textContent = `~${Math.round(secondsSaved)}s upload time saved`;
    }
  }

  if (countSlider && sizeSlider && ratioSelect) {
    countSlider.addEventListener('input', calculate);
    sizeSlider.addEventListener('input', calculate);
    ratioSelect.addEventListener('change', calculate);
    calculate();
  }
}

/* --------------------------------------------------------------------------
   FAQ SEARCH & ACCORDION
   -------------------------------------------------------------------------- */
function initFaqSearch() {
  const searchInput = document.getElementById('faqSearch');
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      faqItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(q)) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  }
}

/* --------------------------------------------------------------------------
   MODALS SYSTEM (Privacy, Terms, Contact)
   -------------------------------------------------------------------------- */
function initModals() {
  const modalOverlays = document.querySelectorAll('.modal-overlay');
  const openButtons = document.querySelectorAll('[data-modal-target]');
  const closeButtons = document.querySelectorAll('.modal-close-btn');

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-modal-target');
      const targetModal = document.getElementById(targetId);
      if (targetModal) {
        targetModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modalOverlays.forEach(m => m.classList.remove('active'));
      document.body.style.overflow = '';
    });
  });

  modalOverlays.forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modalOverlays.forEach(m => m.classList.remove('active'));
      document.body.style.overflow = '';
    }
  });

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const modal = contactForm.closest('.modal-overlay');
      if (modal) modal.classList.remove('active');
      document.body.style.overflow = '';
      contactForm.reset();
      showToast('💌 Thank you! Your feedback has been received.');
    });
  }
}

/* --------------------------------------------------------------------------
   CLIPBOARD UTILITIES
   -------------------------------------------------------------------------- */
function initCopyButtons() {
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-copy');
      navigator.clipboard.writeText(text).then(() => {
        showToast('📋 Copied to clipboard!');
      }).catch(() => {
        showToast('⚠️ Could not copy automatically.');
      });
    });
  });
}

/* --------------------------------------------------------------------------
   DOWNLOAD FLOW
   -------------------------------------------------------------------------- */
function initDownloadFlow() {
  document.querySelectorAll('.btn-direct-apk').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('🚀 Downloading Compressly APK (25.5 MB)...');
    });
  });
}

/* --------------------------------------------------------------------------
   ANIMATED STATS COUNTER
   -------------------------------------------------------------------------- */
function initStatsCounter() {
  const statNumbers = document.querySelectorAll('.count-up');
  let started = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !started) {
        started = true;
        statNumbers.forEach(el => {
          const target = parseInt(el.getAttribute('data-count'), 10);
          const duration = 1500;
          const step = Math.ceil(target / (duration / 25));
          let current = 0;

          const timer = setInterval(() => {
            current += step;
            if (current >= target) {
              el.textContent = target.toLocaleString();
              clearInterval(timer);
            } else {
              el.textContent = current.toLocaleString();
            }
          }, 25);
        });
      }
    });
  }, { threshold: 0.3 });

  const statSection = document.getElementById('statsSection');
  if (statSection) observer.observe(statSection);
}

/* --------------------------------------------------------------------------
   QR CODE GENERATOR FOR MOBILE
   -------------------------------------------------------------------------- */
function generateQrCode() {
  const qrCanvas = document.getElementById('qrCodeCanvas');
  if (!qrCanvas) return;

  const ctx = qrCanvas.getContext('2d');
  const size = 180;
  qrCanvas.width = size;
  qrCanvas.height = size;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#0f172a';
  
  drawFinderPattern(ctx, 15, 15, 40);
  drawFinderPattern(ctx, size - 55, 15, 40);
  drawFinderPattern(ctx, 15, size - 55, 40);

  const blockSize = 6;
  for (let r = 0; r < size; r += blockSize) {
    for (let c = 0; c < size; c += blockSize) {
      if ((r < 60 && c < 60) || (r < 60 && c > size - 65) || (r > size - 65 && c < 60)) continue;
      if ((Math.sin(r * 12.3 + c * 4.7) * 10000) % 1 > 0.52) {
        ctx.fillRect(r, c, blockSize - 1, blockSize - 1);
      }
    }
  }

  ctx.fillStyle = '#06b6d4';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 12, 0, Math.PI * 2);
  ctx.fill();
}

function drawFinderPattern(ctx, x, y, size) {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 6, y + 6, size - 12, size - 12);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + 12, y + 12, size - 24, size - 24);
}

/* --------------------------------------------------------------------------
   BACK TO TOP
   -------------------------------------------------------------------------- */
function initBackToTop() {
  const btn = document.getElementById('backToTopBtn');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* --------------------------------------------------------------------------
   TOAST NOTIFICATIONS
   -------------------------------------------------------------------------- */
function showToast(message) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
