import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./styles.css";
import io from "socket.io-client";
const reactStringReplace = require("react-string-replace");
const emojiName = require("emoji-name-map");
let socket = null;
const ChatRoom = ({ User }) => {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    socket = io(
      "http://ec2-13-53-66-202.eu-north-1.compute.amazonaws.com:3000"
    );
    socket.on("messages", (messages) => {
      setMessages(messages);
    });
    socket.on("new_message", (message) => {
      const newMessage = [...messages, message];
      setMessages(newMessage);
    });
    return () => {
      socket.disconnect();
    };
  });
  return (
    <div>
      {messages.map((m, i) => {
        let replacedText;
        replacedText = reactStringReplace(
          m.content,
          /(https?:\/\/\S+)/g,
          (match, i) => (
            <a
              key={match + i}
              target="_blank"
              rel="noopener noreferrer"
              href={match}
            >
              {match}
            </a>
          )
        );
        var re = /(?:^|\W):(\w+):(?!\w)/g,
          emojiMatch;
        while ((emojiMatch = re.exec(replacedText))) {
          replacedText = replaceEmoji(replacedText, emojiMatch);
        }
        return (
          <li key={i}>
            {" "}
            <p>
              <strong>{m.username}: </strong> {replacedText}
            </p>
          </li>
        );
      })}
      <SendMessageForm User={User} />
    </div>
  );
};
const LoginForm = ({ handleLogin, onLineStatus }) => {
  const [User, SetUser] = useState("Basel");
  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin(User);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={User} onChange={(e) => SetUser(e.target.value)} />
      <button onClick={() => (onLineStatus ? SetUser("") : handleLogin(User))}>
        {onLineStatus ? "Logout" : "Login"}
      </button>
    </form>
  );
};

const SendMessageForm = ({ User }) => {
  const [newMessage, setNewMessage] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    socket.emit(
      "message",
      {
        username: User,
        content: newMessage
      },
      setNewMessage("")
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />
      <button onClick={() => handleSubmit}>Send</button>
    </form>
  );
};
function replaceEmoji(replacedText, emojiMatch) {
  replacedText = reactStringReplace(replacedText, emojiMatch[0], () =>
    emojiName.get(emojiMatch[1])
  );
  return replacedText;
}

function App() {
  let re = /^[\w\s.-]+$/gim;
  const [User, setUser] = useState("");
  const [onLineStatus, setonLineStatus] = useState(false);
  const handleLogin = (User) => {
    setUser(User);
    User.length <= 12 && User.length >= 1 && re.exec(User)
      ? setonLineStatus(true)
      : setonLineStatus(false);
  };

  return (
    <div className="App">
      <LoginForm handleLogin={handleLogin} onLineStatus={onLineStatus} />

      {onLineStatus ? (
        <ChatRoom User={User} />
      ) : (
        <div>
          {" "}
          <p
            style={{
              color: User.length <= 12 && User.length >= 1 ? "green" : "red"
            }}
          >
            The UserName must be between 1 and 12 characters long
          </p>
          <p style={{ color: re.exec(User) ? "green" : "red" }}>
            The UserName can only contain alphanumeric characters, “-”, “_” and
            spaces
          </p>
        </div>
      )}
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
