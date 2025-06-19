export class AnimationEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext('2d');
    this.particles = [];
    this.isRunning = false;
    this.animationId = null;
  }

  // 파티클 시스템
  createParticles(type, count = 50) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: Math.random() * 3 + 1,
        color: this.getParticleColor(type),
        life: 1.0
      });
    }
  }

  getParticleColor(type) {
    const colors = {
      'oxidation': '#ff6b6b',
      'sputtering': '#4ecdc4',
      'evaporation': '#45b7d1',
      'plasma': '#9b59b6'
    };
    return colors[type] || '#95a5a6';
  }

  updateParticles() {
    this.particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 0.01;
      
      // 경계에서 반사
      if (particle.x <= 0 || particle.x >= this.canvas.width) particle.vx *= -1;
      if (particle.y <= 0 || particle.y >= this.canvas.height) particle.vy *= -1;
    });
    
    // 생명이 다한 파티클 제거
    this.particles = this.particles.filter(p => p.life > 0);
  }

  drawParticles() {
    if (!this.ctx) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.particles.forEach(particle => {
      this.ctx.globalAlpha = particle.life;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    this.ctx.globalAlpha = 1.0;
  }

  start(type) {
    this.stop();
    this.isRunning = true;
    this.createParticles(type);
    
    const animate = () => {
      if (!this.isRunning) return;
      
      this.updateParticles();
      this.drawParticles();
      this.animationId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}