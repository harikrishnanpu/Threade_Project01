/* global io */
(() => {
  // --- DOM refs ------------------------------------------------------------
  const widget   = document.querySelector('.harry-chat');
  const header   = widget.querySelector('.harry-chat__header');
  const input    = widget.querySelector('#harryChatInput');
  const sendBtn  = widget.querySelector('#harryChatSend');
  const list     = widget.querySelector('.harry-chat__messages');

  // --- Helpers -------------------------------------------------------------
  const scrollToBottom = () => {
    widget.querySelector('.harry-chat__window').scrollTop =
      widget.querySelector('.harry-chat__window').scrollHeight;
  };

  const addBubble = (msg, side = 'ai') => {
    const li = document.createElement('li');
    li.className = `harry-chat__bubble harry-chat__bubble--${side}`;
    li.textContent = msg;
    list.appendChild(li);
    scrollToBottom();
  };

  // --- Open / close toggle -------------------------------------------------
  header.addEventListener('click', () => {
    widget.classList.toggle('harry-chat--closed');
    widget.classList.toggle('harry-chat--open');
  });

  // --- Socket.IO -----------------------------------------------------------
  const socket = io(); // same origin – adjust if you use a namespace

  socket.on('connect', () => {
    console.log('[harry-chat] connected', socket.id);
  });

  socket.on('bot:reply', text => addBubble(text, 'ai'));

  // --- Send message --------------------------------------------------------
  const send = () => {
    const text = input.value.trim();
    if (!text) return;
    addBubble(text, 'user');
    socket.emit('user:message', text);
    input.value = '';
  };

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') send();
  });
})();
