$(document).ready(function() {
    // Initialize mixitup for product filtering
    if ($('.product__filter').length > 0) {
        var mixer = mixitup('.product__filter', {
            selectors: {
                target: '.mix'
            },
            animation: {
                duration: 300
            }
        });
    }

    // Set background images
    $('.set-bg').each(function() {
        var bg = $(this).data('setbg');
        $(this).css('background-image', 'url(' + bg + ')');
    });

    // Initialize nice select for dropdowns
    $('select').niceSelect();

    // Current filter state
    let currentFilters = {
        search: getParameterByName('search') || '',
        category: getParameterByName('category') || '',
        brand: getParameterByName('brand') || '',
        priceRange: getParameterByName('priceRange') || '',
        size: getParameterByName('size') || '',
        color: getParameterByName('color') || '',
        tag: getParameterByName('tag') || '',
        sortBy: getParameterByName('sortBy') || 'newest',
        page: parseInt(getParameterByName('page')) || 1
    };

    // Handle sidebar search form
    $('#sidebar-search-form').on('submit', function(e) {
        e.preventDefault();
        currentFilters.search = $('#sidebar-search-input').val();
        currentFilters.page = 1; // Reset to first page on new search
        applyFilters();
    });

    // Handle category filter clicks
    $('.category-filter').on('click', function(e) {
        e.preventDefault();
        $('.category-filter').removeClass('active');
        $(this).addClass('active');
        currentFilters.category = $(this).data('category');
        currentFilters.page = 1;
        applyFilters();
    });

    // Handle brand filter clicks
    $('.brand-filter').on('click', function(e) {
        e.preventDefault();
        $('.brand-filter').removeClass('active');
        $(this).addClass('active');
        currentFilters.brand = $(this).data('brand');
        currentFilters.page = 1;
        applyFilters();
    });

    // Handle price filter clicks
    $('.price-filter').on('click', function(e) {
        e.preventDefault();
        $('.price-filter').removeClass('active');
        $(this).addClass('active');
        currentFilters.priceRange = $(this).data('price');
        currentFilters.page = 1;
        applyFilters();
    });

    // Handle size filter clicks
    $('input[name="size"]').on('change', function() {
        currentFilters.size = $(this).val();
        currentFilters.page = 1;
        applyFilters();
    });

    // Handle color filter clicks
    $('input[name="color"]').on('change', function() {
        currentFilters.color = $(this).val();
        currentFilters.page = 1;
        applyFilters();
    });

    // Handle tag filter clicks
    $('.tag-filter').on('click', function(e) {
        e.preventDefault();
        $('.tag-filter').removeClass('active');
        $(this).addClass('active');
        currentFilters.tag = $(this).data('tag');
        currentFilters.page = 1;
        applyFilters();
    });

    // Handle sort selection
    $('#sort-select').on('change', function() {
        currentFilters.sortBy = $(this).val();
        currentFilters.page = 1;
        applyFilters();
    });

    // Handle pagination clicks
    $('.pagination-link').on('click', function(e) {
        e.preventDefault();
        currentFilters.page = $(this).data('page');
        applyFilters();
        // Scroll to top of products
        $('html, body').animate({
            scrollTop: $('.shop__product__option').offset().top - 100
        }, 500);
    });

    // Handle reset filters button
    $('#reset-filters').on('click', function() {
        currentFilters = {
            search: '',
            category: '',
            brand: '',
            priceRange: '',
            size: '',
            color: '',
            tag: '',
            sortBy: 'newest',
            page: 1
        };
        applyFilters();
    });

    // Handle clear search button
    $('#clear-search').on('click', function() {
        currentFilters.search = '';
        applyFilters();
    });

    // Quick view functionality
    $('.quick-view').on('click', function(e) {
        e.preventDefault();
        const productId = $(this).data('id');
        
        // Show loading state
        $('#quickViewModal').modal('show');
        $('#quickViewTitle').text('Loading...');
        $('#quickViewImage').attr('src', '/img/loading.gif');
        $('#quickViewName').text('');
        $('#quickViewRating').html('');
        $('#quickViewPrice').text('');
        $('#quickViewDescription').text('');
        $('#quickViewSize').html('<option value="">Select Size</option>');
        $('#quickViewColor').html('<option value="">Select Color</option>');
        
        // Fetch product data
        $.ajax({
            url: `/api/products/${productId}`,
            method: 'GET',
            success: function(response) {
                if (response.success) {
                    const product = response.data;
                    
                    // Update modal with product data
                    $('#quickViewTitle').text('Quick View');
                    $('#quickViewImage').attr('src', product.images && product.images.length > 0 ? product.images[0] : '/img/product/no-image.jpg');
                    $('#quickViewName').text(product.name);
                    
                    // Set rating stars
                    let ratingHtml = '';
                    for (let i = 1; i <= 5; i++) {
                        ratingHtml += `<i class="fa ${i <= product.rating ? 'fa-star' : 'fa-star-o'}"></i>`;
                    }
                    $('#quickViewRating').html(ratingHtml);
                    
                    // Set price
                    if (product.salePrice && product.salePrice < product.regularPrice) {
                        $('#quickViewPrice').html(`$${product.salePrice.toFixed(2)} <span class="old-price">$${product.regularPrice.toFixed(2)}</span>`);
                    } else {
                        $('#quickViewPrice').text(`$${product.regularPrice.toFixed(2)}`);
                    }
                    
                    // Set description
                    $('#quickViewDescription').text(product.description);
                    
                    // Set sizes
                    let sizeOptions = '<option value="">Select Size</option>';
                    if (product.sizes && product.sizes.length > 0) {
                        product.sizes.forEach(size => {
                            sizeOptions += `<option value="${size}">${size.toUpperCase()}</option>`;
                        });
                    }
                    $('#quickViewSize').html(sizeOptions);
                    
                    // Set colors
                    let colorOptions = '<option value="">Select Color</option>';
                    if (product.colors && product.colors.length > 0) {
                        product.colors.forEach(color => {
                            colorOptions += `<option value="${color}">${color.charAt(0).toUpperCase() + color.slice(1)}</option>`;
                        });
                    }
                    $('#quickViewColor').html(colorOptions);
                    
                    // Set add to cart button
                    $('#quickViewAddToCart').data('id', product._id);
                    
                    // Refresh nice select
                    $('select').niceSelect('update');
                } else {
                    alert('Failed to load product data');
                    $('#quickViewModal').modal('hide');
                }
            },
            error: function() {
                alert('An error occurred while loading product data');
                $('#quickViewModal').modal('hide');
            }
        });
    });

    // Add to cart from quick view
    $('#quickViewAddToCart').on('click', function() {
        const productId = $(this).data('id');
        const quantity = parseInt($('#quickViewQuantity').val()) || 1;
        const size = $('#quickViewSize').val();
        const color = $('#quickViewColor').val();
        
        addToCart(productId, quantity, size, color);
    });

    // Add to cart from product list
    $('.add-cart').on('click', function(e) {
        e.preventDefault();
        const productId = $(this).data('id');
        addToCart(productId, 1);
    });

    // Add to wishlist
    $('.add-to-wishlist').on('click', function(e) {
        e.preventDefault();
        const productId = $(this).data('id');
        
        $.ajax({
            url: '/api/wishlist/toggle',
            method: 'POST',
            data: { productId },
            success: function(response) {
                if (response.success) {
                    if (response.added) {
                        alert('Product added to wishlist!');
                    } else {
                        alert('Product removed from wishlist!');
                    }
                } else {
                    if (response.redirect) {
                        window.location.href = response.redirect;
                    } else {
                        alert(response.message || 'Failed to update wishlist');
                    }
                }
            },
            error: function() {
                alert('An error occurred. Please try again.');
            }
        });
    });

    // Helper function to add product to cart
    function addToCart(productId, quantity, size = '', color = '') {
        $.ajax({
            url: '/api/cart/add',
            method: 'POST',
            data: { 
                productId, 
                quantity,
                size,
                color
            },
            success: function(response) {
                if (response.success) {
                    // Update cart count in header
                    if (response.cartCount) {
                        $('.cart-count').text(response.cartCount);
                    }
                    
                    // Close modal if open
                    $('#quickViewModal').modal('hide');
                    
                    // Show success message
                    alert('Product added to cart!');
                } else {
                    if (response.redirect) {
                        window.location.href = response.redirect;
                    } else {
                        alert(response.message || 'Failed to add product to cart');
                    }
                }
            },
            error: function() {
                alert('An error occurred. Please try again.');
            }
        });
    }

    // Apply all filters and redirect
    function applyFilters() {
        const queryParams = new URLSearchParams();
        
        if (currentFilters.search) queryParams.set('search', currentFilters.search);
        if (currentFilters.category) queryParams.set('category', currentFilters.category);
        if (currentFilters.brand) queryParams.set('brand', currentFilters.brand);
        if (currentFilters.priceRange) queryParams.set('priceRange', currentFilters.priceRange);
        if (currentFilters.size) queryParams.set('size', currentFilters.size);
        if (currentFilters.color) queryParams.set('color', currentFilters.color);
        if (currentFilters.tag) queryParams.set('tag', currentFilters.tag);
        if (currentFilters.sortBy !== 'newest') queryParams.set('sortBy', currentFilters.sortBy);
        if (currentFilters.page > 1) queryParams.set('page', currentFilters.page);
        
        window.location.href = `/shop?${queryParams.toString()}`;
    }

    // Helper function to get URL parameters
    function getParameterByName(name, url = window.location.href) {
        name = name.replace(/[\[\]]/g, '\\$&');
        const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    // Quantity increment/decrement for quick view
    $('.cart-plus-minus').append('<div class="dec qtybutton">-</div><div class="inc qtybutton">+</div>');
    $('.qtybutton').on('click', function() {
        const $button = $(this);
        const oldValue = $button.parent().find('input').val();
        
        if ($button.hasClass('inc')) {
            const newVal = parseFloat(oldValue) + 1;
            $button.parent().find('input').val(newVal);
        } else {
            // Don't allow decrementing below one
            if (oldValue > 1) {
                const newVal = parseFloat(oldValue) - 1;
                $button.parent().find('input').val(newVal);
            } else {
                $button.parent().find('input').val(1);
            }
        }
    });
});