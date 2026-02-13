<template>
  <div class="animated-background" :class="{ 'dark-mode': isDarkMode }">
    <canvas ref="canvas" class="bg-canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'stars'
  }
})

const isDarkMode = ref(false)
const canvas = ref(null)
let ctx = null
let animationId = null
let particles = []

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDarkMode.value = true
  }
  
  initCanvas()
  window.addEventListener('resize', handleResize)
  window.addEventListener('themeChange', handleThemeChange)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('themeChange', handleThemeChange)
})

const handleThemeChange = (event) => {
  isDarkMode.value = event.detail.isDarkMode
}

watch(isDarkMode, () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  particles = []
  initCanvas()
})
 
const initCanvas = () => {
  if (!canvas.value) return
  
  ctx = canvas.value.getContext('2d')
  resizeCanvas()
  
  switch (props.type) {
    case 'stars':
      initStars()
      animateStars()
      break
    case 'meteor':
      initMeteor()
      animateMeteor()
      break
    case 'river':
      initRiver()
      animateRiver()
      break
    case 'particles':
      initParticles()
      animateParticles()
      break
  }
}

const resizeCanvas = () => {
  if (!canvas.value) return
  canvas.value.width = window.innerWidth
  canvas.value.height = window.innerHeight
}

const handleResize = () => {
  resizeCanvas()
  particles = []
  switch (props.type) {
    case 'stars':
      initStars()
      animateStars()
      break
    case 'meteor':
      initMeteor()
      animateMeteor()
      break
    case 'river':
      initRiver()
      animateRiver()
      break
    case 'particles':
      initParticles()
      animateParticles()
      break
  }
}

const initStars = () => {
  particles = []
  for (let i = 0; i < 200; i++) {
    particles.push({
      x: Math.random() * canvas.value.width,
      y: Math.random() * canvas.value.height,
      radius: Math.random() * 2,
      alpha: Math.random(),
      speed: Math.random() * 0.5 + 0.1
    })
  }
}

const animateStars = () => {
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  
  particles.forEach(star => {
    ctx.beginPath()
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
    ctx.fillStyle = isDarkMode.value 
      ? `rgba(255, 255, 255, ${star.alpha})`
      : `rgba(100, 126, 234, ${star.alpha})`
    ctx.fill()
    
    star.y -= star.speed
    if (star.y < 0) {
      star.y = canvas.value.height
      star.x = Math.random() * canvas.value.width
    }
  })
  
  animationId = requestAnimationFrame(animateStars)
}

const initMeteor = () => {
  particles = []
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: Math.random() * canvas.value.width,
      y: Math.random() * canvas.value.height,
      length: Math.random() * 100 + 50,
      speed: Math.random() * 3 + 2,
      opacity: Math.random()
    })
  }
}

const animateMeteor = () => {
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  
  particles.forEach(meteor => {
    ctx.beginPath()
    const gradient = ctx.createLinearGradient(
      meteor.x, meteor.y,
      meteor.x - meteor.length, meteor.y - meteor.length
    )
    gradient.addColorStop(0, isDarkMode.value 
      ? `rgba(255, 255, 255, ${meteor.opacity})`
      : `rgba(102, 126, 234, ${meteor.opacity})`)
    gradient.addColorStop(1, 'transparent')
    ctx.strokeStyle = gradient
    ctx.lineWidth = 2
    ctx.moveTo(meteor.x, meteor.y)
    ctx.lineTo(meteor.x - meteor.length, meteor.y - meteor.length)
    ctx.stroke()
    
    meteor.x += meteor.speed
    meteor.y += meteor.speed
    
    if (meteor.x > canvas.value.width + meteor.length || meteor.y > canvas.value.height + meteor.length) {
      meteor.x = Math.random() * canvas.value.width * 0.5
      meteor.y = -meteor.length
    }
  })
  
  animationId = requestAnimationFrame(animateMeteor)
}

const initRiver = () => {
  particles = []
  const waveCount = 5
  for (let i = 0; i < waveCount; i++) {
    particles.push({
      y: canvas.value.height * 0.7 + i * 20,
      amplitude: 30 + i * 10,
      frequency: 0.01 + i * 0.002,
      phase: i * 0.5,
      speed: 0.02 + i * 0.005
    })
  }
}

const animateRiver = () => {
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  
  particles.forEach((wave, index) => {
    ctx.beginPath()
    ctx.moveTo(0, wave.y)
    
    for (let x = 0; x <= canvas.value.width; x += 10) {
      const y = wave.y + Math.sin(x * wave.frequency + wave.phase) * wave.amplitude
      ctx.lineTo(x, y)
    }
    
    const gradient = ctx.createLinearGradient(0, wave.y - wave.amplitude, 0, wave.y + wave.amplitude)
    if (isDarkMode.value) {
      const alpha1 = 0.3 - index * 0.05
      const alpha2 = 0.2 - index * 0.03
      gradient.addColorStop(0, `rgba(102, 126, 234, ${alpha1})`)
      gradient.addColorStop(1, `rgba(118, 75, 162, ${alpha2})`)
    } else {
      const alpha1 = 0.4 - index * 0.07
      const alpha2 = 0.3 - index * 0.05
      gradient.addColorStop(0, `rgba(66, 184, 131, ${alpha1})`)
      gradient.addColorStop(1, `rgba(52, 146, 104, ${alpha2})`)
    }
    
    ctx.fillStyle = gradient
    ctx.fill()
    
    wave.phase += wave.speed
  })
  
  animationId = requestAnimationFrame(animateRiver)
}

const initParticles = () => {
  particles = []
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * canvas.value.width,
      y: Math.random() * canvas.value.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: Math.random() * 4 + 2,
      color: Math.random() > 0.5 ? '#667eea' : '#42b883'
    })
  }
}

const animateParticles = () => {
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  
  particles.forEach(p => {
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
    ctx.fillStyle = isDarkMode.value 
      ? p.color === '#667eea' ? 'rgba(102, 126, 234, 0.6)' : 'rgba(66, 184, 131, 0.6)'
      : p.color === '#667eea' ? 'rgba(102, 126, 234, 0.4)' : 'rgba(66, 184, 131, 0.4)'
    ctx.fill()
    
    p.x += p.vx
    p.y += p.vy
    
    if (p.x < 0 || p.x > canvas.value.width) p.vx *= -1
    if (p.y < 0 || p.y > canvas.value.height) p.vy *= -1
  })
  
  animationId = requestAnimationFrame(animateParticles)
}

watch(() => props.type, () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  particles = []
  initCanvas()
})
</script>

<style scoped>
.animated-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
  transition: background 0.5s ease;
}

.animated-background.dark-mode {
  background: linear-gradient(135deg, #0c2340 0%, #1e3a5f 50%, #2d4a6f 100%);
}

.animated-background:not(.dark-mode) {
  background: linear-gradient(135deg, #ffeef8 0%, #ffd1dc 100%);
}

.bg-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
