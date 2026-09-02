<?php
declare(strict_types=1);
require_once __DIR__.'/room-rules.php';

function social_schema(PDO $db): void {
    $db->exec('CREATE TABLE IF NOT EXISTS yatsun_members (uid VARCHAR(191) PRIMARY KEY, name VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL, code CHAR(12) NOT NULL UNIQUE, seen_at BIGINT NOT NULL, INDEX(name)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin');
    $db->exec("CREATE TABLE IF NOT EXISTS yatsun_friends (a VARCHAR(191) NOT NULL, b VARCHAR(191) NOT NULL, sender VARCHAR(191) NOT NULL, status VARCHAR(16) NOT NULL DEFAULT 'pending', PRIMARY KEY(a,b)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin");
    $db->exec("CREATE TABLE IF NOT EXISTS yatsun_rooms (id CHAR(32) PRIMARY KEY, a VARCHAR(191) NOT NULL, b VARCHAR(191) NOT NULL, status VARCHAR(16) NOT NULL DEFAULT 'pending', revision INT NOT NULL DEFAULT 0, state_json LONGTEXT NOT NULL, updated_at BIGINT NOT NULL, INDEX(a), INDEX(b)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin");
}
function social_query(PDO $db,string $sql,array $params=[]): PDOStatement {$q=$db->prepare($sql);$q->execute($params);return $q;}
function social_pair(string $uid,string $other): array {if($uid===$other||$other==='')throw new RuntimeException('Välj en annan medlem.',400);$pair=[$uid,$other];sort($pair,SORT_STRING);return $pair;}
function social_room(array $row): array {return ['id'=>$row['id'],'a'=>$row['a'],'b'=>$row['b'],'status'=>$row['status'],'revision'=>(int)$row['revision'],'state'=>json_decode($row['state_json'],true),'updatedAt'=>(int)$row['updated_at']];}

