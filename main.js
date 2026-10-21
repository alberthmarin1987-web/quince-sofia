;(function () {
  // URL de tu aplicación web en Google Apps Script
  const DATABASE_URL = 'https://script.google.com/macros/s/AKfycbxjPwPP7o0HTFYDJON8KoyCtqwfOFT5TZyPFOahg2wOY1KwaXVk5lgpVNMTMqpJNVk3mQ/exec'

  // Fecha exacta del evento: Sábado 28 de Noviembre de 2026 a las 6:30 PM (Misa)
  const fechaEvento = dayjs('2026-11-28T18:30:00')

  // Fecha límite para recibir registros: 5 de Noviembre de 2026 a las 23:59
  const fechaLimiteRegistro = dayjs('2026-11-05T23:59:59')

  // Configuración de música de fondo
  const audio = new Audio('./assets/musica.mp3')
  audio.loop = true
  audio.volume = 0.5
  let reproduciendo = false

  const welcomeScreen = document.getElementById('welcome-screen')
  const btnOpenInvite = document.getElementById('btn-open-invite')
  const musicToggle = document.getElementById('music-toggle')

  // Leer si viene el nombre del invitado en el enlace (?invitado=Familia...)
  const params = new URLSearchParams(window.location.search)
  const invitadoParam = params.get('invitado') || ''

  if (invitadoParam) {
    document.getElementById('welcome-guest-name').textContent = `Invitación para: ${invitadoParam}`
    document.getElementById('guest-name-banner').textContent = invitadoParam
    document.getElementById('input-nombre').value = invitadoParam
  }

  // Abrir invitación y reproducir música
  btnOpenInvite.addEventListener('click', () => {
    welcomeScreen.style.opacity = '0'
    setTimeout(() => welcomeScreen.classList.add('hidden'), 600)
    musicToggle.classList.remove('hidden')

    audio.play().then(() => {
      reproduciendo = true
      musicToggle.textContent = '🔊'
    }).catch((err) => {
      console.log('Audio esperando interacción:', err)
      reproduciendo = false
      musicToggle.textContent = '🔇'
    })
  })

  // Botón flotante para silenciar o activar música
  musicToggle.addEventListener('click', () => {
    if (reproduciendo) {
      audio.pause()
      musicToggle.textContent = '🔇'
    } else {
      audio.play()
      musicToggle.textContent = '🔊'
    }
    reproduciendo = !reproduciendo
  })

  // Reloj de cuenta regresiva
  const actualizarCuentaRegresiva = () => {
    const ahora = dayjs()
    if (ahora.isAfter(fechaEvento)) {
      document.getElementById('days').textContent = '00'
      document.getElementById('hours').textContent = '00'
      document.getElementById('minutes').textContent = '00'
      document.getElementById('seconds').textContent = '00'
      return
    }

    const diff = fechaEvento.diff(ahora, 'second')
    const days = Math.floor(diff / 86400)
    const hours = Math.floor((diff % 86400) / 3600)
    const minutes = Math.floor((diff % 3600) / 60)
    const seconds = diff % 60

    document.getElementById('days').textContent = String(days).padStart(2, '0')
    document.getElementById('hours').textContent = String(hours).padStart(2, '0')
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0')
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0')
  }

  actualizarCuentaRegresiva()
  setInterval(actualizarCuentaRegresiva, 1000)

  // Si la imagen fue convertida de PNG a JPG con fondo negro, lo vuelve transparente automáticamente
  const asegurarTransparenciaBotones = () => {
    const imagenesBotones = document.querySelectorAll('.btn-graphic')
    imagenesBotones.forEach((img) => {
      const procesar = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          ctx.drawImage(img, 0, 0)

          const esquina = ctx.getImageData(0, canvas.height - 1, 1, 1).data
          if (esquina[3] === 0) return

          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imgData.data

          for (let i = 0; i < data.length; i += 4) {
            if (data[i] < 22 && data[i + 1] < 22 && data[i + 2] < 22) {
              data[i + 3] = 0
            }
          }
          ctx.putImageData(imgData, 0, 0)
          img.src = canvas.toDataURL('image/png')
        } catch (e) {}
      }
      if (img.complete && img.naturalWidth > 0) {
        procesar()
      } else {
        img.addEventListener('load', procesar, { once: true })
      }
    })
  }
  asegurarTransparenciaBotones()

  // Modal y envío a Base de Datos (Google Sheets) con bloqueo por fecha (5 de Noviembre)
  const modal = document.getElementById('rsvp-modal')
  const btnOpenRsvp = document.getElementById('btn-open-rsvp')
  const btnCloseModal = document.getElementById('close-modal')
  const form = document.getElementById('rsvp-form')

  btnOpenRsvp.addEventListener('click', () => {
    const ahora = dayjs()
    if (ahora.isAfter(fechaLimiteRegistro)) {
      alert('El plazo para confirmar asistencia finalizó el 5 de Noviembre de 2026. ¡Muchas gracias a todos por responder!')
      return
    }
    modal.classList.remove('hidden')
  })

  btnCloseModal.addEventListener('click', () => {
    modal.classList.add('hidden')
  })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const btnGuardar = document.getElementById('btn-guardar')
    const estado = document.getElementById('estado-envio')

    const datos = {
      nombre: document.getElementById('input-nombre').value.trim(),
      telefono: document.getElementById('input-telefono').value.trim(),
      asistencia: document.getElementById('input-asistencia').value,
      invitado_url: invitadoParam || 'Enlace directo'
    }

    btnGuardar.disabled = true
    btnGuardar.textContent = 'Guardando...'
    estado.textContent = ''

    try {
      await fetch(DATABASE_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(datos)
      })

      estado.style.color = '#2e7d32'
      estado.textContent = '¡Confirmación registrada con éxito! Muchas gracias.'
      form.reset()

      setTimeout(() => {
        modal.classList.add('hidden')
        estado.textContent = ''
      }, 2000)
    } catch (error) {
      estado.style.color = '#c62828'
      estado.textContent = 'Hubo al registrar. Intenta nuevamente.'
    } finally {
      btnGuardar.disabled = false
      btnGuardar.textContent = 'Enviar Confirmación'
    }
  })

  // --- EFECTO VISUAL: ESCARCHA CAYENDO Y DESTELLOS DE LUZ ---
  const iniciarEfectosMagicos = () => {
    const canvas = document.getElementById('sparkle-canvas')
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const ajustarTamano = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    ajustarTamano()
    window.addEventListener('resize', ajustarTamano)

    const colores = ['#ffffff', '#f8e8ff', '#e0aaff', '#ffd6ff', '#c77dff']
    const particulas = Array.from({ length: 65 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3.2 + 1,
      speedY: Math.random() * 1.1 + 0.4,
      speedX: (Math.random() - 0.5) * 0.6,
      color: colores[Math.floor(Math.random() * colores.length)],
      alpha: Math.random(),
      alphaSpeed: Math.random() * 0.025 + 0.008,
      esEstrella: Math.random() > 0.65
    }))

    const dibujarEstrella = (cx, cy, radio, color, alpha) => {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = color
      ctx.shadowBlur = 10
      ctx.shadowColor = '#e0aaff'
      ctx.beginPath()
      for (let i = 0; i < 4; i++) {
        ctx.lineTo(
          cx + Math.cos((i * Math.PI) / 2) * radio * 2.4,
          cy + Math.sin((i * Math.PI) / 2) * radio * 2.4
        )
        ctx.lineTo(
          cx + Math.cos(((i + 0.5) * Math.PI) / 2) * (radio * 0.5),
          cy + Math.sin(((i + 0.5) * Math.PI) / 2) * (radio * 0.5)
        )
      }
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    const animarEscarcha = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particulas.forEach((p) => {
        p.y += p.speedY
        p.x += p.speedX + Math.sin(p.y * 0.02) * 0.3
        p.alpha += p.alphaSpeed

        if (p.alpha >= 1 || p.alpha <= 0.15) p.alphaSpeed *= -1
        if (p.y > canvas.height) {
          p.y = -10
          p.x = Math.random() * canvas.width
        }

        if (p.esEstrella) {
          dibujarEstrella(p.x, p.y, p.size, p.color, Math.max(0, Math.min(1, p.alpha)))
        } else {
          ctx.save()
          ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha))
          ctx.fillStyle = p.color
          ctx.shadowBlur = 6
          ctx.shadowColor = '#ffffff'
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      })
      requestAnimationFrame(animarEscarcha)
    }
    animarEscarcha()
  }

  iniciarEfectosMagicos()
})()
