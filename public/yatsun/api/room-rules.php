<?php
declare(strict_types=1);

function room_categories(): array { return array_merge(array_map(fn($i) => 'u'.$i, range(1,6)), array_map(fn($i) => 'l'.$i, range(0,8))); }
function room_score(string $category, array $dice): int {
    $counts = array_count_values($dice); $sum = array_sum($dice);
    if (preg_match('/^u([1-6])$/', $category, $m)) return ($counts[(int)$m[1]] ?? 0) * (int)$m[1];
    $groups = fn(int $n) => array_keys(array_filter($counts, fn($count) => $count >= $n));
    $pairs = $groups(2); rsort($pairs);
    return match($category) {
        'l0' => $pairs ? $pairs[0]*2 : 0,
        'l1' => count($pairs)>=2 ? ($pairs[0]+$pairs[1])*2 : 0,
        'l2' => $groups(3) ? max($groups(3))*3 : 0,
        'l3' => $groups(4) ? max($groups(4))*4 : 0,
        'l4' => count(array_intersect([1,2,3,4,5],$dice))===5 ? 15 : 0,
        'l5' => count(array_intersect([2,3,4,5,6],$dice))===5 ? 20 : 0,
        'l6' => in_array(3,$counts,true)&&in_array(2,$counts,true) ? $sum : 0,
        'l7' => $sum,
        'l8' => in_array(5,$counts,true) ? 50 : 0,
        default => throw new RuntimeException('Ogiltig poängrad.',400),
    };
}
function room_total(array $scores): int {
    $upper=0;foreach(range(1,6) as $n)$upper += $scores['u'.$n]??0;
    return array_sum($scores)+($upper>=63?50:0);
}
function room_initial(string $a, string $b): array {
    return ['players'=>[$a,$b],'turn'=>$a,'rolls'=>0,'dice'=>[1,2,3,4,5], 'held'=>array_fill(0,5,false),'scores'=>[$a=>[],$b=>[]],'last'=>null,'done'=>false];
}
function room_move(array $state,string $uid,string $action,array $input,?callable $random=null): array {
    if(!in_array($uid,$state['players'],true))throw new RuntimeException('Du är inte med i matchen.',403);
    if($state['done']||$state['turn']!==$uid)throw new RuntimeException('Det är inte din tur.',409);
    if($action==='room_hold'){
        $held=$input['held']??null;
        if(!$state['rolls']||!is_array($held)||count($held)!==5||array_filter($held,fn($v)=>!is_bool($v)))throw new RuntimeException('Ogiltiga sparade tärningar.',400);
        $state['held']=array_values($held);
    } elseif($action==='room_roll'){
        if($state['rolls']>=3)throw new RuntimeException('Du har redan kastat tre gånger.',409);
        $held=$input['held']??array_fill(0,5,false);
        if(!is_array($held)||count($held)!==5||array_filter($held,fn($v)=>!is_bool($v)))throw new RuntimeException('Ogiltiga sparade tärningar.',400);
        $held=array_values($held);if($state['rolls']===0)$held=array_fill(0,5,false);
        if(!in_array(false,$held,true))throw new RuntimeException('Välj minst en tärning att kasta.',400);
        foreach($held as $i=>$keep)if(!$keep)$state['dice'][$i]=$random ? $random() : random_int(1,6);
        $state['rolls']++;$state['held']=$held;
    } elseif($action==='room_score'){
        $id=$input['category']??'';
        if(!in_array($id,room_categories(),true))throw new RuntimeException('Ogiltig poängrad.',400);
        if(!$state['rolls']||array_key_exists($id,$state['scores'][$uid]))throw new RuntimeException('Den poängraden kan inte väljas.',409);
        $score=room_score($id,$state['dice']);$state['scores'][$uid][$id]=$score;
        $state['last']=['uid'=>$uid,'id'=>$id,'score'=>$score];
        $other=$state['players'][0]===$uid?$state['players'][1]:$state['players'][0];
        $state['done']=count($state['scores'][$uid])===15&&count($state['scores'][$other])===15;
        $state['turn']=$other;$state['rolls']=0;$state['held']=array_fill(0,5,false);
    } else throw new RuntimeException('Okänt drag.',400);
    return $state;
}
