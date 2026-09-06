<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private function registration(): array
    {
        return [
            'name' => 'Fajar Test',
            'email' => 'fajar.auth@example.test',
            'company_name' => 'Captuto',
            'password' => 'TestLogin123!',
            'password_confirmation' => 'TestLogin123!',
        ];
    }

    public function test_register_then_login_and_access_profile_with_bearer_token(): void
    {
        $data = $this->registration();
        $this->withHeader('Origin', 'http://localhost:5173')
            ->postJson('/api/auth/register', $data)
            ->assertCreated()
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
            ->assertJsonPath('data.user.email', $data['email'])
            ->assertJsonStructure(['data' => ['token', 'user']]);

        $this->assertTrue(Hash::check($data['password'], User::firstOrFail()->password));
        $login = $this->postJson('/api/auth/login', [
            'email' => $data['email'], 'password' => $data['password'],
        ])->assertOk()->assertJsonStructure(['data' => ['token', 'user']]);

        // Clear the guard cached by the preceding request so this checks the token.
        $this->app['auth']->forgetGuards();
        $this->withToken($login->json('data.token'))->getJson('/api/auth/me')
            ->assertOk()->assertJsonPath('data.email', $data['email']);
    }

    public function test_duplicate_email_and_password_mismatch_return_validation_errors(): void
    {
        $data = $this->registration();
        $this->postJson('/api/auth/register', $data)->assertCreated();
        $this->postJson('/api/auth/register', $data)
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->postJson('/api/auth/register', array_replace($data, [
            'email' => 'another@example.test', 'password_confirmation' => 'Mismatch123!',
        ]))->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->assertDatabaseCount('users', 1);
    }

    public function test_wrong_password_and_missing_token_are_rejected(): void
    {
        $data = $this->registration();
        $this->postJson('/api/auth/register', $data)->assertCreated();
        $this->postJson('/api/auth/login', [
            'email' => $data['email'], 'password' => 'WrongPassword123!',
        ])->assertUnauthorized()->assertJsonPath('message', 'Invalid credentials');
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }
}
