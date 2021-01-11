// Sesion parameters
const TWO_HOURS = 1000 * 60 * 60 * 2;

const {
    PORT = 8080,
    NODE_ENV = 'developmnet',
    SESS_NAME = 'ssid',
    SESS_SECRET = '6u4/I/%$76v5&4vkuG7i(87%G%B(&NH((O%"§%$(&)?@€|~^^=)(/&!&%§"$',
    SESS_LIFETIME = TWO_HOURS
} = process.env;

const IN_PROD = NODE_ENV === 'production';

const securityScriptHash = "be2d765fca5c51b3f430bb73ede903b7f530dbf82152af238736b0882edfd41d";

const securityHeaders = {
    contentSecurityPolicy: {
        name: 'Content-Security-Policy',
        value: ["'self'", "https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"]
    }
};

const staticFileOptions = {
    setHeaders: function(res, path, stat) {
        res.set(securityHeaders.contentSecurityPolicy.name, securityHeaders.contentSecurityPolicy.value);
    }
};

const sessionConfig = {
    name: SESS_NAME,
    resave : false,
    saveUninitialized: false,
    secret : SESS_SECRET,
    cookie: {
        maxAge: SESS_LIFETIME,
        secure: IN_PROD,
        sameSite: 'strict',
        httpOnly: true,
    },
    'QkFCQUFCQUFCQUFBQkFBQkFBQUJBQkFBQUFCQkFCQUFCQUJBQkJCQQ==': '123'
};

const csrfConfig = {
    cookie: {
        httpOnly: true, 
        maxAge: TWO_HOURS, 
        sameSite: true, 
        secure: IN_PROD
    }
};

const rateLimitConfig = {
    windowMs: 5 * 60 * 1000, // 15 minutes
    max: 100, // only 100 requests per client per windowMS
    delayMs: 0 // disable delay -> user hasfull speed until limit
}

module.exports = {
    securityHeaders,
    staticFileOptions,
    sessionConfig,
    csrfConfig,
    rateLimitConfig,
    IN_PROD,
    securityScriptHash
};