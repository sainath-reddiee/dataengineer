<?php
/**
 * Create a Dodo Payments checkout session.
 * POST JSON: { "sku": "pro_monthly", "return_url": "https://..." }
 * API key lives in dodo-secrets.php — never in the Vite bundle.
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = [
  'https://dataengineerhub.blog',
  'https://www.dataengineerhub.blog',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];
if (in_array($origin, $allowed, true)) {
  header('Access-Control-Allow-Origin: ' . $origin);
  header('Vary: Origin');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'POST only']);
  exit;
}

$secrets = __DIR__ . '/dodo-secrets.php';
if (!is_file($secrets)) {
  http_response_code(503);
  echo json_encode([
    'error' => 'Dodo secrets are not on this server yet. Use a static payment link or upload dodo-secrets.php.',
    'code' => 'not_configured',
  ]);
  exit;
}

require $secrets;

if (!defined('DODO_API_KEY') || !DODO_API_KEY || str_starts_with((string) DODO_API_KEY, 'REPLACE_ME')) {
  http_response_code(503);
  echo json_encode(['error' => 'Dodo API key is a placeholder.', 'code' => 'not_configured']);
  exit;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw ?: '[]', true);
if (!is_array($body)) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid JSON']);
  exit;
}

$sku = preg_replace('/[^a-z0-9_]/', '', strtolower((string) ($body['sku'] ?? '')));
$map = [
  'coffee' => defined('DODO_PRODUCT_COFFEE') ? DODO_PRODUCT_COFFEE : '',
  'pro_monthly' => defined('DODO_PRODUCT_PRO_MONTHLY') ? DODO_PRODUCT_PRO_MONTHLY : '',
  'pro_annual' => defined('DODO_PRODUCT_PRO_ANNUAL') ? DODO_PRODUCT_PRO_ANNUAL : '',
  'coaching' => defined('DODO_PRODUCT_COACHING') ? DODO_PRODUCT_COACHING : '',
  'ad_card_monthly' => defined('DODO_PRODUCT_AD_CARD_MONTHLY') ? DODO_PRODUCT_AD_CARD_MONTHLY : '',
  'ad_card_yearly' => defined('DODO_PRODUCT_AD_CARD_YEARLY') ? DODO_PRODUCT_AD_CARD_YEARLY : '',
  'ad_tools' => defined('DODO_PRODUCT_AD_TOOLS') ? DODO_PRODUCT_AD_TOOLS : '',
  'ad_guide' => defined('DODO_PRODUCT_AD_GUIDE') ? DODO_PRODUCT_AD_GUIDE : '',
  'ad_newsletter' => defined('DODO_PRODUCT_AD_NEWSLETTER') ? DODO_PRODUCT_AD_NEWSLETTER : '',
];

if (!isset($map[$sku]) || !$map[$sku]) {
  http_response_code(400);
  echo json_encode(['error' => 'Unknown or unmapped SKU. Paste the live product ID into dodo-secrets.php.', 'sku' => $sku]);
  exit;
}

$returnUrl = (string) ($body['return_url'] ?? '');
if ($returnUrl === '' || !preg_match('#^https://dataengineerhub\.blog/#', $returnUrl)) {
  $returnUrl = 'https://dataengineerhub.blog/settings?dodo=success&sku=' . $sku;
}

$mode = defined('DODO_MODE') ? strtolower((string) DODO_MODE) : 'live';
$apiBase = $mode === 'test' ? 'https://test.dodopayments.com' : 'https://live.dodopayments.com';

$payload = [
  'product_cart' => [
    ['product_id' => $map[$sku], 'quantity' => 1],
  ],
  'return_url' => $returnUrl,
  'metadata' => [
    'sku' => $sku,
    'source' => 'dataengineerhub',
  ],
];

$ch = curl_init($apiBase . '/checkouts');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    'Authorization: Bearer ' . DODO_API_KEY,
    'Content-Type: application/json',
  ],
  CURLOPT_POSTFIELDS => json_encode($payload),
  CURLOPT_TIMEOUT => 20,
]);
$response = curl_exec($ch);
$status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false) {
  http_response_code(502);
  echo json_encode(['error' => 'Could not reach Dodo Payments', 'detail' => $curlError]);
  exit;
}

$decoded = json_decode($response, true);
if ($status < 200 || $status >= 300) {
  http_response_code($status >= 400 ? $status : 502);
  echo json_encode([
    'error' => 'Dodo checkout session failed',
    'status' => $status,
    'detail' => is_array($decoded) ? ($decoded['message'] ?? $decoded) : $response,
  ]);
  exit;
}

echo json_encode([
  'checkout_url' => $decoded['checkout_url'] ?? null,
  'session_id' => $decoded['session_id'] ?? null,
  'sku' => $sku,
]);