function social_handle(PDO $db,string $uid,string $action,array $input): array {
    social_schema($db);$now=(int)floor(microtime(true)*1000);
    if($action==='social_register'){
        $name=trim((string)($input['name']??''));if($name===''||strlen($name)>200)throw new RuntimeException('Ogiltigt namn.',400);
        $name=mb_substr($name,0,80);
        social_query($db,'INSERT INTO yatsun_members(uid,name,code,seen_at) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),seen_at=VALUES(seen_at)',[$uid,$name,strtoupper(bin2hex(random_bytes(6))),$now]);
        return ['member'=>social_query($db,'SELECT uid,name,code FROM yatsun_members WHERE uid=?',[$uid])->fetch()];
    }
    if(!social_query($db,'SELECT uid FROM yatsun_members WHERE uid=?',[$uid])->fetch())throw new RuntimeException('Öppna vänfönstret igen för att aktivera din spelprofil.',409);
    if($action==='room_lobby'){
        return ['tables'=>social_query($db,"SELECT r.id,r.a AS hostUid,m.name AS hostName,r.updated_at AS createdAt FROM yatsun_rooms r JOIN yatsun_members m ON m.uid=r.a WHERE r.status='open' ORDER BY r.updated_at DESC LIMIT 100")->fetchAll()];
    }
    if($action==='room_host'){
        $db->beginTransaction();
        try{
            // Serialize host requests so a double click cannot create two tables.
            social_query($db,'SELECT uid FROM yatsun_members WHERE uid=? FOR UPDATE',[$uid])->fetch();
            $existing=social_query($db,"SELECT id FROM yatsun_rooms WHERE a=? AND status='open' LIMIT 1",[$uid])->fetch();
            if($existing){$db->commit();return ['id'=>$existing['id']];}
            $id=bin2hex(random_bytes(16));
            social_query($db,"INSERT INTO yatsun_rooms(id,a,b,status,state_json,updated_at) VALUES(?,?,'','open','{}',?)",[$id,$uid,$now]);
            $db->commit();return ['id'=>$id];
        }catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}
    }
    if($action==='room_join'||$action==='room_cancel_open'){
        $id=(string)($input['id']??'');if(!preg_match('/^[a-f0-9]{32}$/',$id))throw new RuntimeException('Ogiltigt bord.',400);
        $db->beginTransaction();
        try{
            $row=social_query($db,'SELECT * FROM yatsun_rooms WHERE id=? FOR UPDATE',[$id])->fetch();
            if(!$row||$row['status']!=='open')throw new RuntimeException('Bordet är inte längre ledigt. Uppdatera listan.',409);
            if($action==='room_cancel_open'){
                if($row['a']!==$uid)throw new RuntimeException('Bara värden kan stänga bordet.',403);
                social_query($db,"UPDATE yatsun_rooms SET status='cancelled',revision=revision+1,updated_at=? WHERE id=?",[$now,$id]);
                $db->commit();return ['ok'=>true];
            }
            if($row['a']===$uid)throw new RuntimeException('Vänta på en annan spelare vid ditt bord.',409);
            $row['b']=$uid;$row['status']='active';$row['revision']=(int)$row['revision']+1;$row['updated_at']=$now;$row['state_json']=json_encode(room_initial($row['a'],$uid));
            social_query($db,"UPDATE yatsun_rooms SET b=?,status='active',revision=?,state_json=?,updated_at=? WHERE id=?",[$uid,$row['revision'],$row['state_json'],$now,$id]);
            $name=social_query($db,'SELECT name FROM yatsun_members WHERE uid=?',[$row['a']])->fetchColumn();
            $db->commit();return ['room'=>social_room($row)+['otherName'=>$name]];
        }catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}
    }
    if($action==='social_search'){
        $term=trim((string)($input['query']??''));if(mb_strlen($term)<2||mb_strlen($term)>80)return ['members'=>[]];
        $prefix=str_replace(['!','%','_'],['!!','!%','!_'],$term).'%';
        return ['members'=>social_query($db,"SELECT uid,name,code FROM yatsun_members WHERE uid<>? AND (code=? OR name LIKE ? ESCAPE '!') ORDER BY name LIMIT 20",[$uid,strtoupper(str_replace([' ','-'],'',$term)),$prefix])->fetchAll()];
    }
    if($action==='social_list'){
        social_query($db,'UPDATE yatsun_members SET seen_at=? WHERE uid=?',[$now,$uid]);
        $friends=social_query($db,'SELECT m.uid,m.name,m.code,m.seen_at,f.sender,f.status FROM yatsun_friends f JOIN yatsun_members m ON m.uid=CASE WHEN f.a=? THEN f.b ELSE f.a END WHERE f.a=? OR f.b=? ORDER BY m.name',[$uid,$uid,$uid])->fetchAll();
        $rooms=social_query($db,"SELECT r.*,m.name AS other_name FROM yatsun_rooms r JOIN yatsun_members m ON m.uid=CASE WHEN r.a=? THEN r.b ELSE r.a END WHERE (r.a=? OR r.b=?) AND r.status IN ('pending','active','done') ORDER BY r.updated_at DESC LIMIT 50",[$uid,$uid,$uid])->fetchAll();
        return ['friends'=>$friends,'rooms'=>array_map(fn($r)=>social_room($r)+['otherName'=>$r['other_name']],$rooms)];
    }
    if(in_array($action,['friend_request','friend_accept','friend_remove'],true)){
        $other=(string)($input['uid']??'');[$a,$b]=social_pair($uid,$other);
        if($action==='friend_request'){
            if(!social_query($db,'SELECT uid FROM yatsun_members WHERE uid=?',[$other])->fetch())throw new RuntimeException('Medlemmen finns inte.',404);
            social_query($db,"INSERT IGNORE INTO yatsun_friends(a,b,sender,status) VALUES(?,?,?,'pending')",[$a,$b,$uid]);
        }elseif($action==='friend_accept'){
            $q=social_query($db,"UPDATE yatsun_friends SET status='accepted' WHERE a=? AND b=? AND sender<>? AND status='pending'",[$a,$b,$uid]);
            if(!$q->rowCount())throw new RuntimeException('Ingen inkommande förfrågan finns.',409);
        }else social_query($db,'DELETE FROM yatsun_friends WHERE a=? AND b=?',[$a,$b]);
        return ['ok'=>true];
    }
    if($action==='room_invite'){
        $other=(string)($input['uid']??'');[$a,$b]=social_pair($uid,$other);
        $db->beginTransaction();
        try{
            $friend=social_query($db,"SELECT status FROM yatsun_friends WHERE a=? AND b=? FOR UPDATE",[$a,$b])->fetch();
            if(!$friend||$friend['status']!=='accepted')throw new RuntimeException('Ni måste vara vänner för att utmana varandra.',403);
            $existing=social_query($db,"SELECT * FROM yatsun_rooms WHERE ((a=? AND b=?) OR (a=? AND b=?)) AND status IN ('pending','active') LIMIT 1",[$uid,$other,$other,$uid])->fetch();
            if($existing){$db->commit();return ['room'=>social_room($existing)];}
            $id=bin2hex(random_bytes(16));$state=room_initial($uid,$other);
            social_query($db,'INSERT INTO yatsun_rooms(id,a,b,state_json,updated_at) VALUES(?,?,?,?,?)',[$id,$uid,$other,json_encode($state),$now]);$db->commit();
            return ['room'=>['id'=>$id,'a'=>$uid,'b'=>$other,'status'=>'pending','revision'=>0,'state'=>$state,'updatedAt'=>$now]];
        }catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}
    }
    if(str_starts_with($action,'room_')){
        $id=(string)($input['id']??'');if(!preg_match('/^[a-f0-9]{32}$/',$id))throw new RuntimeException('Ogiltigt matchrum.',400);
        $db->beginTransaction();
        try{
            $row=social_query($db,'SELECT * FROM yatsun_rooms WHERE id=? FOR UPDATE',[$id])->fetch();
            if(!$row||!in_array($uid,[$row['a'],$row['b']],true))throw new RuntimeException('Matchen finns inte.',404);
            if($action==='room_get'){$db->commit();return ['room'=>social_room($row)];}
            if(($input['revision']??null)!==(int)$row['revision'])throw new RuntimeException('Matchen har uppdaterats. Försök igen.',409);
            $state=json_decode($row['state_json'],true);
            if($action==='room_accept'||$action==='room_decline'){
                if($row['status']!=='pending'||$row['b']!==$uid)throw new RuntimeException('Utmaningen kan inte besvaras.',409);
                $row['status']=$action==='room_accept'?'active':'declined';
            }else{
                if($row['status']!=='active')throw new RuntimeException('Matchen är inte aktiv.',409);
                if($action==='room_reaction'){
                    $reaction=$input['reaction']??null;
                    if(!is_int($reaction)||$reaction<0||$reaction>7)throw new RuntimeException('Ogiltig reaktion.',400);
                    $state['reaction']=['uid'=>$uid,'id'=>$reaction,'at'=>$now];
                }else $state=room_move($state,$uid,$action,$input);
                if($state['done'])$row['status']='done';
            }
            $row['state_json']=json_encode($state);$row['revision']=(int)$row['revision']+1;$row['updated_at']=$now;
            social_query($db,'UPDATE yatsun_rooms SET status=?,revision=?,state_json=?,updated_at=? WHERE id=?',[$row['status'],$row['revision'],$row['state_json'],$now,$id]);$db->commit();return ['room'=>social_room($row)];
        }catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}
    }
    throw new RuntimeException('Okänd åtgärd.',400);
}
