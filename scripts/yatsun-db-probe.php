<?php
// Temporary, token-protected, read-only production connection check.
declare(strict_types=1);
header('Content-Type: application/json');
header('Cache-Control: no-store');
if (time()-filemtime(__FILE__)>600 || !hash_equals('__PROBE_TOKEN__', $_SERVER['HTTP_X_YATSUN_PROBE']??'')) {http_response_code(404);exit;}
$config=[];
try {
    $config=json_decode(file_get_contents(__DIR__.'/yatsun-db.json'),true,512,JSON_THROW_ON_ERROR);
    $config['host']=base64_decode('__CANDIDATE_HOST__');
    $db=new PDO('mysql:host='.$config['host'].';dbname='.$config['name'].';charset=utf8mb4',$config['user'],$config['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
    $result=['connected'=>true,'expectedDatabase'=>$db->query('SELECT DATABASE()')->fetchColumn()==='dbs16080702','version'=>$db->query('SELECT VERSION()')->fetchColumn(),'tables'=>[]];
    foreach(['yatsun_matches','yatsun_members','yatsun_friends','yatsun_rooms'] as $table){
        try {$result['tables'][$table]=$db->query('SHOW CREATE TABLE '.$table)->fetch();}
        catch(PDOException $e){$result['tables'][$table]=['sqlstate'=>$e->getCode(),'driverCode'=>$e->errorInfo[1]??null];}
    }
    echo json_encode($result);
} catch(Throwable $e){
    $message=$e->getMessage();foreach($config as $value)if(is_string($value)&&$value!=='')$message=str_replace($value,'[redacted]',$message);
    echo json_encode(['connected'=>false,'sqlstate'=>$e->getCode(),'driverCode'=>$e instanceof PDOException?($e->errorInfo[1]??null):null,'error'=>$message]);
}
