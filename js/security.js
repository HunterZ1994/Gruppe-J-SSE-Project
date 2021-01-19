// Session parameters
const TWO_HOURS = 1000 * 60 * 60 * 2;

const {
    PORT = 443,
    NODE_ENV = 'development',
    SESS_NAME = 'ssid',
    SESS_SECRET = '6u4/I/%$76v5&4vkuG7i(87%G%B(&NH((O%"§%$(&)?@€|~^^=)(/&!&%§"$',
    SESS_LIFETIME = TWO_HOURS
} = process.env;

const IN_PROD = NODE_ENV === 'production';

const securityHeaders = {
    contentSecurityPolicy: {
        name: 'Content-Security-Policy',
        scrtiptSrc: ["'self'", "https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"],
        styleSrc: [ "'self'"],
        https: ["'self'"],
        frame_ancestors: ["'none'"],
        form_action: ["'self'"]
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

const cookieConfig = { 
    sameSite: 'strict', 
    httpOnly: true, 
    secure:true,
    maxAge: SESS_LIFETIME
};

module.exports = {
    securityHeaders,
    staticFileOptions,
    sessionConfig,
    csrfConfig,
    rateLimitConfig,
    IN_PROD,
    cookieConfig
};