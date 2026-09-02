<?php
declare(strict_types=1);
require __DIR__.'/../public/yatsun/api/social.php';
function check(bool $condition,string $message): void {if(!$condition)throw new Exception($message);}
function rejects(callable $fn,int $code): void {try{$fn();}catch(RuntimeException $e){check($e->getCode()===$code,'Wrong error: '.$e->getMessage());return;}throw new Exception('Expected rejection');}
$s=room_initial('a','b');
rejects(fn()=>room_move($s,'outsider','room_roll',[]),403);
rejects(fn()=>room_move($s,'b','room_roll',[]),409);
rejects(fn()=>room_move($s,'a','room_score',['category'=>'u1']),409);
$s=room_move($s,'a','room_roll',['held'=>[true,true,true,true,true]],fn()=>3);
check($s['dice']===[3,3,3,3,3]&&$s['rolls']===1,'First roll ignores holds');
$s=room_move($s,'a','room_roll',['held'=>[true,true,true,true,false]],fn()=>6);
check($s['dice']===[3,3,3,3,6],'Held dice preserved');
$s=room_move($s,'a','room_roll',['held'=>[true,true,true,true,false]],fn()=>6);
rejects(fn()=>room_move($s,'a','room_roll',[]),409);
$s=room_move($s,'a','room_score',['category'=>'u3']);
check($s['scores']['a']['u3']===12&&$s['turn']==='b'&&$s['rolls']===0,'Score and switch turn');
check(room_score('l8',[6,6,6,6,6])===50,'Yatzy');
check(room_score('l4',[1,2,3,4,5])===15&&room_score('l4',[1,2,3,4,4])===0,'Straight');
check(room_score('l1',[2,2,6,6,1])===16,'Two pairs');
check(room_score('l6',[2,2,6,6,6])===22&&room_score('l6',[6,6,6,6,6])===0,'Full house');
check(room_total(['u1'=>3,'u2'=>6,'u3'=>9,'u4'=>12,'u5'=>15,'u6'=>18])===113,'Bonus');
$s=room_initial('a','b');foreach(room_categories() as $id){foreach(['a','b'] as $uid){$s=room_move($s,$uid,'room_roll',[],fn()=>3);$s=room_move($s,$uid,'room_score',['category'=>$id]);}}
check($s['done']===true,'Full match completes');rejects(fn()=>room_move($s,'a','room_roll',[]),409);
echo "Room rule tests passed\n";
if(!getenv('YATSUN_TEST_DSN'))exit;
$db=new PDO(getenv('YATSUN_TEST_DSN'),'root','test-only',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
$call=fn($uid,$action,$input=[])=>social_handle($db,$uid,$action,$input);
foreach(['alice','bob','eve'] as $uid)$call($uid,'social_register',['name'=>ucfirst($uid)]);
$member=$call('alice','social_register',['name'=>'Alice'])['member'];
check(count($call('bob','social_search',['query'=>$member['code']])['members'])===1,'Search code');
rejects(fn()=>$call('alice','room_invite',['uid'=>'bob']),403);
$call('alice','friend_request',['uid'=>'bob']);
rejects(fn()=>$call('alice','friend_accept',['uid'=>'bob']),409);
$call('bob','friend_accept',['uid'=>'alice']);
$room=$call('alice','room_invite',['uid'=>'bob'])['room'];
check($call('bob','room_invite',['uid'=>'alice'])['room']['id']===$room['id'],'Duplicate invitation reuses room');
rejects(fn()=>$call('eve','room_get',['id'=>$room['id']]),404);
rejects(fn()=>$call('alice','room_accept',['id'=>$room['id'],'revision'=>0]),409);
$room=$call('bob','room_accept',['id'=>$room['id'],'revision'=>0])['room'];
rejects(fn()=>$call('bob','room_roll',['id'=>$room['id'],'revision'=>1]),409);
$room=$call('alice','room_roll',['id'=>$room['id'],'revision'=>1])['room'];
rejects(fn()=>$call('alice','room_roll',['id'=>$room['id'],'revision'=>1]),409);
check($call('bob','room_get',['id'=>$room['id']])['room']===$room,'Resume exact saved state');
$room=$call('alice','room_score',['id'=>$room['id'],'revision'=>2,'category'=>'l7'])['room'];
check($room['state']['turn']==='bob','Persistent turn transition');
check(count($call('eve','social_list')['rooms'])===0,'Room list participant isolation');
echo "MariaDB social and durable room tests passed\n";
