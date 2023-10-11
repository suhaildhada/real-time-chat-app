import "./style.css";
import { io } from "socket.io-client";

const socket = io("http://localhost:3003");

//vars

let userId = null;
let username = null;

// Screens, Containers

const initialScreen = document.getElementById("initialScreen");
const chatScreen = document.getElementById("chatScreen");
const alertMessage = document.getElementById("alert-message");
const alertContainer = document.getElementById("alert-container");

// Elements (Buttons, Inputs...)

//initialScreen
const usernameInput = document.getElementById("usernameInput");
const createNewRoomButton = document.getElementById("createNewRoomButton");
const roomIdInput = document.getElementById("roomIdInput");
const joinRoomButton = document.getElementById("joinRoomButton");

//chatScreen
const roomIdText = document.getElementById("roomIdText");
const messageInput = document.getElementById("messageInput");
const sendMessageButton = document.getElementById("sendMessageButton");
const chatBox = document.getElementById("chatBox");
//listeners
createNewRoomButton.addEventListener("click", handleCreateNewRoom);
joinRoomButton.addEventListener("click", handleJoinRoom);
roomIdText.addEventListener("click", () => {
  navigator.clipboard.writeText(roomIdText.innerText);
  showAlert("Room ID copied!", "success", 1500);
});

messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    handleSendMessage();
  }
});

sendMessageButton.addEventListener("click", handleSendMessage);

//socket listeners

socket.on("unknownRoom", () => {
  console.log("unknownRoom");
  reset();
  showAlert("No Such Room");
});
socket.on("roomJoined", (userIdFromServer, roomId, username) => {
  userId = userIdFromServer;
  roomIdText.innerText = roomId;
});

socket.on("userJoined", (username, userIdFromServer) => {
  const user = userId === userIdFromServer ? "You" : username;
  const text = `${user} Joined the chat!`;

  if (userId === userIdFromServer) {
    createMessageBoxForMe(text);
  } else {
    createMessageBoxForYou(text, username, false);
  }
});

socket.on("message", handleNewMessage);

socket.on("userLeft", (username) => {
  const message = `${username} left the chat.`;
  createMessageBoxForYou(message, username, false);
});

function handleNewMessage(newMessage, userIdFromServer, username) {
  if (userId === userIdFromServer) {
    createMessageBoxForMe(newMessage);
  } else {
    createMessageBoxForYou(newMessage, username);
  }
}

function createWrapper(me = true) {
  const wrapper = document.createElement("div");
  if (me) {
    wrapper.classList.add("me-wrapper");
  }

  return wrapper;
}

function createMessageBoxForMe(message) {
  const wrapper = createWrapper();
  const div = document.createElement("div");
  div.classList.add("me", "chat-item");
  const p = document.createElement("p");
  p.innerText = message;
  div.appendChild(p);
  wrapper.appendChild(div);
  chatBox.appendChild(wrapper);
}

function createMessageBoxForYou(message, username, includeUsername = true) {
  const wrapper = createWrapper(false);
  const div = document.createElement("div");
  div.classList.add("you", "chat-item");

  if (includeUsername) {
    const span = document.createElement("span");
    span.classList.add("contact-name");
    span.innerText = username;
    div.appendChild(span);
  }

  const p = document.createElement("p");
  p.innerText = message;

  div.appendChild(p);
  wrapper.appendChild(div);
  chatBox.appendChild(wrapper);
}

function handleCreateNewRoom() {
  if (!checkUsername()) return;
  socket.emit("createNewChatRoom", usernameInput.value);
  showChatScreen();
}

function showChatScreen() {
  initialScreen.style.display = "none";
  chatScreen.style.display = "block";
}

function handleJoinRoom() {
  if (!checkUsername()) return;
  if (!roomIdInput.value) {
    showAlert("Enter room code.");
    return;
  }
  socket.emit("joinChatRoom", roomIdInput.value, usernameInput.value);
  showChatScreen();
}

function checkUsername() {
  if (!usernameInput.value) {
    showAlert("Please enter your username.");
    return false;
  }
  username = usernameInput.value;
  return true;
}

function reset() {
  userId = null;
  username = null;
  usernameInput.value = "";
  roomIdInput.value = "";
  roomIdText.innerText = "";
  initialScreen.style.display = "block";
  chatScreen.style.display = "none";
}

function showAlert(msg, type = "danger", ms = 2000) {
  alertContainer.style.display = "block";
  alertContainer.classList.add("alert-display");
  alertMessage.classList.add(`alert-${type}`);
  alertMessage.innerText = msg;

  setTimeout(() => {
    alertMessage.innerText = "";
    alertContainer.style.display = "none";
    alertContainer.classList.remove("alert-display");
    alertMessage.classList.remove(`alert-${type}`);
  }, ms);
}

function handleSendMessage() {
  if (!messageInput.value) return;
  socket.emit("message", messageInput.value);
  messageInput.value = "";
}
