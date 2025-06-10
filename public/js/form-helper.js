const showInputErrorMessage = (inputId, message) => {
  const errorEl = document.getElementById(`${inputId}-input-error`);
  if(errorEl){
      errorEl.innerText = message;
      errorEl.style.display = 'block';
    }
};


const clearAllErrors = () => {
  document.querySelectorAll('.error-msg-input').forEach(el => {
    el.innerText = '';
    el.style.display = 'none';
  });

 Array.from(document.getElementsByTagName('input')).forEach(el =>{
    el.classList.remove('invalid')
  });
};


const disableAllSubmitButtons = () => {
  document.querySelectorAll('button').forEach(btn => {
    btn.disabled = true;

    if (btn.classList.contains('google') || btn.classList.contains('primary')) {
      btn.dataset.originalText = btn.innerHTML;
      btn.innerHTML = `<span class="loader"></span> loading...`;
    }
  });
};

const resetAllSubmitButtons = () => {
  document.querySelectorAll('button').forEach(btn => {
    btn.disabled = false;
    if (btn.classList.contains('google') && btn.dataset.originalText) {
      btn.innerHTML = btn.dataset.originalText;
      delete btn.dataset.originalText;
    } else if (btn.classList.contains('primary') && btn.dataset.originalText) {
      btn.innerHTML = btn.dataset.originalText;
      delete btn.dataset.originalText;
    }
  });
};
