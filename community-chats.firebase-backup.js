/**
 * RI Student Environment - Community Chat (Firebase)
 * More reliable loading + clear errors
 */
(function () {
  "use strict";

  if (typeof firebase === "undefined" || typeof db === "undefined") {
    alert("Firebase not loaded. Check scripts in community.html");
    return;
  }

  var currentUser = null;
  var currentChatId = null;
  var currentFilter = "all";
  var unsubscribeMessages = null;
  var allChatsCache = [];
  var emojiPanel = null;
  var attachInput = null;

  var EMOJIS = ["😀","😂","😍","🥰","😊","😎","🤔","😢","😡","👍","👎","🙏","👏","🔥","❤️","💙","🎉","✅","📚","💻","🎓","☕","🚀","💡","⭐","🙌","🤝","💪"];

  var chatListEl = document.getElementById("chatList");
  var emptyState = document.getElementById("emptyState");
  var activeChat = document.getElementById("activeChat");
  var messagesArea = document.getElementById("messagesArea");
  var chatName = document.getElementById("chatName");
  var chatStatus = document.getElementById("chatStatus");
  var chatAvatar = document.getElementById("chatAvatar");
  var messageInput = document.getElementById("messageInput");
  var sendBtn = document.getElementById("sendBtn");
  var backToList = document.getElementById("backToList");
  var waApp = document.querySelector(".wa-app");
  var searchInput = document.getElementById("chatSearch");
  var filterBtns = document.querySelectorAll(".wa-filter");

  var PROGRAM_GROUPS = [
    { id: "technology-innovation", name: "Technology and Innovation", type: "group", avatar: "TI", color: "linear-gradient(135deg,#2563eb,#1d4ed8)", status: "Technology program group", lastMessage: "Welcome to Technology and Innovation." },
    { id: "career-development", name: "Career Development", type: "group", avatar: "CD", color: "linear-gradient(135deg,#0f766e,#0d9488)", status: "Career program group", lastMessage: "Welcome to Career Development." },
    { id: "academic-support", name: "Academic Support", type: "group", avatar: "AS", color: "linear-gradient(135deg,#7c3aed,#6d28d9)", status: "Academic program group", lastMessage: "Welcome to Academic Support." },
    { id: "hiking-adventure", name: "Hiking and Adventure", type: "group", avatar: "HA", color: "linear-gradient(135deg,#15803d,#16a34a)", status: "Outdoor program group", lastMessage: "Welcome to Hiking and Adventure." }
  ];

  function showToast(text) {
    var toast = document.getElementById("wa-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "wa-toast";
      toast.style.cssText = "position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#172554;color:#fff;padding:10px 18px;border-radius:8px;font-size:0.875rem;z-index:9999;opacity:0;transition:opacity 0.25s;box-shadow:0 4px 16px rgba(0,0,0,0.25);max-width:90%;text-align:center;";
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.style.opacity = "1";
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () { toast.style.opacity = "0"; }, 2500);
  }

  function escapeHtml(str) {
    var d = document.createElement("div");
    d.textContent = str || "";
    return d.innerHTML;
  }

  function formatTime(ts) {
    if (!ts) return "";
    try {
      var d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  }

  function initUser() {
    var guestId = localStorage.getItem("ri_guest_id");
    if (!guestId) {
      guestId = "guest_" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem("ri_guest_id", guestId);
    }
    currentUser = { uid: guestId, name: "Student", avatar: "ST" };

    var nameEl = document.querySelector(".wa-user-info strong");
    var smallEl = document.querySelector(".wa-user-info small");
    var avEl = document.querySelector(".wa-avatar-self span");
    if (nameEl) nameEl.textContent = currentUser.name;
    if (smallEl) smallEl.textContent = "Guest";
    if (avEl) avEl.textContent = currentUser.avatar;
  }

  // Create default chats if none exist
  function ensureChatsExist() {
    return db.collection("chats").limit(1).get()
      .then(function (snap) {
        if (!snap.empty) {
          console.log("Chats already exist:", snap.size);
          return;
        }
        console.log("No chats found – seeding defaults...");
        showToast("Creating default chats...");

        var defaults = [
          { name: "Technology & IT", type: "group", avatar: "IT", color: "linear-gradient(135deg,#6366f1,#4338ca)", status: "12 members", lastMessage: "Welcome to Technology & IT!", members: [] },
          { name: "Business & Entrepreneurship", type: "group", avatar: "BE", color: "linear-gradient(135deg,#6366f1,#4338ca)", status: "28 members", lastMessage: "Share your business ideas", members: [] },
          { name: "Student Activities", type: "group", avatar: "SA", color: "linear-gradient(135deg,#6366f1,#4338ca)", status: "45 members", lastMessage: "Campus events and activities", members: [] },
          { name: "Internship Opportunities", type: "opportunity", avatar: "💼", color: "linear-gradient(135deg,#0ea5e9,#0284c7)", status: "Official channel", lastMessage: "New opportunities posted here", members: [] },
          { name: "Scholarship Alerts", type: "opportunity", avatar: "🎓", color: "linear-gradient(135deg,#0ea5e9,#0284c7)", status: "Official channel", lastMessage: "NSFAS and bursary updates", members: [] }
        ];

        var writes = defaults.map(function (c) {
          c.lastMessageTime = firebase.firestore.FieldValue.serverTimestamp();
          return db.collection("chats").add(c).then(function (ref) {
            var welcomeText = "Hi everyone! Welcome to " + c.name + ". Share something with the group.";
            return ref.collection("messages").add({
              text: welcomeText,
              senderId: "system",
              senderName: "RI Student Community",
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              status: "sent"
            }).then(function () {
              return ref.update({
                lastMessage: welcomeText,
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp()
              });
            });
          });
        });
        return Promise.all(writes).then(function () {
          console.log("Seeded " + defaults.length + " chats with starter messages");
          showToast("Default chats created");
        });
      })
      .catch(function (err) {
        console.error("ensureChatsExist error:", err);
        showToast("Error creating chats: " + (err.message || "permissions?"));
      });
  }

  // Load chats WITHOUT orderBy first (avoids index errors)
  function loadChats() {
    db.collection("chats").get()
      .then(function (snap) {
        allChatsCache = [];
        snap.forEach(function (doc) {
          allChatsCache.push(Object.assign({ id: doc.id }, doc.data()));
        });

        // Sort client-side by lastMessageTime
        allChatsCache.sort(function (a, b) {
          var ta = a.lastMessageTime && a.lastMessageTime.toMillis ? a.lastMessageTime.toMillis() : 0;
          var tb = b.lastMessageTime && b.lastMessageTime.toMillis ? b.lastMessageTime.toMillis() : 0;
          return tb - ta;
        });

        console.log("Loaded chats:", allChatsCache.length);
        renderChatList();

        if (allChatsCache.length === 0) {
          chatListEl.innerHTML = '<div style="padding:2rem;text-align:center;color:#667781;font-size:0.9rem;">No chats yet.<br><button id="btnCreateDefaults" style="margin-top:12px;padding:8px 16px;background:#4169E1;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Create default chats</button></div>';
          var btn = document.getElementById("btnCreateDefaults");
          if (btn) {
            btn.addEventListener("click", function () {
              ensureChatsExist().then(loadChats);
            });
          }
          return;
        }

        if (!currentChatId) {
          var firstChat = allChatsCache[0];
          if (firstChat) {
            openChat(firstChat);
          }
        }
      })
      .catch(function (err) {
        console.error("loadChats error:", err);
        showToast("Cannot load chats: " + (err.message || "check rules"));
        chatListEl.innerHTML = '<div style="padding:2rem;text-align:center;color:#b91c1c;font-size:0.9rem;">Failed to load chats.<br>Check Firestore rules are published.</div>';
      });
  }

  // Live updates (simple polling every 5s + on focus) – reliable without composite indexes
  function startLiveRefresh() {
    setInterval(loadChats, 5000);
    window.addEventListener("focus", loadChats);
  }

  function renderChatList() {
    var q = (searchInput && searchInput.value || "").toLowerCase().trim();
    var filtered = allChatsCache.filter(function (c) {
      if (currentFilter === "groups" && c.type !== "group") return false;
      if (currentFilter === "opportunities" && c.type !== "opportunity") return false;
      if (q && !(c.name || "").toLowerCase().includes(q) && !(c.lastMessage || "").toLowerCase().includes(q)) return false;
      return true;
    });

    chatListEl.innerHTML = "";
    if (filtered.length === 0) {
      chatListEl.innerHTML = '<div style="padding:2rem;text-align:center;color:#667781;font-size:0.9rem;">No chats found</div>';
      return;
    }

    filtered.forEach(function (chat) {
      var item = document.createElement("div");
      item.className = "wa-chat-item" + (currentChatId === chat.id ? " active" : "");
      item.dataset.id = chat.id;
      var avatarClass = chat.type === "group" ? " group" : chat.type === "opportunity" ? " opportunity" : "";
      item.innerHTML =
        '<div class="wa-avatar' + avatarClass + '" style="background:' + (chat.color || "linear-gradient(135deg,#4169E1,#2748A5)") + '"><span>' + (chat.avatar || "CH") + "</span></div>" +
        '<div class="wa-chat-meta"><div class="wa-chat-top">' +
        '<span class="wa-chat-name">' + escapeHtml(chat.name) + "</span>" +
        '<span class="wa-chat-time">' + formatTime(chat.lastMessageTime) + "</span></div>" +
        '<div class="wa-chat-bottom"><span class="wa-chat-preview">' + escapeHtml(chat.lastMessage || "No messages yet") + "</span></div></div>";
      item.addEventListener("click", function () { openChat(chat); });
      chatListEl.appendChild(item);
    });
  }

  function openChat(chat) {
    currentChatId = chat.id;
    document.querySelectorAll(".wa-chat-item").forEach(function (el) {
      el.classList.toggle("active", el.dataset.id === chat.id);
    });
    chatName.textContent = chat.name || "Chat";
    chatStatus.textContent = chat.status || "Online";
    chatAvatar.innerHTML = "<span>" + (chat.avatar || "CH") + "</span>";
    chatAvatar.style.background = chat.color || "linear-gradient(135deg,#4169E1,#2748A5)";
    if (emptyState) emptyState.hidden = true;
    activeChat.hidden = false;
    waApp.classList.add("show-chat");
    messageInput.focus();
    hideEmojiPanel();
    loadMessages(chat);
  }

  function loadMessages(chat) {
    if (unsubscribeMessages) unsubscribeMessages();
    messagesArea.innerHTML = '<div style="text-align:center;color:#667781;padding:1rem;">Loading messages...</div>';

    unsubscribeMessages = db.collection("chats").doc(chat.id).collection("messages")
      .orderBy("createdAt", "asc")
      .onSnapshot(
        function (snapshot) {
          messagesArea.innerHTML = "";
          var div = document.createElement("div");
          div.className = "wa-date-divider";
          div.textContent = "Messages";
          messagesArea.appendChild(div);

          if (snapshot.empty) {
            var welcomeText = "Hi everyone! Welcome to " + (chat.name || "this chat") + ".";
            db.collection("chats").doc(chat.id).collection("messages").add({
              text: welcomeText,
              senderId: "system",
              senderName: "RI Student Community",
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              status: "sent"
            }).then(function () {
              return db.collection("chats").doc(chat.id).update({
                lastMessage: welcomeText,
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp()
              });
            }).catch(function (err) {
              console.error("Unable to create welcome message:", err);
            });
            var empty = document.createElement("div");
            empty.style.cssText = "text-align:center;color:#667781;padding:1.5rem;font-size:0.9rem;";
            empty.textContent = "Loading conversation...";
            messagesArea.appendChild(empty);
            return;
          }

          snapshot.forEach(function (doc) {
            var msg = doc.data();
            var isOut = msg.senderId === currentUser.uid;
            var row = document.createElement("div");
            row.className = "wa-message " + (isOut ? "outgoing" : "incoming");
            var senderHtml = (!isOut && msg.senderName && chat.type !== "private")
              ? '<div class="wa-sender-name">' + escapeHtml(msg.senderName) + "</div>" : "";
            var statusIcon = isOut ? '<span class="wa-bubble-status read"><i class="fa-solid fa-check-double"></i></span>' : "";
            row.innerHTML = '<div class="wa-bubble">' + senderHtml +
              '<div class="wa-bubble-text">' + escapeHtml(msg.text) + "</div>" +
              '<div class="wa-bubble-meta"><span class="wa-bubble-time">' + formatTime(msg.createdAt) + "</span>" + statusIcon + "</div></div>";
            messagesArea.appendChild(row);
          });
          messagesArea.scrollTop = messagesArea.scrollHeight;
        },
        function (err) {
          console.error(err);
          // Fallback without orderBy
          db.collection("chats").doc(chat.id).collection("messages").get().then(function (snap) {
            messagesArea.innerHTML = "";
            snap.forEach(function (doc) {
              var msg = doc.data();
              var isOut = msg.senderId === currentUser.uid;
              var row = document.createElement("div");
              row.className = "wa-message " + (isOut ? "outgoing" : "incoming");
              row.innerHTML = '<div class="wa-bubble"><div class="wa-bubble-text">' + escapeHtml(msg.text) + "</div></div>";
              messagesArea.appendChild(row);
            });
          });
        }
      );
  }

  function sendMessage() {
    var text = messageInput.value.trim();
    if (!text || !currentChatId) return;
    messageInput.value = "";
    hideEmojiPanel();
    var chatRef = db.collection("chats").doc(currentChatId);
    chatRef.collection("messages").add({
      text: text,
      senderId: currentUser.uid,
      senderName: currentUser.name,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: "sent"
    }).then(function () {
      return chatRef.update({
        lastMessage: text,
        lastMessageTime: firebase.firestore.FieldValue.serverTimestamp()
      });
    }).then(function () {
      loadChats();
    }).catch(function (err) {
      console.error(err);
      showToast("Send failed: " + (err.message || "error"));
    });
  }

  function startNewChat() {
    var name = prompt("Enter student or group name:");
    if (!name || !name.trim()) return;
    var initials = name.trim().split(/\s+/).map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase();
    db.collection("chats").add({
      name: name.trim(),
      type: "private",
      avatar: initials || "ST",
      color: "linear-gradient(135deg,#4169E1,#2748A5)",
      status: "online",
      lastMessage: "New conversation started",
      lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
      members: [currentUser.uid],
      createdBy: currentUser.uid
    }).then(function (ref) {
      showToast("Chat created");
      return ref.get();
    }).then(function (doc) {
      loadChats();
      openChat(Object.assign({ id: doc.id }, doc.data()));
    }).catch(function (err) {
      showToast("Create failed: " + (err.message || "error"));
    });
  }

  function toggleEmojiPanel() {
    if (emojiPanel && emojiPanel.style.display === "flex") { hideEmojiPanel(); return; }
    if (!emojiPanel) {
      emojiPanel = document.createElement("div");
      emojiPanel.style.cssText = "position:absolute;bottom:60px;left:12px;max-width:320px;background:#fff;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,0.18);padding:10px;display:none;flex-wrap:wrap;gap:4px;z-index:50;border:1px solid #e2e8f0;";
      EMOJIS.forEach(function (e) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = e;
        btn.style.cssText = "width:36px;height:36px;border:none;background:transparent;font-size:1.25rem;cursor:pointer;border-radius:8px;";
        btn.addEventListener("click", function () { messageInput.value += e; messageInput.focus(); });
        emojiPanel.appendChild(btn);
      });
      var bar = document.querySelector(".wa-input-bar");
      if (bar) { bar.style.position = "relative"; bar.appendChild(emojiPanel); }
    }
    emojiPanel.style.display = "flex";
  }

  function hideEmojiPanel() {
    if (emojiPanel) emojiPanel.style.display = "none";
  }

  function triggerAttach() {
    if (!currentChatId) { showToast("Open a chat first"); return; }
    if (!attachInput) {
      attachInput = document.createElement("input");
      attachInput.type = "file";
      attachInput.style.display = "none";
      document.body.appendChild(attachInput);
      attachInput.addEventListener("change", function () {
        if (!attachInput.files || !attachInput.files[0]) return;
        var file = attachInput.files[0];
        db.collection("chats").doc(currentChatId).collection("messages").add({
          text: "📎 " + file.name,
          senderId: currentUser.uid,
          senderName: currentUser.name,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function () {
          return db.collection("chats").doc(currentChatId).update({
            lastMessage: "📎 " + file.name,
            lastMessageTime: firebase.firestore.FieldValue.serverTimestamp()
          });
        }).then(function () { showToast("File sent"); loadChats(); });
        attachInput.value = "";
      });
    }
    attachInput.click();
  }

  function wireButtons() {
    if (sendBtn) sendBtn.addEventListener("click", sendMessage);
    if (messageInput) {
      messageInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
      });
    }
    if (backToList) {
      backToList.addEventListener("click", function () {
        waApp.classList.remove("show-chat");
        currentChatId = null;
        if (unsubscribeMessages) { unsubscribeMessages(); unsubscribeMessages = null; }
        if (emptyState) emptyState.hidden = true;
        activeChat.hidden = false;
        hideEmojiPanel();
      });
    }
    if (searchInput) searchInput.addEventListener("input", renderChatList);
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        currentFilter = btn.dataset.filter || "all";
        renderChatList();
      });
    });
    var headerActions = document.querySelectorAll(".wa-sidebar-header .wa-icon-btn");
    if (headerActions[0]) headerActions[0].addEventListener("click", startNewChat);
    if (headerActions[1]) headerActions[1].addEventListener("click", function () { showToast("RI Student Community"); });
    var expandBtn = document.getElementById("expandChatBtn");
    if (expandBtn) {
      expandBtn.addEventListener("click", function () {
        document.body.classList.toggle("chat-expanded");
        var expanded = document.body.classList.contains("chat-expanded");
        expandBtn.title = expanded ? "Exit expand" : "Expand chat";
        showToast(expanded ? "Expanded view" : "Normal view");
      });
    }
    var chatActions = document.querySelectorAll(".wa-chat-actions .wa-icon-btn:not(.wa-expand-btn)");
    if (chatActions[0]) chatActions[0].addEventListener("click", function () { showToast("Search in chat"); });
    if (chatActions[1]) chatActions[1].addEventListener("click", function () { showToast(chatName.textContent); });
    var inputBtns = document.querySelectorAll(".wa-input-bar .wa-icon-btn");
    if (inputBtns[0]) inputBtns[0].addEventListener("click", toggleEmojiPanel);
    if (inputBtns[1]) inputBtns[1].addEventListener("click", triggerAttach);
  }

  // START
  initUser();
  wireButtons();
  showToast("Connected to RI Student Hub");

  ensureChatsExist()
    .then(function () { return loadChats(); })
    .then(function () { startLiveRefresh(); })
    .catch(function (err) {
      console.error(err);
      showToast("Start error – check console");
      loadChats();
    });
})();