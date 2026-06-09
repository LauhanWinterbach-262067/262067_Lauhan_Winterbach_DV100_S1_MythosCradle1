// Wrapper
document.addEventListener("DOMContentLoaded", () => {
    // ---- GLOBALS & UTILS ----
    const isSubPage = window.location.pathname.includes('/pages/');
    const basePath = isSubPage ? '../' : './';
    
    // Formatter for currency
    const formatPrice = (num) => {
        return num.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // ---- CART FUNCTIONALITY ----
    let cart = JSON.parse(localStorage.getItem('mythosCradleCart')) || [];

    const updateCartBadge = () => {
        const badges = document.querySelectorAll('.cart-badge');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        badges.forEach(badge => {
            badge.textContent = totalItems;
        });
    };

    const saveCart = () => {
        localStorage.setItem('mythosCradleCart', JSON.stringify(cart));
        updateCartBadge();
        renderCart();
    };

    // Initialize badge
    updateCartBadge();

    // 1. Qty controls on adopt.html
    const qtyControls = document.querySelectorAll('.adopt-row .qty-control');
    qtyControls.forEach(control => {
        const minusBtn = control.querySelector('button:first-child');
        const plusBtn = control.querySelector('button:last-child');
        const qtySpan = control.querySelector('span');

        minusBtn.addEventListener('click', () => {
            let qty = parseInt(qtySpan.textContent);
            if (qty > 1) qtySpan.textContent = qty - 1;
        });

        plusBtn.addEventListener('click', () => {
            let qty = parseInt(qtySpan.textContent);
            qtySpan.textContent = qty + 1;
        });
    });

    // 2. Add to Cart buttons
    const addToCartBtns = document.querySelectorAll('.adopt-row .btn-primary');
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('.adopt-row');
            const title = row.querySelector('.adopt-title').textContent.trim();
            const priceText = row.querySelector('.adopt-price').childNodes[0].nodeValue.trim(); 
            // extract number from "R 2,500.00"
            const price = parseFloat(priceText.replace('R', '').replace(/,/g, '').trim());
            const imgSrcRaw = row.querySelector('.adopt-image img').getAttribute('src');
            // Normalize image path to be absolute or relative to root
            const imgSrc = imgSrcRaw.replace('../', '').replace('./', '');
            const qty = parseInt(row.querySelector('.qty-control span').textContent);

            const existingItem = cart.find(item => item.title === title);
            if (existingItem) {
                existingItem.quantity += qty;
            } else {
                cart.push({ title, price, image: imgSrc, quantity: qty });
            }

            saveCart();
            // Reset qty on page back to 1
            row.querySelector('.qty-control span').textContent = '1';
        });
    });

    // 3. Render Cart in Modal
    const cartModalBody = document.getElementById('cartModalBody');
    const cartTotalEl = document.getElementById('cartTotal');
    const cartIcons = document.querySelectorAll('.cart-icon');

    const renderCart = () => {
        if (!cartModalBody) return;
        
        cartModalBody.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartModalBody.innerHTML = '<p class="text-center" style="font-size: 1.2rem; color: #555;">Your cradle is currently empty.</p>';
        } else {
            cart.forEach((item, index) => {
                total += item.price * item.quantity;
                const itemEl = document.createElement('div');
                itemEl.style.display = 'flex';
                itemEl.style.alignItems = 'center';
                itemEl.style.justifyContent = 'space-between';
                itemEl.style.borderBottom = '1px solid rgba(0,0,0,0.05)';
                itemEl.style.padding = '15px 0';
                
                const itemImgPath = basePath + item.image;

                itemEl.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="${itemImgPath}" alt="${item.title}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
                        <div>
                            <h5 style="margin-bottom: 5px; color: var(--color-primary-dark); font-family: var(--font-heading);">${item.title}</h5>
                            <div style="color: var(--color-accent-cyan); font-weight: bold;">R ${formatPrice(item.price)}</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <div class="qty-control dark-qty" style="display: flex; align-items: center; border-radius: 4px; overflow: hidden; background: var(--color-accent-orange); color: white; height: 36px;">
                            <button class="cart-minus" data-index="${index}" style="width: 30px; height: 100%; border: none; background: transparent; color: white; cursor: pointer; font-weight: bold;">-</button>
                            <span style="width: 30px; text-align: center; display: inline-block;">${item.quantity}</span>
                            <button class="cart-plus" data-index="${index}" style="width: 30px; height: 100%; border: none; background: transparent; color: white; cursor: pointer; font-weight: bold;">+</button>
                        </div>
                        <div style="font-weight: bold; width: 100px; text-align: right;">R ${formatPrice(item.price * item.quantity)}</div>
                        <button class="cart-delete" data-index="${index}" style="border: none; background: none; color: #dc3545; cursor: pointer; font-size: 1.5rem;"><i class="ph ph-trash"></i></button>
                    </div>
                `;
                cartModalBody.appendChild(itemEl);
            });
        }

        if (cartTotalEl) {
            cartTotalEl.textContent = formatPrice(total);
        }
    };

    // Delegate events for cart items
    if (cartModalBody) {
        cartModalBody.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const index = target.getAttribute('data-index');
            if (index === null) return;

            if (target.classList.contains('cart-minus')) {
                if (cart[index].quantity > 1) {
                    cart[index].quantity -= 1;
                    saveCart();
                }
            } else if (target.classList.contains('cart-plus')) {
                cart[index].quantity += 1;
                saveCart();
            } else if (target.classList.contains('cart-delete') || target.closest('.cart-delete')) {
                const delBtn = target.classList.contains('cart-delete') ? target : target.closest('.cart-delete');
                const delIndex = delBtn.getAttribute('data-index');
                cart.splice(delIndex, 1);
                saveCart();
            }
        });
    }

    // Open Cart Modal
    cartIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            renderCart();
            const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
            cartModal.show();
        });
    });

    // Finish Adoption Button
    const finishAdoptionBtn = document.getElementById('finishAdoptionBtn');
    if (finishAdoptionBtn) {
        finishAdoptionBtn.addEventListener('click', () => {
            // clear cart? (Optional, let's keep it realistic to a checkout)
            // cart = [];
            // saveCart();
            window.location.href = basePath + 'index.html';
        });
    }


    // ---- CONTACT FORM MODAL ----
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = contactForm.querySelector('input[type="text"]').value;
            const thankYouName = document.getElementById('thankYouName');
            if (thankYouName) {
                thankYouName.textContent = nameInput || 'Friend';
            }
            
            const thankYouModal = new bootstrap.Modal(document.getElementById('thankYouModal'));
            thankYouModal.show();
            contactForm.reset();
        });
    }


    // ---- IMAGE SLIDER (Homepage) ----
    const imageSlider = document.querySelector('.image-slider');
    if (imageSlider) {
        const sliderImg = imageSlider.querySelector('img');
        const leftArrow = imageSlider.querySelector('.left-arrow');
        const rightArrow = imageSlider.querySelector('.right-arrow');

        // Assuming there are multiple images available for the slider
        const images = [
            'assets/img/imageSlider1.png',
            'assets/img/adopt1.png', // Fallbacks since we only see imageSlider1.png in folder structure
            'assets/img/adopt2.png',
            'assets/img/adopt3.png'
        ];
        
        let currentSlide = 0;

        leftArrow.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + images.length) % images.length;
            sliderImg.src = basePath + images[currentSlide];
        });

        rightArrow.addEventListener('click', () => {
            currentSlide = (currentSlide + 1) % images.length;
            sliderImg.src = basePath + images[currentSlide];
        });
    }

    // ---- SEARCH BAR FUNCTIONALITY ----
    const searchInputs = document.querySelectorAll('.search-box input');
    
    // Parse URL params for search on adopt.html
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    
    if (searchQuery && window.location.pathname.includes('adopt.html')) {
        const lowerQuery = searchQuery.toLowerCase();
        const adoptRows = document.querySelectorAll('.adopt-row');
        
        adoptRows.forEach(row => {
            const title = row.querySelector('.adopt-title').textContent.toLowerCase();
            const desc = row.querySelector('.adopt-desc').textContent.toLowerCase();
            if (title.includes(lowerQuery) || desc.includes(lowerQuery)) {
                row.style.display = 'block'; // Or whatever its default is
            } else {
                row.style.display = 'none';
            }
        });
        
        // Populate search boxes with query
        searchInputs.forEach(input => input.value = searchQuery);
    }

    searchInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = input.value.trim();
                if (query) {
                    window.location.href = basePath + 'pages/adopt.html?search=' + encodeURIComponent(query);
                } else {
                    window.location.href = basePath + 'pages/adopt.html';
                }
            }
        });
    });

});
