require('dotenv').config();

module.exports = {
    // Configuración del servidor (Diferente al del microservicio de USDT, a efectos de crear un macroservicio)
    PORT: process.env.PORT || 3001,

    // URLs
    APP_BASE_URL: process.env.APP_BASE_URL || 'https://havainventory.infinityfreeapp.com/inventario-app/web',
    UPDATE_RATE_ENDPOINT: process.env.UPDATE_RATE_ENDPOINT || '/index.php?r=site/update-bcv',
    BCV_URL: process.env.BCV_URL || 'http://www.bcv.org.ve',

    // Configuración de scraping
    PAGE_TIMEOUT: parseInt(process.env.PAGE_TIMEOUT) || 30000,
    RETRY_ATTEMPTS: parseInt(process.env.RETRY_ATTEMPTS) || 3,
    UPDATE_INTERVAL: parseInt(process.env.UPDATE_INTERVAL) || 15 // 15 minutos para BCV
};
