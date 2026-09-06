<?php

$origins = [env('FRONTEND_URL', 'http://localhost:5173')];

// Vite can be opened through either loopback hostname during development.
if (in_array(env('APP_ENV'), ['local', 'testing'], true)) {
    $origins = array_merge($origins, ['http://localhost:5173', 'http://127.0.0.1:5173']);
}

return [
    'paths'                    => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods'          => ['*'],
    'allowed_origins'          => array_values(array_unique($origins)),
    'allowed_origins_patterns' => [],
    'allowed_headers'          => ['*'],
    'exposed_headers'          => [],
    'max_age'                  => 0,
    'supports_credentials'     => true,
];
