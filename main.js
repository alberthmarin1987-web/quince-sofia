;(function () {
  // URL de tu aplicación web en Google Apps Script (Ya configurada)
  const DATABASE_URL = 'https://script.google.com/macros/s/AKfycbxjPwPP7o0HTFYDJON8KoyCtqwfOFT5TZyPFOahg2wOY1KwaXVk5lgpVNMTMqpJNVk3mQ/exec'

  // Fecha exacta del evento: Sábado 28 de Noviembre de 2026 a las 6:30 PM (Misa)
  const fechaEvento = dayjs('2026-11-28T18:30:00')

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

          // Verificamos la esquina inferior izquierda; si ya es transparente (PNG real), no hace falta tocarla
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

  // Modal y envío a Base de Datos (Google Sheets)
  const modal = document.getElementById('rsvp-modal')
  const btnOpenRsvp = document.getElementById('btn-open-rsvp')
  const btnCloseModal = document.getElementById('close-modal')
  const form = document.getElementById('rsvp-form')

  btnOpenRsvp.addEventListener('click', () => {
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
      estado.textContent = 'Hubo un error al guardar. Intenta nuevamente.'
    } finally {
      btnGuardar.disabled = false
      btnGuardar.textContent = 'Enviar Confirmación'
    }
  })
})()