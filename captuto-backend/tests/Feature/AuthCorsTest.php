<?php

namespace Tests\Feature;

use Tests\TestCase;

class AuthCorsTest extends TestCase
{
    public function test_both_local_frontend_origins_can_preflight_registration(): void
    {
        foreach (['http://localhost:5173', 'http://127.0.0.1:5173'] as $origin) {
            $this->options('/api/auth/register', [], [
                'Origin' => $origin,
                'Access-Control-Request-Method' => 'POST',
                'Access-Control-Request-Headers' => 'content-type',
            ])->assertNoContent()->assertHeader('Access-Control-Allow-Origin', $origin);
        }
    }

    public function test_untrusted_origins_are_not_allowed(): void
    {
        $response = $this->options('/api/auth/register', [], [
            'Origin' => 'https://untrusted.example',
            'Access-Control-Request-Method' => 'POST',
        ]);
        $this->assertNotSame('https://untrusted.example', $response->headers->get('Access-Control-Allow-Origin'));
    }
}
