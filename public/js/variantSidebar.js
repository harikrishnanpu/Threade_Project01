(function () {
  var product, selectedVariant;

  function unique(arr) {
    return Array.from(new Set(arr));
  }

  function highlightActive(id, val) {
    var c = document.getElementById(id);
    Array.from(c.children).forEach(function (b) {
      b.classList.toggle("active", b.dataset.val === val);
    });
  }

  function renderOptions(id, opts, active, onClick) {
    var c = document.getElementById(id);
    c.innerHTML = "";
    opts.forEach(function (o) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = o.toUpperCase();
      b.dataset.val = o;
      b.onclick = function () {
        onClick(o);
      };
      c.appendChild(b);
    });
    highlightActive(id, active);
  }

  function updateMain(src) {
    document.getElementById("vsMainImg").src = src;
  }

  function renderThumbnails(imgs) {
    var t = document.getElementById("vsThumbs");
    t.innerHTML = "";
    imgs.forEach(function (s, i) {
      var im = document.createElement("img");
      im.src = s;
      im.className = "vs-thumb";
      im.dataset.val = i;
      im.onclick = function () {
        updateMain(s);
        highlightActive("vsThumbs", i.toString());
      };
      t.appendChild(im);
    });
    highlightActive("vsThumbs", "0");
  }

  function onSize(size) {
    var vs = product.variants.filter(function (v) {
      return v.size === size;
    });
    selectedVariant = vs[0];
    var cols = unique(
      vs.map(function (v) {
        return v.color;
      })
    );
    renderOptions("vsColours", cols, selectedVariant.color, onColor);
    updateMain(selectedVariant.images[0]);
    renderThumbnails(selectedVariant.images);
    highlightActive("vsSizes", size);
  }

  function onColor(color) {
    var v = product.variants.find(function (v) {
      return v.size === selectedVariant.size && v.color === color;
    });
    if (!v) return;
    selectedVariant = v;
    updateMain(v.images[0]);
    renderThumbnails(v.images);
    highlightActive("vsColours", color);
  }

  async function addToCart(id, variant, quantity) {
    try {
      const r = await fetch(`/user/cart/api/add/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant, quantity }),
      });
      const res = await r.json();
      if (r.ok) {
        showGlobalToast("item added to cart successfully");
        updateCartCount();
        updateUI(false, id);


          if(window.location.href.includes('wishlist')){

                  const allBtns=document.querySelectorAll(`.whishlist-page-icon[data-product-id="${id}"]`);
     allBtns.forEach(el=>{
                const card = el.closest('.showcase') || el.parentElement;
      if (card) card.remove(); 
     })
          }

          
      } else {
        showGlobalToast(res.message, "error");
      }
    } catch (e) {
      location.href = "/user/login";
    }
  }

  async function updateCartCount() {
    try {
      const r = await fetch("/user/cart/api/count");
      const d = await r.json();
document.querySelectorAll(".HeadercartCount").forEach(el => {
  if (r.ok && el) el.innerText = d.count;
})
      updateWishlistCount();

      
    } catch (e) {
      console.error(e);
    }
  }

async function addToWishlist(productId, variant, btn) {
  const isActive = btn.classList.contains("active");

  if (isActive) {
    // Ask confirmation before removing
    const modal = document.getElementById("wishlistConfirmModal");
    modal.classList.remove("hidden");

    document.getElementById("wishlistConfirmYes").onclick = async function () {
      modal.classList.add("hidden");
      try {
        const res = await fetch(`/user/wishlist/remove/${variant._id}`, {
          method: "DELETE"
        });
        const data = await res.json();
        if (res.ok) {
          btn.classList.remove("active", "pulse-continuous");
          showGlobalToast("Item removed from wishlist");
          updateWishlistCount();
        } else {
          showGlobalToast(data.message || "Failed to remove", "error");
        }
      } catch (err) {
        showGlobalToast("Failed to remove", "error");
      }
    };

    document.getElementById("wishlistConfirmNo").onclick = function () {
      modal.classList.add("hidden");
    };

    return;
  }

  try {
    const res = await fetch("/user/wishlist/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, variant }),
    });
    const data = await res.json();

    if (res.ok) {
      showGlobalToast("Item added to wishlist");
      btn.classList.add("active");
    } else {
      showGlobalToast(data.message || "Failed", "error");
    }

    btn.classList.remove("pulse-once", "pulse-continuous");
    void btn.offsetWidth;
    btn.classList.add("pulse-once");
    btn.addEventListener("animationend", () => {
      btn.classList.remove("pulse-once");
      btn.classList.add("pulse-continuous");
    }, { once: true });

    updateWishlistCount();
  } catch (err) {
    location.href = "/user/login";
  }
}


window.updateWishlistCount = async function() {
    try {
      const r = await fetch("/user/wishlist/count");
      const d = await r.json();
document.querySelectorAll(".HeaderwishCount").forEach(el => {
  console.log(el);
  if (r.ok && el) el.textContent = d.count;
});
    } catch (e) {
      console.error(e);
    }
  }


window.showVariantSidebar = function (id,page) {
  fetch("/user/products/api/"+id)
    .then((r) => r.json())
    .then(async function (data) {
      product = data;

      if (!product.variants || !product.variants.length) {
        showGlobalToast("no variants found for this product", "error");
        return;
      }

      selectedVariant = product.variants[0];

      const wishBtn = document.getElementById("vsWishlistBtn");

      try {
        const wRes = await fetch("/user/api/wishlist");
        const wData = await wRes.json();

        const isWishlisted = wData.wishlistItems?.some(
          item => item.product._id === product._id 
        );

        if (isWishlisted) {
          wishBtn.classList.add("active", "pulse-continuous");
        } else {
          wishBtn.classList.remove("active", "pulse-continuous");
        }
      } catch (e) {
        console.error("Failed to check wishlist", e);
      }

      document.getElementById("vsTitle").textContent = product.name;
      updateMain(selectedVariant.images[0]);
      renderThumbnails(selectedVariant.images);

      const sizes = unique(product.variants.map((v) => v.size));
      renderOptions("vsSizes", sizes, selectedVariant.size, onSize);

      const initCols = unique(
        product.variants
          .filter((v) => v.size === selectedVariant.size)
          .map((v) => v.color)
      );
      renderOptions("vsColours", initCols, selectedVariant.color, onColor);

      const qty = document.getElementById("vsQty");
      qty.value = 1;

      document.getElementById("vsQtyPlus").onclick = function () {
        if (qty.valueAsNumber < selectedVariant.stock) qty.value++;
      };
      document.getElementById("vsQtyMinus").onclick = function () {
        if (qty.valueAsNumber > 1) qty.value--;
      };

      document.getElementById("vsAddBtn").onclick = function () {
        const q = +qty.value;
        if (q < 1) return;
        addToCart(id, selectedVariant, q);
        closeVariantSidebar();
      };

      wishBtn.onclick = function () {
        addToWishlist(id, selectedVariant, wishBtn);
      };

      document.getElementById("variantSidebar").classList.add("open");
      document.getElementById("sidebarOverlay").classList.add("show");
    })
    .catch(() => showGlobalToast("Failed to load product", "error"));
};



  window.closeVariantSidebar = function () {
    document.getElementById("variantSidebar").classList.remove("open");
    document.getElementById("sidebarOverlay").classList.remove("show");
  };

  window.showGlobalToast = function (msg, type = "success") {
    var t = document.getElementById("toast-global");
    var m = document.getElementById("toastMessage-global");
    if (!t || !m) return;
    t.classList.remove("success", "error", "warning");
    t.classList.add(type);
    m.textContent = msg;
    t.classList.add("show");
    setTimeout(function () {
      t.classList.remove("show");
    }, 3000);
  };


      const updateUI = (active, productId) => {

            const allButtons = document.querySelectorAll(`.whishlist[data-product-id="${productId}"]`);

      allButtons.forEach(el => {
        const path = el.querySelector('svg path');
        if (active) {
          el.classList.add('active', 'pulse-continuous');
          path.setAttribute('fill', '#e63946');
          path.setAttribute('stroke', '#e63946');

        } else {
          el.classList.remove('active', 'pulse-continuous');
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke', '#000');
        }
      });
    };

  
})();

//   window.addToWishlist = async function(productId, selectedVariant) {
//   const BASE_URL = window.location.origin;
//   try {
//     const response = await fetch(`${BASE_URL}/user/wishlist/add`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         productId,
//         size: selectedVariant.size,
//         color: selectedVariant.color
//       })
//     });

//     const result = await response.json();

//     if (response.ok) {
//       showGlobalToast('Item added to wishlist successfully');
//       updateWishlistCount();
//     } else {
//       showGlobalToast(result.message, 'error');
//     }
//   } catch (err) {
//     window.location.href = '/user/login';
//   }
// };

// window.updateWishlistCount = async function() {
//   const BASE_URL = window.location.origin;
//   try {
//     const res = await fetch(`${BASE_URL}/user/wishlist/api/count`);
//     const result = await res.json();
//     const el = document.getElementById('HeaderWishlistCount');
//     if (res.ok) {
//       if (el) el.innerText = result.count;
//     } else {
//       showGlobalToast(result.message, 'error');
//     }
//   } catch (err) {
//     console.error('Error updating wishlist count:', err);
//   }
// };

// window.removeFromWishlist = async function(itemId) {
//   const BASE_URL = window.location.origin;
//   try {
//     const response = await fetch(`${BASE_URL}/user/wishlist/remove/${itemId}`, {
//       method: 'DELETE',
//       headers: { 'Content-Type': 'application/json' }
//     });

//     const result = await response.json();

//     if (response.ok) {
//       showGlobalToast('Item removed from wishlist');
//       updateWishlistCount();
//     } else {
//       showGlobalToast(result.message, 'error');
//     }
//   } catch (err) {
//     window.location.href = '/user/login';
//   }
// };

//   if(!document.getElementById('wl-anim-style')){
//     const s=document.createElement('style');
//     s.id='wl-anim-style';
//     s.textContent=`
//     .wl-pop{animation:wl-pop .45s ease forwards}
//     @keyframes wl-pop{0%{transform:scale(1)}50%{transform:scale(1.4)}100%{transform:scale(1)}}
//     .wl-pulse{animation:wl-pulse 1.2s infinite}
//     @keyframes wl-pulse{0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)}}`;
//     document.head.appendChild(s);
//   }
