
import { useEffect, useState } from 'react';

const CursorAnimation = () => {
  const [isActive, setIsActive] = useState(false);
  
  useEffect(() => {
    // Create cursor element if it doesn't exist
    if (!document.querySelector('.cursor')) {
      const cursor = document.createElement('div');
      cursor.classList.add('cursor');
      document.body.appendChild(cursor);
    }

    const cursor = document.querySelector('.cursor') as HTMLElement;
    
    const moveCursor = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    };

    const onMouseDown = () => {
      setIsActive(true);
      cursor.classList.add('active');
    };

    const onMouseUp = () => {
      setIsActive(false);
      cursor.classList.remove('active');
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    // Add hover effect to all hover-this elements
    const hoverLinks = document.querySelectorAll('.hover-this');
    hoverLinks.forEach(link => {
      link.addEventListener('mouseleave', () => {
        cursor.style.transform = 'translate(-50%, -50%)';
        cursor.style.background = 'transparent';
      });
      link.addEventListener('mouseenter', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
        cursor.style.background = 'rgba(122, 30, 31, 0.1)';
      });
    });

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      hoverLinks.forEach(link => {
        link.removeEventListener('mouseleave', () => {});
        link.removeEventListener('mouseenter', () => {});
      });
    };
  }, [isActive]);

  return null;
};

export default CursorAnimation;
