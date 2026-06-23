
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const StoryAnimation = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = 300;
    canvas.height = 300;
    
    // Circle properties
    const circles: Circle[] = [];
    for (let i = 0; i < 15; i++) {
      circles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 20 + 5,
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2,
        color: `rgba(${Math.floor(Math.random() * 250)}, 30, 30, ${Math.random() * 0.5 + 0.3})`,
      });
    }
    
    // Animation function
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw and update circles
      circles.forEach(circle => {
        // Draw circle
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fillStyle = circle.color;
        ctx.fill();
        ctx.closePath();
        
        // Move circle
        circle.x += circle.dx;
        circle.y += circle.dy;
        
        // Bounce off edges
        if (circle.x + circle.radius > canvas.width || circle.x - circle.radius < 0) {
          circle.dx = -circle.dx;
        }
        if (circle.y + circle.radius > canvas.height || circle.y - circle.radius < 0) {
          circle.dy = -circle.dy;
        }
      });
      
      // Draw gifs over the animation
      for (let i = 0; i < 3; i++) {
        ctx.font = '20px serif';
        ctx.fillStyle = '#4f090c';
        ctx.fillText('V&S', 100 + i * 50, 150 + Math.sin(Date.now() / 1000 + i) * 20);
      }
      
      // Continue animation
      requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
    
    // Cleanup
    return () => {
      // Cancel animation if component unmounts
      cancelAnimationFrame(0);
    };
  }, []);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-[300px] h-[300px] rounded-lg overflow-hidden shadow-xl"
    >
      <canvas ref={canvasRef} className="w-full h-full"></canvas>
    </motion.div>
  );
};

interface Circle {
  x: number;
  y: number;
  radius: number;
  dx: number;
  dy: number;
  color: string;
}

export default StoryAnimation;
