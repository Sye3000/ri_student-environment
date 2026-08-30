const messages = document.getElementById("chatMessages");
const form = document.getElementById("chatForm");
const input = document.getElementById("userInput");
const modeButtons = document.querySelectorAll(".mode-btn");
let currentMode = "lost";

function addUserMessage(text) {
    const message = document.createElement("p");
    message.className = "msg user";
    message.textContent = text;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
}

function addBotMessage(text) {
    const message = document.createElement("p");
    message.className = "msg bot";
    message.textContent = text;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
}

function generateReply(userText) {
    const lowerText = userText.toLowerCase();

    if (lowerText.includes("phone") || lowerText.includes("samsung") || lowerText.includes("iphone")) {
        return "Got it. Looking for matches on a phone...\n\n"
            + "- Item: Phone\n"
            + "- Possible colour extracted\n"
            + "- Location noted\n\n"
            + "In the full system this will search the found-items database.";
    }

    if (lowerText.includes("wallet") || lowerText.includes("keys") || lowerText.includes("laptop")) {
        return "Thanks for the description. I have logged the key details. "
            + "Once the backend is connected, I will search for possible matches and notify you.";
    }

    const matchingType = currentMode === "lost" ? "found" : "lost";
    return "I have recorded your description. In the full system this will be matched "
        + `against ${matchingType} items using AI. For now, this is the interface only.`;
}

modeButtons.forEach(button => {
    button.addEventListener("click", () => {
        modeButtons.forEach(modeButton => {
            const isSelected = modeButton === button;
            modeButton.classList.toggle("active", isSelected);
            modeButton.setAttribute("aria-pressed", String(isSelected));
        });

        currentMode = button.dataset.mode;
        const modeLabel = currentMode === "lost" ? "I Lost Something" : "I Found Something";
        addBotMessage(`Switched to ${modeLabel} mode. Describe the item.`);
    });
});

form.addEventListener("submit", event => {
    event.preventDefault();

    const text = input.value.trim();
    if (!text) {
        return;
    }

    addUserMessage(text);
    input.value = "";

    window.setTimeout(() => {
        addBotMessage(generateReply(text));
    }, 800);
});
document.getElementById('registerItemForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);

  const payload = {
    itemType: data.get('itemType'),
    brand: data.get('brand'),
    model: data.get('model'),
    color: data.get('color'),
    description: data.get('description'),
    serial: data.get('serial'),
  };

  const res = await fetch('/api/register-item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    alert('Item registered successfully!');
    form.reset();
  } else {
    alert('Failed to register item.');
  }
});
document.getElementById('foundItemForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);

  const res = await fetch('/api/submit-found-item', {
    method: 'POST',
    body: data, // includes image file
  });

  if (res.ok) {
    const result = await res.json();
    if (result.matched) {
      alert('Possible match found! The owner will be contacted.');
    } else {
      alert('Item submitted. We’ll notify you if a match is found.');
    }
  } else {
    alert('Failed to submit found item.');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const modeButtons = document.querySelectorAll('.mode-btn');
  const registerSection = document.getElementById('registerSection');
  const foundSection = document.getElementById('foundSection');

  console.log('Mode buttons found:', modeButtons.length);
  console.log('registerSection:', registerSection);
  console.log('foundSection:', foundSection);

  if (!registerSection || !foundSection || modeButtons.length === 0) {
    console.warn('Missing elements for mode switching.');
    return;
  }

  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      console.log('Button clicked:', btn.textContent.trim());

      modeButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');

      const mode = btn.dataset.mode;
      console.log('Mode:', mode);

      if (mode === 'register') {
        registerSection.style.display = '';
        foundSection.style.display = 'none';
      } else if (mode === 'found') {
        registerSection.style.display = 'none';
        foundSection.style.display = '';
      }
    });
  });
});
    // Camera / photo logic
    const photoInput = document.getElementById('itemPhoto');
    const takePhotoBtn = document.getElementById('takePhotoBtn');
    const photoPreview = document.getElementById('photoPreview');

    takePhotoBtn.addEventListener('click', () => {
      photoInput.click();
    });

    photoInput.addEventListener('change', () => {
      const file = photoInput.files[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      photoPreview.src = url;
      photoPreview.style.display = 'block';
    });
