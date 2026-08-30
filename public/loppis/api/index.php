<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
session_name('kassun_session');
session_set_cookie_params(['lifetime' => 60 * 60 * 24 * 30, 'path' => '/loppis/', 'secure' => true, 'httponly' => true, 'samesite' => 'Lax']);
session_start();

function reply(array $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function input(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    if (!is_array($data)) reply(['ok' => false, 'error' => 'Ogiltig förfrågan'], 400);
    return $data;
}

function uid(): string { return bin2hex(random_bytes(12)); }
function now_iso(): string { return gmdate('c'); }

function database(): PDO {
    static $db = null;
    if ($db instanceof PDO) return $db;
    $dir = dirname(__DIR__, 3) . DIRECTORY_SEPARATOR . 'private';
    if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) reply(['ok' => false, 'error' => 'Kunde inte skapa datamappen'], 500);
    $db = new PDO('sqlite:' . $dir . DIRECTORY_SEPARATOR . 'kassun.sqlite');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $db->exec('PRAGMA journal_mode=WAL');
    $db->exec('PRAGMA foreign_keys=ON');
    $db->exec('CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY, username TEXT NOT NULL, username_lower TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT "user", active INTEGER NOT NULL DEFAULT 1,
        password_hash TEXT, legacy_hash TEXT, legacy_salt TEXT, created_at TEXT NOT NULL
    )');
    $db->exec('CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1,
        photo TEXT NOT NULL DEFAULT "", created_at TEXT NOT NULL
    )');
    $db->exec('CREATE TABLE IF NOT EXISTS occasions (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, date TEXT NOT NULL DEFAULT "",
        starting_cash REAL NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL, ended_at TEXT
    )');
    $db->exec('CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY, item TEXT NOT NULL, price REAL NOT NULL DEFAULT 0,
        payment TEXT NOT NULL, seller_id TEXT NOT NULL, seller_name TEXT NOT NULL,
        occasion_id TEXT NOT NULL, date TEXT NOT NULL DEFAULT "", kind TEXT,
        refunded INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL,
        updated_at TEXT, refunded_at TEXT
    )');
    $count = (int)$db->query('SELECT COUNT(*) FROM accounts')->fetchColumn();
    if ($count === 0) {
        $stmt = $db->prepare('INSERT INTO accounts (id,username,username_lower,role,active,password_hash,created_at) VALUES (?,?,?,?,?,?,?)');
        $stmt->execute(['admin-bubbsun', 'bubbsun', 'bubbsun', 'admin', 1, password_hash('davita', PASSWORD_DEFAULT), now_iso()]);
    }
    return $db;
}

