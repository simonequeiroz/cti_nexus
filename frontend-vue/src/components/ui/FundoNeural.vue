<template>
  <canvas ref="tela" class="block w-full h-full" aria-hidden="true"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  cor: { type: String, default: '0, 110, 183' }, // Azul primário (#006EB7) em RGB.
  corDestaque: { type: String, default: '255, 143, 0' }, // Laranja (#FF8F00) em RGB.
  distanciaLigacao: { type: Number, default: 150 }, // Distância máxima para ligar dois pontos.
  densidade: { type: Number, default: 12000 } // Quanto menor, mais pontos na tela.
})

const tela = ref(null)

let contexto = null
let pontos = []
let largura = 0
let altura = 0
let quadro = null
let observador = null
const mouse = { x: null, y: null }
const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function criarPontos() { // Espalha os pontos pela área do fundo.
  const quantidade = Math.min(140, Math.round((largura * altura) / props.densidade))
  pontos = Array.from({ length: quantidade }, () => ({
    x: Math.random() * largura,
    y: Math.random() * altura,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    raio: Math.random() * 1.6 + 1.2,
    destaque: Math.random() < 0.08 // Alguns pontos laranja, como na identidade da landing.
  }))
}

function ajustarTamanho() { // Acompanha o tamanho da tela e a densidade de pixels.
  const canvas = tela.value
  const escala = window.devicePixelRatio || 1
  largura = canvas.clientWidth
  altura = canvas.clientHeight
  canvas.width = largura * escala
  canvas.height = altura * escala
  contexto.setTransform(escala, 0, 0, escala, 0, 0)
  criarPontos()
  if (reduzirMovimento) desenhar()
}

function desenhar() {
  contexto.clearRect(0, 0, largura, altura)
  const limite = props.distanciaLigacao

  // Linhas entre pontos próximos: quanto mais perto, mais forte a linha.
  for (let i = 0; i < pontos.length; i++) {
    for (let j = i + 1; j < pontos.length; j++) {
      const dx = pontos[i].x - pontos[j].x
      const dy = pontos[i].y - pontos[j].y
      const distancia = Math.hypot(dx, dy)
      if (distancia < limite) {
        contexto.strokeStyle = `rgba(${props.cor}, ${(1 - distancia / limite) * 0.28})`
        contexto.lineWidth = 1
        contexto.beginPath()
        contexto.moveTo(pontos[i].x, pontos[i].y)
        contexto.lineTo(pontos[j].x, pontos[j].y)
        contexto.stroke()
      }
    }

    // Linhas até o mouse, para a rede "reagir" ao usuário.
    if (mouse.x !== null) {
      const distancia = Math.hypot(pontos[i].x - mouse.x, pontos[i].y - mouse.y)
      if (distancia < limite * 1.3) {
        contexto.strokeStyle = `rgba(${props.cor}, ${(1 - distancia / (limite * 1.3)) * 0.45})`
        contexto.beginPath()
        contexto.moveTo(pontos[i].x, pontos[i].y)
        contexto.lineTo(mouse.x, mouse.y)
        contexto.stroke()
      }
    }
  }

  // Os pontos (neurônios).
  for (const ponto of pontos) {
    contexto.fillStyle = ponto.destaque ? `rgba(${props.corDestaque}, 0.85)` : `rgba(${props.cor}, 0.55)`
    contexto.beginPath()
    contexto.arc(ponto.x, ponto.y, ponto.raio, 0, Math.PI * 2)
    contexto.fill()
  }
}

function mover() { // Move cada ponto e faz ele voltar quando bate na borda.
  for (const ponto of pontos) {
    ponto.x += ponto.vx
    ponto.y += ponto.vy
    if (ponto.x < 0 || ponto.x > largura) ponto.vx *= -1
    if (ponto.y < 0 || ponto.y > altura) ponto.vy *= -1
  }
}

function animar() {
  mover()
  desenhar()
  quadro = requestAnimationFrame(animar)
}

function acompanharMouse(evento) {
  const area = tela.value.getBoundingClientRect()
  mouse.x = evento.clientX - area.left
  mouse.y = evento.clientY - area.top
}

function esquecerMouse() {
  mouse.x = null
  mouse.y = null
}

onMounted(() => {
  contexto = tela.value.getContext('2d')
  observador = new ResizeObserver(ajustarTamanho)
  observador.observe(tela.value)

  if (!reduzirMovimento) {
    // O canvas fica atrás do conteúdo, então o mouse é lido na janela.
    window.addEventListener('mousemove', acompanharMouse)
    document.addEventListener('mouseleave', esquecerMouse)
    animar()
  }
})

onUnmounted(() => {
  cancelAnimationFrame(quadro)
  observador?.disconnect()
  window.removeEventListener('mousemove', acompanharMouse)
  document.removeEventListener('mouseleave', esquecerMouse)
})
</script>
