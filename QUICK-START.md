# ═══════════════════════════════════════════════════════════════════════════
# GUÍA RÁPIDA DE USO - MICROSERVICIOS CON PM2
# ═══════════════════════════════════════════════════════════════════════════

## 🚀 INICIO RÁPIDO

### Windows
```bash
# Doble clic en:
start-pm2.bat

# O desde terminal:
pm2 start ecosystem.config.js
```

### Linux/Mac
```bash
pm2 start ecosystem.config.js
```

---

## 📋 COMANDOS ESENCIALES

### Gestión de Servicios
```bash
pm2 start ecosystem.config.js    # Iniciar todos
pm2 restart all                   # Reiniciar todos
pm2 stop all                      # Detener todos
pm2 delete all                    # Eliminar todos de PM2
```

### Servicios Individuales
```bash
pm2 restart bcv-microservice      # Reiniciar solo BCV
pm2 restart binance-microservice  # Reiniciar solo Binance
pm2 stop bcv-microservice         # Detener solo BCV
pm2 stop binance-microservice     # Detener solo Binance
```

### Monitoreo
```bash
pm2 status                        # Estado de servicios
pm2 logs                          # Logs en tiempo real (todos)
pm2 logs bcv-microservice         # Logs solo BCV
pm2 logs binance-microservice     # Logs solo Binance
pm2 monit                         # Monitor interactivo
```

### Información Detallada
```bash
pm2 info bcv-microservice         # Info detallada BCV
pm2 info binance-microservice     # Info detallada Binance
pm2 describe bcv-microservice     # Descripción completa
```

---

## 🔧 CONFIGURACIÓN AVANZADA

### Auto-inicio al arrancar el sistema
```bash
pm2 save                          # Guardar configuración actual
pm2 startup                       # Configurar auto-inicio
```

### Actualizar variables de entorno
```bash
pm2 restart ecosystem.config.js --update-env
```

### Recargar sin downtime (0-downtime reload)
```bash
pm2 reload all
```

---

## 📊 ENDPOINTS DE LOS SERVICIOS

### BCV Microservice (Puerto 3001)
```bash
# Health check
curl http://localhost:3001/health

# Scrapear manualmente
curl http://localhost:3001/scrape

# Obtener tasa
curl http://localhost:3001/get-rate

# Actualizar en app principal
curl -X POST http://localhost:3001/update-rate

# Ver configuración
curl http://localhost:3001/config
```

### Binance Microservice (Puerto 3000)
```bash
# Health check
curl http://localhost:3000/health

# Scrapear manualmente
curl http://localhost:3000/scrape

# Obtener promedios
curl http://localhost:3000/get-averages

# Actualizar en app principal
curl -X POST http://localhost:3000/update-rate

# Ver configuración
curl http://localhost:3000/config
```

---

## 🐛 TROUBLESHOOTING

### Ver logs de errores
```bash
pm2 logs --err                    # Solo errores
pm2 logs bcv-microservice --lines 100
```

### Reiniciar servicio con problemas
```bash
pm2 restart bcv-microservice --update-env
```

### Limpiar logs
```bash
pm2 flush                         # Limpiar todos los logs
```

### Ver uso de memoria
```bash
pm2 monit                         # Monitor en tiempo real
```

### Si un puerto está ocupado
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Matar proceso por PID
taskkill /PID <PID> /F
```

---

## 📝 ARCHIVOS DE LOG

Los logs se guardan automáticamente en:
- `./logs/bcv-error.log` - Errores BCV
- `./logs/bcv-out.log` - Salida BCV
- `./logs/binance-error.log` - Errores Binance
- `./logs/binance-out.log` - Salida Binance

---

## ⚙️ CONFIGURACIÓN PERSONALIZADA

Para modificar la configuración, edita `ecosystem.config.js`:

```javascript
env: {
    PORT: 3001,                    // Puerto del servicio
    UPDATE_INTERVAL: 15,           // Minutos entre actualizaciones
    PAGE_TIMEOUT: 30000,           // Timeout en ms
    RETRY_ATTEMPTS: 3,             // Reintentos en caso de error
    // ... más opciones
}
```

Después de modificar:
```bash
pm2 restart ecosystem.config.js --update-env
```

---

## 🎯 MEJORES PRÁCTICAS

1. **Desarrollo**: Usa `node server.js` directamente
2. **Producción**: Usa PM2 con `ecosystem.config.js`
3. **Monitoreo**: Revisa `pm2 monit` regularmente
4. **Logs**: Usa `pm2 logs` para debugging
5. **Auto-inicio**: Configura `pm2 save && pm2 startup`

---

## 📌 NOTAS IMPORTANTES

- ✅ BCV usa Axios + Cheerio (ligero, sin navegador)
- ✅ Binance usa Puppeteer (requiere más memoria)
- ✅ Ambos tienen cron jobs internos (actualizaciones automáticas)
- ✅ Graceful shutdown implementado
- ✅ Logs rotados automáticamente por PM2
- ✅ Reinicio automático en caso de crash

---

## 🆘 AYUDA ADICIONAL

```bash
pm2 --help                        # Ayuda general
pm2 start --help                  # Ayuda de start
pm2 logs --help                   # Ayuda de logs
```

Documentación oficial: https://pm2.keymetrics.io/docs/usage/quick-start/
