import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(0);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL;

    const newSocket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      withCredentials: true
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, setOnlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};