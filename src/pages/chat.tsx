import { useState, useEffect, useRef } from "preact/hooks";
import { Head } from "../components/head";
import { Obfuscated } from "../util/obfuscate";

interface Message {
  id: string;
  user: string;
  content: string;
  timestamp: Date;
}

function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [username, setUsername] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!inputMessage.trim() || !username.trim()) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      user: username,
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputMessage("");
  };

  return (
    <>
      <Head />
      <div class="flex flex-col h-[80vh] max-w-3xl mx-auto">
        <h1 class="text-3xl font-bold text-center mb-6">
          <Obfuscated>Chat Room</Obfuscated>
        </h1>

        {!username ? (
          <div class="flex flex-col items-center gap-4">
            <input
              type="text"
              placeholder="Enter your username"
              class="bg-secondary text-textInverse p-2 rounded-lg w-64"
              value={username}
              onChange={(e) => setUsername((e.target as HTMLInputElement).value)}
            />
          </div>
        ) : (
          <>
            <div class="flex-1 overflow-y-auto bg-secondary rounded-lg p-4 mb-4">
              {messages.map((msg) => (
                <div key={msg.id} class="mb-4">
                  <div class="font-bold text-textInverse">
                    <Obfuscated>{msg.user}</Obfuscated>
                  </div>
                  <div class="text-textInverse">
                    <Obfuscated>{msg.content}</Obfuscated>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} class="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage((e.target as HTMLInputElement).value)}
                placeholder="Type a message..."
                class="flex-1 bg-secondary text-textInverse p-2 rounded-lg"
              />
              <button
                type="submit"
                class="bg-secondary text-textInverse px-4 py-2 rounded-lg hover:opacity-80"
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}

export { Chat };