function account_row(PDO $db, string $id): ?array {
    $stmt = $db->prepare('SELECT * FROM accounts WHERE id=? AND active=1');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

function session_account(PDO $db): ?array {
    $id = (string)($_SESSION['account_id'] ?? '');
    return $id ? account_row($db, $id) : null;
}

function public_account(array $row): array {
    return ['id' => $row['id'], 'username' => $row['username'], 'usernameLower' => $row['username_lower'], 'role' => $row['role'], 'active' => (bool)$row['active'], 'createdAt' => $row['created_at']];
}

function require_account(PDO $db): array {
    $account = session_account($db);
    if (!$account) reply(['ok' => false, 'error' => 'Du måste logga in'], 401);
    return $account;
}

function require_admin(PDO $db): array {
    $account = require_account($db);
    if ($account['role'] !== 'admin') reply(['ok' => false, 'error' => 'Endast administratören kan göra detta'], 403);
    return $account;
}

function verify_password(array $account, string $password): bool {
    if (!empty($account['password_hash'])) return password_verify($password, $account['password_hash']);
    if (empty($account['legacy_hash']) || empty($account['legacy_salt'])) return false;
    $salt = base64_decode($account['legacy_salt'], true);
    if ($salt === false) return false;
    $derived = hash_pbkdf2('sha256', $password, $salt, 120000, 32, true);
    return hash_equals($account['legacy_hash'], base64_encode($derived));
}

function state_payload(PDO $db, array $account): array {
    $users = array_map(fn($r) => ['id'=>$r['id'],'name'=>$r['name'],'active'=>(bool)$r['active'],'photo'=>$r['photo'],'createdAt'=>$r['created_at']], $db->query('SELECT * FROM users ORDER BY name COLLATE NOCASE')->fetchAll());
    $occasions = array_map(fn($r) => ['id'=>$r['id'],'name'=>$r['name'],'date'=>$r['date'],'startingCash'=>(float)$r['starting_cash'],'active'=>(bool)$r['active'],'createdAt'=>$r['created_at'],'endedAt'=>$r['ended_at']], $db->query('SELECT * FROM occasions ORDER BY created_at DESC')->fetchAll());
    $sales = array_map(fn($r) => ['id'=>$r['id'],'item'=>$r['item'],'price'=>(float)$r['price'],'payment'=>$r['payment'],'sellerId'=>$r['seller_id'],'sellerName'=>$r['seller_name'],'occasionId'=>$r['occasion_id'],'date'=>$r['date'],'kind'=>$r['kind'],'refunded'=>(bool)$r['refunded'],'createdAt'=>$r['created_at'],'updatedAt'=>$r['updated_at'],'refundedAt'=>$r['refunded_at']], $db->query('SELECT * FROM sales ORDER BY created_at DESC')->fetchAll());
    $accounts = [];
    if ($account['role'] === 'admin') $accounts = array_map('public_account', $db->query('SELECT * FROM accounts ORDER BY username COLLATE NOCASE')->fetchAll());
    return ['ok'=>true,'account'=>public_account($account),'accounts'=>$accounts,'users'=>$users,'occasions'=>$occasions,'sales'=>$sales];
}

try {
    $db = database();
    $action = (string)($_GET['action'] ?? 'session');
    $data = input();

    if ($action === 'health') reply(['ok'=>true,'database'=>'sqlite']);
    if ($action === 'session') {
        $account = session_account($db);
        reply(['ok'=>true,'account'=>$account ? public_account($account) : null]);
    }
    if ($action === 'login') {
        $username = mb_strtolower(trim((string)($data['username'] ?? '')), 'UTF-8');
        $stmt = $db->prepare('SELECT * FROM accounts WHERE username_lower=? AND active=1');
        $stmt->execute([$username]);
        $account = $stmt->fetch();
        if (!$account || !verify_password($account, (string)($data['password'] ?? ''))) reply(['ok'=>false,'error'=>'Fel användarnamn eller lösenord'], 401);
        if (empty($account['password_hash'])) {
            $db->prepare('UPDATE accounts SET password_hash=?,legacy_hash=NULL,legacy_salt=NULL WHERE id=?')->execute([password_hash((string)$data['password'], PASSWORD_DEFAULT), $account['id']]);
            $account = account_row($db, $account['id']);
        }
        session_regenerate_id(true);
        $_SESSION['account_id'] = $account['id'];
        reply(['ok'=>true,'account'=>public_account($account)]);
    }
    if ($action === 'logout') {
        $_SESSION = [];
        session_destroy();
        reply(['ok'=>true]);
    }

    $account = require_account($db);
    if ($action === 'state') reply(state_payload($db, $account));

    if ($action === 'import') {
        require_admin($db);
        $existing = (int)$db->query('SELECT (SELECT COUNT(*) FROM users)+(SELECT COUNT(*) FROM occasions)+(SELECT COUNT(*) FROM sales)')->fetchColumn();
        if ($existing > 0) reply(['ok'=>false,'error'=>'Kassun är redan importerad'], 409);
        $db->beginTransaction();
        try {
            $accountStmt = $db->prepare('INSERT OR IGNORE INTO accounts (id,username,username_lower,role,active,password_hash,legacy_hash,legacy_salt,created_at) VALUES (?,?,?,?,?,NULL,?,?,?)');
            foreach (($data['accounts'] ?? []) as $r) $accountStmt->execute([(string)$r['id'],(string)$r['username'],(string)$r['usernameLower'],(string)($r['role'] ?? 'user'),($r['active'] ?? true)?1:0,(string)($r['passwordHash'] ?? ''),(string)($r['salt'] ?? ''),(string)($r['createdAt'] ?? now_iso())]);
            $userStmt = $db->prepare('INSERT INTO users (id,name,active,photo,created_at) VALUES (?,?,?,?,?)');
            foreach (($data['users'] ?? []) as $r) $userStmt->execute([(string)$r['id'],(string)$r['name'],($r['active'] ?? true)?1:0,(string)($r['photo'] ?? ''),(string)($r['createdAt'] ?? now_iso())]);
            $occasionStmt = $db->prepare('INSERT INTO occasions (id,name,date,starting_cash,active,created_at,ended_at) VALUES (?,?,?,?,?,?,?)');
            foreach (($data['occasions'] ?? []) as $r) $occasionStmt->execute([(string)$r['id'],(string)$r['name'],(string)($r['date'] ?? ''),(float)($r['startingCash'] ?? 0),($r['active'] ?? true)?1:0,(string)($r['createdAt'] ?? now_iso()),$r['endedAt'] ?? null]);
            $saleStmt = $db->prepare('INSERT INTO sales (id,item,price,payment,seller_id,seller_name,occasion_id,date,kind,refunded,created_at,updated_at,refunded_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');
            foreach (($data['sales'] ?? []) as $r) $saleStmt->execute([(string)$r['id'],(string)($r['item'] ?? 'Vara'),(float)($r['price'] ?? 0),(string)$r['payment'],(string)$r['sellerId'],(string)$r['sellerName'],(string)$r['occasionId'],(string)($r['date'] ?? ''),$r['kind'] ?? null,($r['refunded'] ?? false)?1:0,(string)($r['createdAt'] ?? now_iso()),$r['updatedAt'] ?? null,$r['refundedAt'] ?? null]);
            $db->commit();
        } catch (Throwable $error) {
            $db->rollBack();
            throw $error;
        }
        reply(state_payload($db, account_row($db, $account['id'])));
    }

    if ($action === 'password_change') {
        if (!verify_password($account, (string)($data['currentPassword'] ?? ''))) reply(['ok'=>false,'error'=>'Nuvarande lösenord är fel'], 400);
        $password = (string)($data['newPassword'] ?? '');
        if (mb_strlen($password) < 4) reply(['ok'=>false,'error'=>'Det nya lösenordet måste ha minst 4 tecken'], 400);
        $db->prepare('UPDATE accounts SET password_hash=?,legacy_hash=NULL,legacy_salt=NULL WHERE id=?')->execute([password_hash($password, PASSWORD_DEFAULT),$account['id']]);
    } elseif ($action === 'account_add') {
        require_admin($db);
        $username = trim((string)($data['username'] ?? ''));
        $lower = mb_strtolower($username, 'UTF-8');
        $password = (string)($data['password'] ?? '');
        if (!preg_match('/^[a-z0-9._-]{3,30}$/', $lower) || mb_strlen($password) < 4) reply(['ok'=>false,'error'=>'Kontrollera användarnamn och lösenord'], 400);
        $db->prepare('INSERT INTO accounts (id,username,username_lower,role,active,password_hash,created_at) VALUES (?,?,?,?,?,?,?)')->execute([uid(),$username,$lower,'user',1,password_hash($password,PASSWORD_DEFAULT),now_iso()]);
    } elseif ($action === 'account_rename') {
        require_admin($db);
        $username = trim((string)$data['username']);
        $db->prepare('UPDATE accounts SET username=?,username_lower=? WHERE id=?')->execute([$username,mb_strtolower($username,'UTF-8'),(string)$data['id']]);
    } elseif ($action === 'account_reset') {
        require_admin($db);
        $db->prepare('UPDATE accounts SET password_hash=?,legacy_hash=NULL,legacy_salt=NULL WHERE id=?')->execute([password_hash((string)$data['password'],PASSWORD_DEFAULT),(string)$data['id']]);
    } elseif ($action === 'occasion_create') {
        $id=uid(); $db->prepare('INSERT INTO occasions (id,name,date,starting_cash,active,created_at) VALUES (?,?,?,?,1,?)')->execute([$id,(string)$data['name'],(string)$data['date'],(float)$data['startingCash'],now_iso()]);
        reply(['ok'=>true,'id'=>$id]);
    } elseif ($action === 'occasion_end') {
        $db->prepare('UPDATE occasions SET active=0,ended_at=? WHERE id=?')->execute([now_iso(),(string)$data['id']]);
    } elseif ($action === 'sale_create') {
        $id=uid(); $db->prepare('INSERT INTO sales (id,item,price,payment,seller_id,seller_name,occasion_id,date,kind,refunded,created_at) VALUES (?,?,?,?,?,?,?,?,?,0,?)')->execute([$id,(string)$data['item'],(float)$data['price'],(string)$data['payment'],(string)$data['sellerId'],(string)$data['sellerName'],(string)$data['occasionId'],(string)$data['date'],$data['kind']??null,now_iso()]);
    } elseif ($action === 'sale_update') {
        $db->prepare('UPDATE sales SET item=?,price=?,payment=?,seller_id=?,seller_name=?,updated_at=? WHERE id=?')->execute([(string)$data['item'],(float)$data['price'],(string)$data['payment'],(string)$data['sellerId'],(string)$data['sellerName'],now_iso(),(string)$data['id']]);
    } elseif ($action === 'sale_refund') {
        $db->prepare('UPDATE sales SET refunded=1,refunded_at=? WHERE id=?')->execute([now_iso(),(string)$data['id']]);
    } elseif ($action === 'sale_delete') {
        $db->prepare('DELETE FROM sales WHERE id=?')->execute([(string)$data['id']]);
    } elseif ($action === 'user_create') {
        $db->prepare('INSERT INTO users (id,name,active,photo,created_at) VALUES (?,?,1,"",?)')->execute([uid(),(string)$data['name'],now_iso()]);
    } elseif ($action === 'user_update') {
        $fields=[]; $values=[];
        foreach (['name'=>'name','active'=>'active','photo'=>'photo'] as $json=>$column) if (array_key_exists($json,$data)) { $fields[]="$column=?"; $values[]=$json==='active'?($data[$json]?1:0):$data[$json]; }
        if ($fields) { $values[]=(string)$data['id']; $db->prepare('UPDATE users SET '.implode(',',$fields).' WHERE id=?')->execute($values); }
        if (array_key_exists('name',$data)) $db->prepare('UPDATE sales SET seller_name=? WHERE seller_id=?')->execute([(string)$data['name'],(string)$data['id']]);
    } elseif ($action === 'user_delete') {
        $db->prepare('DELETE FROM users WHERE id=?')->execute([(string)$data['id']]);
    } else reply(['ok'=>false,'error'=>'Okänd åtgärd'],404);

    $fresh = account_row($db, $account['id']);
    reply(state_payload($db, $fresh));
} catch (PDOException $error) {
    $message = str_contains($error->getMessage(), 'UNIQUE') ? 'Namnet finns redan' : 'Databasen kunde inte uppdateras';
    reply(['ok'=>false,'error'=>$message],500);
} catch (Throwable $error) {
    reply(['ok'=>false,'error'=>'Kassun-servern svarade inte'],500);
}
