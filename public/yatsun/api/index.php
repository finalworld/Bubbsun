<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function reply(array $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    $file = __DIR__ . '/yatsun-db.json';
    if (!is_file($file)) reply(['ok' => false, 'error' => 'Yatsun-databasen är inte ansluten.'], 503);
    $config = json_decode((string) file_get_contents($file), true);
    if (!is_array($config)) reply(['ok' => false, 'error' => 'Databasinställningen är ogiltig.'], 503);
    $pdo = new PDO(
        'mysql:host=' . $config['host'] . ';dbname=' . $config['name'] . ';charset=utf8mb4',
        $config['user'],
        $config['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]
    );
    $pdo->exec('CREATE TABLE IF NOT EXISTS yatsun_matches (uid VARCHAR(191) PRIMARY KEY, state_json LONGTEXT NOT NULL, updated_at BIGINT NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    return $pdo;
}

function authenticated_identity(): array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(.+)$/i', $header, $match)) reply(['ok' => false, 'error' => 'Logga in igen.'], 401);
    $url = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=AIzaSyBuJP3imBBQZ7CWJzUhosSbyEhi_Z0lgj8';
    $curl = curl_init($url);
    curl_setopt_array($curl, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 12, CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_POSTFIELDS => json_encode(['idToken' => $match[1]])]);
    $response = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);
    $data = json_decode((string) $response, true);
    $uid = $data['users'][0]['localId'] ?? '';
    if ($status !== 200 || !is_string($uid) || $uid === '') reply(['ok' => false, 'error' => 'Inloggningen kunde inte verifieras.'], 401);
    return ['uid'=>$uid,'email'=>strtolower((string)($data['users'][0]['email']??''))];
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') reply(['ok' => false, 'error' => 'Fel metod.'], 405);
$input = json_decode((string) file_get_contents('php://input'), true);
$action = is_array($input) ? (string) ($input['action'] ?? '') : '';
$identity = authenticated_identity();$uid=$identity['uid'];

try {
    if(preg_match('/^(social_|friend_|room_)/',$action)){
        require_once __DIR__.'/social.php';
        reply(['ok'=>true]+social_handle(db(),$uid,$action,$input,$identity['email']));
    }
    if ($action === 'load_match') {
        $statement = db()->prepare('SELECT state_json, updated_at FROM yatsun_matches WHERE uid = ?');
        $statement->execute([$uid]);
        $row = $statement->fetch();
        reply(['ok' => true, 'match' => $row ? json_decode($row['state_json'], true) : null, 'updatedAt' => $row ? (int) $row['updated_at'] : 0]);
    }
    if ($action === 'save_match') {
        $state = $input['state'] ?? null;
        if (!is_array($state)) reply(['ok' => false, 'error' => 'Matchen saknas.'], 400);
        $encoded = json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($encoded === false || strlen($encoded) > 250000) reply(['ok' => false, 'error' => 'Matchen är för stor.'], 400);
        $updatedAt = (int) floor(microtime(true) * 1000);
        $statement = db()->prepare('INSERT INTO yatsun_matches (uid, state_json, updated_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE state_json = VALUES(state_json), updated_at = VALUES(updated_at)');
        $statement->execute([$uid, $encoded, $updatedAt]);
        reply(['ok' => true, 'updatedAt' => $updatedAt]);
    }
    if ($action === 'delete_match') {
        $statement = db()->prepare('DELETE FROM yatsun_matches WHERE uid = ?');
        $statement->execute([$uid]);
        reply(['ok' => true]);
    }
    reply(['ok' => false, 'error' => 'Okänd åtgärd.'], 400);
} catch (PDOException $error) {
    error_log('Yatsun database error: ' . $error->getMessage());
    reply(['ok' => false, 'error' => 'Databasen svarar inte just nu.'], 503);
} catch (RuntimeException $error) {
    $status=in_array($error->getCode(),[400,403,404,409],true)?$error->getCode():500;
    reply(['ok'=>false,'error'=>$status===500?'Något gick fel. Försök igen.':$error->getMessage()],$status);
}
