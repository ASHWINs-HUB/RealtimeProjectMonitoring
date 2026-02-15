// src/services/useSocket.js
import { useEffect, useRef } from 'react';
import socket from './socket';

export function useSocket(event, handler, deps = []) {
  const savedHandler = useRef();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!event) return;
    function eventListener(...args) {
      if (savedHandler.current) {
        savedHandler.current(...args);
      }
    }
    socket.on(event, eventListener);
    return () => {
      socket.off(event, eventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]);
}

export default useSocket;
