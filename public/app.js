(function(window) {
  const socket = window.io('http://localhost:3000');
  socket.on('connect', function() {
    console.info('socket.id', socket.id);
  });

  const elements = {
    sendForm: document.querySelector('#send-form'),
    prefix: document.querySelector('select[name="prefix"]'),
    phone: document.querySelector('input[name="phone"]'),
    sendBtn: document.querySelector('#send-form button'),
    confirmForm: document.querySelector('#confirm-from'),
    code: document.querySelector('input[name="code"]'),
    confirmBtn: document.querySelector('#confirm-from button'),
    resendLink: document.querySelector('#resend'),
  };

  elements.sendForm.addEventListener('submit', send);
  elements.confirmForm.addEventListener('submit', confirm);
  elements.resendLink.addEventListener('click', resend);

  function send(e) {
    e.preventDefault();
    startProcessing(elements.sendBtn);
    socket.emit('send', {prefix: elements.prefix.value, phone: elements.phone.value}, function(err, res) {
      if (err) {
        window.alert('Oops! Double check your phone number and try again');
      } else {
        showConfirmationForm();
      }
      stopProcessing(elements.sendBtn);
    });
  }

  function confirm(e) {
    e.preventDefault();
    startProcessing(elements.confirmBtn);
    socket.emit('confirm', {code: elements.code.value}, function(err, res) {
      if (err) {
        window.alert('Oops! Double check confirmation code and try again');
      } else {
        window.alert('Salem ' + res + ' :)');
        showSendForm();
      }
      stopProcessing(elements.confirmBtn);
    });
  }

  function resend(e) {
    e.preventDefault();
    showSendForm();
  }

  function showSendForm() {
    elements.confirmForm.reset();
    elements.confirmForm.style.display = 'none';
    elements.sendForm.style.display = 'block';
  }

  function showConfirmationForm() {
    elements.sendForm.style.display = 'none';
    elements.confirmForm.style.display = 'block';
  }

  function startProcessing(button) {
    button.setAttribute('disabled', 'disabled');
    button.setAttribute('data-origin-txt', button.innerText);
    button.innerText = 'Processing...';
  }

  function stopProcessing(button) {
    button.innerText = button.getAttribute('data-origin-txt');
    button.removeAttribute('data-origin-txt');
    button.removeAttribute('disabled');
  }
})(window);
