<?php

declare(strict_types=1);

$host = preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? ''));
$host = preg_replace('/[^a-z0-9.-]/i', '', $host);
$defaultFrom = $host && str_contains($host, '.')
    ? 'noreply@' . $host
    : 'noreply@example.com';

return [
    // Можно заменить прямо здесь или задать переменную сервера EKM_MAIL_TO.
    'to' => getenv('EKM_MAIL_TO') ?: 'Savelprz2008@gmail.com',
    'from' => getenv('EKM_MAIL_FROM') ?: $defaultFrom,
    'from_name' => getenv('EKM_MAIL_FROM_NAME') ?: 'ЕКМ',

    // Если EKM_SMTP_HOST не указан, PHPMailer использует стандартную mail() хостинга.
    'smtp_host' => getenv('EKM_SMTP_HOST') ?: '',
    'smtp_port' => (int) (getenv('EKM_SMTP_PORT') ?: 465),
    'smtp_user' => getenv('EKM_SMTP_USER') ?: '',
    'smtp_password' => getenv('EKM_SMTP_PASSWORD') ?: '',
    'smtp_encryption' => strtolower((string) (getenv('EKM_SMTP_ENCRYPTION') ?: 'smtps')),
];
