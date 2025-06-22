// variantSidebar.js
(function() {
  var product, selectedVariant;

  function unique(arr) {
    return Array.from(new Set(arr));
  }

  function highlightActive(containerId, value) {
    var ctr = document.getElementById(containerId);
    Array.from(ctr.children).forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.val === value);
    });
  }

  function renderOptions(containerId, options, active, onClick) {
    var ctr = document.getElementById(containerId);
    ctr.innerHTML = '';           
    options.forEach(function(opt) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = opt.toUpperCase();
      btn.dataset.val = opt;
      btn.addEventListener('click', function() {
        onClick(opt);
      });
      ctr.appendChild(btn);
    });
    highlightActive(containerId, active);
  }

  function updateMain(src) {
    document.getElementById('vsMainImg').src = src;
  }

  function renderThumbnails(imgs) {
    var thumbs = document.getElementById('vsThumbs');
    thumbs.innerHTML = '';
    imgs.forEach(function(src, i) {
      var img = document.createElement('img');
      img.src = src;
      img.className = 'vs-thumb';
      img.addEventListener('click', function() {
        updateMain(src);
        highlightActive('vsThumbs', i.toString());
      });
      img.dataset.val = i;
      thumbs.appendChild(img);
    });
    highlightActive('vsThumbs', '0');
  }

  function onSize(size) {
    var vs = product.variants.filter(function(v) { return v.size === size; });
    selectedVariant = vs[0];              
    var cols = unique(vs.map(function(v) { return v.color; }));
    renderOptions('vsColours', cols, selectedVariant.color, onColor);
    updateMain(selectedVariant.images[0]);
    renderThumbnails(selectedVariant.images);
    highlightActive('vsSizes', size);
  }

  function onColor(color) {
    var v = product.variants.find(function(v) {
      return v.size === selectedVariant.size && v.color === color;
    });
    if (!v) return;
    selectedVariant = v;
    updateMain(v.images[0]);
    renderThumbnails(v.images);
    highlightActive('vsColours', color);
  }


  window.showVariantSidebar = function(productId) {
    fetch('/user/products/api/' + productId)
      .then(r => r.json())
      .then(function(data) {
        product = data;
        if (!product.variants || !product.variants.length) {
          alert('No variants.');
          return;
        }

        selectedVariant = product.variants[0];

        document.getElementById('vsTitle').textContent = product.name;
        updateMain(selectedVariant.images[0]);
        renderThumbnails(selectedVariant.images);

        var sizes = unique(product.variants.map(v=>v.size));
        renderOptions('vsSizes', sizes, selectedVariant.size, onSize);

        var initCols = unique(
          product.variants
            .filter(v=>v.size===selectedVariant.size)
            .map(v=>v.color)
        );
        renderOptions('vsColours', initCols, selectedVariant.color, onColor);

        var qty = document.getElementById('vsQty');
        qty.value = 1;
        document.getElementById('vsQtyPlus').onclick = function() {
          if (qty.valueAsNumber < selectedVariant.stock) qty.value++;
        };
        document.getElementById('vsQtyMinus').onclick = function() {
          if (qty.valueAsNumber > 1) qty.value--;
        };

        document.getElementById('vsAddBtn').onclick = function() {
          var q = +qty.value;
          if (q<1) return alert('Quantity at least 1');
          addToCart(productId, selectedVariant, q);
          closeVariantSidebar();
        };

        document.getElementById('variantSidebar').classList.add('open');
        document.getElementById('sidebarOverlay').classList.add('show');
      }).catch(() => alert('Failed to load product'));
  };


  window.closeVariantSidebar = function() {
    document.getElementById('variantSidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
  };



   async function addToCart(id,variant, quantity) {
    const BASE_URL = window.location.origin;
    try{

        const response = await fetch(`${BASE_URL}/user/cart/api/add/${id}`,{
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ variant, quantity })
        });

        const result = await response.json();

        if(response.ok){
            
            updateCartCount(result.userId)
        }else{
            alert(result.message)
        }
    }catch(err){
       window.location.href = '/user/login'
    }
  }


  async function updateCartCount(userId) {
    const BASE_URL = window.location.origin;
  try {
    const res = await fetch(`${BASE_URL}/user/cart/api/count`);
    const result = await res.json();
    if(res.ok){
        const el = document.getElementById('HeadercartCount');
        el.innerText = result.count;
    }else{
        alert(result.message)
    }
    if (el) el.innerText = count;
  } catch (err) {
    console.error('Error fetching cart count:', err);
  }
}


})();



