# Orquestación de Microservicios con PM2

Este proyecto utiliza **PM2** para orquestar dos microservicios de scraping de tasas de cambio:

## Microservicios Incluidos

### 1. **BCV Microservice** (Puerto 3001)
- Scrapea la tasa oficial USD/VES del Banco Central de Venezuela
- Actualiza cada 15 minutos
- Usa Axios + Cheerio (sin navegador)
- Endpoint: `http://localhost:3001`

### 2. **Binance Microservice** (Puerto 3000)
- Scrapea precios P2P de USDT/VES en Binance
- Actualiza cada 5 minutos
- Usa Puppeteer (navegador headless)
- Endpoint: `http://localhost:3000`

---

## Comandos PM2

### Instalación de PM2 (si no lo tienes)
```bash
npm install -g pm2
```

### Iniciar todos los microservicios
```bash
pm2 start ecosystem.config.js
```

### Ver estado de los servicios
```bash
pm2 status
```

### Ver logs en tiempo real
```bash
# Todos los servicios
pm2 logs

# Solo BCV
pm2 logs bcv-microservice

# Solo Binance
pm2 logs binance-microservice
```

### Reiniciar servicios
```bash
# Todos
pm2 restart all

# Individual
pm2 restart bcv-microservice
pm2 restart binance-microservice
```

### Detener servicios
```bash
# Todos
pm2 stop all

# Individual
pm2 stop bcv-microservice
pm2 stop binance-microservice
```

### Eliminar servicios de PM2
```bash
pm2 delete all
# o
pm2 delete bcv-microservice
pm2 delete binance-microservice
```

### Monitoreo en tiempo real
```bash
pm2 monit
```

### Guardar configuración actual (auto-inicio)
```bash
pm2 save
pm2 startup
```

---

## Endpoints Disponibles

### BCV Microservice (Puerto 3001)
- `GET /health` - Estado del servicio
- `GET /scrape` - Scrapear tasa BCV manualmente
- `GET /get-rate` - Obtener última tasa
- `POST /update-rate` - Scrapear y enviar a la app principal
- `GET /config` - Ver configuración

### Binance Microservice (Puerto 3000)
- `GET /health` - Estado del servicio
- `GET /scrape` - Scrapear precios Binance P2P
- `GET /get-averages` - Obtener promedios resumidos
- `POST /update-rate` - Scrapear y enviar a la app principal
- `GET /config` - Ver configuración

---

## Configuración

Las variables de entorno se configuran en `ecosystem.config.js`. Puedes modificar:

- **Puertos**: `PORT`
- **URLs de destino**: `APP_BASE_URL`, `UPDATE_RATE_ENDPOINT`
- **Intervalos de actualización**: `UPDATE_INTERVAL`
- **Timeouts**: `PAGE_TIMEOUT`
- **Reintentos**: `RETRY_ATTEMPTS`

---

## Logs

Los logs se guardan en:
- `./logs/bcv-error.log` - Errores del microservicio BCV
- `./logs/bcv-out.log` - Salida estándar del microservicio BCV
- `./logs/binance-error.log` - Errores del microservicio Binance
- `./logs/binance-out.log` - Salida estándar del microservicio Binance

---

## Troubleshooting

### Si un servicio no inicia:
```bash
# Ver logs detallados
pm2 logs <nombre-servicio> --lines 100

# Reiniciar con logs
pm2 restart <nombre-servicio> --update-env
```

### Si hay problemas de memoria (Binance/Puppeteer):
```bash
# Aumentar límite de memoria en ecosystem.config.js
max_memory_restart: '1G'
```

### Verificar que los puertos estén libres:
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

---

## Uso Recomendado

1. **Desarrollo**: Ejecutar servicios individualmente con `node server.js`
2. **Producción**: Usar PM2 con `pm2 start ecosystem.config.js`
3. **Monitoreo**: `pm2 monit` para ver uso de CPU/memoria en tiempo real
4. **Auto-inicio**: `pm2 save && pm2 startup` para que se inicien al arrancar el sistema

---

## Notas Importantes

- El microservicio BCV usa **Axios + Cheerio** (ligero, sin navegador)
- El microservicio Binance usa **Puppeteer** (requiere más memoria)
- Ambos tienen **cron jobs internos** que ejecutan actualizaciones automáticas
- Los logs se rotan automáticamente por PM2
- Cada servicio tiene **graceful shutdown** para cerrar recursos correctamente

# Desarrollado por: 

- DiegoPtit <diego@diegoptit.com> (Con ayuda asistida de AI)