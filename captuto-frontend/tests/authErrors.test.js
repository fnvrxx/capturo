import test from 'node:test';
import assert from 'node:assert/strict';
import { authErrorMessage, isAuthSubmission } from '../src/services/authErrors.js';

test('login and register failures stay on the form; protected endpoints remain protected', () => {
  assert.equal(isAuthSubmission('/auth/login'), true);
  assert.equal(isAuthSubmission('/auth/register'), true);
  assert.equal(isAuthSubmission('/auth/me'), false);
  assert.equal(isAuthSubmission('/templates'), false);
});

test('validation and wrong-password messages are retained', () => {
  assert.equal(authErrorMessage({ response: { status: 401, data: { message: 'Invalid credentials' } } }), 'Invalid credentials');
  assert.equal(authErrorMessage({ response: { status: 422, data: { errors: { email: ['Email already used'] } } } }), 'Email already used');
});

test('network failures, timeouts and HTML error responses produce useful messages', () => {
  assert.match(authErrorMessage({ code: 'ERR_NETWORK' }), /Tidak dapat terhubung/);
  assert.match(authErrorMessage({ code: 'ECONNABORTED' }), /terlalu lama/);
  assert.match(authErrorMessage({ response: { status: 500, data: '<html>SQL credentials</html>' } }), /Server mengalami gangguan/);
});
