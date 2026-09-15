<?php
/**
 * Dodo Payments webhook (Standard Webhooks HMAC).
 * Logs payment/subscription events. Does not put secrets in the response.
 * Protect dodo-events.jsonl via api/.htaccess.
 */

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'POST only']);
  exit;
}

$secrets = __DIR__ . '/dodo-secrets.php';
if (!is_file($secrets)) {
  http_response_code(503);
  echo json_encode(['error' => 'not_configured']);
  exit;
}
require $secrets;

$payload = file_get_contents('php://input') ?: '';
$id = $_SERVER['HTTP_WEBHOOK_ID'] ?? '';
$timestamp = $_SERVER['HTTP_WEBHOOK_TIMESTAMP'] ?? '';
$signatureHeader = $_SERVER['HTTP_WEBHOOK_SIGNATURE'] ?? '';

function dodo_header_get($name) {
  $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
  if (!empty($_SERVER[$key])) return $_SERVER[$key];
  if (function_exists('getallheaders')) {
    foreach (getallheaders() as $k => $v) {
      if (strcasecmp($k, $name) === 0) return $v;
    }
  }
  return '';
}

if ($id === '') $id = dodo_header_get('webhook-id');
if ($timestamp === '') $timestamp = dodo_header_get('webhook-timestamp');
if ($signatureHeader === '') $signatureHeader = dodo_header_get('webhook-signature');

$secret = defined('DODO_WEBHOOK_SECRET') ? (string) DODO_WEBHOOK_SECRET : '';
if ($secret === '' || str_starts_with($secret, 'whsec_REPLACE')) {
  http_response_code(503);
  echo json_encode(['error' => 'webhook_secret_missing']);
  exit;
}

$key = $secret;
if (str_starts_with($secret, 'whsec_')) {
  $decoded = base64_decode(substr($secret, 6), true);
  if ($decoded !== false) $key = $decoded;
}

$signed = $id . '.' . $timestamp . '.' . $payload;
$expected = base64_encode(hash_hmac('sha256', $signed, $key, true));

$ok = false;
foreach (preg_split('/\s+/', trim($signatureHeader)) as $part) {
  if ($part === '') continue;
  $sig = $part;
  if (str_starts_with($part, 'v1,')) $sig = substr($part, 3);
  if (hash_equals($expected, $sig)) {
    $ok = true;
    break;
  }
}

if (!$ok) {
  http_response_code(401);
  echo json_encode(['error' => 'invalid_signature']);
  exit;
}

$event = json_decode($payload, true);
$type = is_array($event) ? (string) ($event['type'] ?? 'unknown') : 'unknown';
$logLine = json_encode([
  'received_at' => gmdate('c'),
  'type' => $type,
  'webhook_id' => $id,
  'data' => is_array($event) ? ($event['data'] ?? $event) : null,
]) . PHP_EOL;

@file_put_contents(__DIR__ . '/dodo-events.jsonl', $logLine, FILE_APPEND | LOCK_EX);

http_response_code(200);
echo json_encode(['received' => true, 'type' => $type]);
