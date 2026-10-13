import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * ModalPortal — renderiza sus hijos directamente en document.body,
 * escapando de cualquier ancestro con transform/will-change/overflow-hidden
 * que rompería position:fixed en los descendientes.
 */
interface ModalPortalProps {
  children: React.ReactNode;
}

export const ModalPortal: React.FC<ModalPortalProps> = ({ children }) => {
  const el = useRef<HTMLDivElement>(document.createElement('div'));

  useEffect(() => {
    const container = el.current;
    // El div portal es puro contenedor sin estilos propios
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.zIndex = '9999';
    container.style.pointerEvents = 'none'; // el backdrop/panel manejan sus propios clicks
    document.body.appendChild(container);
    return () => {
      document.body.removeChild(container);
    };
  }, []);

  return createPortal(children, el.current);
};
