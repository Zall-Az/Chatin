export const sendMessage = async (inputValue, setMessages) => {
    if (!inputValue.trim()) return;
  
    // Pesan pengguna
    const newUserMessage = {
      id: Date.now(),
      text: inputValue,
      sender: "user"
    };
    setMessages(prev => [...prev, newUserMessage]);
  
    // Simulasi respons bot
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        text: "Saya akan mencari informasi tentang itu...",
        sender: "bot"
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };