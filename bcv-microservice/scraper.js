const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const config = require('./config');

// Agente HTTPS que ignora errores de certificado
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

/**
 * Convierte fecha de texto a formato DD/MM/YYYY
 * Ejemplo: "Jueves, 04 Diciembre 2025" -> "04/12/2025"
 * @param {string} dateText - Texto de la fecha
 * @returns {string|null} - Fecha en formato DD/MM/YYYY o null si no es válido
 */
function parseDate(dateText) {
    try {
        if (!dateText || typeof dateText !== 'string') {
            return null;
        }

        // Mapa de meses en español
        const meses = {
            'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
            'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
            'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
        };

        // Formato esperado: "Jueves, 04 Diciembre 2025"
        // Eliminar el día de la semana y la coma
        const cleanText = dateText.trim().replace(/^[a-záéíóúñ]+,\s*/i, '');

        // Dividir por espacios: ["04", "Diciembre", "2025"]
        const parts = cleanText.split(/\s+/);

        if (parts.length !== 3) {
            console.error(`[parseDate] Formato inesperado: "${dateText}"`);
            return null;
        }

        const dia = parts[0].padStart(2, '0');
        const mesTexto = parts[1].toLowerCase();
        const año = parts[2];

        const mes = meses[mesTexto];

        if (!mes) {
            console.error(`[parseDate] Mes no reconocido: "${mesTexto}"`);
            return null;
        }

        return `${dia}/${mes}/${año}`;

    } catch (error) {
        console.error('[parseDate] Error:', error.message);
        return null;
    }
}

/**
 * Convierte el precio de formato BCV a número flotante
 * BCV usa COMA como separador DECIMAL: "251,88670000" = 251.88670000 VES
 * @param {string} priceText - Texto del precio
 * @returns {number|null} - Precio como número o null si no es válido
 */
function parsePrice(priceText) {
    try {
        if (!priceText || typeof priceText !== 'string') {
            console.error('[parsePrice] Precio inválido:', priceText);
            return null;
        }

        // Limpiar espacios
        const cleanText = priceText.trim();

        // Reemplazar coma por punto decimal
        const normalizedText = cleanText.replace(',', '.');

        const price = parseFloat(normalizedText);

        if (isNaN(price) || price <= 0) {
            console.error('[parsePrice] Precio no válido después de parsear:', cleanText);
            return null;
        }

        return price;

    } catch (error) {
        console.error('[parsePrice] Error:', error.message);
        return null;
    }
}

/**
 * Extrae la tasa de cambio USD/VES del BCV
 * @returns {Promise<Object>} - Objeto con la tasa extraída
 */
async function scrapeBCV() {
    console.log('\n' + '='.repeat(60));
    console.log('INICIANDO SCRAPING DEL BCV');
    console.log('='.repeat(60));

    try {
        console.log(`\n[1/3] Descargando HTML de ${config.BCV_URL}...`);

        const response = await axios.get(config.BCV_URL, {
            timeout: 15000,
            httpsAgent: httpsAgent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });

        const html = response.data;
        console.log(`✓ HTML descargado (${html.length} caracteres)`);

        console.log('\n[2/3] Parseando HTML con Cheerio...');
        const $ = cheerio.load(html);

        // Buscar el div con id="dolar"
        const dolarDiv = $('#dolar');
        if (!dolarDiv.length) {
            throw new Error('No se encontró el div con id="dolar"');
        }
        console.log('✓ Div #dolar encontrado');

        // Buscar el precio dentro de class="col-sm-6 col-xs-6 centrado"
        const precioElement = dolarDiv.find('.col-sm-6.col-xs-6.centrado');
        if (!precioElement.length) {
            throw new Error('No se encontró el elemento de precio');
        }

        const precioTexto = precioElement.text().trim();
        console.log(`✓ Precio extraído: "${precioTexto}"`);

        // Buscar la fecha
        const fechaElement = $('.pull-right.dinpro.center .date-display-single');
        if (!fechaElement.length) {
            throw new Error('No se encontró el elemento de fecha');
        }

        const fechaTexto = fechaElement.text().trim();
        console.log(`✓ Fecha extraída: "${fechaTexto}"`);

        console.log('\n[3/3] Procesando datos...');

        // Parsear precio
        const precio = parsePrice(precioTexto);
        if (precio === null) {
            throw new Error(`No se pudo parsear el precio: "${precioTexto}"`);
        }
        console.log(`  ✓ Precio parseado: ${precio} VES`);

        // Parsear fecha
        const fecha = parseDate(fechaTexto);
        if (fecha === null) {
            throw new Error(`No se pudo parsear la fecha: "${fechaTexto}"`);
        }
        console.log(`  ✓ Fecha parseada: ${fecha}`);

        console.log('\n✓ Resultado final:');
        const result = {
            success: true,
            data: {
                rate: precio,
                date: fecha,
                rawPrice: precioTexto,
                rawDate: fechaTexto
            },
            timestamp: new Date().toISOString()
        };

        console.log(JSON.stringify(result.data, null, 2));
        console.log('\n' + '='.repeat(60));
        console.log('✓ SCRAPING COMPLETADO EXITOSAMENTE');
        console.log('='.repeat(60) + '\n');

        return result;

    } catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('✗ ERROR EN SCRAPING');
        console.error('='.repeat(60));
        console.error('Mensaje:', error.message);
        if (error.response) {
            console.error('Status HTTP:', error.response.status);
            console.error('Status Text:', error.response.statusText);
        }
        console.error('Stack:', error.stack);
        console.error('='.repeat(60) + '\n');

        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

// Si se ejecuta directamente (npm run scrape)
if (require.main === module) {
    scrapeBCV()
        .then(result => {
            console.log('\n[!] Resultado completo:');
            console.log(JSON.stringify(result, null, 2));
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('[!!!] Error fatal:', error);
            process.exit(1);
        });
}

module.exports = {
    scrapeBCV
};
