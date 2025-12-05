const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const config = require('./config');
const { scrapeBCV } = require('./scraper');
const { smartPost, isAntiBotChallenge } = require('./smart-request');
const { createEndpointLogger } = require('./logger');

const app = express();
app.use(express.json());

// Logger middleware simple
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

/**
 * Endpoint de salud
 */
app.get('/health', (req, res) => {
    const logger = createEndpointLogger('health');
    const startTime = Date.now();

    const response = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'BCV Scraper (Binance Scraper Fork)',
        version: '1.0.0'
    };

    logger.logSuccess(req, { data: response }, Date.now() - startTime);
    res.json(response);
});

/**
 * Endpoint para scrapear precios manualmente
 */
app.get('/scrape', async (req, res) => {
    const logger = createEndpointLogger('scrape');
    const startTime = Date.now();

    try {
        const result = await scrapeBCV();

        logger.logSuccess(req, {
            data: {
                success: result.success,
                rate: result.data?.rate,
                date: result.data?.date
            }
        }, Date.now() - startTime);

        res.json(result);
    } catch (error) {
        logger.logError(req, error, Date.now() - startTime);

        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Endpoint para obtener la tasa del BCV
 */
app.get('/get-rate', async (req, res) => {
    const logger = createEndpointLogger('get-rate');
    const startTime = Date.now();

    try {
        const result = await scrapeBCV();

        if (!result.success) {
            logger.logError(req, new Error(result.error || 'Scraping failed'), Date.now() - startTime);

            return res.status(500).json({
                success: false,
                error: result.error,
                timestamp: result.timestamp
            });
        }

        // Devolver únicamente los datos de la tasa
        const response = {
            success: true,
            timestamp: result.timestamp,
            data: {
                rate: result.data.rate,
                date: result.data.date,
                rawPrice: result.data.rawPrice,
                rawDate: result.data.rawDate
            }
        };

        logger.logSuccess(req, { data: response.data }, Date.now() - startTime);
        res.json(response);

    } catch (error) {
        logger.logError(req, error, Date.now() - startTime);

        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Endpoint principal: Scrapear y actualizar precio en la aplicación
 */
app.post('/update-rate', async (req, res) => {
    const logger = createEndpointLogger('update-rate');
    const startTime = Date.now();

    try {
        console.log('\n' + '='.repeat(80));
        console.log('█ INICIANDO PROCESO DE ACTUALIZACIÓN');
        console.log('='.repeat(80));
        console.log(`█ Timestamp: ${new Date().toISOString()}`);

        // 1. Scrapear tasa del BCV
        console.log('\n█ PASO 1: Scraping de BCV...');
        const scrapeResult = await scrapeBCV();

        if (!scrapeResult.success) {
            throw new Error(`Scraping falló: ${scrapeResult.error}`);
        }

        const rate = scrapeResult.data.rate;
        console.log(`█ Scraping exitoso`);
        console.log(`  • Tasa USD/VES: ${rate}`);
        console.log(`  • Fecha: ${scrapeResult.data.date}`);
        console.log(`  • Precio raw: ${scrapeResult.data.rawPrice}`);
        console.log(`  • Fecha raw: ${scrapeResult.data.rawDate}`);

        // 2. Preparar actualización a la aplicación principal
        const updateUrl = `${config.APP_BASE_URL}${config.UPDATE_RATE_ENDPOINT}`;
        console.log('\n█ PASO 2: Preparando envío al servidor destino');
        console.log(`  • URL destino: ${updateUrl}`);

        // Preparar datos como objeto para smartPost
        const postData = {
            rate: rate,
            date: scrapeResult.data.date,
            source: 'bcv-scraper',
            metadata: JSON.stringify({
                rate: rate,
                date: scrapeResult.data.date,
                rawPrice: scrapeResult.data.rawPrice,
                rawDate: scrapeResult.data.rawDate,
                timestamp: scrapeResult.timestamp
            })
        };

        console.log('\n█ DATOS A ENVIAR (POST):');
        console.log(`  • rate: ${rate}`);
        console.log(`  • date: ${scrapeResult.data.date}`);
        console.log(`  • source: bcv-scraper`);
        console.log(`  • metadata: ${postData.metadata}`);

        console.log('\n█ HEADERS A ENVIAR:');
        console.log('  • Content-Type: application/x-www-form-urlencoded');
        console.log('  • User-Agent: BCVScraper/1.0');

        // 3. Enviar al servidor con bypass anti-bot
        console.log('\n█ PASO 3: Enviando request HTTP POST (con bypass anti-bot)...');
        const requestStartTime = Date.now();

        const updateResponse = await smartPost(updateUrl, postData, {
            timeout: 15000,
            userAgent: 'BCVScraper/1.0'
        });

        const requestDuration = Date.now() - requestStartTime;

        // 4. Mostrar respuesta DETALLADA del servidor
        console.log('\n' + '='.repeat(80));
        console.log('█ RESPUESTA DEL SERVIDOR DESTINO');
        console.log('='.repeat(80));
        console.log(`  • Tiempo de respuesta: ${requestDuration}ms`);
        console.log(`  • Status Code: ${updateResponse.status}`);
        console.log(`  • Status Text: ${updateResponse.statusText || 'OK'}`);

        if (updateResponse.finalUrl) {
            console.log(`  • URL Final: ${updateResponse.finalUrl}`);
        }

        console.log('\n█ RESPONSE HEADERS:');
        if (updateResponse.headers && Object.keys(updateResponse.headers).length > 0) {
            Object.keys(updateResponse.headers).forEach(key => {
                console.log(`  • ${key}: ${updateResponse.headers[key]}`);
            });
        } else {
            console.log('  (No disponibles - usado con Puppeteer)');
        }

        console.log('\n█ RESPONSE DATA (Contenido completo):');
        console.log('  Tipo de dato:', typeof updateResponse.data);
        if (typeof updateResponse.data === 'string') {
            console.log('  Longitud:', updateResponse.data.length, 'caracteres');
            console.log('  Primeros 1000 caracteres:');
            console.log('  ---');
            console.log(updateResponse.data.substring(0, 1000));
            console.log('  ---');
            if (updateResponse.data.length > 1000) {
                console.log(`  ... (${updateResponse.data.length - 1000} caracteres más)`);
            }

            // Intentar parsear si parece JSON
            if (updateResponse.data.trim().startsWith('{') || updateResponse.data.trim().startsWith('[')) {
                try {
                    const parsed = JSON.parse(updateResponse.data);
                    console.log('\n  █ Data parseada como JSON:');
                    console.log(JSON.stringify(parsed, null, 2).split('\n').map(line => '    ' + line).join('\n'));
                } catch (e) {
                    console.log('\n  █ No se pudo parsear como JSON válido');
                }
            }
        } else {
            console.log(JSON.stringify(updateResponse.data, null, 2).split('\n').map(line => '  ' + line).join('\n'));
        }

        console.log('\n' + '='.repeat(80));

        // Verificar si el status code es exitoso
        const isSuccess = updateResponse.status >= 200 && updateResponse.status < 300;

        if (isSuccess) {
            console.log('█ ACTUALIZACIÓN COMPLETADA EXITOSAMENTE');
        } else {
            console.log('█ ADVERTENCIA: Status code no exitoso (' + updateResponse.status + ')');
        }

        const totalDuration = Date.now() - startTime;
        console.log(`█ Duración total del proceso: ${totalDuration}ms`);
        console.log('='.repeat(80) + '\n');

        // Log a archivo
        logger.log({
            request: {
                method: req.method,
                ip: req.ip || req.connection.remoteAddress
            },
            process: {
                'Scraping': `Exitoso - Tasa: ${rate} VES`,
                'Fecha': scrapeResult.data.date,
                'URL destino': updateUrl,
                'Duración request': `${requestDuration}ms`
            },
            result: {
                success: isSuccess,
                status: updateResponse.status,
                data: `Tasa actualizada a ${rate} VES`
            },
            duration: totalDuration
        });

        // Responder al cliente del microservicio
        res.json({
            success: isSuccess,
            message: isSuccess ? 'Tasa BCV actualizada correctamente' : 'Request enviado pero status code no exitoso',
            statusCode: updateResponse.status,
            statusText: updateResponse.statusText || 'OK',
            duration: {
                total: totalDuration,
                request: requestDuration
            },
            data: {
                rate: rate,
                date: scrapeResult.data.date,
                scrapeInfo: scrapeResult.data,
                updateResponse: {
                    status: updateResponse.status,
                    statusText: updateResponse.statusText || 'OK',
                    headers: updateResponse.headers,
                    data: updateResponse.data
                }
            }
        });

    } catch (error) {
        const totalDuration = Date.now() - startTime;

        console.log('\n' + '='.repeat(80));
        console.error('█ ERROR EN /update-rate');
        console.log('='.repeat(80));
        console.error(`  • Error message: ${error.message}`);
        console.error(`  • Error name: ${error.name}`);
        console.error(`  • Duración hasta el error: ${totalDuration}ms`);

        // Si es un error de Axios, mostrar detalles específicos
        if (error.response) {
            console.error('\n  █ ERROR DE RESPUESTA HTTP:');
            console.error(`    - Status: ${error.response.status}`);
            console.error(`    - Status Text: ${error.response.statusText}`);
            console.error('\n    - Headers:');
            Object.keys(error.response.headers).forEach(key => {
                console.error(`      • ${key}: ${error.response.headers[key]}`);
            });
            console.error('\n    - Response Data:');
            console.error(JSON.stringify(error.response.data, null, 2).split('\n').map(line => '      ' + line).join('\n'));
        } else if (error.request) {
            console.error('\n  █ ERROR DE REQUEST (No se recibió respuesta):');
            console.error(`    - Timeout: ${error.code === 'ECONNABORTED' ? 'SÍ' : 'NO'}`);
            console.error(`    - Error code: ${error.code}`);
            console.error(`    - Request details:`, error.config ? {
                url: error.config.url,
                method: error.config.method,
                headers: error.config.headers,
                timeout: error.config.timeout
            } : 'No disponible');
        } else {
            console.error('\n  █ ERROR DE CONFIGURACIÓN O INTERNO:');
            console.error(`    - Stack trace:`);
            console.error(error.stack.split('\n').map(line => '      ' + line).join('\n'));
        }

        console.log('='.repeat(80) + '\n');

        // Log a archivo
        logger.logError(req, error, totalDuration);

        res.status(500).json({
            success: false,
            error: error.message,
            errorName: error.name,
            errorCode: error.code,
            timestamp: new Date().toISOString(),
            duration: totalDuration,
            details: error.response ? {
                status: error.response.status,
                statusText: error.response.statusText,
                headers: error.response.headers,
                data: error.response.data
            } : (error.request ? {
                request: 'Enviado pero sin respuesta',
                timeout: error.code === 'ECONNABORTED'
            } : null)
        });
    }
});

/**
 * Endpoint para obtener configuración actual
 */
app.get('/config', (req, res) => {
    const logger = createEndpointLogger('config');
    const startTime = Date.now();

    const response = {
        p2pUrl: config.P2P_URL,
        updateEndpoint: `${config.APP_BASE_URL}${config.UPDATE_RATE_ENDPOINT}`,
        updateInterval: config.UPDATE_INTERVAL,
        timeout: config.PAGE_TIMEOUT,
        retryAttempts: config.RETRY_ATTEMPTS
    };

    logger.logSuccess(req, { data: response }, Date.now() - startTime);
    res.json(response);
});

// Manejador de errores 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint no encontrado',
        availableEndpoints: [
            'GET /health',
            'GET /scrape',
            'GET /get-rate',
            'POST /update-rate',
            'GET /config'
        ]
    });
});

// Iniciar servidor
const PORT = config.PORT;
const server = app.listen(PORT, async () => {
    console.log(`\n█ Servidor iniciado en http://localhost:${PORT}`);
    console.log(`█ Endpoints disponibles:`);
    console.log(`  • GET  /health       (Estado del servicio)`);
    console.log(`  • GET  /scrape       (Scrapear precios)`);
    console.log(`  • GET  /get-rate     (Obtener tasa BCV)`);
    console.log(`  • POST /update-rate  (Scrapear y actualizar)`);
    console.log(`  • GET  /config       (Configuración actual)`);
    console.log(`\n█ Configuración:`);
    console.log(`  • URL BCV: ${config.BCV_URL}`);
    console.log(`  • Endpoint destino: ${config.APP_BASE_URL}${config.UPDATE_RATE_ENDPOINT}`);
    console.log(`  • Logs guardados en: ./logs/`);

    // BCV no necesita navegador persistente (usa axios + cheerio)
    console.log(`\n█ Scraper BCV listo (axios + cheerio)`);
    console.log(`   No requiere instancia de navegador`);

    console.log(`\n█ Tip: Ejecuta POST http://localhost:${PORT}/update-rate para testear\n`);
});

// ═══════════════════════════════════════════════════════════════════════════
// DAEMON SCHEDULER - Ejecuta /update-rate cada 15 minutos
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Función auxiliar para ejecutar update-rate internamente (sin HTTP)
 */
async function runUpdateRateDaemon() {
    console.log('\n' + '═'.repeat(80));
    console.log('[!] DAEMON: Ejecución automática de update-rate');
    console.log('═'.repeat(80));
    console.log(`[!] Timestamp: ${new Date().toISOString()}\n`);

    try {
        // Hacer un request interno POST a /update-rate
        const axios = require('axios');
        const response = await axios.post(`http://localhost:${PORT}/update-rate`, {}, {
            timeout: 60000 // 60 segundos de timeout
        });

        console.log('[!] DAEMON: Actualización completada exitosamente');
        console.log(`   Status: ${response.status}`);
        console.log(`   Tasa actualizada: ${response.data.data?.rate} VES`);
        console.log(`   Fecha: ${response.data.data?.date}`);
        console.log('═'.repeat(80) + '\n');
    } catch (error) {
        console.error('[!!!] DAEMON: Error en actualización automática');
        console.error(`   Error: ${error.message}`);
        if (error.response) {
            console.error(`   HTTP Status: ${error.response.status}`);
        }
        console.log('═'.repeat(80) + '\n');
    }
}

// Configurar cron job: cada 15 minutos
// Formato cron: */15 * * * * = cada 15 minutos
const daemonSchedule = '*/15 * * * *';
console.log(`\n[!] Configurando daemon programado...`);
console.log(`   [!] Frecuencia: Cada 15 minutos`);
console.log(`   [!] Expresión cron: ${daemonSchedule}`);

const cronJob = cron.schedule(daemonSchedule, runUpdateRateDaemon, {
    scheduled: true,
    timezone: "America/Caracas" // Ajusta según tu zona horaria
});

console.log(`\n[!] Daemon programado y activo`);

// Ejecutar inmediatamente al iniciar (opcional, puedes comentar esta línea si no quieres)
console.log(`\n[!] Ejecutando primera actualización inmediata...`);
setTimeout(() => {
    runUpdateRateDaemon().catch(err => console.error('Error en ejecución inicial:', err));
}, 5000); // Esperar 5 segundos después del inicio del servidor

// ═══════════════════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN - Limpieza al cerrar el servidor
// ═══════════════════════════════════════════════════════════════════════════

async function gracefulShutdown(signal) {
    console.log(`\n\n${'═'.repeat(80)}`);
    console.log(`[!] Señal ${signal} recibida, cerrando servidor...`);
    console.log('═'.repeat(80));

    // Detener cron job
    console.log('[!] Deteniendo daemon scheduler...');
    cronJob.stop();

    // Cerrar servidor HTTP
    console.log('[!] Cerrando servidor HTTP...');
    server.close(() => {
        console.log('[!] Servidor HTTP cerrado');
    });

    // BCV no usa navegador persistente
    console.log('[!] No hay navegador para cerrar (scraper usa axios)');

    console.log('═'.repeat(80));
    console.log('Proceso terminado...');
    console.log('═'.repeat(80) + '\n');

    process.exit(0);
}

// Capturar señales de terminación
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
