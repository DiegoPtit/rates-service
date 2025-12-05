module.exports = {
    apps: [
        {
            // ═══════════════════════════════════════════════════════════════
            // MICROSERVICIO BCV - Scraper del Banco Central de Venezuela
            // ═══════════════════════════════════════════════════════════════
            name: 'bcv-microservice',
            script: './bcv-microservice/server.js',
            cwd: './bcv-microservice',
            instances: 1,
            exec_mode: 'fork',

            // Variables de entorno específicas
            env: {
                NODE_ENV: 'production',
                PORT: 3001,
                APP_BASE_URL: 'https://havainventory.infinityfreeapp.com/inventario-app/web',
                UPDATE_RATE_ENDPOINT: '/index.php?r=site/update-bcv',
                BCV_URL: 'http://www.bcv.org.ve',
                PAGE_TIMEOUT: 30000,
                RETRY_ATTEMPTS: 3,
                UPDATE_INTERVAL: 15
            },

            // Configuración de reinicio automático
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',

            // Reintentos en caso de error
            max_restarts: 10,
            min_uptime: '10s',
            restart_delay: 4000,

            // Logs
            error_file: './logs/bcv-error.log',
            out_file: './logs/bcv-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,

            // Configuración de tiempo
            time: true,

            // Configuración de kill
            kill_timeout: 5000,
            listen_timeout: 3000,

            // Metadata
            instance_var: 'INSTANCE_ID'
        },

        {
            // ═══════════════════════════════════════════════════════════════
            // MICROSERVICIO BINANCE - Scraper de Binance P2P USDT/VES
            // ═══════════════════════════════════════════════════════════════
            name: 'binance-microservice',
            script: './binance-microservice/server.js',
            cwd: './binance-microservice',
            instances: 1,
            exec_mode: 'fork',

            // Variables de entorno específicas
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
                APP_BASE_URL: 'https://havainventory.infinityfreeapp.com/inventario-app/web',
                UPDATE_RATE_ENDPOINT: '/index.php?r=site/update-usdt-rate',
                P2P_URL: 'https://p2p.binance.com/trade/all-payments/USDT?fiat=VES',
                PAGE_TIMEOUT: 30000,
                RETRY_ATTEMPTS: 3,
                UPDATE_INTERVAL: 5
            },

            // Configuración de reinicio automático
            autorestart: true,
            watch: false,
            max_memory_restart: '800M', // Más memoria para Puppeteer

            // Reintentos en caso de error
            max_restarts: 10,
            min_uptime: '10s',
            restart_delay: 4000,

            // Logs
            error_file: './logs/binance-error.log',
            out_file: './logs/binance-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,

            // Configuración de tiempo
            time: true,

            // Configuración de kill
            kill_timeout: 10000, // Más tiempo para cerrar Puppeteer
            listen_timeout: 3000,

            // Metadata
            instance_var: 'INSTANCE_ID'
        }
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIGURACIÓN DE DEPLOYMENT (Opcional)
    // ═══════════════════════════════════════════════════════════════════════
    deploy: {
        production: {
            user: 'node',
            host: 'localhost',
            ref: 'origin/main',
            repo: 'git@github.com:repo.git',
            path: '/var/www/rates-service',
            'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
        }
    }
};
