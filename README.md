# Rates Service - Orquestador de Microservicios de Tasas de Cambio

Sistema de microservicios para scrapear y actualizar tasas de cambio USD/VES desde múltiples fuentes.

---

## Estructura del Proyecto

```
rates-service/
├── bcv-microservice/          # Microservicio BCV (Puerto 3001)
│   ├── server.js              # Servidor Express
│   ├── scraper.js             # Scraper con Axios + Cheerio
│   ├── config.js              # Configuración
│   ├── logger.js              # Sistema de logs
│   └── smart-request.js       # Bypass anti-bot
│
├── binance-microservice/      # Microservicio Binance (Puerto 3000)
│   ├── server.js              # Servidor Express
│   ├── scraper.js             # Scraper con Puppeteer
│   ├── config.js              # Configuración
│   ├── logger.js              # Sistema de logs
│   └── smart-request.js       # Bypass anti-bot
│
├── ecosystem.config.js        # Configuración PM2 (ORQUESTADOR)
├── start-pm2.bat             # Iniciar servicios con PM2
├── stop-pm2.bat              # Detener servicios
├── logs-pm2.bat              # Ver logs en tiempo real
├── monitor-pm2.bat           # Monitor interactivo
├── check-status.bat          # Verificar estado
│
├── README.md                 # Este archivo
├── README-PM2.md             # Documentación PM2
└── QUICK-START.md            # Guía rápida
```

---

## Inicio Rápido

### Opción 1: Con PM2 (Recomendado para Producción)

```bash
# Windows - Doble clic en:
start-pm2.bat

# O desde terminal:
pm2 start ecosystem.config.js
```

### Opción 2: Manual (Desarrollo)

```bash
# Terminal 1 - BCV
cd bcv-microservice
node server.js

# Terminal 2 - Binance
cd binance-microservice
node server.js
```

---

## Microservicios Incluidos

### 1. **BCV Microservice** (Puerto 3001)
- **Fuente**: Banco Central de Venezuela (www.bcv.org.ve)
- **Tecnología**: Axios + Cheerio (sin navegador)
- **Actualización**: Cada 15 minutos
- **Endpoint destino**: `/index.php?r=site/update-bcv`
- **Memoria**: ~100-200 MB

**Endpoints:**
- `GET /health` - Estado del servicio
- `GET /scrape` - Scrapear tasa BCV
- `GET /get-rate` - Obtener última tasa
- `POST /update-rate` - Scrapear y enviar a app
- `GET /config` - Ver configuración

### 2. **Binance Microservice** (Puerto 3000)
- **Fuente**: Binance P2P (USDT/VES)
- **Tecnología**: Puppeteer (navegador headless)
- **Actualización**: Cada 5 minutos
- **Endpoint destino**: `/index.php?r=site/update-usdt-rate`
- **Memoria**: ~300-500 MB

**Endpoints:**
- `GET /health` - Estado del servicio
- `GET /scrape` - Scrapear precios Binance
- `GET /get-averages` - Obtener promedios
- `POST /update-rate` - Scrapear y enviar a app
- `GET /config` - Ver configuración

---

## Características

- **Orquestación con PM2**: Gestión centralizada de microservicios  
- **Auto-restart**: Reinicio automático en caso de crash  
- **Cron Jobs**: Actualizaciones automáticas programadas  
- **Logs Estructurados**: Sistema de logging detallado  
- **Graceful Shutdown**: Cierre limpio de recursos  
- **Bypass Anti-Bot**: Sistema inteligente para evadir protecciones  
- **Health Checks**: Endpoints de verificación de estado  
- **Navegador Persistente**: Optimización de recursos (Binance)  

---

## Configuración

### Variables de Entorno

Edita `ecosystem.config.js` para modificar:

```javascript
env: {
    PORT: 3001,                              // Puerto del servicio
    APP_BASE_URL: 'https://...',             // URL de la app principal
    UPDATE_RATE_ENDPOINT: '/index.php?...',  // Endpoint de actualización
    UPDATE_INTERVAL: 15,                     // Minutos entre actualizaciones
    PAGE_TIMEOUT: 30000,                     // Timeout en ms
    RETRY_ATTEMPTS: 3                        // Reintentos
}
```

---

## Comandos PM2

### Gestión Básica
```bash
pm2 start ecosystem.config.js    # Iniciar
pm2 status                        # Estado
pm2 logs                          # Logs en tiempo real
pm2 monit                         # Monitor interactivo
pm2 restart all                   # Reiniciar
pm2 stop all                      # Detener
pm2 delete all                    # Eliminar de PM2
```

### Servicios Individuales
```bash
pm2 restart bcv-microservice
pm2 restart binance-microservice
pm2 logs bcv-microservice
pm2 logs binance-microservice
```

### Auto-inicio
```bash
pm2 save                          # Guardar configuración
pm2 startup                       # Configurar auto-inicio
```

---

## Testing

### Verificar Estado
```bash
# Windows
check-status.bat

# Manual
curl http://localhost:3001/health
curl http://localhost:3000/health
```

### Scrapear Manualmente
```bash
curl http://localhost:3001/scrape
curl http://localhost:3000/scrape
```

### Actualizar en App Principal
```bash
curl -X POST http://localhost:3001/update-rate
curl -X POST http://localhost:3000/update-rate
```

---

## Logs

Los logs se guardan en:
- `./logs/bcv-error.log` - Errores BCV
- `./logs/bcv-out.log` - Salida BCV
- `./logs/binance-error.log` - Errores Binance
- `./logs/binance-out.log` - Salida Binance

Cada microservicio también guarda logs detallados en:
- `./bcv-microservice/logs/`
- `./binance-microservice/logs/`

---

## Troubleshooting

### Servicio no inicia
```bash
pm2 logs <nombre-servicio> --lines 100
pm2 restart <nombre-servicio> --update-env
```

### Puerto ocupado
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Problemas de memoria (Binance)
Edita `ecosystem.config.js`:
```javascript
max_memory_restart: '1G'  // Aumentar límite
```

### Ver logs de errores
```bash
pm2 logs --err
```

---

## Documentación Adicional

- **[README-PM2.md](./README-PM2.md)** - Documentación completa de PM2
- **[QUICK-START.md](./QUICK-START.md)** - Guía rápida de comandos

---

## Uso Recomendado

| Entorno | Método | Comando |
|---------|--------|---------|
| **Desarrollo** | Manual | `node server.js` |
| **Producción** | PM2 | `pm2 start ecosystem.config.js` |
| **Testing** | Manual | `node server.js` |
| **Staging** | PM2 | `pm2 start ecosystem.config.js` |

---

## Notas Importantes

- **BCV** usa Axios + Cheerio (ligero, ideal para scraping simple)
- **Binance** usa Puppeteer (más pesado, necesario para JavaScript dinámico)
- Ambos tienen **cron jobs internos** que ejecutan actualizaciones automáticas
- Los **logs rotan automáticamente** con PM2
- Implementado **graceful shutdown** para cerrar recursos correctamente
- Sistema de **bypass anti-bot** para InfinityFree

---

## Soporte

Para más información:
- PM2 Docs: https://pm2.keymetrics.io/docs/
- Puppeteer Docs: https://pptr.dev/
- Cheerio Docs: https://cheerio.js.org/

---

## Licencia

Este proyecto es privado y de uso interno. (Se permite el fork del proyecto, y del orquestador)

---

**Desarrollado para el sistema de inventario Hava**
