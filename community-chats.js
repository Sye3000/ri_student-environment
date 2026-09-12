/**
 * RI Student Environment - Community Chat
 * MySQL / Express API version
 *
 * Uses the existing RI JWT:
 * localStorage["ri_student_token"]
 */

(function () {
  "use strict";

  const API_BASE_URL = "http://192.168.122.10:3000/api/community";
  const TOKEN_KEY = "ri_student_token";

  let currentUser = null;
  let currentChatId = null;
  let currentFilter = "all";
  let allChatsCache = [];
  let emojiPanel = null;
  let attachInput = null;
  let refreshTimer = null;

  const EMOJIS = [
    "😀","😂","😍","🥰","😊","😎","🤔",
    "😢","😡","👍","👎","🙏","👏","🔥",
    "❤️","💙","🎉","✅","📚","💻","🎓",
    "☕","🚀","💡","⭐","🙌","🤝","💪"
  ];

  const chatListEl = document.getElementById("chatList");
  const activeChat = document.getElementById("activeChat");
  const messagesArea = document.getElementById("messagesArea");
  const chatName = document.getElementById("chatName");
  const chatStatus = document.getElementById("chatStatus");
  const chatAvatar = document.getElementById("chatAvatar");
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");
  const backToList = document.getElementById("backToList");
  const waApp = document.querySelector(".wa-app");
  const searchInput = document.getElementById("chatSearch");
  const filterBtns = document.querySelectorAll(".wa-filter");

  /*
   * ---------------------------------------------------------
   * AUTHENTICATION
   * ---------------------------------------------------------
   */

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function requireToken() {
    const token = getToken();

    if (!token) {
      showToast("Please log in to use Community");

      setTimeout(function () {
        window.location.href = "login.html";
      }, 1200);

      throw new Error("Authentication token missing");
    }

    return token;
  }

  /*
   * ---------------------------------------------------------
   * API HELPER
   * ---------------------------------------------------------
   */

  async function apiRequest(endpoint, options = {}) {
    const token = requireToken();

    const config = {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      }
    };

    if (options.body !== undefined) {
      config.body = JSON.stringify(options.body);
    }

    let response;

    try {
      response = await fetch(API_BASE_URL + endpoint, config);
    } catch (error) {
      console.error("Community API connection error:", error);
      throw new Error("Unable to connect to the Community server.");
    }

    let data;

    try {
      data = await response.json();
    } catch (error) {
      throw new Error("Invalid response from Community server.");
    }

    if (!response.ok || data.status === "error") {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = "login.html";
      }

      throw new Error(data.message || "Community request failed.");
    }

    return data;
  }

  /*
   * ---------------------------------------------------------
   * UI HELPERS
   * ---------------------------------------------------------
   */

  function showToast(text) {
    let toast = document.getElementById("wa-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "wa-toast";

      toast.style.cssText =
        "position:fixed;" +
        "bottom:90px;" +
        "left:50%;" +
        "transform:translateX(-50%);" +
        "background:#172554;" +
        "color:#fff;" +
        "padding:10px 18px;" +
        "border-radius:8px;" +
        "font-size:.875rem;" +
        "z-index:9999;" +
        "opacity:0;" +
        "transition:opacity .25s;" +
        "box-shadow:0 4px 16px rgba(0,0,0,.25);" +
        "max-width:90%;" +
        "text-align:center;";

      document.body.appendChild(toast);
    }

    toast.textContent = text;
    toast.style.opacity = "1";

    clearTimeout(toast._timer);

    toast._timer = setTimeout(function () {
      toast.style.opacity = "0";
    }, 2500);
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str || "";
    return d.innerHTML;
  }

  function formatTime(timestamp) {
    if (!timestamp) return "";

    try {
      const date = new Date(timestamp);

      if (isNaN(date.getTime())) {
        return "";
      }

      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      return "";
    }
  }

  function getInitials(name) {
    if (!name) return "ST";

    return name
      .trim()
      .split(/\s+/)
      .map(function (word) {
        return word.charAt(0);
      })
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function getChatDisplayName(conversation) {
    if (conversation.conversation_type === "group") {
      return conversation.title || "Group";
    }

    /*
     * Backend returns member information for direct conversations.
     * Find the member that isn't the current student.
     */
    if (conversation.members && Array.isArray(conversation.members)) {
      const other = conversation.members.find(function (member) {
        return Number(member.student_id) !== Number(currentUser.student_id);
      });

      if (other) {
        return other.full_name || other.student_name || "Student";
      }
    }

    return conversation.title || "Direct message";
  }

  function getChatAvatar(conversation) {
    if (conversation.conversation_type === "group") {
      return getInitials(conversation.title || "Group");
    }

    return getInitials(getChatDisplayName(conversation));
  }

  /*
   * ---------------------------------------------------------
   * CURRENT USER
   * ---------------------------------------------------------
   */

  async function loadCurrentUser() {
    const data = await apiRequest("/students");

    /*
     * We don't use this endpoint as the source of the current
     * student. The JWT already identifies the user.
     *
     * Try to decode the JWT payload locally.
     */
    const token = getToken();

    if (!token) {
      throw new Error("Authentication token missing");
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      currentUser = {
        student_id: payload.student_id,
        email: payload.email,
        role: payload.role
      };
    } catch (error) {
      console.error("Unable to decode JWT:", error);
      throw new Error("Invalid authentication token.");
    }

    /*
     * Find the current student's profile from the student list
     * if available.
     */
    const me = data.students?.find(function (student) {
      return Number(student.student_id) === Number(currentUser.student_id);
    });

    if (me) {
      currentUser = Object.assign({}, currentUser, me);
    }

    updateUserProfile();
  }

  function updateUserProfile() {
    const nameEl = document.querySelector(".wa-user-info strong");
    const smallEl = document.querySelector(".wa-user-info small");
    const avatarEl = document.querySelector(".wa-avatar-self span");

    if (nameEl) {
      nameEl.textContent = currentUser.full_name || "Student";
    }

    if (smallEl) {
      smallEl.textContent = currentUser.campus_name || "RI Student";
    }

    if (avatarEl) {
      avatarEl.textContent = getInitials(currentUser.full_name || "Student");
    }
  }

  /*
   * ---------------------------------------------------------
   * CONVERSATIONS
   * ---------------------------------------------------------
   */

  async function loadChats() {
    try {
      const data = await apiRequest("/conversations");

      allChatsCache = Array.isArray(data.conversations)
        ? data.conversations
        : [];

      renderChatList();

      if (currentChatId) {
        const stillExists = allChatsCache.some(function (chat) {
          return Number(chat.conversation_id) === Number(currentChatId);
        });

        if (!stillExists) {
          currentChatId = null;
          activeChat.hidden = true;
        }
      }

      return data;
    } catch (error) {
      console.error("loadChats error:", error);

      chatListEl.innerHTML =
        '<div style="padding:2rem;text-align:center;color:#b91c1c;font-size:.9rem;">' +
        escapeHtml(error.message) +
        "</div>";

      showToast(error.message);
    }
  }

  function renderChatList() {
    const q = (searchInput?.value || "").toLowerCase().trim();

    const filtered = allChatsCache.filter(function (chat) {
      const name = getChatDisplayName(chat);
      const lastMessage = chat.last_message || "";

      if (
        currentFilter === "groups" &&
        chat.conversation_type !== "group"
      ) {
        return false;
      }

      if (
        currentFilter === "opportunities"
      ) {
        /*
         * Opportunities will later be connected to the
         * notification/opportunity system.
         *
         * Opportunities are not represented by the current chat API.
         */
        return false;
      }

      if (
        currentFilter === "unread" &&
        Number(chat.unread_count || 0) === 0
      ) {
        return false;
      }

      if (
        q &&
        !name.toLowerCase().includes(q) &&
        !lastMessage.toLowerCase().includes(q)
      ) {
        return false;
      }

      return true;
    });

    chatListEl.innerHTML = "";

    if (filtered.length === 0) {
      chatListEl.innerHTML =
        '<div style="padding:2rem;text-align:center;color:#667781;font-size:.9rem;">' +
        "No chats found" +
        "</div>";

      return;
    }

    filtered.forEach(function (chat) {
      const conversationId = Number(chat.conversation_id);
      const name = getChatDisplayName(chat);
      const avatar = getChatAvatar(chat);

      const item = document.createElement("div");

      item.className =
        "wa-chat-item" +
        (Number(currentChatId) === conversationId ? " active" : "");

      item.dataset.id = conversationId;

      const avatarClass =
        chat.conversation_type === "group"
          ? " group"
          : "";

      const unreadCount = Number(chat.unread_count || 0);

      item.innerHTML =
        '<div class="wa-avatar' +
        avatarClass +
        '" style="background:linear-gradient(135deg,#4169E1,#2748A5)">' +
        "<span>" +
        escapeHtml(avatar) +
        "</span>" +
        "</div>" +

        '<div class="wa-chat-meta">' +

        '<div class="wa-chat-top">' +

        '<span class="wa-chat-name">' +
        escapeHtml(name) +
        "</span>" +

        '<span class="wa-chat-time">' +
        formatTime(chat.last_message_at) +
        "</span>" +

        "</div>" +

        '<div class="wa-chat-bottom">' +

        '<span class="wa-chat-preview">' +
        escapeHtml(chat.last_message || "No messages yet") +
        "</span>" +

        (
          unreadCount > 0
            ? '<span class="wa-unread-badge">' +
              unreadCount +
              "</span>"
            : ""
        ) +

        "</div>" +

        "</div>";

      item.addEventListener("click", function () {
        openChat(chat);
      });

      chatListEl.appendChild(item);
    });
  }

  /*
   * ---------------------------------------------------------
   * OPEN CONVERSATION
   * ---------------------------------------------------------
   */

  async function openChat(chat) {
    currentChatId = Number(chat.conversation_id);

    document.querySelectorAll(".wa-chat-item").forEach(function (el) {
      el.classList.toggle(
        "active",
        Number(el.dataset.id) === currentChatId
      );
    });

    const name = getChatDisplayName(chat);

    chatName.textContent = name;

    chatStatus.textContent =
      chat.conversation_type === "group"
        ? "Group conversation"
        : "RI Student";

    chatAvatar.innerHTML =
      "<span>" +
      escapeHtml(getChatAvatar(chat)) +
      "</span>";

    chatAvatar.style.background =
      "linear-gradient(135deg,#4169E1,#2748A5)";

    activeChat.hidden = false;

    if (waApp) {
      waApp.classList.add("show-chat");
    }

    if (messageInput) {
      messageInput.focus();
    }

    hideEmojiPanel();

    await loadMessages(currentChatId);

    /*
     * Mark the conversation read after loading it.
     */
    await markConversationRead(currentChatId);

    /*
     * Refresh the left sidebar so unread badges disappear.
     */
    await loadChats();
  }

  /*
   * ---------------------------------------------------------
   * MESSAGES
   * ---------------------------------------------------------
   */

  async function loadMessages(conversationId) {
    messagesArea.innerHTML =
      '<div style="text-align:center;color:#667781;padding:1rem;">' +
      "Loading messages..." +
      "</div>";

    try {
      const data = await apiRequest(
        "/conversations/" +
        encodeURIComponent(conversationId) +
        "/messages"
      );

      const messages = Array.isArray(data.messages)
        ? data.messages
        : [];

      messagesArea.innerHTML = "";

      const divider = document.createElement("div");
      divider.className = "wa-date-divider";
      divider.textContent = "Messages";
      messagesArea.appendChild(divider);

      if (messages.length === 0) {
        const empty = document.createElement("div");

        empty.style.cssText =
          "text-align:center;color:#667781;padding:1.5rem;font-size:.9rem;";

        empty.textContent =
          "No messages yet. Start the conversation.";

        messagesArea.appendChild(empty);

        return;
      }

      messages.forEach(function (msg) {
        renderMessage(msg);
      });

      messagesArea.scrollTop = messagesArea.scrollHeight;

    } catch (error) {
      console.error("loadMessages error:", error);

      messagesArea.innerHTML =
        '<div style="text-align:center;color:#b91c1c;padding:1.5rem;">' +
        escapeHtml(error.message) +
        "</div>";
    }
  }

  function renderMessage(msg) {
    const isOutgoing =
      Number(msg.sender_id) === Number(currentUser.student_id);

    const row = document.createElement("div");

    row.className =
      "wa-message " +
      (isOutgoing ? "outgoing" : "incoming");

    const senderName =
      msg.sender_name ||
      msg.full_name ||
      "Student";

    const senderHtml =
      !isOutgoing && senderName
        ? '<div class="wa-sender-name">' +
          escapeHtml(senderName) +
          "</div>"
        : "";

    const statusIcon = isOutgoing
      ? '<span class="wa-bubble-status read">' +
        '<i class="fa-solid fa-check-double"></i>' +
        "</span>"
      : "";

    row.innerHTML =
      '<div class="wa-bubble">' +

      senderHtml +

      '<div class="wa-bubble-text">' +
      escapeHtml(msg.message_text || "") +
      "</div>" +

      '<div class="wa-bubble-meta">' +

      '<span class="wa-bubble-time">' +
      formatTime(msg.created_at) +
      "</span>" +

      statusIcon +

      "</div>" +

      "</div>";

    messagesArea.appendChild(row);
  }

  /*
   * ---------------------------------------------------------
   * SEND MESSAGE
   * ---------------------------------------------------------
   */

  async function sendMessage() {
    const text = messageInput.value.trim();

    if (!text || !currentChatId) {
      return;
    }

    sendBtn.disabled = true;
    messageInput.value = "";
    hideEmojiPanel();

    try {
      const data = await apiRequest(
        "/conversations/" +
        encodeURIComponent(currentChatId) +
        "/messages",
        {
          method: "POST",
          body: {
            message_text: text
          }
        }
      );

      if (data.message_data) {
        renderMessage(data.message_data);
        messagesArea.scrollTop = messagesArea.scrollHeight;
      }

      await loadChats();

    } catch (error) {
      console.error("sendMessage error:", error);

      messageInput.value = text;

      showToast(
        "Send failed: " +
        error.message
      );
    } finally {
      sendBtn.disabled = false;
      messageInput.focus();
    }
  }

  /*
   * ---------------------------------------------------------
   * NEW DIRECT CHAT
   * ---------------------------------------------------------
   */

  async function startNewChat() {
    const name = prompt(
      "Enter the student's name, student number or email:"
    );

    if (!name || !name.trim()) {
      return;
    }

    try {
      const search = encodeURIComponent(name.trim());

      const data = await apiRequest(
        "/students?search=" + search
      );

      const students = Array.isArray(data.students)
        ? data.students
        : [];

      if (students.length === 0) {
        showToast("No student found.");
        return;
      }

      if (students.length > 1) {
        const choices = students
          .slice(0, 10)
          .map(function (student, index) {
            return (
              (index + 1) +
              ". " +
              student.full_name +
              " (" +
              student.student_number +
              ")"
            );
          })
          .join("\n");

        const choice = prompt(
          "Select a student:\n\n" +
          choices +
          "\n\nEnter the number:"
        );

        const index = Number(choice) - 1;

        if (
          !Number.isInteger(index) ||
          index < 0 ||
          index >= Math.min(students.length, 10)
        ) {
          return;
        }

        await createDirectConversation(
          students[index]
        );

        return;
      }

      await createDirectConversation(students[0]);

    } catch (error) {
      console.error("startNewChat error:", error);
      showToast(error.message);
    }
  }

  async function createDirectConversation(student) {
    try {
      const data = await apiRequest(
        "/conversations",
        {
          method: "POST",
          body: {
            student_id: Number(student.student_id)
          }
        }
      );

      showToast(
        data.created
          ? "New conversation created"
          : "Conversation opened"
      );

      await loadChats();

      const conversationId =
        data.conversation?.conversation_id ||
        data.conversation_id;

      if (conversationId) {
        const chat = allChatsCache.find(function (item) {
          return Number(item.conversation_id) ===
            Number(conversationId);
        });

        if (chat) {
          await openChat(chat);
        }
      }

    } catch (error) {
      console.error("createDirectConversation error:", error);
      showToast(error.message);
    }
  }

  /*
   * ---------------------------------------------------------
   * READ / UNREAD
   * ---------------------------------------------------------
   */

  async function markConversationRead(conversationId) {
    try {
      await apiRequest(
        "/conversations/" +
        encodeURIComponent(conversationId) +
        "/read",
        {
          method: "POST"
        }
      );
    } catch (error) {
      console.error(
        "markConversationRead error:",
        error
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * BACK TO CHAT LIST
   * ---------------------------------------------------------
   */

  function closeChat() {
    if (waApp) {
      waApp.classList.remove("show-chat");
    }

    currentChatId = null;

    activeChat.hidden = true;

    hideEmojiPanel();
  }

  /*
   * ---------------------------------------------------------
   * EMOJI
   * ---------------------------------------------------------
   */

  function toggleEmojiPanel() {
    if (
      emojiPanel &&
      emojiPanel.style.display === "flex"
    ) {
      hideEmojiPanel();
      return;
    }

    if (!emojiPanel) {
      emojiPanel = document.createElement("div");

      emojiPanel.style.cssText =
        "position:absolute;" +
        "bottom:60px;" +
        "left:12px;" +
        "max-width:320px;" +
        "background:#fff;" +
        "border-radius:12px;" +
        "box-shadow:0 8px 28px rgba(0,0,0,.18);" +
        "padding:10px;" +
        "display:none;" +
        "flex-wrap:wrap;" +
        "gap:4px;" +
        "z-index:50;" +
        "border:1px solid #e2e8f0;";

      EMOJIS.forEach(function (emoji) {
        const button = document.createElement("button");

        button.type = "button";
        button.textContent = emoji;

        button.style.cssText =
          "width:36px;" +
          "height:36px;" +
          "border:none;" +
          "background:transparent;" +
          "font-size:1.25rem;" +
          "cursor:pointer;" +
          "border-radius:8px;";

        button.addEventListener("click", function () {
          messageInput.value += emoji;
          messageInput.focus();
        });

        emojiPanel.appendChild(button);
      });

      const bar =
        document.querySelector(".wa-input-bar");

      if (bar) {
        bar.style.position = "relative";
        bar.appendChild(emojiPanel);
      }
    }

    emojiPanel.style.display = "flex";
  }

  function hideEmojiPanel() {
    if (emojiPanel) {
      emojiPanel.style.display = "none";
    }
  }

  /*
   * ---------------------------------------------------------
   * ATTACHMENT BUTTON
   * ---------------------------------------------------------
   *
   * The backend currently accepts text messages.
   * We therefore don't fake file messages in MySQL.
   *
   * This button is kept ready for the future file-upload API.
   */

  function triggerAttach() {
    showToast(
      "File attachments will be connected after the chat migration."
    );
  }

  /*
   * ---------------------------------------------------------
   * NOTIFICATIONS
   * ---------------------------------------------------------
   */

  async function loadNotifications() {
    try {
      const data = await apiRequest(
        "/notifications"
      );

      console.log(
        "Community notifications:",
        data.notifications || []
      );

      return data;

    } catch (error) {
      console.error(
        "loadNotifications error:",
        error
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * GLOBAL UNREAD COUNT
   * ---------------------------------------------------------
   */

  async function loadGlobalUnread() {
    try {
      const data = await apiRequest("/unread");

      console.log(
        "Global unread messages:",
        data.unread_count
      );

      return Number(data.unread_count || 0);

    } catch (error) {
      console.error(
        "loadGlobalUnread error:",
        error
      );

      return 0;
    }
  }

  /*
   * ---------------------------------------------------------
   * BUTTON WIRING
   * ---------------------------------------------------------
   */

  function wireButtons() {
    if (sendBtn) {
      sendBtn.addEventListener(
        "click",
        sendMessage
      );
    }

    if (messageInput) {
      messageInput.addEventListener(
        "keydown",
        function (event) {
          if (
            event.key === "Enter" &&
            !event.shiftKey
          ) {
            event.preventDefault();
            sendMessage();
          }
        }
      );
    }

    if (backToList) {
      backToList.addEventListener(
        "click",
        closeChat
      );
    }

    if (searchInput) {
      searchInput.addEventListener(
        "input",
        renderChatList
      );
    }

    filterBtns.forEach(function (button) {
      button.addEventListener(
        "click",
        function () {
          filterBtns.forEach(function (btn) {
            btn.classList.remove("active");
          });

          button.classList.add("active");

          currentFilter =
            button.dataset.filter || "all";

          renderChatList();
        }
      );
    });

    const headerActions =
      document.querySelectorAll(
        ".wa-sidebar-header .wa-icon-btn"
      );

    if (headerActions[0]) {
      headerActions[0].addEventListener(
        "click",
        startNewChat
      );
    }

    if (headerActions[1]) {
      headerActions[1].addEventListener(
        "click",
        async function () {
          const unread =
            await loadGlobalUnread();

          showToast(
            unread > 0
              ? unread +
                " unread message" +
                (unread === 1 ? "" : "s")
              : "No unread messages"
          );
        }
      );
    }

    const chatActions =
      document.querySelectorAll(
        ".wa-chat-actions .wa-icon-btn"
      );

    if (chatActions[0]) {
      chatActions[0].addEventListener(
        "click",
        function () {
          showToast("Chat search coming next");
        }
      );
    }

    if (chatActions[1]) {
      chatActions[1].addEventListener(
        "click",
        function () {
          showToast(
            chatName.textContent ||
            "Community"
          );
        }
      );
    }

    const inputButtons =
      document.querySelectorAll(
        ".wa-input-bar .wa-icon-btn"
      );

    if (inputButtons[0]) {
      inputButtons[0].addEventListener(
        "click",
        toggleEmojiPanel
      );
    }

    if (inputButtons[1]) {
      inputButtons[1].addEventListener(
        "click",
        triggerAttach
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * LIVE REFRESH
   * ---------------------------------------------------------
   *
  * The REST backend does not use WebSockets yet.
   * Our REST backend doesn't use WebSockets yet.
   *
   * We therefore refresh the conversation list periodically.
   * Messages refresh every 5 seconds while a conversation is open.
   */

  function startLiveRefresh() {
    clearInterval(refreshTimer);

    refreshTimer = setInterval(
      async function () {
        await loadChats();

        if (currentChatId) {
          await loadMessages(currentChatId);
        }

        await loadGlobalUnread();

      },
      5000
    );

    window.addEventListener(
      "focus",
      async function () {
        await loadChats();

        if (currentChatId) {
          await loadMessages(currentChatId);
        }
      }
    );
  }

  /*
   * ---------------------------------------------------------
   * START APPLICATION
   * ---------------------------------------------------------
   */

  async function init() {
    try {
      requireToken();

      wireButtons();

      showToast(
        "Connecting to RI Student Community..."
      );

      await loadCurrentUser();

      await loadChats();

      await loadNotifications();

      await loadGlobalUnread();

      startLiveRefresh();

      showToast(
        "Connected to RI Student Community"
      );

    } catch (error) {
      console.error(
        "Community initialization error:",
        error
      );

      if (error.message !== "Authentication token missing") {
        showToast(
          "Community connection failed"
        );
      }
    }
  }

  init();

})();
