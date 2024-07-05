import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const Home: React.FC = () => {
  const [messages, setMessages] = useState<
    { sender: string; content: string; type: string }[]
  >([]);
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);
  const [username, setUsername] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const socketInstance = io("http://localhost:3001");

    socketInstance.on("connect", () => {
      console.log("Connected to server");
    });

    socketInstance.on("username", (username) => {
      setUsername(username);
    });

    socketInstance.on("chatMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socketInstance.on("users", (users) => {
      setUsers(users);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (socket && inputMessage.trim() !== "") {
      const validRecipients = recipients.filter(
        (recipient) => recipient !== socket.id
      );
      if (validRecipients.length > 0) {
        socket.emit("chatMessage", {
          recipients: validRecipients,
          message: inputMessage,
          type: "text",
        });
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "You", content: inputMessage, type: "text" },
        ]);
        setInputMessage("");
      }
    }
  };

  const sendFile = () => {
    if (socket && selectedFile) {
      const validRecipients = recipients.filter(
        (recipient) => recipient !== socket.id
      );
      if (validRecipients.length > 0) {
        const reader = new FileReader();
        reader.onload = () => {
          const fileData = reader.result;
          socket.emit("chatMessage", {
            recipients: validRecipients,
            message: fileData,
            type: selectedFile.type,
            fileName: selectedFile.name,
          });
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              sender: "You",
              content: selectedFile.name,
              type: selectedFile.type,
            },
          ]);
        };
        reader.readAsDataURL(selectedFile);
        setSelectedFile(null);
      }
    }
  };

  const toggleRecipient = (userId: string) => {
    setRecipients((prevRecipients) =>
      prevRecipients.includes(userId)
        ? prevRecipients.filter((id) => id !== userId)
        : [...prevRecipients, userId]
    );
  };

  return (
    <div>
      <h1>Chat WebApp</h1>
      <div>
        <input type="text" placeholder="Username" value={username} readOnly />
      </div>
      <div>
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              <label>
                <input
                  type="checkbox"
                  value={user.id}
                  onChange={() => toggleRecipient(user.id)}
                  disabled={user.id === socket?.id}
                />
                <strong>{user.username}</strong>
              </label>
            </li>
          ))}
        </ul>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
        <input
          type="file"
          onChange={(e) =>
            setSelectedFile(e.target.files ? e.target.files[0] : null)
          }
        />
        <button onClick={sendFile}>Send File</button>
      </div>
      <div>
        <h2>Messages</h2>
        <ul>
          {messages.map((message, index) => (
            <li key={index}>
              <strong>{message.sender}:</strong>
              {message.type === "text" ? (
                message.content
              ) : (
                <a href={message.content} download>
                  {message.content}
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Home;
