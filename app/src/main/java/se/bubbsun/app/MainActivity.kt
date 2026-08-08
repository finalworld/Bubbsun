package se.bubbsun.app

import android.content.Context
import android.content.Intent
import android.app.Activity
import java.util.Locale
import java.text.SimpleDateFormat
import android.net.Uri
import android.os.Bundle
import android.os.Build
import android.Manifest
import android.content.pm.PackageManager
import android.content.res.Configuration
import java.net.HttpURLConnection
import java.net.URL
import androidx.activity.ComponentActivity
import androidx.core.app.ActivityCompat
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGesturesAfterLongPress
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.snapshots.SnapshotStateList
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import org.json.JSONArray
import org.json.JSONObject
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.SetOptions
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import java.util.UUID
import kotlin.math.abs
import kotlin.math.roundToInt
import kotlin.math.sign
import kotlin.random.Random
import kotlinx.coroutines.launch
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull

private data class ListIconOption(val id:String,val drawable:Int,val supporter:Boolean=false)
private val listIcons = listOf(
    ListIconOption("list_cart",R.drawable.list_cart),
    ListIconOption("list_basket",R.drawable.list_basket),
    ListIconOption("list_food",R.drawable.list_food),
    ListIconOption("list_dining",R.drawable.list_dining),
    ListIconOption("list_home",R.drawable.list_home),
    ListIconOption("list_drink_cup",R.drawable.list_drink_cup),
    ListIconOption("list_work",R.drawable.list_work),
    ListIconOption("list_checklist",R.drawable.list_checklist),
    ListIconOption("list_fitness",R.drawable.list_fitness),
    ListIconOption("list_hiking",R.drawable.list_hiking),
    ListIconOption("list_pets",R.drawable.list_pets),
    ListIconOption("list_vacation",R.drawable.list_vacation),
    ListIconOption("list_supporter_heart_cart",R.drawable.list_supporter_heart_cart,true),
    ListIconOption("list_supporter_moon",R.drawable.list_supporter_moon,true),
    ListIconOption("list_supporter_emblem",R.drawable.list_supporter_emblem,true),
    ListIconOption("list_supporter_beer",R.drawable.list_supporter_beer,true)
)

@Composable private fun ListIconVisual(id:String,modifier:Modifier=Modifier,locked:Boolean=false){
    val migratedId=when(id){"list_sofa"->"list_drink_cup";"list_supporter_compass"->"list_supporter_beer";else->id}
    val option=listIcons.firstOrNull{it.id==migratedId}?:if(id=="list_supporter_crystal")ListIconOption(id,R.drawable.list_supporter_heart_cart,true)else null
    Box(modifier,contentAlignment=Alignment.Center){
        if(option!=null)Image(painterResource(option.drawable),contentDescription=null,contentScale=ContentScale.Fit,modifier=Modifier.fillMaxSize().graphicsLayer{alpha=if(locked).28f else 1f})
        else Text(id,fontSize=30.sp)
        if(locked){
            Box(Modifier.matchParentSize().clip(RoundedCornerShape(7.dp)).background(Color.Gray.copy(alpha=.30f)))
            Text("🔒",fontSize=15.sp,modifier=Modifier.align(Alignment.TopEnd))
        }
    }
}
private val iconColors = listOf(0xFF2B7A78,0xFFC84B55,0xFFF2994A,0xFFA8C686,0xFF4E6F9E,0xFF8E72B5)
private const val editionName = "Family Expansion"
private val supporterStyleIds = setOf("none","classic","royal","ribbon","signature","badge","cosmic")
private val appLanguageState = mutableStateOf("sv")
private val italian=mapOf(
    "MINA LISTOR" to "LE MIE LISTE","ANVÄNDARE" to "UTENTI","STATISTIK" to "STATISTICHE","INSTÄLLNINGAR" to "IMPOSTAZIONI","OM BUBBSUN" to "INFO SU BUBBSUN",
    "AKTIV ANVÄNDARE" to "UTENTE ATTIVO","Aktiv användare" to "Utente attivo","Tryck för att byta" to "Tocca per cambiare","Hantera användare" to "Gestisci utenti",
    "Se listor, köp och aktivitet" to "Vedi liste, acquisti e attività","Språk, bekräftelser & statistik" to "Lingua, conferme e statistiche","Version, skapare & kontakt" to "Versione, autori e contatti",
    "LÄGG TILL NY LISTA" to "AGGIUNGI NUOVA LISTA","LÄGG TILL PRODUKT" to "AGGIUNGI PRODOTTO","LÄGG TILL ANVÄNDARE" to "AGGIUNGI UTENTE",
    "REDIGERA LISTA" to "MODIFICA LISTA","REDIGERA VARA" to "MODIFICA ARTICOLO","REDIGERA ANVÄNDARE" to "MODIFICA UTENTE",
    "SPARA" to "SALVA","AVBRYT" to "ANNULLA","BEKRÄFTA" to "CONFERMA","AVSLUTA" to "ESCI","KLART" to "COMPLETATI",
    "VÄLJ TEMA" to "SCEGLI TEMA","VÄLJ FÄRG" to "SCEGLI COLORE","VÄLJ IKON" to "SCEGLI ICONA","SKAPA LISTA" to "CREA LISTA",
    "PRODUKT" to "PRODOTTO","MÄNGD" to "QUANTITÀ","Namn" to "Nome","Listnamn" to "Nome lista","Vara" to "Articolo","objekt" to "elementi","varor" to "articoli",
    "RAPPORTERA PROBLEM" to "SEGNALA UN PROBLEMA","SKICKA FÖRSLAG" to "INVIA UN SUGGERIMENTO","Ingen lista ännu" to "Nessuna lista","Ingen statistik ännu" to "Nessuna statistica",
    "SKAPADE LISTOR" to "LISTE CREATE","TILLAGDA VAROR" to "ARTICOLI AGGIUNTI","AVPRICKADE" to "COMPLETATI","UNDER PERIODEN" to "NEL PERIODO",
    "MEST AKTIV ANVÄNDARE" to "UTENTE PIÙ ATTIVO","MEST ANVÄNDA LISTA" to "LISTA PIÙ USATA","MEST HANDLADE" to "PIÙ ACQUISTATI",
    "Retro" to "Retrò","Ljus retro" to "Retrò chiaro","Hav" to "Oceano","Skog" to "Foresta","Solnedgång" to "Tramonto","Vinter" to "Inverno","Blomster" to "Fiori","Eld" to "Fuoco","Stål" to "Acciaio",
    "Kosmisk supporter" to "Supporter cosmico","Hjärtlig supporter" to "Supporter del cuore","Vill du stänga appen?" to "Vuoi chiudere l'app?","Avsluta Bubbsun?" to "Uscire da Bubbsun?"
    ,"BEKRÄFTELSER" to "CONFERME","SPRÅK" to "LINGUA","Visa 'Avsluta Bubbsun?'" to "Mostra 'Uscire da Bubbsun?'","Aktivera supporterläge" to "Attiva modalità supporter",
    "Simulerar framtida köp och låser upp supporterteman." to "Simula l'acquisto futuro e sblocca i temi supporter.","Välj supporter-dekoration vid Bubbsun-loggan." to "Scegli la decorazione supporter vicino al logo Bubbsun.","Mjukt sken runt Bubbsun-loggan." to "Bagliore morbido intorno al logo Bubbsun.",
    "STÖD BUBBSUN" to "SOSTIENI BUBBSUN","TACK FÖR DITT STÖD!" to "GRAZIE PER IL TUO SOSTEGNO!","DU ÄR SUPPORTER" to "SEI UN SUPPORTER",
    "GRATIS UNDER FÖRHANDSVISNINGEN" to "GRATIS DURANTE L'ANTEPRIMA","DETTA LÅSES UPP" to "QUESTO VIENE SBLOCCATO",
    "Kosmiskt och Hjärtligt tema" to "Temi Cosmico e del Cuore","Exklusiva ikoner och färger" to "Icone e colori esclusivi","Supporterdekorationer och glow" to "Decorazioni supporter e bagliore","Klingon som appspråk" to "Klingon come lingua dell'app",
    "Ingen betalning genomförs. Knappen aktiverar bara Supporter Preview på den här enheten." to "Non viene effettuato alcun pagamento. Il pulsante attiva solo Supporter Preview su questo dispositivo.",
    "AKTIVERA SUPPORTER GRATIS" to "ATTIVA SUPPORTER GRATIS","Tack för att du stödjer Bubbsun!" to "Grazie per sostenere Bubbsun!","UTFORSKA SUPPORTERINNEHÅLL" to "ESPLORA I CONTENUTI SUPPORTER","ÅTERSTÄLL KÖP  •  KOMMER SENARE" to "RIPRISTINA ACQUISTI  •  PROSSIMAMENTE"
    ,"VERSIONER & NYHETER" to "VERSIONI E NOVITÀ","NYTT" to "NOVITÀ"
    ,"Valfri mängd" to "Quantità facoltativa","Mängd/enhet, t.ex. 2 paket" to "Quantità/unità, es. 2 confezioni","Skriv listans namn…" to "Scrivi il nome della lista…","Skriv ett namn" to "Scrivi un nome","Namnet finns redan" to "Il nome esiste già",
    "MARKERA ALLA" to "SELEZIONA TUTTO","FÄRG" to "COLORE","1 VECKA" to "1 SETTIMANA","1 MÅNAD" to "1 MESE","1 ÅR" to "1 ANNO","LIVSTID" to "SEMPRE",
    "Alla saker i listan försvinner." to "Tutti gli articoli della lista verranno eliminati.","Det går inte att ångra." to "Questa azione non può essere annullata.","Neon" to "Neon",
    "Utveckling & design" to "Sviluppo e design","Idéer, testning & feedback" to "Idee, test e feedback","Support & kvalitetskontroll" to "Supporto e controllo qualità",
    "Hjälp oss att göra Bubbsun ännu bättre" to "Aiutaci a migliorare Bubbsun","Har du en idé? Vi vill gärna höra den!" to "Hai un'idea? Vogliamo ascoltarla!"
)
private val klingon=mapOf(
    "MINA LISTOR" to "TETLHWIJMEY","ANVÄNDARE" to "LO'WI'PU'","STATISTIK" to "DE'","INSTÄLLNINGAR" to "CHENMOHMEH","OM BUBBSUN" to "BUBBSUN DE'",
    "AKTIV ANVÄNDARE" to "LO'WI' VUM","Tryck för att byta" to "CHOHMEH YI'UY","SPARA" to "POL","AVBRYT" to "QIL","BEKRÄFTA" to "HIJA'","AVSLUTA" to "MEJ",
    "LÄGG TILL NY LISTA" to "TETLH CHU' CHEL","LÄGG TILL PRODUKT" to "Doch CHEL","LÄGG TILL ANVÄNDARE" to "LO'WI' CHEL",
    "VÄLJ TEMA" to "NGOQ YIWIV","VÄLJ FÄRG" to "NGUVTAHGHACH YIWIV","VÄLJ IKON" to "MIV YIWIV","SKAPA LISTA" to "TETLH CHENMOH",
    "PRODUKT" to "Doch","MÄNGD" to "mI'","Namn" to "pong","Listnamn" to "tetlh pong","Vara" to "Doch","objekt" to "Dochmey","varor" to "Dochmey",
    "KLART" to "RIN","RAPPORTERA PROBLEM" to "QAGH JA'","SKICKA FÖRSLAG" to "QUB JA'","Ingen lista ännu" to "TETLH TU'BE'","Ingen statistik ännu" to "DE' TU'BE'",
    "Kosmisk supporter" to "QIB SUPPORTER","Hjärtlig supporter" to "TIQ SUPPORTER","Vill du stänga appen?" to "DAH BIMEJ'A'?","Avsluta Bubbsun?" to "BUBBSUN DAMEJ'A'?"
    ,"BEKRÄFTELSER" to "OL","SPRÅK" to "HOL","Visa 'Avsluta Bubbsun?'" to "Bubbsun Damej'a' 'ang","Aktivera supporterläge" to "supporter yIchu'",
    "Simulerar framtida köp och låser upp supporterteman." to "supporter Dochmey poSmoH.","Välj supporter-dekoration vid Bubbsun-loggan." to "Bubbsun Degh yIwIv.","Mjukt sken runt Bubbsun-loggan." to "Bubbsun Degh wov.",
    "STÖD BUBBSUN" to "BUBBSUN YIQaH","TACK FÖR DITT STÖD!" to "QaHLI' VItlho'!","DU ÄR SUPPORTER" to "SUPPORTER SOH",
    "GRATIS UNDER FÖRHANDSVISNINGEN" to "DAH DIlnISBE'","DETTA LÅSES UPP" to "Dochmeyvam DapoSmoH",
    "Kosmiskt och Hjärtligt tema" to "QIb TIQ je ngoq","Exklusiva ikoner och färger" to "Deghmey rItlhmey le' je","Supporterdekorationer och glow" to "Supporter Deghmey wov je","Klingon som appspråk" to "tlhIngan Hol app Hol",
    "Ingen betalning genomförs. Knappen aktiverar bara Supporter Preview på den här enheten." to "DaH pagh DIl. janvamDaq Supporter Preview neH chu' leQ.",
    "AKTIVERA SUPPORTER GRATIS" to "SUPPORTER YICHU' DIlnISBE'","Tack för att du stödjer Bubbsun!" to "Bubbsun DaQaHmo' qatlho'!","UTFORSKA SUPPORTERINNEHÅLL" to "SUPPORTER Dochmey YIlegh","ÅTERSTÄLL KÖP  •  KOMMER SENARE" to "je'meH Dochmey cheghmoH  •  pIq"
    ,"VERSIONER & NYHETER" to "MUGHMEY DE' CHU' JE","NYTT" to "CHU'"
    ,"Valfri mängd" to "mI' poQbe'","Mängd/enhet, t.ex. 2 paket" to "mI' pagh tup","Skriv listans namn…" to "tetlh pong yIghItlh…","Skriv ett namn" to "pong yIghItlh","Namnet finns redan" to "pong tu'lu'",
    "MARKERA ALLA" to "Hoch yIwIv","FÄRG" to "rItlh","1 VECKA" to "Hogh wa'","1 MÅNAD" to "jar wa'","1 ÅR" to "DIS wa'","LIVSTID" to "yIn Hoch",
    "Alla saker i listan försvinner." to "tetlh Dochmey Hoch teqlu'.","Det går inte att ångra." to "choHlaHbe'.","Neon" to "neon",
    "SKAPADE LISTOR" to "tetlhmey chenmoHlu'","TILLAGDA VAROR" to "Dochmey chellu'","AVPRICKADE" to "rInbogh","UNDER PERIODEN" to "poHvam",
    "MEST AKTIV ANVÄNDARE" to "lo'wI' vumqu'","MEST ANVÄNDA LISTA" to "tetlh lo'qu'","MEST HANDLADE" to "Dochmey je'qu'",
    "REDIGERA LISTA" to "tetlh yIchoH","REDIGERA VARA" to "Doch yIchoH","REDIGERA ANVÄNDARE" to "lo'wI' yIchoH",
    "Utveckling & design" to "ghun 'ej 'ang","Idéer, testning & feedback" to "qechmey, waH, jang","Support & kvalitetskontroll" to "QaH 'ej nIvHa'ghach legh",
    "Hjälp oss att göra Bubbsun ännu bättre" to "Bubbsun wIvuvmeH yIQaH","Har du en idé? Vi vill gärna höra den!" to "qech Daghaj'a'? yIja'!"
)
private val languageOverrides=mapOf(
    "fi" to mapOf("Upptagna färger är överkryssade." to "Käytössä olevat värit on yliviivattu.","Kunde inte spara namnet." to "Nimeä ei voitu tallentaa."),
    "it" to mapOf("Upptagna färger är överkryssade." to "I colori già utilizzati sono barrati.","Kunde inte spara namnet." to "Impossibile salvare il nome."),
    "es" to mapOf("Upptagna färger är överkryssade." to "Los colores que ya están en uso aparecen tachados.","Kunde inte spara namnet." to "No se pudo guardar el nombre."),
    "de" to mapOf("Upptagna färger är överkryssade." to "Bereits verwendete Farben sind durchgestrichen.","Kunde inte spara namnet." to "Der Name konnte nicht gespeichert werden."),
    "fr" to mapOf("Upptagna färger är överkryssade." to "Les couleurs déjà utilisées sont barrées.","Kunde inte spara namnet." to "Impossible d’enregistrer le nom."),
    "pl" to mapOf("Upptagna färger är överkryssade." to "Używane kolory są przekreślone.","Kunde inte spara namnet." to "Nie udało się zapisać nazwy."),
    "no" to mapOf("Upptagna färger är överkryssade." to "Farger som allerede er i bruk, er krysset ut.","Kunde inte spara namnet." to "Kunne ikke lagre navnet.")
)
private fun tr(sv:String,en:String):String {
    val language=appLanguageState.value
    return when(language){
        "sv"->sv
        "en"->en
        "tlh"->klingon[sv]?:en
        "it"->languageOverrides[language]?.get(sv)?:italian[sv]?:generatedTranslations[language]?.get(sv)?:en
        else->languageOverrides[language]?.get(sv)?:generatedTranslations[language]?.get(sv)?:en
    }
}
private fun themeLabel(id:String)=when(id){
    "retro_dark"->tr("Retro","Retro")
    "retro_light"->tr("Ljus retro","Light retro")
    "ocean"->tr("Hav","Ocean")
    "forest"->tr("Skog","Forest")
    "sunset"->tr("Solnedgång","Sunset")
    "winter"->tr("Vinter","Winter")
    "blossom"->tr("Blomster","Blossom")
    "fire"->tr("Eld","Fire")
    "steel"->tr("Stål","Steel")
    "neon"->tr("Neon","Neon")
    "cosmic"->tr("Kosmisk supporter","Cosmic supporter")
    "heart"->tr("Hjärtlig supporter","Heartfelt supporter")
    "gothic"->tr("Gotisk supporter","Gothic supporter")
    else->id
}

data class UserProfile(val id:String=UUID.randomUUID().toString(), var name:String, var colorHex:Long)
class ShoppingItem(
    val id:String=UUID.randomUUID().toString(), name:String, quantity:String="", ownerId:String,
    completed:Boolean=false, val createdAt:Long=System.currentTimeMillis(), completedAt:Long?=null, likedBy:List<String> = emptyList()
){ var name by mutableStateOf(name); var quantity by mutableStateOf(quantity); var ownerId by mutableStateOf(ownerId); var completed by mutableStateOf(completed); var completedAt by mutableStateOf(completedAt); val likedBy=mutableStateListOf<String>().apply{addAll(likedBy)} }
class ShoppingListData(
    val id:String=UUID.randomUUID().toString(), name:String, icon:String="🛒", iconColorHex:Long=0xFF2B6F73,
    items:List<ShoppingItem> = emptyList(), sortMode:String="custom", doneFirst:Boolean=false,
    doneExpanded:Boolean=false, seenAtByUser:Map<String,Long> = emptyMap(), creatorId:String=""
){
    var name by mutableStateOf(name); var icon by mutableStateOf(icon); var iconColorHex by mutableStateOf(iconColorHex)
    var sortMode by mutableStateOf(sortMode); var doneFirst by mutableStateOf(doneFirst); var doneExpanded by mutableStateOf(doneExpanded)
    var creatorId by mutableStateOf(creatorId)
    val seenAtByUser=mutableStateMapOf<String,Long>().apply{putAll(seenAtByUser)}
    val items=mutableStateListOf<ShoppingItem>().apply{addAll(items)}
}
data class StatEvent(val id:String=UUID.randomUUID().toString(),val kind:String,val itemName:String,val userId:String,val timestamp:Long=System.currentTimeMillis())
private data class ReleaseInfo(val version:String,val pageUrl:String,val apkUrl:String,val notes:String)
private data class GithubReleaseStat(val name:String,val tag:String,val url:String,val date:String,val downloads:Int,val latest:Boolean)
data class CloudProfile(val uid:String,val name:String,val color:Long,val groupId:String,val role:String)
data class JoinRequest(val uid:String,val name:String,val color:Long,val createdAt:Long)

private class TogetherRepository{
    val auth:FirebaseAuth=FirebaseAuth.getInstance();private val db=FirebaseFirestore.getInstance()
    fun ensureProfile(user:FirebaseUser,onReady:(CloudProfile)->Unit){
        val ref=db.collection("users").document(user.uid)
        ref.get().addOnSuccessListener{doc->
            if(!doc.exists()){val name=(user.displayName?:"Bubbsun").take(35);val data=mapOf("uid" to user.uid,"displayName" to name,"name" to name,"color" to 0xFFFFC928L,"activeGroupId" to "","groupId" to "","role" to "member","schemaVersion" to 600,"createdAt" to FieldValue.serverTimestamp());ref.set(data).addOnSuccessListener{onReady(CloudProfile(user.uid,name,0xFFFFC928L,"","member"))}}
            else onReady(CloudProfile(user.uid,doc.getString("displayName")?:doc.getString("name")?:user.displayName?:"Bubbsun",doc.getLong("color")?:0xFFFFC928L,doc.getString("activeGroupId")?:doc.getString("groupId")?:"",doc.getString("role")?:"member"))
        }
    }
    fun listenProfile(uid:String,onChange:(CloudProfile)->Unit):ListenerRegistration=db.collection("users").document(uid).addSnapshotListener{d,_->if(d!=null&&d.exists())onChange(CloudProfile(uid,d.getString("displayName")?:d.getString("name")?:"Bubbsun",d.getLong("color")?:0xFFFFC928L,d.getString("activeGroupId")?:d.getString("groupId")?:"",d.getString("role")?:"member"))}
    private fun code()=(1..4).map{"ABCDEFGHJKLMNPQRSTUVWXYZ23456789".random()}.joinToString("")
    fun createGroup(profile:CloudProfile,onDone:(Boolean)->Unit){
        val group=db.collection("groups").document();val invite="BUBB-${code()}"
        db.runTransaction{t->
            val codeRef=db.collection("joinCodes").document(invite);if(t.get(codeRef).exists())throw IllegalStateException("code")
            t.set(group,mapOf("name" to "Familjen ${profile.name.substringBefore(" ")}","ownerId" to profile.uid,"joinCode" to invite,"createdAt" to FieldValue.serverTimestamp()))
            t.set(group.collection("members").document(profile.uid),mapOf("name" to profile.name,"color" to profile.color,"role" to "owner","joinedAt" to FieldValue.serverTimestamp()))
            t.set(codeRef,mapOf("groupId" to group.id));t.set(db.collection("users").document(profile.uid),mapOf("groupId" to group.id,"role" to "owner"),SetOptions.merge())
        }.addOnCompleteListener{onDone(it.isSuccessful)}
    }
    fun requestJoin(code:String,profile:CloudProfile,onDone:(Boolean)->Unit){
        db.collection("joinCodes").document(code.trim().uppercase()).get().addOnSuccessListener{d->val gid=d.getString("groupId");if(gid.isNullOrBlank())onDone(false)else db.collection("groups").document(gid).collection("requests").document(profile.uid).set(mapOf("name" to profile.name,"color" to profile.color,"createdAt" to FieldValue.serverTimestamp())).addOnCompleteListener{onDone(it.isSuccessful)}}.addOnFailureListener{onDone(false)}
    }
    fun listenMembers(groupId:String,onChange:(List<CloudProfile>)->Unit):ListenerRegistration=db.collection("groups").document(groupId).collection("members").addSnapshotListener{s,_->onChange(s?.documents?.map{CloudProfile(it.id,it.getString("name")?:"",it.getLong("color")?:0L,groupId,it.getString("role")?:"member")}?:emptyList())}
    fun listenRequests(groupId:String,onChange:(List<JoinRequest>)->Unit):ListenerRegistration=db.collection("groups").document(groupId).collection("requests").addSnapshotListener{s,_->onChange(s?.documents?.map{JoinRequest(it.id,it.getString("name")?:"",it.getLong("color")?:0L,it.getTimestamp("createdAt")?.toDate()?.time?:0L)}?:emptyList())}
    fun listenGroup(groupId:String,onChange:(String,String)->Unit):ListenerRegistration=db.collection("groups").document(groupId).addSnapshotListener{d,_->if(d!=null)onChange(d.getString("name")?:"Bubbsun",d.getString("joinCode")?:"")}
    fun approve(groupId:String,request:JoinRequest,members:List<CloudProfile>,onDone:(Boolean)->Unit){
        val used=members.map{it.color};val color=(userColors+supporterUserColors).firstOrNull{it !in used}?:0xFF777777
        val role="member";val group=db.collection("groups").document(groupId)
        db.runBatch{b->b.set(group.collection("members").document(request.uid),mapOf("name" to request.name,"color" to color,"role" to role,"joinedAt" to FieldValue.serverTimestamp()));b.set(db.collection("users").document(request.uid),mapOf("groupId" to groupId,"role" to role,"color" to color),SetOptions.merge());b.delete(group.collection("requests").document(request.uid))}.addOnCompleteListener{onDone(it.isSuccessful)}
    }
    fun deny(groupId:String,uid:String)=db.collection("groups").document(groupId).collection("requests").document(uid).delete()
    fun updateOwn(profile:CloudProfile,name:String,color:Long)=db.runBatch{b->b.set(db.collection("users").document(profile.uid),mapOf("name" to name,"color" to color),SetOptions.merge());if(profile.groupId.isNotBlank())b.set(db.collection("groups").document(profile.groupId).collection("members").document(profile.uid),mapOf("name" to name,"color" to color),SetOptions.merge())}
    fun updateGroupName(groupId:String,name:String)=db.collection("groups").document(groupId).update("name",name)
    fun setRole(groupId:String,uid:String,role:String)=db.runBatch{b->b.update(db.collection("groups").document(groupId).collection("members").document(uid),"role",role);b.update(db.collection("users").document(uid),"role",role)}
    fun removeMember(groupId:String,uid:String)=db.runBatch{b->b.delete(db.collection("groups").document(groupId).collection("members").document(uid));b.set(db.collection("users").document(uid),mapOf("groupId" to "","role" to "member"),SetOptions.merge())}
    fun leaveGroup(profile:CloudProfile,onDone:(Boolean)->Unit)=db.runBatch{b->b.delete(db.collection("groups").document(profile.groupId).collection("members").document(profile.uid));b.set(db.collection("users").document(profile.uid),mapOf("groupId" to "","role" to "member"),SetOptions.merge())}.addOnCompleteListener{onDone(it.isSuccessful)}
    fun transferOwner(profile:CloudProfile,newOwner:CloudProfile,onDone:(Boolean)->Unit){
        val group=db.collection("groups").document(profile.groupId)
        db.runBatch{b->b.update(group,"ownerId",newOwner.uid);b.update(group.collection("members").document(profile.uid),"role","admin");b.update(group.collection("members").document(newOwner.uid),"role","owner");b.update(db.collection("users").document(profile.uid),"role","admin");b.update(db.collection("users").document(newOwner.uid),"role","owner")}.addOnCompleteListener{onDone(it.isSuccessful)}
    }
    fun listenLists(groupId:String,onChange:(List<ShoppingListData>)->Unit):ListenerRegistration=db.collection("groups").document(groupId).collection("lists").addSnapshotListener{s,_->
        val result=s?.documents?.map{d->
            val items=(d.get("items") as? List<*>)?.mapNotNull{raw->(raw as? Map<*,*>)?.let{m->ShoppingItem(m["id"] as? String?:UUID.randomUUID().toString(),m["name"] as? String?:"",m["quantity"] as? String?:"",m["ownerId"] as? String?:"",m["completed"] as? Boolean?:false,(m["createdAt"] as? Number)?.toLong()?:System.currentTimeMillis(),(m["completedAt"] as? Number)?.toLong(),(m["likedBy"] as? List<*>)?.filterIsInstance<String>()?:emptyList())}}?:emptyList()
            val seen=(d.get("seenAtByUser") as? Map<*,*>)?.mapNotNull{(k,v)->(k as? String)?.let{it to ((v as? Number)?.toLong()?:0L)}}?.toMap()?:emptyMap()
            ShoppingListData(d.id,d.getString("name")?:"List",d.getString("icon")?:"🛒",d.getLong("iconColor")?:0xFF2B6F73L,items,d.getString("sortMode")?:"custom",d.getBoolean("doneFirst")?:false,d.getBoolean("doneExpanded")?:false,seen,d.getString("creatorId")?:"")
        }?:emptyList();onChange(result.sortedBy{list->s?.documents?.firstOrNull{it.id==list.id}?.getLong("order")?:Long.MAX_VALUE})
    }
    fun syncLists(groupId:String,lists:List<ShoppingListData>,actorId:String,onDone:(Boolean)->Unit={}){
        val col=db.collection("groups").document(groupId).collection("lists")
        col.get().addOnSuccessListener{snap->db.runBatch{b->
            snap.documents.filter{d->lists.none{it.id==d.id}}.forEach{b.delete(it.reference)}
            lists.forEachIndexed{index,l->if(l.creatorId.isBlank())l.creatorId=actorId;val items=l.items.map{i->mapOf("id" to i.id,"name" to i.name,"quantity" to i.quantity,"ownerId" to i.ownerId,"completed" to i.completed,"createdAt" to i.createdAt,"completedAt" to i.completedAt,"likedBy" to i.likedBy.toList())};b.set(col.document(l.id),mapOf("name" to l.name,"icon" to l.icon,"iconColor" to l.iconColorHex,"creatorId" to l.creatorId,"sortMode" to l.sortMode,"doneFirst" to l.doneFirst,"doneExpanded" to l.doneExpanded,"seenAtByUser" to l.seenAtByUser.toMap(),"items" to items,"order" to index,"updatedBy" to actorId,"updatedAt" to FieldValue.serverTimestamp()))}
        }.addOnCompleteListener{onDone(it.isSuccessful)}}.addOnFailureListener{onDone(false)}
    }
    fun listenActivity(groupId:String,onChange:(List<StatEvent>)->Unit):ListenerRegistration=db.collection("groups").document(groupId).collection("activity").limit(500).addSnapshotListener{s,_->onChange(s?.documents?.map{d->StatEvent(d.id,d.getString("kind")?:"",d.getString("itemName")?:"",d.getString("actorId")?:"",d.getLong("timestamp")?:System.currentTimeMillis())}?:emptyList())}
    fun recordActivity(groupId:String,event:StatEvent)=db.collection("groups").document(groupId).collection("activity").document(event.id).set(mapOf("kind" to event.kind,"itemName" to event.itemName,"actorId" to event.userId,"timestamp" to event.timestamp))
}

private suspend fun fetchLatestRelease():ReleaseInfo?=withContext(Dispatchers.IO){
    runCatching{
        val connection=(URL("https://api.github.com/repos/finalworld/Bubbsun/releases/latest").openConnection() as HttpURLConnection).apply{
            connectTimeout=4500;readTimeout=4500
            setRequestProperty("Accept","application/vnd.github+json")
            setRequestProperty("User-Agent","Bubbsun-Android/${BuildConfig.VERSION_NAME}")
        }
        try{
            if(connection.responseCode !in 200..299)return@runCatching null
            val json=JSONObject(connection.inputStream.bufferedReader().use{it.readText()})
            val version=json.optString("tag_name").removePrefix("v")
            val assets=json.optJSONArray("assets")?:JSONArray()
            var apk=""
            repeat(assets.length()){i->val asset=assets.getJSONObject(i);if(asset.optString("name").endsWith(".apk",true))apk=asset.optString("browser_download_url")}
            if(version.isBlank()||apk.isBlank())null else ReleaseInfo(version,json.optString("html_url"),apk,json.optString("body"))
        }finally{connection.disconnect()}
    }.getOrNull()
}

private suspend fun fetchReleaseStats(): List<GithubReleaseStat> = withContext(Dispatchers.IO){
    runCatching{
        val c=(URL("https://api.github.com/repos/finalworld/Bubbsun/releases?per_page=50").openConnection() as HttpURLConnection).apply{connectTimeout=8000;readTimeout=8000;setRequestProperty("Accept","application/vnd.github+json");setRequestProperty("User-Agent","Bubbsun-Android")}
        val array=JSONArray(c.inputStream.bufferedReader().use{it.readText()})
        (0 until array.length()).map{i->val o=array.getJSONObject(i);val assets=o.optJSONArray("assets")?:JSONArray();var downloads=0;for(a in 0 until assets.length())downloads+=assets.getJSONObject(a).optInt("download_count",0);GithubReleaseStat(o.optString("name",o.optString("tag_name")),o.optString("tag_name"),o.optString("html_url"),o.optString("published_at").take(10),downloads,i==0)}
    }.getOrDefault(emptyList())
}

private fun isNewerVersion(remote:String,local:String):Boolean{
    val a=remote.split(".").map{it.toIntOrNull()?:0};val b=local.split(".").map{it.toIntOrNull()?:0}
    return (0 until maxOf(a.size,b.size)).firstNotNullOfOrNull{i->((a.getOrElse(i){0}).compareTo(b.getOrElse(i){0})).takeIf{it!=0}}?.let{it>0}?:false
}

class MainActivity:ComponentActivity(){
    override fun attachBaseContext(newBase:Context){
        val config=Configuration(newBase.resources.configuration).apply{
            fontScale=1f
        }
        super.attachBaseContext(newBase.createConfigurationContext(config))
    }
    override fun onCreate(savedInstanceState:Bundle?){
        super.onCreate(savedInstanceState)
        if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)ActivityCompat.requestPermissions(this,arrayOf(Manifest.permission.POST_NOTIFICATIONS),603)
        setContent{BubbsunApp(this)}
    }
}

private class BubbsunStore(context:Context){
    private val prefs=context.getSharedPreferences("bubbsun_store",Context.MODE_PRIVATE)
    fun loadUsers():MutableList<UserProfile>{
        val raw=prefs.getString("users_v010",null)?:return mutableListOf(UserProfile("frasse","Frasse",0xFFFFC928))
        return runCatching{val a=JSONArray(raw);MutableList(a.length()){i->val o=a.getJSONObject(i);UserProfile(o.getString("id"),o.getString("name"),o.getLong("color"))}}.getOrElse{mutableListOf(UserProfile("frasse","Frasse",0xFFFFC928))}
    }
    fun saveUsers(users:List<UserProfile>){val a=JSONArray();users.forEach{u->a.put(JSONObject().apply{put("id",u.id);put("name",u.name);put("color",u.colorHex)})};prefs.edit().putString("users_v010",a.toString()).apply()}
    fun loadLists(users:List<UserProfile>):MutableList<ShoppingListData>{
        val raw=prefs.getString("lists",null)?:return mutableListOf(ShoppingListData(name=if(loadLanguage()=="sv") "Matinköp" else "Shopping",icon=listIcons.first().id))
        val danne=users.firstOrNull{it.name.equals("Danne",true)}?.id?:users.first().id;val sanja=users.firstOrNull{it.name.equals("Sanja",true)}?.id?:users.first().id
        return runCatching{val a=JSONArray(raw);MutableList(a.length()){i->
            val o=a.getJSONObject(i);val loaded=mutableListOf<ShoppingItem>();val ia=o.optJSONArray("items")?:JSONArray()
            repeat(ia.length()){j->val it=ia.getJSONObject(j);val legacy=it.optString("owner","DANNE");val likes=it.optJSONArray("likedBy");loaded+=ShoppingItem(it.optString("id",UUID.randomUUID().toString()),it.optString("name",""),it.optString("quantity",""),it.optString("ownerId",if(legacy=="SANJA")sanja else danne),it.optBoolean("completed",false),it.optLong("createdAt",System.currentTimeMillis()),if(it.isNull("completedAt"))null else it.optLong("completedAt"),if(likes==null)emptyList()else List(likes.length()){k->likes.optString(k)})}
            val seen=mutableMapOf<String,Long>();val so=o.optJSONObject("seenAtByUser")?:JSONObject();so.keys().forEach{key->seen[key]=so.optLong(key,0L)}
            ShoppingListData(o.optString("id",UUID.randomUUID().toString()),o.optString("name",if(loadLanguage()=="sv") "Lista" else "List"),o.optString("icon",listIcons[i%listIcons.size].id),o.optLong("iconColor",iconColors[i%iconColors.size]),loaded,o.optString("sortMode","custom"),o.optBoolean("doneFirst",false),o.optBoolean("doneExpanded",false),seen,o.optString("creatorId",""))
        }}.getOrElse{mutableListOf(ShoppingListData(name=if(loadLanguage()=="sv") "Matinköp" else "Shopping",icon=listIcons.first().id))}
    }
    fun saveLists(lists:List<ShoppingListData>){val a=JSONArray();lists.forEach{l->val ia=JSONArray();l.items.forEach{it->ia.put(JSONObject().apply{put("id",it.id);put("name",it.name);put("quantity",it.quantity);put("ownerId",it.ownerId);put("completed",it.completed);put("createdAt",it.createdAt);put("completedAt",it.completedAt?:JSONObject.NULL);put("likedBy",JSONArray(it.likedBy))})};val seen=JSONObject();l.seenAtByUser.forEach{(id,time)->seen.put(id,time)};a.put(JSONObject().apply{put("id",l.id);put("name",l.name);put("icon",l.icon);put("iconColor",l.iconColorHex);put("creatorId",l.creatorId);put("sortMode",l.sortMode);put("doneFirst",l.doneFirst);put("doneExpanded",l.doneExpanded);put("seenAtByUser",seen);put("items",ia)})};prefs.edit().putString("lists",a.toString()).apply()}
    fun loadPrivateLists(uid:String):MutableList<ShoppingListData>{
        val raw=prefs.getString("private_lists_v0600_$uid",null)?:return mutableListOf()
        return runCatching{val a=JSONArray(raw);MutableList(a.length()){i->
            val o=a.getJSONObject(i);val loaded=mutableListOf<ShoppingItem>();val ia=o.optJSONArray("items")?:JSONArray()
            repeat(ia.length()){j->val it=ia.getJSONObject(j);val likes=it.optJSONArray("likedBy");loaded+=ShoppingItem(it.optString("id",UUID.randomUUID().toString()),it.optString("name",""),it.optString("quantity",""),uid,it.optBoolean("completed",false),it.optLong("createdAt",System.currentTimeMillis()),if(it.isNull("completedAt"))null else it.optLong("completedAt"),if(likes==null)emptyList()else List(likes.length()){k->likes.optString(k)})}
            ShoppingListData(o.optString("id",UUID.randomUUID().toString()),o.optString("name",tr("Privat lista","Private list")),o.optString("icon",listIcons.first().id),o.optLong("iconColor",iconColors.first()),loaded,o.optString("sortMode","custom"),o.optBoolean("doneFirst",false),o.optBoolean("doneExpanded",false),mutableMapOf(),uid)
        }}.getOrElse{mutableListOf()}
    }
    fun savePrivateLists(uid:String,lists:List<ShoppingListData>){
        val a=JSONArray();lists.forEach{l->val ia=JSONArray();l.items.forEach{it->ia.put(JSONObject().apply{put("id",it.id);put("name",it.name);put("quantity",it.quantity);put("completed",it.completed);put("createdAt",it.createdAt);put("completedAt",it.completedAt?:JSONObject.NULL);put("likedBy",JSONArray(it.likedBy))})};a.put(JSONObject().apply{put("id",l.id);put("name",l.name);put("icon",l.icon);put("iconColor",l.iconColorHex);put("sortMode",l.sortMode);put("doneFirst",l.doneFirst);put("doneExpanded",l.doneExpanded);put("items",ia)})};prefs.edit().putString("private_lists_v0600_$uid",a.toString()).apply()
    }
    fun loadPinnedPrivateLists(uid:String):Set<String> = prefs.getStringSet("private_pins_v0600_$uid",emptySet())?.toSet()?:emptySet()
    fun savePinnedPrivateLists(uid:String,ids:Set<String>)=prefs.edit().putStringSet("private_pins_v0600_$uid",ids).apply()
    fun loadPrivateSpace(uid:String):Boolean=prefs.getBoolean("private_space_v0600_$uid",false)
    fun savePrivateSpace(uid:String,value:Boolean)=prefs.edit().putBoolean("private_space_v0600_$uid",value).apply()
    fun loadEvents():MutableList<StatEvent>{val raw=prefs.getString("events_v010",null)?:return mutableListOf();return runCatching{val a=JSONArray(raw);MutableList(a.length()){i->val o=a.getJSONObject(i);StatEvent(o.getString("id"),o.getString("kind"),o.getString("itemName"),o.optString("userId",""),o.getLong("timestamp"))}}.getOrElse{mutableListOf()}}
    fun saveEvents(events:List<StatEvent>){val a=JSONArray();events.forEach{e->a.put(JSONObject().apply{put("id",e.id);put("kind",e.kind);put("itemName",e.itemName);put("userId",e.userId);put("timestamp",e.timestamp)})};prefs.edit().putString("events_v010",a.toString()).apply()}
    fun loadPrivateEvents(uid:String):MutableList<StatEvent>{val raw=prefs.getString("private_events_v0600_$uid",null)?:return mutableListOf();return runCatching{val a=JSONArray(raw);MutableList(a.length()){i->val o=a.getJSONObject(i);StatEvent(o.getString("id"),o.getString("kind"),o.getString("itemName"),uid,o.getLong("timestamp"))}}.getOrElse{mutableListOf()}}
    fun savePrivateEvents(uid:String,events:List<StatEvent>){val a=JSONArray();events.forEach{e->a.put(JSONObject().apply{put("id",e.id);put("kind",e.kind);put("itemName",e.itemName);put("timestamp",e.timestamp)})};prefs.edit().putString("private_events_v0600_$uid",a.toString()).apply()}
    fun loadThemeId():String=(prefs.getString("theme_v0340",null) ?: if(prefs.getBoolean("dark",true)) "retro_dark" else "retro_light").let{if(it=="steel")"retro_dark" else it}
    fun saveThemeId(id:String)=prefs.edit().putString("theme_v0340",id).apply()
    fun loadUserId(d:String)=prefs.getString("active_user_v010",d)?:d;fun saveUserId(id:String)=prefs.edit().putString("active_user_v010",id).apply()
    fun loadLanguage():String=prefs.getString("language_v0400",null) ?: if(Locale.getDefault().language.equals("sv",true)) "sv" else "en"
    fun saveLanguage(value:String)=prefs.edit().putString("language_v0400",value).apply()
    fun loadExitConfirmation():Boolean=prefs.getBoolean("exit_confirmation_v0400",true)
    fun saveExitConfirmation(value:Boolean)=prefs.edit().putBoolean("exit_confirmation_v0400",value).apply()
    fun loadInputExpanded():Boolean=prefs.getBoolean("input_expanded_v0400",true)
    fun saveInputExpanded(value:Boolean)=prefs.edit().putBoolean("input_expanded_v0400",value).apply()
    fun loadSupporterPreview():Boolean=prefs.getBoolean("supporter_preview_v0450",false)
    fun saveSupporterPreview(value:Boolean)=prefs.edit().putBoolean("supporter_preview_v0450",value).apply()
    fun loadSupporterStyle():String=prefs.getString("supporter_style_v0451","none")?:"none"
    fun saveSupporterStyle(value:String)=prefs.edit().putString("supporter_style_v0451",value).apply()
    fun loadSupporterGlow():Boolean=prefs.getBoolean("supporter_glow_v0454",true)
    fun saveSupporterGlow(value:Boolean)=prefs.edit().putBoolean("supporter_glow_v0454",value).apply()
    fun loadUpdateChecks():Boolean=prefs.getBoolean("update_checks_v0471",true)
    fun saveUpdateChecks(value:Boolean)=prefs.edit().putBoolean("update_checks_v0471",value).apply()
    fun loadLastUpdateCheck():Long=prefs.getLong("last_update_check_v0471",0L)
    fun saveLastUpdateCheck(value:Long)=prefs.edit().putLong("last_update_check_v0471",value).apply()
    fun loadLastFoundVersion():String=prefs.getString("last_found_version_v0480","")?:""
    fun saveLastFoundVersion(value:String)=prefs.edit().putString("last_found_version_v0480",value).apply()
    fun loadSortTipSeen():Boolean=prefs.getBoolean("sort_tip_seen_v0480",false)
    fun saveSortTipSeen()=prefs.edit().putBoolean("sort_tip_seen_v0480",true).apply()
    fun prefsBoolean(key:String)=prefs.getBoolean(key,false)
    fun setPrefsBoolean(key:String)=prefs.edit().putBoolean(key,true).apply()
}

data class Palette(
    val bg:Color,val top:Color,val panel:Color,val paper:Color,val paper2:Color,
    val text:Color,val pageText:Color,val muted:Color,val pageMuted:Color,
    val gold:Color,val green:Color,val red:Color,val outline:Color,val glow:Color
)
data class AppTheme(val id:String,val name:String,val icon:String,val palette:Palette)
private val appThemes=listOf(
    AppTheme("retro_dark","Retro","🏛",Palette(
        Color(0xFF15120E),Color(0xFF211911),Color(0xFF2A2118),Color(0xFFD8C294),Color(0xFFC9AC76),
        Color(0xFF261E16),Color(0xFFF2E2BC),Color(0xFF65543E),Color(0xFFC8B894),
        Color(0xFFD6A83D),Color(0xFF294F4D),Color(0xFFAA3C2C),Color(0xFF6E5328),Color(0xFFFFD85E))),
    AppTheme("retro_light","Ljus retro","☀",Palette(
        Color(0xFFB6915D),Color(0xFF2C2118),Color(0xFF3A2B1C),Color(0xFFE9D7A8),Color(0xFFDCC28B),
        Color(0xFF2A2119),Color(0xFF2A2119),Color(0xFF6D5B42),Color(0xFF5B482F),
        Color(0xFFD4A93A),Color(0xFF315F5C),Color(0xFFA83A28),Color(0xFF60451F),Color(0xFFFFD85E))),
    AppTheme("ocean","Hav","🌊",Palette(
        Color(0xFF071E2B),Color(0xFF092F43),Color(0xFF0D4058),Color(0xFFD8F0F2),Color(0xFFB8DDE2),
        Color(0xFF082A37),Color(0xFFE6FAFF),Color(0xFF527B86),Color(0xFFB4DCE3),
        Color(0xFF5ED1D8),Color(0xFF087F91),Color(0xFFB64545),Color(0xFF2E7589),Color(0xFF8AF5FF))),
    AppTheme("forest","Skog","🌳",Palette(
        Color(0xFF101C13),Color(0xFF1B3020),Color(0xFF29442D),Color(0xFFE2E3C4),Color(0xFFC9D0A3),
        Color(0xFF20301F),Color(0xFFF1F1D8),Color(0xFF68755A),Color(0xFFC9D3B1),
        Color(0xFFD3B85B),Color(0xFF3E7548),Color(0xFFA34332),Color(0xFF617342),Color(0xFFF1DC72))),
    AppTheme("sunset","Solnedgång","🌅",Palette(
        Color(0xFF241126),Color(0xFF3B1837),Color(0xFF552142),Color(0xFFF1D0B0),Color(0xFFE4B58E),
        Color(0xFF3B1A29),Color(0xFFFFE4C9),Color(0xFF885E68),Color(0xFFE0B0B5),
        Color(0xFFFFB34E),Color(0xFF9A3F63),Color(0xFFB83C36),Color(0xFF8A4A59),Color(0xFFFFD071))),
    AppTheme("winter","Vinter","❄",Palette(
        Color(0xFF101A26),Color(0xFF1E3043),Color(0xFF2B435A),Color(0xFFE7F1F6),Color(0xFFC9DDE8),
        Color(0xFF203342),Color(0xFFF2FAFF),Color(0xFF657B8C),Color(0xFFC7DBE6),
        Color(0xFFA8D8F0),Color(0xFF477F9D),Color(0xFFAF4B56),Color(0xFF678DA4),Color(0xFFD6F3FF))),
    AppTheme("blossom","Blomster","🌸",Palette(
        Color(0xFF261821),Color(0xFF402536),Color(0xFF583247),Color(0xFFF3DCE7),Color(0xFFE8BED3),
        Color(0xFF3D2432),Color(0xFFFFEAF4),Color(0xFF8B6477),Color(0xFFE4BED0),
        Color(0xFFF0A9C6),Color(0xFF6E8B63),Color(0xFFB8455B),Color(0xFF956078),Color(0xFFFFCBE1))),
    AppTheme("fire","Eld","🔥",Palette(
        Color(0xFF1C0E0B),Color(0xFF351710),Color(0xFF4C2116),Color(0xFFF1D0A7),Color(0xFFE0AF75),
        Color(0xFF341B10),Color(0xFFFFE3BA),Color(0xFF8A5A3C),Color(0xFFD9B18D),
        Color(0xFFFFAA34),Color(0xFF8B3A21),Color(0xFFC33B25),Color(0xFF8A4A27),Color(0xFFFFC14D))),
    AppTheme("neon","Neon","💎",Palette(
        Color(0xFF090813),Color(0xFF151127),Color(0xFF21183B),Color(0xFFE7DFFF),Color(0xFFC9B9F2),
        Color(0xFF21173A),Color(0xFFF5EFFF),Color(0xFF74658E),Color(0xFFD3C8EC),
        Color(0xFF45E6D0),Color(0xFF713DB0),Color(0xFFFF3D72),Color(0xFF6E4C9D),Color(0xFF66FFE7))),
    AppTheme("cosmic","Kosmisk supporter","🌌",Palette(
        Color(0xFF070613),Color(0xE6120C2A),Color(0xD91C123D),Color(0x6621163F),Color(0x552D1C50),
        Color(0xFFF7F1FF),Color(0xFFF7F1FF),Color(0xFFC8B9E6),Color(0xFFD8CCEE),
        Color(0xFFE8B8FF),Color(0xFF9A55E8),Color(0xFF704A82),Color(0xFF9E6BD4),Color(0xFFDAA6FF))),
    AppTheme("heart","Hjärtlig supporter","♥",Palette(
        Color(0xFFF2EBDD),Color(0xFFE8D8C6),Color(0xFFE1CDB7),Color(0xFFFFF7E9),Color(0xFFF3E5D2),
        Color(0xFF49352F),Color(0xFF49352F),Color(0xFF816D65),Color(0xFF6E6255),
        Color(0xFFC58B91),Color(0xFF7D8B68),Color(0xFFA75B62),Color(0xFFA98B75),Color(0xFFE8B6BB))),
    AppTheme("gothic","Gotisk supporter","☾",Palette(
        Color(0xFF09090C),Color(0xFF17151B),Color(0xFF24202A),Color(0xFFE8DFD1),Color(0xFFD1C5B7),
        Color(0xFF211B24),Color(0xFFF2EAE0),Color(0xFF706873),Color(0xFFC9BEC9),
        Color(0xFFC8B9A6),Color(0xFF59485F),Color(0xFF8D2638),Color(0xFF6A5C6C),Color(0xFFD8CADB)))
)

private fun themeDrawable(id:String)=when(id){
    "retro_dark"->R.drawable.theme_retro;"retro_light"->R.drawable.theme_light;"ocean"->R.drawable.theme_ocean
    "forest"->R.drawable.theme_forest;"sunset"->R.drawable.theme_sunset;"winter"->R.drawable.theme_winter
    "blossom"->R.drawable.theme_flower;"fire"->R.drawable.theme_fire
    "neon"->R.drawable.theme_neon;"heart"->R.drawable.theme_heart;"gothic"->R.drawable.theme_gothic_noir;else->R.drawable.cosmic_theme
}
private fun readableOn(color:Color)=if(color.luminance()>.45f)Color(0xFF241B14) else Color(0xFFF4E4BA)
private fun popupColor(color:Color)=color.copy(alpha=1f)
private val LocalHomeAction=staticCompositionLocalOf<()->Unit>{{}}
private val LocalBackIsHome=staticCompositionLocalOf{false}
@Composable private fun SelectionBadge(color:Color,modifier:Modifier=Modifier){
    Canvas(modifier.size(20.dp).clip(CircleShape).background(color).border(1.dp,readableOn(color),CircleShape)){
        val ink=readableOn(color)
        drawLine(ink,Offset(size.width*.25f,size.height*.52f),Offset(size.width*.44f,size.height*.70f),strokeWidth=2.1.dp.toPx(),cap=StrokeCap.Round)
        drawLine(ink,Offset(size.width*.44f,size.height*.70f),Offset(size.width*.76f,size.height*.31f),strokeWidth=2.1.dp.toPx(),cap=StrokeCap.Round)
    }
}
private val userColors=listOf(0xFFFFC928,0xFFFF5E8A,0xFFFF8A2B,0xFFE84B3C,0xFF9E3F45,0xFF7846A8,0xFF3487C7,0xFF35AFC2,0xFF3BA78F,0xFF7BAD43,0xFFB4D936,0xFF8A5B35,0xFFD8B98A,0xFF244F73,0xFF9DD8B7,0xFF777777)
private val supporterUserColors=listOf(0xFFC6A75E,0xFF9B72CF,0xFF72B7A5,0xFF6F91B8)

@Composable private fun SignInScreen(error:String,onSignIn:()->Unit){
    val bg=Color(0xFF15120E);val paper=Color(0xFFD8C294);val ink=Color(0xFF261E16);val gold=Color(0xFFD6A83D)
    Column(Modifier.fillMaxSize().background(bg).safeDrawingPadding().padding(26.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.Center){
        Image(painterResource(R.drawable.bubbsun_header_logo),null,contentScale=ContentScale.Fit,modifier=Modifier.fillMaxWidth().height(130.dp))
        Text("TOGETHER EDITION BETA",color=gold,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,letterSpacing=1.1.sp,fontSize=14.sp,maxLines=1)
        Spacer(Modifier.height(28.dp))
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).background(paper).border(2.dp,gold,RoundedCornerShape(18.dp)).padding(22.dp),horizontalAlignment=Alignment.CenterHorizontally){
            Text(tr("VÄLKOMMEN TILL BUBBSUN","WELCOME TO BUBBSUN"),color=ink,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=23.sp,textAlign=TextAlign.Center)
            Spacer(Modifier.height(8.dp));Text(tr("Logga in för att spara dina listor och dela dem med familjen.","Sign in to save your lists and share them with your family."),color=ink,textAlign=TextAlign.Center,lineHeight=20.sp)
            Spacer(Modifier.height(18.dp));Button(onClick=onSignIn,modifier=Modifier.fillMaxWidth().height(58.dp),shape=RoundedCornerShape(10.dp),colors=ButtonDefaults.buttonColors(containerColor=Color(0xFF315F5C)),contentPadding=PaddingValues(horizontal=10.dp)){GoogleGIcon();Spacer(Modifier.width(9.dp));Text(tr("LOGGA IN MED GOOGLE","SIGN IN WITH GOOGLE"),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,color=Color.White,fontSize=15.sp,maxLines=1)}
            if(error.isNotBlank()){Spacer(Modifier.height(10.dp));Text(error,color=Color(0xFFA83A28),fontSize=12.sp,textAlign=TextAlign.Center)}
        }
        Spacer(Modifier.height(14.dp));Text(tr("Första inloggningen kräver internet.","The first sign-in requires internet."),color=Color(0xFFC8B894),fontSize=12.sp)
    }
}

@Composable private fun GoogleGIcon(){
    Box(Modifier.size(24.dp).clip(CircleShape).background(Color.White),contentAlignment=Alignment.Center){
        Text("G",fontWeight=FontWeight.Black,fontSize=17.sp,color=Color(0xFF4285F4))
        Box(Modifier.align(Alignment.BottomEnd).size(7.dp).background(Color(0xFF34A853)))
        Box(Modifier.align(Alignment.TopEnd).size(7.dp).background(Color(0xFFEA4335)))
        Box(Modifier.align(Alignment.BottomStart).size(6.dp).background(Color(0xFFFBBC05)))
    }
}

@Composable private fun PrivacyConsentScreen(onAccept:()->Unit,onCancel:()->Unit){
    var accepted by remember{mutableStateOf(false)}
    val bg=Color(0xFF15120E);val paper=Color(0xFFD8C294);val ink=Color(0xFF261E16);val gold=Color(0xFFD6A83D)
    Column(Modifier.fillMaxSize().background(bg).safeDrawingPadding().verticalScroll(rememberScrollState()).padding(24.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.Center){
        Text(tr("INTEGRITET & MOLNDATA","PRIVACY & CLOUD DATA"),color=gold,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=23.sp,textAlign=TextAlign.Center)
        Spacer(Modifier.height(18.dp))
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(paper).border(2.dp,gold,RoundedCornerShape(16.dp)).padding(18.dp)){
            Text(tr("Bubbsun sparar ditt visningsnamn, din valda färg, familjegrupp, listor och aktivitet i Firebase så att innehållet kan synkas mellan familjemedlemmar och enheter.","Bubbsun stores your display name, selected color, family group, lists and activity in Firebase so content can sync between family members and devices."),color=ink,lineHeight=20.sp)
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth().clickable{accepted=!accepted},verticalAlignment=Alignment.CenterVertically){Checkbox(accepted,{accepted=it});Text(tr("Jag godkänner att dessa uppgifter sparas och synkas.","I agree that this data may be stored and synced."),color=ink,modifier=Modifier.weight(1f))}
            Spacer(Modifier.height(14.dp))
            Button(onClick=onAccept,enabled=accepted,modifier=Modifier.fillMaxWidth(),colors=ButtonDefaults.buttonColors(containerColor=Color(0xFF315F5C))){Text(tr("GODKÄNN & FORTSÄTT","ACCEPT & CONTINUE"),fontWeight=FontWeight.Black)}
            TextButton(onClick=onCancel,modifier=Modifier.fillMaxWidth()){Text(tr("AVBRYT & LOGGA UT","CANCEL & SIGN OUT"),color=Color(0xFFA83A28),fontWeight=FontWeight.Bold)}
        }
    }
}

@Composable private fun MigrationDialog(p:Palette,onUpload:()->Unit,onLocal:()->Unit,onEmpty:()->Unit){
    AlertDialog(onDismissRequest={},containerColor=p.paper,title={Text(tr("DINA BEFINTLIGA LISTOR","YOUR EXISTING LISTS"),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,color=p.text)},text={Column{Text(tr("Vad vill du göra med listorna som redan finns på telefonen? Inget raderas automatiskt.","What would you like to do with the lists already on this phone? Nothing is deleted automatically."),color=p.text);Spacer(Modifier.height(12.dp));RetroButton(tr("FLYTTA TILL GRUPPEN","MOVE TO GROUP"),onUpload,p,modifier=Modifier.fillMaxWidth());Spacer(Modifier.height(7.dp));RetroButton(tr("BEHÅLL LOKALT TILLS VIDARE","KEEP LOCAL FOR NOW"),onLocal,p,modifier=Modifier.fillMaxWidth());Spacer(Modifier.height(7.dp));RetroButton(tr("BÖRJA MED TOM GRUPP","START WITH EMPTY GROUP"),onEmpty,p,danger=true,modifier=Modifier.fillMaxWidth())}},confirmButton={})
}

@Composable private fun UserColorGrid(selected:Long,p:Palette,supporterEnabled:Boolean,onLocked:()->Unit={},onSelect:(Long)->Unit){
    (userColors+supporterUserColors).chunked(4).forEachIndexed{rowIndex,row->
        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){
            row.forEach{c->
                val locked=rowIndex==4&&!supporterEnabled
                Box(Modifier.size(42.dp).clip(CircleShape).background(if(locked)Color.Gray else Color(c)).border(if(c==selected)4.dp else 1.dp,if(c==selected)p.text else p.outline,CircleShape).clickable{if(locked)onLocked()else onSelect(c)},contentAlignment=Alignment.Center){
                    if(locked)Text("🔒",fontSize=13.sp)
                }
            }
        }
        Spacer(Modifier.height(7.dp))
    }
}

@Composable fun BubbsunApp(context:Context){
    val together=remember{TogetherRepository()}
    val v600=remember{V600Repository()}
    var firebaseUser by remember{mutableStateOf(together.auth.currentUser)}
    var signInError by remember{mutableStateOf("")}
    val googleClient=remember{GoogleSignIn.getClient(context,GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN).requestIdToken(context.getString(R.string.default_web_client_id)).requestEmail().build())}
    val signInLauncher=rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()){result->
        runCatching{GoogleSignIn.getSignedInAccountFromIntent(result.data).getResult(ApiException::class.java)}.onSuccess{account->
            together.auth.signInWithCredential(GoogleAuthProvider.getCredential(account.idToken,null)).addOnCompleteListener{if(!it.isSuccessful)signInError=it.exception?.localizedMessage?:tr("Inloggningen misslyckades","Sign-in failed")}
        }.onFailure{signInError=it.localizedMessage?:tr("Inloggningen avbröts","Sign-in was cancelled")}
    }
    DisposableEffect(Unit){val listener=FirebaseAuth.AuthStateListener{firebaseUser=it.currentUser};together.auth.addAuthStateListener(listener);onDispose{together.auth.removeAuthStateListener(listener)}}
    LaunchedEffect(Unit){if(firebaseUser==null)runCatching{googleClient.silentSignIn().addOnSuccessListener{a->together.auth.signInWithCredential(GoogleAuthProvider.getCredential(a.idToken,null))}}}
    val store=remember{BubbsunStore(context)}
    LaunchedEffect(Unit){FollowNotificationScheduler.schedule(context)}
    val deviceDensity=LocalDensity.current.density
    val lockedDensity=remember(deviceDensity){Density(deviceDensity,1f)}
    if(firebaseUser==null){CompositionLocalProvider(LocalDensity provides lockedDensity){SignInScreen(signInError){signInError="";signInLauncher.launch(googleClient.signInIntent)}};return}
    val localDeveloperAccount=BuildConfig.DEBUG&&firebaseUser!!.uid=="vIIrmKj3Q6YIjoR01TR8ZFYdgZz1"
    var bootstrapAccount by remember(firebaseUser!!.uid){mutableStateOf<V600Account?>(null)}
    var bootstrapCloudWarning by remember(firebaseUser!!.uid){mutableStateOf(false)}
    var privacyAccepted by remember(firebaseUser!!.uid){mutableStateOf(store.prefsBoolean("privacy_0501_${firebaseUser!!.uid}"))}
    LaunchedEffect(firebaseUser!!.uid){
        var answered=false
        val fallback=V600Account(uid=firebaseUser!!.uid,displayName=(firebaseUser!!.displayName?:"Bubbsun").take(35))
        v600.ensureAccount(firebaseUser!!){result->
            answered=true
            result.onSuccess{bootstrapAccount=it;privacyAccepted=privacyAccepted||it.privacyVersion>=1}
                .onFailure{bootstrapCloudWarning=true;bootstrapAccount=fallback}
        }
        delay(6500)
        if(!answered&&bootstrapAccount==null){bootstrapCloudWarning=true;bootstrapAccount=fallback}
    }
    LaunchedEffect(bootstrapAccount?.privacyVersion,privacyAccepted){if(privacyAccepted&&bootstrapAccount!=null&&bootstrapAccount!!.privacyVersion<1)v600.acceptPrivacy(firebaseUser!!.uid,1){}}
    if(bootstrapAccount==null){Box(Modifier.fillMaxSize(),contentAlignment=Alignment.Center){CircularProgressIndicator()};return}
    if(!privacyAccepted){CompositionLocalProvider(LocalDensity provides lockedDensity){PrivacyConsentScreen(onAccept={store.setPrefsBoolean("privacy_0501_${firebaseUser!!.uid}");privacyAccepted=true;v600.acceptPrivacy(firebaseUser!!.uid,1){}},onCancel={together.auth.signOut();googleClient.signOut()})};return}
    val users=remember{mutableStateListOf<UserProfile>().apply{addAll(store.loadUsers())}}
    val lists=remember{mutableStateListOf<ShoppingListData>().apply{addAll(store.loadLists(users))}}
    val privateLists=remember(firebaseUser!!.uid){mutableStateListOf<ShoppingListData>().apply{addAll(store.loadPrivateLists(firebaseUser!!.uid))}}
    val pinnedPrivateLists=remember(firebaseUser!!.uid){mutableStateListOf<String>().apply{addAll(store.loadPinnedPrivateLists(firebaseUser!!.uid))}}
    var privateSpace by remember(firebaseUser!!.uid){mutableStateOf(store.loadPrivateSpace(firebaseUser!!.uid))}
    val events=remember{mutableStateListOf<StatEvent>().apply{addAll(store.loadEvents())}}
    val privateEvents=remember(firebaseUser!!.uid){mutableStateListOf<StatEvent>().apply{addAll(store.loadPrivateEvents(firebaseUser!!.uid))}}
    var activeUserId by remember{mutableStateOf(firebaseUser!!.uid)}
    var cloudProfile by remember{mutableStateOf<CloudProfile?>(null)}
    var v600Account by remember{mutableStateOf<V600Account?>(bootstrapAccount)}
    var memberships by remember{mutableStateOf<List<GroupMembership>>(emptyList())}
    var activeV600Members by remember{mutableStateOf<List<GroupMembership>>(emptyList())}
    var activeV600Requests by remember{mutableStateOf<List<V600JoinRequest>>(emptyList())}
    var myV600JoinRequests by remember{mutableStateOf<List<V600JoinRequest>>(emptyList())}
    var globalPin by remember{mutableStateOf<GlobalPinDocument?>(null)}
    var globalPinItems by remember{mutableStateOf<List<GlobalPinItem>>(emptyList())}
    var adminSettings by remember{mutableStateOf(AdminSettings())}
    val groupSummaries=remember{mutableStateMapOf<String,GroupSummary>()}
    var cloudMembers by remember{mutableStateOf<List<CloudProfile>>(emptyList())}
    var joinRequests by remember{mutableStateOf<List<JoinRequest>>(emptyList())}
    var groupName by remember{mutableStateOf("")};var joinCode by remember{mutableStateOf("")}
    var applyingCloud by remember{mutableStateOf(false)};var showMigration by remember{mutableStateOf(false)};var localOnly by remember{mutableStateOf(false)}
    LaunchedEffect(firebaseUser!!.uid){
        together.ensureProfile(firebaseUser!!){cloudProfile=it}
        v600.ensureAccount(firebaseUser!!){result->result.onSuccess{v600Account=it}}
    }
    DisposableEffect(firebaseUser!!.uid){
        val accountReg=v600.listenAccount(firebaseUser!!.uid){v600Account=it}
        val membershipReg=v600.listenMemberships(firebaseUser!!.uid){memberships=it}
        val pinReg=v600.listenPublishedGlobalPin{globalPin=it}
        val myRequestsReg=v600.listenMyJoinRequests(firebaseUser!!.uid){myV600JoinRequests=it}
        val settingsReg=v600.listenAdminSettings{adminSettings=it}
        onDispose{accountReg.remove();membershipReg.remove();pinReg.remove();myRequestsReg.remove();settingsReg.remove()}
    }
    DisposableEffect(globalPin?.id){
        val id=globalPin?.id.orEmpty()
        if(id.isBlank()){globalPinItems=emptyList();onDispose{}}
        else{val reg=v600.listenGlobalPinItems(id){globalPinItems=it};onDispose{reg.remove()}}
    }
    DisposableEffect(memberships.map{it.groupId}){
        val regs=memberships.map{membership->v600.listenGroup(membership.groupId){summary->if(summary==null)groupSummaries.remove(membership.groupId)else groupSummaries[membership.groupId]=summary}}
        onDispose{regs.forEach{it.remove()}}
    }
    DisposableEffect(v600Account?.activeGroupId){
        val gid=v600Account?.activeGroupId.orEmpty()
        if(gid.isBlank()){
            activeV600Members=emptyList();activeV600Requests=emptyList()
            onDispose{}
        }else{
            val membersReg=v600.listenGroupMembers(gid){activeV600Members=it}
            val requestsReg=v600.listenJoinRequests(gid){activeV600Requests=it}
            onDispose{membersReg.remove();requestsReg.remove()}
        }
    }
    DisposableEffect(cloudProfile?.uid,cloudProfile?.groupId){
        val regs=mutableListOf<ListenerRegistration>();cloudProfile?.let{profile->regs+=together.listenProfile(profile.uid){cloudProfile=it};if(profile.groupId.isNotBlank()){regs+=together.listenMembers(profile.groupId){cloudMembers=it};regs+=together.listenRequests(profile.groupId){joinRequests=it};regs+=together.listenGroup(profile.groupId){name,code->groupName=name;joinCode=code};regs+=together.listenActivity(profile.groupId){remote->if(remote.isNotEmpty()){events.clear();events.addAll(remote);store.saveEvents(events)}};regs+=together.listenLists(profile.groupId){remote->
            val decided=store.prefsBoolean("migration_0500_${profile.groupId}")
            if(remote.isNotEmpty()&&!localOnly){applyingCloud=true;lists.clear();lists.addAll(remote);store.saveLists(lists);applyingCloud=false}
            else if(!decided&&lists.isNotEmpty())showMigration=true
        }}}
        onDispose{regs.forEach{it.remove()}}
    }
    var themeId by remember{mutableStateOf(store.loadThemeId())}
    var screen by remember{mutableStateOf("lists")}
    val navigationHistory=remember{mutableStateListOf<String>()}
    var openSupportSettings by remember{mutableStateOf(false)}
    var selectedListId by remember{mutableStateOf<String?>(null)}
    var selectedListPrivate by remember{mutableStateOf(false)}
    var menuOpen by remember{mutableStateOf(false)}
    val initialLanguage=remember{store.loadLanguage().also{appLanguageState.value=it}}
    var language by remember{mutableStateOf(initialLanguage)}
    var exitConfirmation by remember{mutableStateOf(store.loadExitConfirmation())}
    var inputExpanded by remember{mutableStateOf(store.loadInputExpanded())}
    var supporterPreview by remember{mutableStateOf(store.loadSupporterPreview())}
    var supporterStyle by remember{mutableStateOf(store.loadSupporterStyle().takeIf{it in supporterStyleIds}?:"none")}
    var supporterGlow by remember{mutableStateOf(store.loadSupporterGlow())}
    var updateChecks by remember{mutableStateOf(store.loadUpdateChecks())}
    var availableRelease by remember{mutableStateOf<ReleaseInfo?>(null)}
    var manualUpdateCheck by remember{mutableIntStateOf(0)}
    var updateStatus by remember{mutableStateOf("")}
    var showExitDialog by remember{mutableStateOf(false)}
    LaunchedEffect(activeUserId,supporterPreview,v600Account?.supporter,v600Account?.supporterNoticeType){
        if(v600Account?.supporter==true&&!supporterPreview){supporterPreview=true;store.saveSupporterPreview(true)}
        else if(v600Account?.supporter==false&&v600Account?.supporterNoticeType=="removed"&&supporterPreview){supporterPreview=false;store.saveSupporterPreview(false)}
        else if(supporterPreview&&v600Account?.supporter==false&&v600Account?.supporterNoticeType!="removed")v600.syncSupporter(activeUserId,true){}
    }
    LaunchedEffect(manualUpdateCheck){
        if(!supporterPreview&&themeId in setOf("cosmic","heart","gothic")){themeId="retro_dark";store.saveThemeId(themeId)}
        if(store.loadSupporterStyle()!=supporterStyle)store.saveSupporterStyle(supporterStyle)
        val now=System.currentTimeMillis()
        val alreadyFound=store.loadLastFoundVersion().isNotBlank()
        val shouldCheck=manualUpdateCheck>0 || (updateChecks && (!alreadyFound || now-store.loadLastUpdateCheck()>=24*60*60*1000L))
        if(shouldCheck){
            val found=fetchLatestRelease();store.saveLastUpdateCheck(now)
            if(found==null){if(manualUpdateCheck>0)updateStatus=tr("Kunde inte kontrollera just nu.","Could not check right now.")}
            else if(isNewerVersion(found.version,BuildConfig.VERSION_NAME)){store.saveLastFoundVersion(found.version);availableRelease=found;if(screen!="update"){navigationHistory.add(screen);screen="update"}}
            else if(manualUpdateCheck>0)updateStatus="${tr("Du har den senaste versionen","You have the latest version")} • ${SimpleDateFormat("HH:mm",Locale.getDefault()).format(java.util.Date(now))}"
        }
    }
    val theme=appThemes.firstOrNull{it.id==themeId}?:appThemes.first()
    val p=theme.palette
    val legacyMembership=cloudProfile?.takeIf{it.groupId.isNotBlank()}?.let{legacy->GroupMembership(groupId=legacy.groupId,uid=legacy.uid,displayName=legacy.name,color=legacy.color,role=when(legacy.role){"owner"->GroupRole.SUPER_BOSS.wire;"admin"->GroupRole.BOSS.wire;else->GroupRole.MEMBER.wire})}
    val visibleMemberships=if(memberships.isNotEmpty())memberships else listOfNotNull(legacyMembership)
    val visibleAccount=v600Account?.let{account->if(account.activeGroupId.isBlank()&&legacyMembership!=null)account.copy(activeGroupId=legacyMembership.groupId)else account}
    val visibleGroups=groupSummaries.toMutableMap().apply{legacyMembership?.let{legacy->if(legacy.groupId !in this)this[legacy.groupId]=GroupSummary(id=legacy.groupId,name=groupName.ifBlank{tr("Min grupp","My group")},iconId="⌂",color=0xFF7D936C,ownerId=if(legacy.parsedRole==GroupRole.SUPER_BOSS)legacy.uid else "")}}
    val activeSpaceName=if(privateSpace)tr("Mina listor","My lists") else visibleGroups[visibleAccount?.activeGroupId]?.name?:groupName.ifBlank{tr("Gruppens listor","Group lists")}
    val syncedUsers=if(cloudMembers.isNotEmpty())cloudMembers.map{UserProfile(it.uid,it.name,it.color)} else cloudProfile?.let{listOf(UserProfile(it.uid,it.name,it.color))}?:users
    fun saveTogether(){store.saveLists(lists);val profile=cloudProfile;if(!applyingCloud&&!localOnly&&profile!=null&&profile.groupId.isNotBlank())together.syncLists(profile.groupId,lists,profile.uid)}
    fun savePrivate(){store.savePrivateLists(activeUserId,privateLists);store.savePinnedPrivateLists(activeUserId,pinnedPrivateLists.toSet())}
    fun navigate(target:String){
        if(screen=="list"&&target!="list"&&!selectedListPrivate)selectedListId?.let{id->lists.firstOrNull{it.id==id}?.seenAtByUser?.set(activeUserId,System.currentTimeMillis());saveTogether()}
        if(target!=screen){navigationHistory.add(screen);screen=target}
    }
    fun navigateBack(){
        if(screen=="list"&&!selectedListPrivate)selectedListId?.let{id->lists.firstOrNull{it.id==id}?.seenAtByUser?.set(activeUserId,System.currentTimeMillis());saveTogether()}
        screen=if(navigationHistory.isNotEmpty())navigationHistory.removeAt(navigationHistory.lastIndex) else "lists"
        if(screen!="list"){selectedListId=null;selectedListPrivate=false}
    }
    BackHandler {
        when {
            menuOpen -> menuOpen=false
            screen!="lists" -> navigateBack()
            exitConfirmation -> showExitDialog=true
            else -> (context as? Activity)?.finish()
        }
    }
    CompositionLocalProvider(
        LocalDensity provides lockedDensity,
        LocalHomeAction provides {navigationHistory.clear();screen="lists";selectedListId=null;selectedListPrivate=false},
        LocalBackIsHome provides (navigationHistory.lastOrNull()=="lists")
    ) {
        MaterialTheme(colorScheme=if(p.bg.luminance()<.45f)darkColorScheme() else lightColorScheme()){
            Box(Modifier.fillMaxSize().background(p.bg).safeDrawingPadding()){
                if(theme.id=="cosmic") CosmicBackground()
                if(theme.id=="heart") HeartBackground()
                if(theme.id=="gothic") GothicBackground()
                Column(Modifier.fillMaxSize()){
                    AppHeader(theme,p,supporterPreview,supporterStyle,supporterGlow,onMenu={menuOpen=true},onHome={if(screen!="lists"){navigationHistory.clear();screen="lists";selectedListId=null;selectedListPrivate=false}},onThemeSelected={themeId=it;store.saveThemeId(it)},onSupporterInfo={navigate("support")})
                    when(screen){
                        "lists"->ListsScreen(lists,privateLists,pinnedPrivateLists.toSet(),privateSpace,p,theme.id,activeUserId,cloudMembers,globalPin?.takeIf{it.revision>(v600Account?.hiddenGlobalPinRevision?:0L)},supporterPreview,onSupporterInfo={navigate("support")},onSelectPrivate={privateSpace=true;store.savePrivateSpace(activeUserId,true)},onSelectGroups={privateSpace=false;store.savePrivateSpace(activeUserId,false)},onOpen={selectedListPrivate=false;selectedListId=it;navigate("list")},onOpenPrivate={selectedListPrivate=true;selectedListId=it;navigate("list")},onTogglePrivatePin={id->if(id in pinnedPrivateLists)pinnedPrivateLists.remove(id)else pinnedPrivateLists.add(id);savePrivate()},onOpenPin={navigate("globalPin")},onHidePin={pin->v600.hideGlobalPin(activeUserId,pin.revision){}},onRestorePin={v600.restoreGlobalPin(activeUserId){}},onAdd={navigate("addList")},onAddPrivate={navigate("addPrivateList")},onSave={saveTogether()},onSavePrivate={savePrivate()})
                        "addList"->AddListScreen(p,supporterPreview,onSupporterInfo={navigate("support")},onBack={navigateBack()},onCreate={name,icon,color->lists.add(0,ShoppingListData(name=capitalized(name),icon=icon,iconColorHex=color,creatorId=activeUserId));saveTogether();navigateBack()})
                        "addPrivateList"->AddListScreen(p,supporterPreview,onSupporterInfo={navigate("support")},onBack={navigateBack()},onCreate={name,icon,color->privateLists.add(0,ShoppingListData(name=capitalized(name),icon=icon,iconColorHex=color,creatorId=activeUserId));savePrivate();navigateBack()})
                        "stats"->StatsScreen(if(privateSpace)privateLists else lists,if(privateSpace)privateEvents else events,syncedUsers,activeSpaceName,p,onBack={navigateBack()})
                        "settings"->SettingsScreen(p,language,updateChecks,exitConfirmation,supporterPreview,supporterStyle,supporterGlow,openSupportSettings,updateStatus,onSupporterInfo={navigate("supporterSettings")},onBack={navigateBack()},onCheckNow={updateStatus=tr("Kontrollerar…","Checking…");manualUpdateCheck++},onUpdateChecks={updateChecks=it;store.saveUpdateChecks(it)},onLanguage={newLanguage->appLanguageState.value=newLanguage;language=newLanguage;store.saveLanguage(newLanguage)},onExitConfirmation={exitConfirmation=it;store.saveExitConfirmation(it)},onSupporterPreview={enabled->val firstPurchase=enabled&&!supporterPreview;supporterPreview=enabled;store.saveSupporterPreview(enabled);if(firstPurchase){supporterStyle="classic";supporterGlow=true;store.saveSupporterStyle("classic");store.saveSupporterGlow(true)};if(!enabled&&themeId in setOf("cosmic","heart","gothic")){themeId="retro_dark";store.saveThemeId(themeId)};if(!enabled&&language=="tlh"){language="sv";appLanguageState.value="sv";store.saveLanguage("sv")}},onSupporterStyle={style->supporterStyle=style;store.saveSupporterStyle(style)},onSupporterGlow={supporterGlow=it;store.saveSupporterGlow(it)},onResetStats={events.clear();store.saveEvents(events)})
                        "supporterSettings"->SupporterSettingsScreen(p,supporterPreview,supporterStyle,supporterGlow,onBack={navigateBack()},onPurchase={navigate("support")},onStyle={supporterStyle=it;store.saveSupporterStyle(it)},onGlow={supporterGlow=it;store.saveSupporterGlow(it)})
                        "users"->visibleAccount?.let{account->V600GroupAndProfileScreen(account,visibleMemberships,visibleGroups,if(activeV600Members.isNotEmpty())activeV600Members else legacyMembership?.let{listOf(it)}?:emptyList(),activeV600Requests,myV600JoinRequests,p,v600,onBack={navigateBack()},onSignOut={together.auth.signOut();googleClient.signOut()})}?:Box(Modifier.fillMaxSize(),contentAlignment=Alignment.Center){CircularProgressIndicator(color=p.gold)}
                        "about"->AboutScreen(p,supporterPreview,onSupporterInfo={navigate("support")},onVersions={navigate("versions")},onHelp={navigate("help")},onPrivacy={navigate("privacy")},onProblem={navigate("problem")},onSuggestion={navigate("suggestion")},onBack={navigateBack()})
                        "help"->HelpScreen(p,onBack={navigateBack()})
                        "privacy"->PrivacyScreen(p,onBack={navigateBack()})
                        "problem"->FeedbackScreen(true,p,activeUserId,language,theme.id,v600,onBack={navigateBack()})
                        "suggestion"->FeedbackScreen(false,p,activeUserId,language,theme.id,v600,onBack={navigateBack()})
                        "support"->SupportScreen(p,supporterPreview,onBack={navigateBack()},onActivate={val first=!supporterPreview;supporterPreview=true;store.saveSupporterPreview(true);if(first){supporterStyle="classic";supporterGlow=true;store.saveSupporterStyle("classic");store.saveSupporterGlow(true)}},onExplore={navigate("supporterSettings")})
                        "versions"->VersionsScreen(p,onBack={navigateBack()})
                        "globalPin"->globalPin?.let{pin->GlobalPinScreen(pin,globalPinItems,activeUserId,p,v600,onBack={navigateBack()})}?:Box(Modifier.fillMaxSize(),contentAlignment=Alignment.Center){Text(tr("Meddelandet finns inte längre.","The message is no longer available."),color=p.pageText)}
                        "admin"->if(localDeveloperAccount||v600Account?.megaSuperBoss==true||v600Account?.founder==true||adminSettings.founderUid==activeUserId)AdminScreen(p,v600,globalPin,adminSettings,onBack={navigateBack()}) else Box(Modifier.fillMaxSize(),contentAlignment=Alignment.Center){Text(tr("Ingen adminbehörighet.","No admin permission."),color=p.pageText)}
                        "update"->availableRelease?.let{UpdateAvailableScreen(it,p,onBack={navigateBack()})}?:ListsScreen(lists,privateLists,pinnedPrivateLists.toSet(),privateSpace,p,theme.id,activeUserId,cloudMembers,globalPin?.takeIf{it.revision>(v600Account?.hiddenGlobalPinRevision?:0L)},supporterPreview,onSupporterInfo={navigate("support")},onSelectPrivate={privateSpace=true;store.savePrivateSpace(activeUserId,true)},onSelectGroups={privateSpace=false;store.savePrivateSpace(activeUserId,false)},onOpen={selectedListPrivate=false;selectedListId=it;navigate("list")},onOpenPrivate={selectedListPrivate=true;selectedListId=it;navigate("list")},onTogglePrivatePin={id->if(id in pinnedPrivateLists)pinnedPrivateLists.remove(id)else pinnedPrivateLists.add(id);savePrivate()},onOpenPin={navigate("globalPin")},onHidePin={pin->v600.hideGlobalPin(activeUserId,pin.revision){}},onRestorePin={v600.restoreGlobalPin(activeUserId){}},onAdd={navigate("addList")},onAddPrivate={navigate("addPrivateList")},onSave={saveTogether()},onSavePrivate={savePrivate()})
                        else->{val l=if(selectedListPrivate)privateLists.firstOrNull{it.id==selectedListId}else lists.firstOrNull{it.id==selectedListId};if(l==null)screen="lists" else ShoppingListScreen(l,syncedUsers,activeUserId,if(selectedListPrivate)"" else (visibleAccount?.activeGroupId?:cloudProfile?.groupId.orEmpty()),p,supporterPreview,inputExpanded,onSupporterInfo={navigate("support")},onHelp={navigate("help")},onInputExpanded={inputExpanded=it;store.saveInputExpanded(it)},onBack={navigateBack()},onSave={if(selectedListPrivate)savePrivate()else saveTogether()},onEvent={event->if(selectedListPrivate){privateEvents.add(event);store.savePrivateEvents(activeUserId,privateEvents)}else{events.add(event);store.saveEvents(events);cloudProfile?.takeIf{it.groupId.isNotBlank()}?.let{together.recordActivity(it.groupId,event)}}})}
                    }
                }
                if(menuOpen)SideMenu(cloudProfile,visibleAccount?.let{if(localDeveloperAccount||adminSettings.founderUid==it.uid)it.copy(founder=true)else it},visibleMemberships,visibleGroups,groupName,privateSpace,p,supporterPreview,onSwitchGroup={groupId->privateSpace=false;store.savePrivateSpace(activeUserId,false);v600Account?.let{account->v600.switchActiveGroup(account.uid,groupId){}};navigationHistory.clear();screen="lists";selectedListId=null;selectedListPrivate=false;menuOpen=false},onSelectPrivate={privateSpace=true;store.savePrivateSpace(activeUserId,true);navigationHistory.clear();screen="lists";selectedListId=null;selectedListPrivate=false;menuOpen=false},onSupporterInfo={menuOpen=false;navigate("support")},onClose={menuOpen=false},onNavigate={menuOpen=false;navigate(it)})
                v600Account?.takeIf{it.supporterNoticeRevision>it.supporterNoticeSeen&&it.supporterNoticeType.isNotBlank()}?.let{notice->
                    val granted=notice.supporterNoticeType=="granted"
                    AlertDialog(onDismissRequest={},containerColor=popupColor(p.paper),title={Text(if(granted)"♥ ${tr("DU HAR FÅTT SUPPORTERSTATUS!","YOU RECEIVED SUPPORTER STATUS!")}" else tr("SUPPORTERSTATUS ÄNDRAD","SUPPORTER STATUS CHANGED"),color=p.text,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black)},text={Text(if(granted)tr("Du har blivit tilldelad Supporter-rank av Bubbsun.","You have been granted Supporter rank by Bubbsun.") else tr("Din Supporter-rank har tagits bort av Bubbsun.","Your Supporter rank has been removed by Bubbsun."),color=p.text)},confirmButton={RetroButton(if(granted)"♥ ${tr("TACK!","THANK YOU!")}" else "OK",{v600.acknowledgeSupporterNotice(notice.uid,notice.supporterNoticeRevision){}},p)})
                }
                if(showExitDialog) ConfirmDialog(tr("Avsluta Bubbsun?","Exit Bubbsun?"),tr("Vill du stänga appen?","Do you want to close the app?"),p,{showExitDialog=false},{showExitDialog=false;(context as? Activity)?.finish()},confirmLabel=tr("AVSLUTA","EXIT"))
                if(bootstrapCloudWarning)Box(Modifier.align(Alignment.BottomCenter).padding(12.dp).clip(RoundedCornerShape(9.dp)).background(p.panel).border(1.dp,p.gold,RoundedCornerShape(9.dp)).clickable{bootstrapCloudWarning=false}.padding(horizontal=12.dp,vertical=8.dp)){Text(tr("Molnanslutningen svarade inte – appen öppnades lokalt. Tryck för att stänga.","Cloud setup did not respond – the app opened locally. Tap to dismiss."),color=readableOn(p.panel),fontSize=11.sp)}
                if(showMigration)MigrationDialog(p,onUpload={cloudProfile?.let{profile->lists.forEach{l->l.creatorId=profile.uid;l.items.forEach{i->i.ownerId=profile.uid}};store.setPrefsBoolean("migration_0500_${profile.groupId}");together.syncLists(profile.groupId,lists,profile.uid)};showMigration=false},onLocal={cloudProfile?.let{store.setPrefsBoolean("migration_0500_${it.groupId}")};localOnly=true;showMigration=false},onEmpty={lists.clear();store.saveLists(lists);cloudProfile?.let{store.setPrefsBoolean("migration_0500_${it.groupId}")};showMigration=false})
            }
        }
    }
}

@Composable private fun CosmicBackground(){
    Canvas(Modifier.fillMaxSize()){
        drawRect(Brush.verticalGradient(listOf(Color(0xFF130B2B),Color(0xFF241044),Color(0xFF090713)),startY=0f,endY=size.height))
        drawCircle(Brush.radialGradient(listOf(Color(0x665E2A95),Color.Transparent),center=Offset(size.width*.18f,size.height*.28f),radius=size.width*.75f),radius=size.width*.75f,center=Offset(size.width*.18f,size.height*.28f))
        drawCircle(Brush.radialGradient(listOf(Color(0x553D68B8),Color.Transparent),center=Offset(size.width*.82f,size.height*.62f),radius=size.width*.72f),radius=size.width*.72f,center=Offset(size.width*.82f,size.height*.62f))
        drawCircle(Brush.radialGradient(listOf(Color(0x243B9AAE),Color.Transparent),center=Offset(size.width*.48f,size.height*.78f),radius=size.width*.52f),radius=size.width*.52f,center=Offset(size.width*.48f,size.height*.78f))
        val stars=listOf(.04f to .07f,.08f to .11f,.15f to .23f,.22f to .19f,.31f to .05f,.41f to .09f,.49f to .18f,.62f to .16f,.71f to .04f,.84f to .08f,.93f to .27f,.13f to .43f,.26f to .31f,.34f to .36f,.46f to .42f,.55f to .47f,.65f to .34f,.76f to .39f,.88f to .55f,.20f to .68f,.31f to .62f,.47f to .73f,.58f to .57f,.71f to .66f,.82f to .74f,.91f to .82f,.09f to .89f,.18f to .81f,.38f to .91f,.51f to .84f,.64f to .86f,.29f to .55f,.67f to .25f,.96f to .48f,.04f to .61f,.58f to .94f,.81f to .72f,.16f to .30f,.27f to .82f,.44f to .22f,.52f to .61f,.73f to .12f,.79f to .91f,.97f to .68f,.05f to .35f,.89f to .18f,.36f to .76f,.69f to .78f)
        stars.forEachIndexed{i,(x,y)->
            val radius=when{ i%11==0->3.1f;i%4==0->2.1f;else->1.15f}
            drawCircle(Color.White.copy(alpha=when{ i%11==0->.78f;i%3==0->.58f;else->.34f}),radius=radius,center=Offset(size.width*x,size.height*y))
            if(i%11==0){drawLine(Color.White.copy(alpha=.34f),Offset(size.width*x-radius*2.3f,size.height*y),Offset(size.width*x+radius*2.3f,size.height*y),1f);drawLine(Color.White.copy(alpha=.34f),Offset(size.width*x,size.height*y-radius*2.3f),Offset(size.width*x,size.height*y+radius*2.3f),1f)}
        }
    }
}

@Composable private fun HeartBackground(){
    Canvas(Modifier.fillMaxSize()){
        drawRect(Brush.verticalGradient(listOf(Color(0xFFF4ECDD),Color(0xFFE8D8C5))))
        val hearts=listOf(Triple(.08f,.12f,.65f),Triple(.24f,.23f,1.05f),Triple(.50f,.09f,.48f),Triple(.83f,.12f,1.35f),Triple(.93f,.32f,.62f),Triple(.22f,.43f,.82f),Triple(.52f,.38f,1.42f),Triple(.73f,.55f,.70f),Triple(.09f,.61f,1.18f),Triple(.36f,.69f,.52f),Triple(.12f,.78f,.75f),Triple(.62f,.82f,1.12f),Triple(.91f,.86f,.92f),Triple(.45f,.94f,.58f))
        hearts.forEachIndexed{i,(x,y,scale)->
            val cx=size.width*x;val cy=size.height*y;val r=5.dp.toPx()*scale;val tint=listOf(Color(0x22B9747F),Color(0x1FCE8FA2),Color(0x1D91A386))[i%3]
            drawCircle(tint,radius=r,center=Offset(cx-r*.72f,cy))
            drawCircle(tint,radius=r,center=Offset(cx+r*.72f,cy))
            drawPath(Path().apply{moveTo(cx-r*1.7f,cy+r*.15f);lineTo(cx+r*1.7f,cy+r*.15f);lineTo(cx,cy+r*2.25f);close()},tint)
        }
    }
}

@Composable private fun GothicBackground(){
    Box(Modifier.fillMaxSize()){
        Canvas(Modifier.fillMaxSize()){
            drawRect(Brush.verticalGradient(listOf(Color(0xFF09090C),Color(0xFF17131A),Color(0xFF07070A))))
            val stars=listOf(.08f to .19f,.19f to .37f,.31f to .11f,.43f to .28f,.56f to .15f,.69f to .36f,.82f to .22f,.93f to .42f,.13f to .68f,.38f to .59f,.61f to .74f,.86f to .65f,.48f to .91f,.75f to .88f)
            stars.forEachIndexed{i,(x,y)->drawCircle(if(i%4==0)Color(0x99D9CBDD)else Color(0x557A6C80),if(i%4==0)2.1f else 1.1f,Offset(size.width*x,size.height*y))}
        }
        Image(painterResource(R.drawable.theme_gothic_noir),contentDescription=null,contentScale=ContentScale.Fit,modifier=Modifier.align(Alignment.TopEnd).padding(top=82.dp).offset(x=34.dp).size(260.dp).graphicsLayer{alpha=.72f})
    }
}

@Composable private fun AppHeader(theme:AppTheme,p:Palette,supporterPreview:Boolean,supporterStyle:String,supporterGlow:Boolean,onMenu:()->Unit,onHome:()->Unit,onThemeSelected:(String)->Unit,onSupporterInfo:()->Unit){
    var themeMenu by remember{mutableStateOf(false)}
    Row(Modifier.fillMaxWidth().background(p.top).padding(horizontal=12.dp,vertical=5.dp),verticalAlignment=Alignment.CenterVertically){
        SquareIcon("☰",onMenu,p,large=true)
        Spacer(Modifier.width(7.dp))
        val hasSupporterMark=supporterPreview&&supporterStyle!="none"
        Box(Modifier.weight(1f).height(69.dp),contentAlignment=Alignment.Center){
            val logoOffset=if(hasSupporterMark)(-8).dp else 0.dp
            if(supporterPreview&&supporterGlow) Image(painterResource(R.drawable.bubbsun_header_logo),null,contentScale=ContentScale.Fit,colorFilter=ColorFilter.tint(p.gold),modifier=Modifier.fillMaxWidth().height(49.dp).offset(y=logoOffset).blur(5.dp).graphicsLayer{alpha=.65f})
            Image(painterResource(R.drawable.bubbsun_header_logo),contentDescription="Bubbsun",contentScale=ContentScale.Fit,modifier=Modifier.fillMaxWidth().height(49.dp).offset(y=logoOffset).clickable{onHome()})
            if(supporterPreview&&supporterStyle!="none")Box(Modifier.align(Alignment.BottomCenter)){CompactSupporterMark(supporterStyle,p)}
        }
        Spacer(Modifier.width(7.dp))
        Box{
            ThemeButton(theme,{themeMenu=true},p)
            DropdownMenu(expanded=themeMenu,onDismissRequest={themeMenu=false},modifier=Modifier.width(300.dp).background(popupColor(p.panel))){
                Row(Modifier.fillMaxWidth().padding(start=16.dp,end=8.dp,top=7.dp,bottom=5.dp),verticalAlignment=Alignment.CenterVertically){
                    Text(tr("VÄLJ TEMA","CHOOSE THEME"),color=readableOn(popupColor(p.panel)),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=15.sp,modifier=Modifier.weight(1f))
                    Box(Modifier.size(34.dp).clip(RoundedCornerShape(8.dp)).background(p.gold.copy(alpha=.14f)).border(1.dp,p.outline,RoundedCornerShape(8.dp)).clickable{themeMenu=false},contentAlignment=Alignment.Center){Text("×",color=readableOn(popupColor(p.panel)),fontSize=21.sp,fontWeight=FontWeight.Black)}
                }
                appThemes.forEach{option->
                    if(option.id=="cosmic"&&supporterPreview){
                        Row(Modifier.fillMaxWidth().padding(horizontal=13.dp,vertical=7.dp),verticalAlignment=Alignment.CenterVertically){
                            HorizontalDivider(Modifier.weight(1f),thickness=1.dp,color=p.gold.copy(alpha=.72f))
                            Text("  ✦ ${tr("SUPPORTER EXKLUSIVT","SUPPORTER EXCLUSIVE")} ✦  ",color=p.gold,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=10.sp,maxLines=1)
                            HorizontalDivider(Modifier.weight(1f),thickness=1.dp,color=p.gold.copy(alpha=.72f))
                        }
                    }
                    val selected=option.id==theme.id
                    val locked=option.id in setOf("cosmic","heart","gothic")&&!supporterPreview
                    DropdownMenuItem(
                        text={Column(Modifier.graphicsLayer{alpha=if(locked).42f else 1f}){Text(themeLabel(option.id),color=readableOn(popupColor(p.panel)),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=18.sp);Row(horizontalArrangement=Arrangement.spacedBy(5.dp)){listOf(option.palette.gold,option.palette.green,option.palette.bg).forEach{c->Box(Modifier.size(10.dp).clip(CircleShape).background(if(locked)Color.Gray else c))}}}},
                        leadingIcon={ThemeMenuIcon(option,locked,selected)},
                        trailingIcon=if(locked){{Text("🔒",fontSize=17.sp)}}else null,
                        onClick={if(locked){themeMenu=false;onSupporterInfo()}else{onThemeSelected(option.id);themeMenu=false}},
                        modifier=Modifier.padding(horizontal=6.dp,vertical=2.dp).clip(RoundedCornerShape(10.dp)).then(if(selected)Modifier.background(p.gold.copy(alpha=.18f)).border(1.dp,p.gold,RoundedCornerShape(10.dp))else Modifier)
                    )
                }
            }
        }
    }
}

@Composable private fun ThemeButton(theme:AppTheme,onClick:()->Unit,p:Palette){
    Button(onClick,shape=RoundedCornerShape(8.dp),colors=ButtonDefaults.buttonColors(containerColor=Color.Transparent),contentPadding=PaddingValues(0.dp),modifier=Modifier.size(56.dp).border(2.dp,p.outline,RoundedCornerShape(8.dp))){
        Image(painterResource(themeDrawable(theme.id)),contentDescription=themeLabel(theme.id),contentScale=ContentScale.Fit,modifier=Modifier.fillMaxSize().padding(2.dp))
    }
}

@Composable private fun ThemeMenuIcon(theme:AppTheme,locked:Boolean,selected:Boolean){
    Box(Modifier.size(42.dp),contentAlignment=Alignment.Center){
        Box(Modifier.size(40.dp).clip(RoundedCornerShape(8.dp))){
            Image(painterResource(themeDrawable(theme.id)),contentDescription=themeLabel(theme.id),contentScale=ContentScale.Fit,modifier=Modifier.fillMaxSize().graphicsLayer{alpha=if(locked).32f else 1f})
            if(locked)Box(Modifier.matchParentSize().background(Color.Gray.copy(alpha=.38f)))
        }
        if(selected)SelectionBadge(theme.palette.gold,Modifier.align(Alignment.TopEnd).padding(top=5.dp,end=0.dp))
    }
}

@Composable private fun SideMenu(profile:CloudProfile?,account:V600Account?,memberships:List<GroupMembership>,groups:Map<String,GroupSummary>,groupName:String,privateSpace:Boolean,p:Palette,supporterEnabled:Boolean,onSwitchGroup:(String)->Unit,onSelectPrivate:()->Unit,onSupporterInfo:()->Unit,onClose:()->Unit,onNavigate:(String)->Unit){
    var groupsExpanded by remember{mutableStateOf(false)}
    Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha=.62f)).clickable{onClose()}){
        Column(
            Modifier.fillMaxHeight().fillMaxWidth(.84f).background(p.top).padding(horizontal=13.dp,vertical=10.dp).clickable(enabled=false){},
            verticalArrangement=Arrangement.Top
        ){
            Row(Modifier.fillMaxWidth().height(42.dp),verticalAlignment=Alignment.CenterVertically){Text("☰",color=readableOn(p.top),fontSize=27.sp,fontWeight=FontWeight.Black);Spacer(Modifier.width(9.dp));Text(tr("MENY","MENU"),color=readableOn(p.top),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=24.sp,modifier=Modifier.weight(1f));Button(onClick=onClose,shape=RoundedCornerShape(8.dp),colors=ButtonDefaults.buttonColors(containerColor=p.panel,contentColor=readableOn(p.panel)),contentPadding=PaddingValues(0.dp),modifier=Modifier.size(40.dp).border(1.dp,p.outline,RoundedCornerShape(8.dp))){Text("×",fontSize=21.sp,fontWeight=FontWeight.Black)}}
            Column(Modifier.fillMaxWidth().weight(1f).verticalScroll(rememberScrollState())){
            Spacer(Modifier.height(8.dp))
            profile?.let{active->
                val activeGroupId=account?.activeGroupId?:active.groupId
                val membership=memberships.firstOrNull{it.groupId==activeGroupId}
                val activeGroup=groups[activeGroupId]
                val activeAccent=if(privateSpace)p.gold else Color(activeGroup?.color?:0xFF7D936C)
                Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(Brush.horizontalGradient(listOf(activeAccent.copy(alpha=.32f),p.panel,p.panel))).border(2.dp,activeAccent,RoundedCornerShape(14.dp))){
                    Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min),verticalAlignment=Alignment.CenterVertically){
                        Row(Modifier.weight(1f).heightIn(min=80.dp).clickable{onNavigate("users")}.padding(horizontal=11.dp,vertical=8.dp),verticalAlignment=Alignment.CenterVertically){
                            val memberColor=membership?.color?:active.color
                            Box(Modifier.size(55.dp).clip(CircleShape).background(Color(memberColor)).border(3.dp,activeAccent,CircleShape),contentAlignment=Alignment.Center){Text((account?.displayName?:active.name).take(1).uppercase(),color=readableOn(Color(memberColor)),fontWeight=FontWeight.Black,fontSize=23.sp)}
                            Spacer(Modifier.width(10.dp));Column(Modifier.weight(1f)){
                                val roleMark=when(membership?.parsedRole){GroupRole.SUPER_BOSS->"  👑";GroupRole.BOSS->"  ★";else->""}
                                Text((account?.displayName?:active.name)+roleMark,color=readableOn(p.panel),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=18.sp,maxLines=1,overflow=TextOverflow.Ellipsis)
                                val title=account?.globalTitle.orEmpty().ifBlank{when(membership?.parsedRole){GroupRole.SUPER_BOSS->tr("Superboss","Super boss");GroupRole.BOSS->"Boss";else->tr("Medlem","Member")}}
                                Text(title,color=activeAccent,fontSize=11.sp,fontWeight=FontWeight.Black,maxLines=1,overflow=TextOverflow.Ellipsis)
                                Spacer(Modifier.height(2.dp));Row(verticalAlignment=Alignment.CenterVertically){if(privateSpace)Image(painterResource(R.drawable.list_checklist),null,Modifier.size(40.dp))else Text(activeGroup?.iconId?:"⌂",fontSize=38.sp,lineHeight=40.sp);Spacer(Modifier.width(7.dp));Text(if(privateSpace)tr("Mina listor","My lists") else activeGroup?.name?:groupName.ifBlank{tr("Ingen grupp ännu","No group yet")},color=readableOn(p.panel).copy(alpha=.88f),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Bold,fontSize=12.sp,lineHeight=14.sp,maxLines=2,overflow=TextOverflow.Ellipsis)}
                            }
                        }
                        Box(Modifier.width(1.dp).fillMaxHeight().background(activeAccent.copy(alpha=.82f)))
                        Box(Modifier.width(62.dp).fillMaxHeight().background(activeAccent.copy(alpha=if(groupsExpanded).28f else .13f)).clickable{groupsExpanded=!groupsExpanded},contentAlignment=Alignment.Center){Text(if(groupsExpanded)"⌃" else "⌄",color=readableOn(p.panel),fontSize=29.sp,fontWeight=FontWeight.Black)}
                    }
                    if(groupsExpanded){
                        HorizontalDivider(color=p.outline.copy(alpha=.55f))
                        Column(Modifier.fillMaxWidth().heightIn(max=280.dp).verticalScroll(rememberScrollState()).padding(7.dp),verticalArrangement=Arrangement.spacedBy(5.dp)){
                            Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(if(privateSpace)p.gold.copy(alpha=.18f) else Color.Transparent).border(if(privateSpace)1.dp else 0.dp,if(privateSpace)p.gold else Color.Transparent,RoundedCornerShape(10.dp)).clickable{onSelectPrivate();groupsExpanded=false}.padding(horizontal=8.dp,vertical=7.dp),verticalAlignment=Alignment.CenterVertically){
                                Box(Modifier.size(31.dp).clip(RoundedCornerShape(8.dp)).background(p.paper).border(1.dp,p.outline,RoundedCornerShape(8.dp)),contentAlignment=Alignment.Center){Image(painterResource(R.drawable.list_checklist),null,Modifier.fillMaxSize().padding(3.dp))}
                                Spacer(Modifier.width(9.dp));Text(tr("Mina listor","My lists"),color=readableOn(p.panel),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Bold,modifier=Modifier.weight(1f))
                                if(privateSpace)SelectionBadge(p.gold)
                            }
                            memberships.sortedBy{it.order}.forEach{item->
                                val summary=groups[item.groupId]
                                val selected=!privateSpace&&item.groupId==activeGroupId
                                Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(if(selected)p.gold.copy(alpha=.18f) else Color.Transparent).border(if(selected)1.dp else 0.dp,if(selected)p.gold else Color.Transparent,RoundedCornerShape(10.dp)).clickable{if(!selected)onSwitchGroup(item.groupId);groupsExpanded=false}.padding(horizontal=8.dp,vertical=7.dp),verticalAlignment=Alignment.CenterVertically){
                                    Box(Modifier.size(31.dp).clip(RoundedCornerShape(8.dp)).background(Color(summary?.color?:0xFF7D936C)).border(1.dp,p.outline,RoundedCornerShape(8.dp)),contentAlignment=Alignment.Center){Text(summary?.iconId?:"⌂",fontSize=17.sp,color=readableOn(Color(summary?.color?:0xFF7D936C)))}
                                    Spacer(Modifier.width(9.dp));Text(summary?.name?:tr("Laddar…","Loading…"),color=readableOn(p.panel),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Bold,maxLines=1,overflow=TextOverflow.Ellipsis,modifier=Modifier.weight(1f))
                                    if(selected)SelectionBadge(p.gold)
                                }
                            }
                        }
                    }
                }
            }
            Spacer(Modifier.height(12.dp))
            MenuCard(R.drawable.menu_stats,tr("STATISTIK","STATISTICS"),if(privateSpace)tr("Mina listor • Privat statistik","My lists • Private statistics") else "${groups[account?.activeGroupId?:profile?.groupId]?.name?:groupName.ifBlank{tr("Gruppen","The group")}} • ${tr("Gruppstatistik","Group statistics")}",p){onNavigate("stats")}
            Spacer(Modifier.height(10.dp))
            MenuCard(R.drawable.theme_steel,tr("INSTÄLLNINGAR","SETTINGS"),tr("Språk, bekräftelser & statistik","Language, confirmations & statistics"),p){onNavigate("settings")}
            Spacer(Modifier.height(8.dp))
            SupportMenuCard(p){onSupporterInfo()}
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(8.dp)){
                HalfMenuCard(R.drawable.about_info,tr("OM","ABOUT"),p,Modifier.weight(1f)){onNavigate("about")}
                HalfMenuCard(R.drawable.list_checklist,tr("HJÄLP","HELP"),p,Modifier.weight(1f)){onNavigate("help")}
            }
            if(account?.megaSuperBoss==true||account?.founder==true){
                Spacer(Modifier.height(10.dp))
                MenuCard(R.drawable.list_supporter_emblem,"MEGASUPERBOSS",tr("Global admin för Bubbsun","Global Bubbsun admin"),p){onNavigate("admin")}
            }
            }
            Box(Modifier.fillMaxWidth().background(Brush.verticalGradient(listOf(Color.Transparent,p.top))).padding(top=8.dp,bottom=2.dp)){
                Column(Modifier.align(Alignment.Center),horizontalAlignment=Alignment.CenterHorizontally){Text(if(supporterEnabled)"♥  FOUNDING SUPPORTER" else "♥  ${tr("STÖD BUBBSUN","SUPPORT BUBBSUN")}",color=readableOn(p.top),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=9.sp,modifier=Modifier.clip(RoundedCornerShape(50)).background(p.gold.copy(alpha=.14f)).border(1.dp,p.outline,RoundedCornerShape(50)).clickable{onSupporterInfo()}.padding(horizontal=9.dp,vertical=4.dp));Spacer(Modifier.height(3.dp));Text("v${BuildConfig.VERSION_NAME}  •  $editionName",color=p.gold.copy(alpha=.85f),fontFamily=FontFamily.Serif,fontSize=11.sp,maxLines=1,overflow=TextOverflow.Ellipsis)}
            }
        }
    }
}

@Composable private fun MenuCard(icon:Int,title:String,subtitle:String,p:Palette,onClick:()->Unit){
    Row(Modifier.fillMaxWidth().height(65.dp).clip(RoundedCornerShape(14.dp)).background(p.panel).border(1.dp,p.outline,RoundedCornerShape(14.dp)).clickable{onClick()}.padding(horizontal=13.dp),verticalAlignment=Alignment.CenterVertically){
        Box(Modifier.size(41.dp).clip(RoundedCornerShape(10.dp)).background(p.gold.copy(alpha=.12f)).border(1.dp,p.outline,RoundedCornerShape(10.dp)),contentAlignment=Alignment.Center){Image(painterResource(icon),null,Modifier.fillMaxSize().padding(6.dp).graphicsLayer{translationX=if(icon==R.drawable.menu_stats)2.dp.toPx() else 0f})}
        Spacer(Modifier.width(11.dp));Text(title,color=readableOn(p.panel),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=if(title.length>13)15.sp else 18.sp,maxLines=1,overflow=TextOverflow.Ellipsis,modifier=Modifier.weight(1f));Text("›",color=readableOn(p.panel),fontSize=28.sp)
    }
}

@Composable private fun SupportMenuCard(p:Palette,onClick:()->Unit){
    val bg=Brush.horizontalGradient(listOf(Color(0xFF6D3F58),Color(0xFF8E5870),Color(0xFF654158)))
    Row(Modifier.fillMaxWidth().height(68.dp).clip(RoundedCornerShape(16.dp)).background(bg).border(2.dp,Color(0xFFE7B5C8),RoundedCornerShape(16.dp)).clickable(onClick=onClick).padding(horizontal=14.dp),verticalAlignment=Alignment.CenterVertically){
        Text("✦",color=Color(0xFFF4D7A0),fontSize=12.sp);Spacer(Modifier.width(5.dp));Image(painterResource(R.drawable.theme_heart),null,Modifier.size(43.dp));Spacer(Modifier.width(10.dp));Text(tr("STÖD BUBBSUN","SUPPORT BUBBSUN"),color=Color(0xFFFFE8CF),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=18.sp,modifier=Modifier.weight(1f));Text("✦  ›",color=Color(0xFFF4D7A0),fontSize=22.sp,fontWeight=FontWeight.Black)
    }
}

@Composable private fun HalfMenuCard(icon:Int,title:String,p:Palette,modifier:Modifier=Modifier,onClick:()->Unit){
    Row(modifier.height(58.dp).clip(RoundedCornerShape(13.dp)).background(p.panel).border(1.dp,p.outline,RoundedCornerShape(13.dp)).clickable(onClick=onClick).padding(horizontal=9.dp),verticalAlignment=Alignment.CenterVertically){Image(painterResource(icon),null,Modifier.size(31.dp));Spacer(Modifier.width(7.dp));Text(title,color=readableOn(p.panel),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=13.sp,maxLines=1,overflow=TextOverflow.Ellipsis,modifier=Modifier.weight(1f));Text("›",color=readableOn(p.panel),fontSize=21.sp)}
}

@Composable private fun SpaceTab(label:String,selected:Boolean,p:Palette,modifier:Modifier=Modifier,onClick:()->Unit){
    val bg=if(selected)p.gold else p.panel
    Box(modifier.height(42.dp).clip(RoundedCornerShape(10.dp)).background(bg).border(if(selected)2.dp else 1.dp,if(selected)p.glow else p.outline,RoundedCornerShape(10.dp)).clickable(onClick=onClick),contentAlignment=Alignment.Center){
        Text(label,color=readableOn(bg),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=12.sp,maxLines=1,overflow=TextOverflow.Ellipsis)
    }
}

@Composable private fun ListsScreen(lists:SnapshotStateList<ShoppingListData>,privateLists:SnapshotStateList<ShoppingListData>,privatePinned:Set<String>,privateSpace:Boolean,p:Palette,themeId:String,activeUserId:String,members:List<CloudProfile>,pin:GlobalPinDocument?,supporterEnabled:Boolean,onSupporterInfo:()->Unit,onSelectPrivate:()->Unit,onSelectGroups:()->Unit,onOpen:(String)->Unit,onOpenPrivate:(String)->Unit,onTogglePrivatePin:(String)->Unit,onOpenPin:()->Unit,onHidePin:(GlobalPinDocument)->Unit,onRestorePin:()->Unit,onAdd:()->Unit,onAddPrivate:()->Unit,onSave:()->Unit,onSavePrivate:()->Unit){
    var deleteTarget by remember{mutableStateOf<Pair<ShoppingListData,Boolean>?>(null)}
    var editTarget by remember{mutableStateOf<Pair<ShoppingListData,Boolean>?>(null)}
    var draggingId by remember{mutableStateOf<String?>(null)}
    var editZoneBounds by remember{mutableStateOf(androidx.compose.ui.geometry.Rect.Zero)}
    var deleteZoneBounds by remember{mutableStateOf(androidx.compose.ui.geometry.Rect.Zero)}
    var overDropZone by remember{mutableStateOf("")}
    var undoPin by remember{mutableStateOf<GlobalPinDocument?>(null)}
    LaunchedEffect(undoPin?.revision){if(undoPin!=null){delay(5000);undoPin=null}}
    val orderedPrivate=privateLists.sortedByDescending{it.id in privatePinned}

    Column(Modifier.fillMaxSize()){
        RetroTitle(if(privateSpace)tr("MINA LISTOR","MY LISTS") else tr("GRUPPENS LISTOR","GROUP LISTS"),p,themeId)
        Spacer(Modifier.height(7.dp))
        Row(Modifier.fillMaxWidth().padding(horizontal=12.dp),horizontalArrangement=Arrangement.spacedBy(7.dp)){
            SpaceTab("⌂  ${tr("MINA LISTOR","MY LISTS")}",privateSpace,p,Modifier.weight(1f),onSelectPrivate)
            SpaceTab("♣  ${tr("GRUPPER","GROUPS")}",!privateSpace,p,Modifier.weight(1f),onSelectGroups)
        }
        Spacer(Modifier.height(7.dp))
        LazyColumn(Modifier.weight(1f).padding(horizontal=12.dp),verticalArrangement=Arrangement.spacedBy(7.dp)){
            if(privateSpace){
            item{
                Row(verticalAlignment=Alignment.CenterVertically,modifier=Modifier.fillMaxWidth().padding(horizontal=3.dp,vertical=2.dp)){
                    Text("🔒",fontSize=15.sp);Spacer(Modifier.width(6.dp));Text(tr("MINA PRIVATA LISTOR","MY PRIVATE LISTS"),color=p.pageText,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=14.sp,modifier=Modifier.weight(1f));Text(tr("Bara du kan se dem","Only you can see them"),color=p.pageMuted,fontSize=9.sp)
                }
            }
            if(orderedPrivate.isEmpty())item{
                Text(tr("Du har inga privata listor ännu.","You do not have any private lists yet."),color=p.pageMuted,fontSize=11.sp,modifier=Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(p.panel.copy(alpha=.55f)).padding(11.dp))
            }
            items(orderedPrivate,key={"private_${it.id}"}){l->
                ListRow(
                    list=l,p=p,creatorColor=members.firstOrNull{it.uid==activeUserId}?.color?:0xFF888888L,newCount=0,
                    dragging=draggingId==l.id,onOpen={onOpenPrivate(l.id)},privatePinned=l.id in privatePinned,onTogglePin={onTogglePrivatePin(l.id)},
                    onDragStart={draggingId=l.id;overDropZone=""},onDragPosition={point->overDropZone=when{editZoneBounds.contains(point)->"edit";deleteZoneBounds.contains(point)->"delete";else->""}},
                    onDragEnd={point,steps->val action=when{editZoneBounds.contains(point)->"edit";deleteZoneBounds.contains(point)->"delete";else->""};draggingId=null;overDropZone="";if(action=="delete")deleteTarget=l to true else if(action=="edit")editTarget=l to true else{val shown=privateLists.sortedByDescending{it.id in privatePinned};val from=shown.indexOf(l);val to=(from+steps).coerceIn(0,shown.lastIndex);if(from>=0&&from!=to&&(shown[to].id in privatePinned)==(l.id in privatePinned)){val other=shown[to];val a=privateLists.indexOf(l);val b=privateLists.indexOf(other);privateLists[a]=other;privateLists[b]=l};onSavePrivate()}}
                )
            }
            }
            if(!privateSpace){
            val pinnedShortcuts=orderedPrivate.filter{it.id in privatePinned}
            if(pinnedShortcuts.isNotEmpty()){
                item{Text(tr("MINA PINNADE LISTOR","MY PINNED LISTS"),color=p.pageText,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=14.sp,modifier=Modifier.padding(horizontal=3.dp,vertical=2.dp))}
                items(pinnedShortcuts,key={"shortcut_${it.id}"}){l->
                    ListRow(list=l,p=p,creatorColor=members.firstOrNull{it.uid==activeUserId}?.color?:0xFF888888L,newCount=0,dragging=false,onOpen={onOpenPrivate(l.id)},privatePinned=true,onTogglePin={onTogglePrivatePin(l.id)},onDragStart={},onDragPosition={},onDragEnd={_,_->})
                }
                item{Spacer(Modifier.height(4.dp))}
            }
            item{
                Text(tr("DELAS MED GRUPPEN","SHARED WITH THE GROUP"),color=p.pageText,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=14.sp,modifier=Modifier.padding(horizontal=3.dp,vertical=2.dp))
            }
            items(lists,key={it.id}){l->
                ListRow(
                    list=l,
                    p=p,
                    creatorColor=members.firstOrNull{it.uid==l.creatorId}?.color,
                    newCount=l.items.count{it.ownerId!=activeUserId&&it.createdAt>(l.seenAtByUser[activeUserId]?:0L)},
                    dragging=draggingId==l.id,
                    onOpen={onOpen(l.id)},
                    onDragStart={draggingId=l.id;overDropZone=""},
                    onDragPosition={point->overDropZone=when{editZoneBounds.contains(point)->"edit";deleteZoneBounds.contains(point)->"delete";else->""}},
                    onDragEnd={point,steps->
                        val action=when{editZoneBounds.contains(point)->"edit";deleteZoneBounds.contains(point)->"delete";else->""}
                        draggingId=null
                        overDropZone=""
                        if(action=="delete")deleteTarget=l to false else if(action=="edit")editTarget=l to false else{
                            val from=lists.indexOf(l)
                            val to=(from+steps).coerceIn(0,lists.lastIndex)
                            if(from>=0&&from!=to){lists.removeAt(from);lists.add(to,l)}
                            onSave()
                        }
                    }
                )
            }
            }
        }
        if(pin!=null){
            GlobalPinHomeCard(pin,p,onOpenPin){undoPin=pin;onHidePin(pin)}
            Spacer(Modifier.height(7.dp))
        }else if(undoPin!=null){
            Row(Modifier.fillMaxWidth().padding(horizontal=12.dp).clip(RoundedCornerShape(9.dp)).background(p.panel).border(1.dp,p.gold,RoundedCornerShape(9.dp)).padding(horizontal=12.dp,vertical=9.dp),verticalAlignment=Alignment.CenterVertically){
                Text(tr("Meddelandet doldes.","Message hidden."),color=readableOn(p.panel),fontSize=12.sp,modifier=Modifier.weight(1f));Text(tr("ÅNGRA","UNDO"),color=p.gold,fontWeight=FontWeight.Black,modifier=Modifier.clickable{onRestorePin();undoPin=null}.padding(5.dp))
            }
            Spacer(Modifier.height(7.dp))
        }
        Box(Modifier.fillMaxWidth().height(68.dp)){
            if(draggingId==null){
                RetroButton(if(privateSpace)tr("＋  LÄGG TILL NY LISTA","＋  ADD NEW LIST") else tr("＋  LÄGG TILL GRUPPLISTA","＋  ADD GROUP LIST"),if(privateSpace)onAddPrivate else onAdd,p,modifier=Modifier.fillMaxWidth().padding(horizontal=12.dp,vertical=7.dp))
            }else{
                Row(Modifier.fillMaxSize().padding(horizontal=12.dp),horizontalArrangement=Arrangement.spacedBy(7.dp)){
                    DropTarget(tr("SLÄPP HÄR FÖR ATT REDIGERA","DROP HERE TO EDIT"),R.drawable.control_edit,p,overDropZone=="edit",Modifier.weight(1f).onGloballyPositioned{editZoneBounds=it.boundsInRoot()})
                    DropTarget(tr("SLÄPP HÄR FÖR ATT TA BORT","DROP HERE TO DELETE"),R.drawable.control_delete,p,overDropZone=="delete",Modifier.weight(1f).onGloballyPositioned{deleteZoneBounds=it.boundsInRoot()},danger=true)
                }
            }
        }
    }
    deleteTarget?.let{(l,isPrivate)->ConfirmDialog(tr("Ta bort listan \"${l.name}\"?","Delete list \"${l.name}\"?"),tr("Alla saker i listan försvinner.","All items in the list will be deleted."),p,{deleteTarget=null},{if(isPrivate){privateLists.remove(l);onSavePrivate()}else{lists.remove(l);onSave()};deleteTarget=null})}
    editTarget?.let{(l,isPrivate)->EditListDialog(l,p,supporterEnabled,onSupporterInfo,{editTarget=null}){name,icon,color->l.name=capitalized(name).take(40);l.icon=icon;l.iconColorHex=color;if(isPrivate)onSavePrivate()else onSave();editTarget=null}}
}

@Composable private fun DropTarget(label:String,icon:Int,p:Palette,active:Boolean,modifier:Modifier=Modifier,danger:Boolean=false){
    val base=if(danger)p.red else p.panel
    val bg=if(active)lerp(base,p.gold,.32f) else base
    Row(modifier.fillMaxHeight().clip(RoundedCornerShape(10.dp)).background(bg).border(if(active)4.dp else 2.dp,if(active)p.gold else p.outline,RoundedCornerShape(10.dp)).padding(horizontal=8.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.Center){
        Image(painterResource(icon),null,Modifier.size(26.dp));Spacer(Modifier.width(6.dp));Text(label,color=readableOn(bg),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=10.sp,lineHeight=11.sp,textAlign=TextAlign.Center,maxLines=3)
    }
}

@Composable private fun GlobalPinHomeCard(pin:GlobalPinDocument,p:Palette,onOpen:()->Unit,onHide:()->Unit){
    var drag by remember{mutableStateOf(0f)}
    Row(Modifier.fillMaxWidth().padding(horizontal=12.dp).height(54.dp).graphicsLayer{translationX=drag}.clip(RoundedCornerShape(11.dp)).background(Brush.horizontalGradient(listOf(p.paper2,p.paper))).border(2.dp,p.gold,RoundedCornerShape(11.dp)).pointerInput(pin.revision){
        detectHorizontalDragGestures(onDragEnd={if(abs(drag)>85f)onHide();drag=0f},onHorizontalDrag={change,amount->change.consume();drag=(drag+amount).coerceIn(-180f,180f)})
    }.clickable{onOpen()}.padding(horizontal=12.dp),verticalAlignment=Alignment.CenterVertically){
        Text("📣",fontSize=25.sp);Spacer(Modifier.width(9.dp));Column(Modifier.weight(1f)){Text(pin.title,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=17.sp,color=p.text,maxLines=1,overflow=TextOverflow.Ellipsis);Text(tr("Från Bubbsun","From Bubbsun"),fontSize=9.sp,fontWeight=FontWeight.Bold,color=p.muted)};Column(horizontalAlignment=Alignment.End){Row(verticalAlignment=Alignment.CenterVertically){Text("↔",fontSize=17.sp,color=p.gold,fontWeight=FontWeight.Black);Spacer(Modifier.width(3.dp));Text("☝",fontSize=17.sp,color=p.muted)};Text(tr("SVEPA FÖR ATT DÖLJA","SWIPE TO HIDE"),fontSize=7.sp,color=p.muted,fontWeight=FontWeight.Black)};Spacer(Modifier.width(5.dp));Text("›",fontSize=27.sp,fontWeight=FontWeight.Black,color=p.text)
    }
}

@Composable private fun GlobalPinScreen(pin:GlobalPinDocument,items:List<GlobalPinItem>,uid:String,p:Palette,repo:V600Repository,onBack:()->Unit){
    val liked=remember(pin.id){mutableStateMapOf<String,Boolean>()}
    Column(Modifier.fillMaxSize().padding(12.dp)){
        PageHeader(pin.title,p,onBack)
        Spacer(Modifier.height(8.dp))
        if(pin.infoText.isNotBlank())Text(pin.infoText,color=readableOn(p.panel),fontSize=14.sp,modifier=Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(p.panel).padding(12.dp))
        pin.publishedAt?.let{Spacer(Modifier.height(6.dp));Text("${tr("Skapad","Created")}: ${SimpleDateFormat("yyyy-MM-dd",Locale.getDefault()).format(it.toDate())}",fontSize=10.sp,color=p.pageMuted)}
        Spacer(Modifier.height(9.dp))
        LazyColumn(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(7.dp)){
            items(items,key={it.id}){item->
                Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(p.paper).border(1.dp,p.outline,RoundedCornerShape(10.dp)).padding(horizontal=12.dp,vertical=11.dp),verticalAlignment=Alignment.CenterVertically){
                    Column(Modifier.weight(1f)){Text(item.name,color=p.text,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=17.sp);if(item.quantity.isNotBlank())Text(item.quantity,color=p.muted,fontSize=12.sp)}
                    val active=liked[item.id]==true
                    Row(Modifier.clickable{val next=!active;liked[item.id]=next;repo.toggleGlobalPinReaction(pin.id,item.id,uid,next){ok->if(!ok)liked[item.id]=active}}.padding(7.dp),verticalAlignment=Alignment.CenterVertically){Text("👍",fontSize=17.sp,color=if(active)p.gold else p.muted);if(item.reactionCount>0)Text(item.reactionCount.toString(),fontSize=9.sp,fontWeight=FontWeight.Black,color=p.muted)}
                }
            }
        }
    }
}

@Composable private fun ListRow(list:ShoppingListData,p:Palette,creatorColor:Long?,newCount:Int,dragging:Boolean,onOpen:()->Unit,privatePinned:Boolean=false,onTogglePin:(()->Unit)?=null,onDragStart:()->Unit,onDragPosition:(Offset)->Unit,onDragEnd:(Offset,Int)->Unit){
    val haptic=LocalHapticFeedback.current
    var dragY by remember{mutableStateOf(0f)}
    var dragX by remember{mutableStateOf(0f)}
    var rowCenter by remember{mutableStateOf(Offset.Zero)}
    val rowStepPx=with(LocalDensity.current){85.dp.toPx()}
    val bg by animateColorAsState(if(dragging)p.glow else p.paper,label="drag")
    Row(
        Modifier.fillMaxWidth()
            .onGloballyPositioned{val pos=it.positionInRoot();rowCenter=Offset(pos.x+it.size.width/2f,pos.y+it.size.height/2f)}
            .graphicsLayer{translationX=if(dragging)dragX else 0f;translationY=if(dragging)dragY else 0f;shadowElevation=if(dragging)18f else 0f}
            .shadow(if(dragging)9.dp else if(p.paper.alpha<1f)0.dp else 2.dp,RoundedCornerShape(10.dp))
            .clip(RoundedCornerShape(10.dp)).background(bg)
            .border(if(dragging)3.dp else 2.dp,if(dragging)p.gold else p.outline,RoundedCornerShape(10.dp))
            .pointerInput(list.id){
                detectDragGesturesAfterLongPress(
                    onDragStart={
                        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                        dragX=0f;dragY=0f;onDragStart();onDragPosition(rowCenter)
                    },
                    onDragEnd={onDragEnd(rowCenter+Offset(dragX,dragY),(dragY/rowStepPx).roundToInt());dragX=0f;dragY=0f},
                    onDragCancel={onDragEnd(Offset(Float.NEGATIVE_INFINITY,Float.NEGATIVE_INFINITY),0);dragX=0f;dragY=0f},
                    onDrag={change,amount->
                        change.consume();dragX+=amount.x;dragY+=amount.y
                        onDragPosition(rowCenter+Offset(dragX,dragY))
                    }
                )
            }
            .clickable(enabled=!dragging){onOpen()},
        verticalAlignment=Alignment.CenterVertically
    ){
        Box(
            Modifier.width(90.dp).height(78.dp).background(Color(list.iconColorHex)),
            contentAlignment=Alignment.Center
        ){ListIconVisual(list.icon,Modifier.size(58.dp))}
        Box(Modifier.width(8.dp).height(78.dp).background(Color(creatorColor?:0xFF888888)))
        Column(Modifier.weight(1f).height(78.dp).padding(horizontal=12.dp,vertical=8.dp),verticalArrangement=Arrangement.Center){
            Text(list.name,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=when{list.name.length<=14->21.sp;list.name.length<=24->18.sp;else->15.sp},color=p.text,maxLines=2,overflow=TextOverflow.Ellipsis,lineHeight=when{list.name.length<=14->23.sp;list.name.length<=24->20.sp;else->17.sp})
            val left=list.items.count{!it.completed};val done=list.items.size-left
            Row(verticalAlignment=Alignment.CenterVertically){Text("${left} ${tr("kvar","left")} • ${done} ${tr("klara","done")}",fontWeight=FontWeight.Bold,color=p.text,fontSize=12.sp);if(newCount>0){Text(" • ",color=p.text,fontSize=12.sp);Text("${newCount} ${if(newCount==1)tr("ny","new") else tr("nya","new")}",fontWeight=FontWeight.Black,color=p.red,fontSize=12.sp)}}
        }
        if(onTogglePin!=null)Box(Modifier.width(if(privatePinned)61.dp else 52.dp).height(34.dp).clip(RoundedCornerShape(8.dp)).background(if(privatePinned)p.gold.copy(alpha=.32f) else p.paper2).border(if(privatePinned)2.dp else 1.dp,if(privatePinned)p.gold else p.outline,RoundedCornerShape(8.dp)).clickable(onClick=onTogglePin),contentAlignment=Alignment.Center){Text(if(privatePinned)tr("✓ PINNAD","✓ PINNED") else tr("PINNA","PIN"),fontSize=7.5.sp,fontWeight=FontWeight.Black,color=if(privatePinned)p.text else p.muted,maxLines=1)}
        Text("›",fontSize=35.sp,fontWeight=FontWeight.Bold,color=p.text,modifier=Modifier.padding(end=14.dp,start=if(onTogglePin==null)14.dp else 2.dp))
    }
}

@Composable private fun AddListScreen(p:Palette,supporterEnabled:Boolean,onSupporterInfo:()->Unit,onBack:()->Unit,onCreate:(String,String,Long)->Unit){
    var name by remember{mutableStateOf("")};var icon by remember{mutableStateOf(listIcons.first().id)};var color by remember{mutableStateOf(iconColors.first())}
    Column(Modifier.fillMaxSize().padding(14.dp)){
        PageHeader(tr("LÄGG TILL NY LISTA","ADD NEW LIST"),p,onBack)
        Spacer(Modifier.height(12.dp))
        LazyColumn(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(10.dp)){
            item{RetroField(name,{name=it.take(40)},tr("Skriv listans namn…","Enter list name…"),Modifier.fillMaxWidth(),p)}
            item{Text(tr("VÄLJ FÄRG","CHOOSE COLOR"),fontWeight=FontWeight.Black,color=p.pageText)}
            item{Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){iconColors.forEach{c->Box(Modifier.size(43.dp).clip(CircleShape).background(Color(c)).border(if(c==color)4.dp else 1.dp,if(c==color)p.gold else p.outline,CircleShape).clickable{color=c})}}}
            item{Text(tr("VÄLJ IKON","CHOOSE ICON"),fontWeight=FontWeight.Black,color=p.pageText)}
            items(listIcons.chunked(4)){row->
                Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(9.dp)){
                    row.forEach{i->val selected=i.id==icon;val locked=i.supporter&&!supporterEnabled;Box(Modifier.weight(1f).aspectRatio(1f).clip(RoundedCornerShape(9.dp)).background(if(selected)Color(color) else p.paper).border(if(selected)3.dp else 2.dp,if(selected)p.gold else p.outline,RoundedCornerShape(9.dp)).clickable{if(locked)onSupporterInfo()else icon=i.id}.padding(8.dp),contentAlignment=Alignment.Center){ListIconVisual(i.id,Modifier.fillMaxSize(),locked)}}
                }
            }
            item{Spacer(Modifier.height(4.dp))}
        }
        Spacer(Modifier.height(10.dp))
        RetroButton(tr("SKAPA LISTA","CREATE LIST"),{if(name.isNotBlank())onCreate(name,icon,color)},p,modifier=Modifier.fillMaxWidth())
    }
}

@Composable
private fun ShoppingListScreen(
    list: ShoppingListData,
    users: List<UserProfile>,
    activeUserId: String,
    groupId: String,
    p: Palette,
    supporterEnabled: Boolean,
    inputExpanded: Boolean,
    onSupporterInfo:()->Unit,
    onHelp:()->Unit,
    onInputExpanded: (Boolean) -> Unit,
    onBack: () -> Unit,
    onSave: () -> Unit,
    onEvent: (StatEvent) -> Unit
) {
    val context = LocalContext.current
    val followPrefs = remember { context.getSharedPreferences("bubbsun_followed_lists", Context.MODE_PRIVATE) }
    var input by remember { mutableStateOf("") }
    var quantityInput by remember { mutableStateOf("") }
    var search by remember(list.id) { mutableStateOf("") }
    var toolsOpen by remember { mutableStateOf(false) }
    var listActionsExpanded by remember { mutableStateOf(false) }
    var toolsTabDragX by remember { mutableStateOf(0f) }
    var toolsTabY by remember { mutableStateOf(followPrefs.getFloat("sort_tab_y_global",0f)) }
    var toolsAreaHeight by remember { mutableIntStateOf(0) }
    val toolsTabHeightPx=with(LocalDensity.current){74.dp.toPx()}
    val visitBaseline=remember(list.id,activeUserId){list.seenAtByUser[activeUserId]?:0L}
    var editing by remember { mutableStateOf<ShoppingItem?>(null) }
    var deleteMode by remember { mutableStateOf(false) }
    val selected = remember { mutableStateListOf<String>() }
    var confirmDelete by remember { mutableStateOf(false) }
    var draggingId by remember { mutableStateOf<String?>(null) }
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()
    val followKey="follow|$groupId|${list.id}"
    var following by remember(list.id,groupId) { mutableStateOf(followPrefs.getBoolean(followKey,followPrefs.getBoolean(list.id,false))) }
    LaunchedEffect(list.id,groupId){if(groupId.isNotBlank()&&following&&!followPrefs.contains(followKey))FollowNotificationScheduler.setFollowing(context,groupId,list.id,list.name,activeUserId,true)}
    LaunchedEffect(toolsAreaHeight){if(toolsAreaHeight>0){val limit=(toolsAreaHeight-toolsTabHeightPx).coerceAtLeast(0f)/2f;toolsTabY=toolsTabY.coerceIn(-limit,limit);followPrefs.edit().putFloat("sort_tab_y_global",toolsTabY).apply()}}

    fun sorted(source:List<ShoppingItem>)=when(list.sortMode){
        "az"->source.sortedBy{it.name.lowercase(Locale.getDefault())}
        "za"->source.sortedByDescending{it.name.lowercase(Locale.getDefault())}
        "new"->source.sortedByDescending{it.createdAt}
        "old"->source.sortedBy{it.createdAt}
        else->source
    }
    val matches=list.items.filter{search.isBlank()||it.name.contains(search,true)||it.quantity.contains(search,true)}
    val active = sorted(matches.filter { !it.completed })
    val done = sorted(matches.filter { it.completed })
    val suggestions = remember(input, list.items.size) {
        if (input.length < 1) emptyList() else list.items.map { it.name }.distinct()
            .filter { it.contains(input, ignoreCase = true) && !it.equals(input, true) }.take(5)
    }

    fun save() = onSave()
    fun addItem(raw: String, quantity: String = quantityInput) {
        val name = capitalized(raw)
        if (name.isBlank()) return
        val existing = list.items.firstOrNull { it.name.equals(name, ignoreCase = true) }
        if (existing == null) list.items.add(0, ShoppingItem(name = name, quantity = quantity.trim(), ownerId = activeUserId))
        else {
            existing.completed = false; existing.completedAt = null; existing.ownerId = activeUserId; existing.quantity = quantity.trim()
            list.items.remove(existing); list.items.add(0, existing)
        }
        input = ""; quantityInput = ""; save()
        scope.launch { if (list.items.isNotEmpty()) listState.animateScrollToItem(0) }
    }

    Box(Modifier.fillMaxSize().onGloballyPositioned{toolsAreaHeight=it.size.height}) {
    Column(Modifier.fillMaxSize().imePadding().padding(start=12.dp,end=12.dp,top=7.dp,bottom=12.dp)) {
        AnimatedVisibility(visible=listActionsExpanded,enter=expandVertically(),exit=shrinkVertically()){
            Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(p.panel).border(1.dp,p.outline,RoundedCornerShape(10.dp)).padding(7.dp),horizontalArrangement=Arrangement.spacedBy(8.dp),verticalAlignment=Alignment.CenterVertically){
                RetroButton(if(following)tr("SLUTA FÖLJA LISTA","UNFOLLOW LIST") else tr("FÖLJ LISTA","FOLLOW LIST"),{following=!following;FollowNotificationScheduler.setFollowing(context,groupId,list.id,list.name,activeUserId,following)},p,modifier=Modifier.weight(1f),compact=true)
                Box(Modifier.size(43.dp).clip(RoundedCornerShape(8.dp)).background(p.red).border(1.dp,p.outline,RoundedCornerShape(8.dp)).clickable{if(deleteMode){if(selected.isEmpty())deleteMode=false else confirmDelete=true}else deleteMode=true},contentAlignment=Alignment.Center){Image(painterResource(R.drawable.control_delete),null,Modifier.size(31.dp))}
            }
        }
        if(listActionsExpanded)Spacer(Modifier.height(7.dp))
        Box(Modifier.fillMaxWidth()){
            PageHeader(title = list.name, p = p, onBack = onBack, trailing = {Spacer(Modifier.width(86.dp))}, homeOnly = true)
            Box(Modifier.align(Alignment.TopEnd).offset(x=(-16).dp,y=(-7).dp).width(72.dp).height(31.dp).clip(RoundedCornerShape(bottomStart=11.dp,bottomEnd=11.dp)).background(p.gold).border(1.dp,p.outline,RoundedCornerShape(bottomStart=11.dp,bottomEnd=11.dp)).clickable{listActionsExpanded=!listActionsExpanded},contentAlignment=Alignment.Center){Text(if(listActionsExpanded)"⌃" else "⌄",color=readableOn(p.gold),fontSize=22.sp,fontWeight=FontWeight.Black)}
        }
        Spacer(Modifier.height(10.dp))
        InputPanel(
            product=input,onProductChange={input=it},quantity=quantityInput,onQuantityChange={quantityInput=it},
            onAdd={addItem(input)},expanded=inputExpanded,onExpandedChange=onInputExpanded,p=p,
        )
        if (suggestions.isNotEmpty()) {
            Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(p.paper).border(1.dp,p.outline,RoundedCornerShape(8.dp))) {
                suggestions.forEach { suggestion ->
                    Text(suggestion, color=p.text, fontWeight=FontWeight.Bold,
                        modifier=Modifier.fillMaxWidth().clickable { input=suggestion }.padding(horizontal=14.dp,vertical=9.dp))
                }
            }
        }
        Spacer(Modifier.height(10.dp))
        if (deleteMode) {
            val allIds = list.items.map { it.id }; val allSelected = allIds.isNotEmpty() && selected.containsAll(allIds)
            Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(p.panel).padding(horizontal=10.dp,vertical=8.dp),verticalAlignment=Alignment.CenterVertically) {
                Checkbox(checked=allSelected,onCheckedChange={selected.clear();if(!allSelected)selected.addAll(allIds)},colors=CheckboxDefaults.colors(checkedColor=p.red,uncheckedColor=p.green,checkmarkColor=Color.White))
                Text(tr("MARKERA ALLA","SELECT ALL"),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,color=Color(0xFFF6E8C3),modifier=Modifier.clickable{selected.clear();if(!allSelected)selected.addAll(allIds)})
                Spacer(Modifier.weight(1f))
                Text(tr("AVBRYT","CANCEL"),fontWeight=FontWeight.Black,color=Color(0xFFF6E8C3),modifier=Modifier.clickable{selected.clear();deleteMode=false}.padding(8.dp))
                Spacer(Modifier.width(5.dp))
                Button(onClick={confirmDelete=true},enabled=selected.isNotEmpty(),shape=RoundedCornerShape(7.dp),colors=ButtonDefaults.buttonColors(containerColor=p.red,contentColor=Color(0xFFF6E8C3),disabledContainerColor=Color.Gray.copy(alpha=.35f),disabledContentColor=Color(0xFFF6E8C3).copy(alpha=.45f)),contentPadding=PaddingValues(horizontal=9.dp,vertical=7.dp)){Text("${tr("TA BORT","DELETE")} (${selected.size})",fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=11.sp)}
            };Spacer(Modifier.height(8.dp))
        }
        if(search.isNotBlank())Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(p.panel).padding(8.dp),verticalAlignment=Alignment.CenterVertically){
            Text("${tr("SÖKRESULTAT","SEARCH RESULTS")}: “$search”",color=readableOn(p.panel),fontWeight=FontWeight.Black,modifier=Modifier.weight(1f))
            Text("✕",color=readableOn(p.panel),fontSize=20.sp,modifier=Modifier.clickable{search=""}.padding(5.dp))
        }
        LazyColumn(state=listState,modifier=Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(6.dp)) {
            if(search.isNotBlank()&&matches.isEmpty())item{Text(tr("Inga träffar.","No matches."),color=p.pageText,fontWeight=FontWeight.Bold,modifier=Modifier.padding(16.dp))}
            if(!list.doneFirst)items(active,key={it.id}) { item ->
                ItemRow(item,users,p,deleteMode,selected.contains(item.id),draggingId==item.id,item.ownerId!=activeUserId&&item.createdAt>visitBaseline,activeUserId,
                    onLike={if(activeUserId in item.likedBy)item.likedBy.remove(activeUserId)else item.likedBy.add(activeUserId);save()},
                    onSelect={if(item.id in selected)selected.remove(item.id) else selected.add(item.id)},
                    onToggle={item.completed=true;item.completedAt=System.currentTimeMillis();onEvent(StatEvent(kind="purchase",itemName=item.name,userId=item.ownerId));save()},
                    onEdit={editing=item},onDragStart={if(list.sortMode=="custom")draggingId=item.id},onDragEnd={draggingId=null;save()},
                    onMove={direction->val current=list.items.filter{!it.completed};val from=current.indexOf(item);val to=(from+direction).coerceIn(0,current.lastIndex);if(from!=to){val other=current[to];val a=list.items.indexOf(item);val b=list.items.indexOf(other);list.items[a]=other;list.items[b]=item;true}else false})
            }
            item { Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(p.green).clickable{list.doneExpanded=!list.doneExpanded;save()}.padding(10.dp)) { Text(if(list.doneExpanded)"${tr("KLART","DONE")} (${done.size})  ▲" else "${tr("KLART","DONE")} (${done.size})  ▼",fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,color=Color.White) } }
            if(list.doneExpanded) items(done,key={"d${it.id}"}) { item ->
                ItemRow(item,users,p,deleteMode,selected.contains(item.id),false,item.ownerId!=activeUserId&&item.createdAt>visitBaseline,activeUserId,
                    onLike={if(activeUserId in item.likedBy)item.likedBy.remove(activeUserId)else item.likedBy.add(activeUserId);save()},
                    onSelect={if(item.id in selected)selected.remove(item.id) else selected.add(item.id)},
                    onToggle={item.completed=false;item.completedAt=null;list.items.remove(item);list.items.add(0,item);save()},
                    onEdit={editing=item},onDragStart={},onDragEnd={},onMove={false})
            }
            if(list.doneFirst)items(active,key={"a${it.id}"}) { item ->
                ItemRow(item,users,p,deleteMode,selected.contains(item.id),draggingId==item.id,item.ownerId!=activeUserId&&item.createdAt>visitBaseline,activeUserId,
                    onLike={if(activeUserId in item.likedBy)item.likedBy.remove(activeUserId)else item.likedBy.add(activeUserId);save()},
                    onSelect={if(item.id in selected)selected.remove(item.id) else selected.add(item.id)},
                    onToggle={item.completed=true;item.completedAt=System.currentTimeMillis();onEvent(StatEvent(kind="purchase",itemName=item.name,userId=item.ownerId));save()},
                    onEdit={editing=item},onDragStart={if(list.sortMode=="custom")draggingId=item.id},onDragEnd={draggingId=null;save()},
                    onMove={direction->val current=list.items.filter{!it.completed};val from=current.indexOf(item);val to=(from+direction).coerceIn(0,current.lastIndex);if(from!=to){val other=current[to];val a=list.items.indexOf(item);val b=list.items.indexOf(other);list.items[a]=other;list.items[b]=item;true}else false})
            }
        }
    }
    Box(Modifier.align(Alignment.CenterEnd).width(28.dp).height(74.dp)
        .graphicsLayer{translationX=toolsTabDragX;translationY=toolsTabY}
        .clip(RoundedCornerShape(topStart=14.dp,bottomStart=14.dp)).background(p.gold)
        .pointerInput(activeUserId,toolsAreaHeight){
            detectDragGestures(
                onDragEnd={if(toolsTabDragX<=-22f)toolsOpen=true;toolsTabDragX=0f;followPrefs.edit().putFloat("sort_tab_y_global",toolsTabY).apply()},
                onDragCancel={toolsTabDragX=0f;followPrefs.edit().putFloat("sort_tab_y_global",toolsTabY).apply()}
            ){change,amount->
                change.consume()
                toolsTabDragX=(toolsTabDragX+amount.x).coerceIn(-90f,0f)
                val limit=(toolsAreaHeight-toolsTabHeightPx).coerceAtLeast(0f)/2f
                toolsTabY=(toolsTabY+amount.y).coerceIn(-limit,limit)
            }
        },contentAlignment=Alignment.Center){
        Column(verticalArrangement=Arrangement.spacedBy(4.dp)){repeat(3){Box(Modifier.width(13.dp).height(2.dp).background(readableOn(p.gold)))}} 
        if(search.isNotBlank())Box(Modifier.align(Alignment.TopStart).padding(4.dp).size(7.dp).clip(CircleShape).background(p.red))
    }
    if(toolsOpen){
        Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha=.42f)).clickable{toolsOpen=false})
        SearchSortPanel(search,{search=it},list,p,onSave={save()},onClose={toolsOpen=false},modifier=Modifier.align(Alignment.CenterEnd).fillMaxHeight().fillMaxWidth(.84f).pointerInput(list.id){
            var drag=0f
            detectHorizontalDragGestures(onDragEnd={if(drag>45f)toolsOpen=false;drag=0f},onDragCancel={drag=0f}){change,amount->change.consume();drag+=amount}
        })
    }
    }
    editing?.let { item -> EditDialog(item,p,{editing=null}) { n,q -> item.name=capitalized(n);item.quantity=q.trim();editing=null;save() } }
    if(confirmDelete) ConfirmDialog(tr("Ta bort ${selected.size} markerade saker?","Delete ${selected.size} selected items?"),tr("Det går inte att ångra.","This cannot be undone."),p,{confirmDelete=false},{val doomed=list.items.filter{it.id in selected};doomed.forEach{onEvent(StatEvent(kind="delete",itemName=it.name,userId=it.ownerId))};list.items.removeAll(doomed);selected.clear();deleteMode=false;confirmDelete=false;save()})
}

@Composable private fun SearchSortPanel(search:String,onSearch:(String)->Unit,list:ShoppingListData,p:Palette,onSave:()->Unit,onClose:()->Unit,modifier:Modifier=Modifier){
    Column(modifier.background(p.panel).verticalScroll(rememberScrollState()).padding(16.dp).imePadding()){
        Row(verticalAlignment=Alignment.CenterVertically){Text(tr("SÖK & SORTERA","SEARCH & SORT"),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=22.sp,color=readableOn(p.panel),modifier=Modifier.weight(1f));Text("✕",fontSize=24.sp,color=readableOn(p.panel),modifier=Modifier.clickable{onClose()}.padding(8.dp))}
        Spacer(Modifier.height(10.dp))
        RetroField(search,onSearch,tr("Sök i listan…","Search this list…"),Modifier.fillMaxWidth(),p)
        Spacer(Modifier.height(18.dp));Text(tr("SORTERING","SORTING"),fontWeight=FontWeight.Black,color=readableOn(p.panel))
        val modes=listOf("custom" to tr("Anpassad","Custom"),"az" to "A–Ö","za" to "Ö–A","new" to tr("Nyast först","Newest first"),"old" to tr("Äldst först","Oldest first"))
        modes.forEach{(id,label)->SortChoice(label,list.sortMode==id,p){list.sortMode=id;onSave()}}
        Spacer(Modifier.height(14.dp));Text(tr("KLARA VAROR","COMPLETED ITEMS"),fontWeight=FontWeight.Black,color=readableOn(p.panel))
        SortChoice(tr("Ej klara först","Not done first"),!list.doneFirst,p){list.doneFirst=false;onSave()}
        SortChoice(tr("Klara först","Done first"),list.doneFirst,p){list.doneFirst=true;list.doneExpanded=true;onSave()}
        Spacer(Modifier.height(28.dp))
        Text(if(list.sortMode=="custom")tr("Håll inne och dra för att sortera manuellt.","Press and hold to reorder manually.") else tr("Manuell dragning pausas tills Anpassad väljs.","Manual dragging is paused until Custom is selected."),color=readableOn(p.panel).copy(alpha=.72f),fontSize=12.sp)
    }
}

@Composable private fun SortChoice(label:String,selected:Boolean,p:Palette,onClick:()->Unit){
    Row(Modifier.fillMaxWidth().padding(top=7.dp).clip(RoundedCornerShape(9.dp)).background(if(selected)p.gold else p.paper).border(1.dp,if(selected)p.glow else p.outline,RoundedCornerShape(9.dp)).clickable{onClick()}.padding(horizontal=12.dp,vertical=11.dp),verticalAlignment=Alignment.CenterVertically){
        Text(label,color=if(selected)readableOn(p.gold) else p.text,fontWeight=FontWeight.Bold,modifier=Modifier.weight(1f))
        if(selected)SelectionBadge(p.gold)
    }
}

@Composable private fun ItemRow(item:ShoppingItem,users:List<UserProfile>,p:Palette,deleteMode:Boolean,isSelected:Boolean,dragging:Boolean,isNew:Boolean,activeUserId:String,onLike:()->Unit,onSelect:()->Unit,onToggle:()->Unit,onEdit:()->Unit,onDragStart:()->Unit,onDragEnd:()->Unit,onMove:(Int)->Boolean){
    val haptic=LocalHapticFeedback.current
    var dragY by remember{mutableStateOf(0f)}
    var reorderDrag by remember{mutableStateOf(0f)}
    val rowStepPx=with(LocalDensity.current){72.dp.toPx()}
    val bg by animateColorAsState(if(dragging)p.glow else if(item.completed)lerp(p.paper,Color.Gray,.32f) else p.paper,label="itemdrag")
    val owner=users.firstOrNull{it.id==item.ownerId}
    Row(
        Modifier.fillMaxWidth()
            .graphicsLayer{translationY=if(dragging)dragY else 0f;shadowElevation=if(dragging)16f else 0f}
            .shadow(if(dragging)8.dp else if(p.paper.alpha<1f)0.dp else 1.dp,RoundedCornerShape(8.dp))
            .clip(RoundedCornerShape(8.dp)).background(bg)
            .border(if(dragging)3.dp else 1.dp,if(dragging)p.gold else p.outline,RoundedCornerShape(8.dp)),
        verticalAlignment=Alignment.CenterVertically
    ){
        if(owner!=null) Box(Modifier.width(8.dp).height(66.dp).background(Color(owner.colorHex)))
        Checkbox(
            checked=item.completed,
            onCheckedChange={onToggle()},
            colors=CheckboxDefaults.colors(checkedColor=p.green,uncheckedColor=p.green,checkmarkColor=Color(0xFFF4E4BA))
        )
        Spacer(Modifier.width(3.dp))
        Row(
            Modifier.weight(1f)
                .pointerInput(item.id,deleteMode,item.completed){
                    if(!deleteMode && !item.completed){
                        detectDragGesturesAfterLongPress(
                            onDragStart={haptic.performHapticFeedback(HapticFeedbackType.LongPress);onDragStart();dragY=0f;reorderDrag=0f},
                            onDragEnd={onDragEnd();dragY=0f;reorderDrag=0f},
                            onDragCancel={onDragEnd();dragY=0f;reorderDrag=0f},
                            onDrag={change,amount->
                                change.consume();dragY+=amount.y;reorderDrag+=amount.y
                                if(abs(reorderDrag)>rowStepPx*.58f){
                                    val dir=if(reorderDrag>0)1 else -1
                                    if(onMove(dir)) dragY-=dir*rowStepPx
                                    reorderDrag=0f
                                }
                            }
                        )
                    }
                }
                .clickable(enabled=!dragging){onEdit()}
                .padding(start=0.dp,end=10.dp,top=9.dp,bottom=9.dp),
            verticalAlignment=Alignment.CenterVertically
        ){
            Column(Modifier.weight(1f)){
                Row(verticalAlignment=Alignment.CenterVertically){Text(item.name,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Bold,fontSize=when{item.name.length<=28->18.sp;item.name.length<=45->16.sp;else->14.sp},lineHeight=when{item.name.length<=28->20.sp;item.name.length<=45->18.sp;else->16.sp},maxLines=2,overflow=TextOverflow.Ellipsis,color=if(item.completed)lerp(p.text,Color.Gray,.78f) else p.text,textDecoration=if(item.completed)TextDecoration.LineThrough else null,modifier=Modifier.weight(1f));if(!deleteMode){Row(Modifier.clickable{onLike()}.padding(start=4.dp,end=if(isNew)4.dp else 0.dp),verticalAlignment=Alignment.CenterVertically){Text("👍",fontSize=15.sp,color=if(activeUserId in item.likedBy)p.gold else p.muted);if(item.likedBy.isNotEmpty())Text(item.likedBy.size.toString(),fontSize=8.sp,fontWeight=FontWeight.Black,color=p.muted)}};if(isNew)Text(tr("NYTT","NEW"),fontSize=9.sp,fontWeight=FontWeight.Black,color=p.red,modifier=Modifier.border(1.dp,p.red,RoundedCornerShape(4.dp)).padding(horizontal=4.dp,vertical=1.dp))}
                if(item.quantity.isNotBlank()) Text(item.quantity,fontSize=13.sp,fontWeight=FontWeight.Bold,color=if(item.completed)lerp(p.muted,Color.Gray,.52f) else p.muted,maxLines=1,overflow=TextOverflow.Ellipsis)
            }
        }
        if(deleteMode) Checkbox(isSelected,{onSelect()},colors=CheckboxDefaults.colors(checkedColor=p.red,uncheckedColor=p.red,checkmarkColor=Color.White))
    }
}

private val v600GroupColors=listOf(0xFF7D936CL,0xFF2F7777L,0xFFB45B55L,0xFF8B6E46L,0xFF667A91L,0xFF8C668EL,0xFF5D8255L,0xFFA56A42L,0xFF486B86L,0xFF9A6570L,0xFFC28A78L,0xFF6F8F8AL)
private val v600GroupIcons=listOf("⌂","♥","★","☀","☾","✿","⚓","♜","◆","☕","♫","✈","⚙","✦","☘","♛")

@Composable private fun V600ColorGrid(colors:List<Long>,selected:Long,p:Palette,blocked:Set<Long> = emptySet(),onSelect:(Long)->Unit){
    colors.chunked(4).forEach{row->
        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){
            row.forEach{color->
                val unavailable=color in blocked&&color!=selected
                Box(Modifier.size(43.dp).clip(CircleShape).background(if(unavailable)Color(color).copy(alpha=.25f) else Color(color)).border(if(selected==color)4.dp else 1.dp,if(selected==color)p.text else p.outline,CircleShape).clickable(enabled=!unavailable){onSelect(color)},contentAlignment=Alignment.Center){if(unavailable)Text("×",color=p.red,fontWeight=FontWeight.Black,fontSize=20.sp)}
            }
        }
        Spacer(Modifier.height(7.dp))
    }
}

@Composable private fun V600GroupIconGrid(selected:String,p:Palette,onSelect:(String)->Unit){
    v600GroupIcons.chunked(4).forEach{row->
        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(8.dp)){
            row.forEach{choice->
                val active=choice==selected
                Box(Modifier.weight(1f).height(46.dp).clip(RoundedCornerShape(9.dp)).background(if(active)p.gold.copy(alpha=.30f) else p.panel).border(if(active)3.dp else 1.dp,if(active)p.gold else p.outline,RoundedCornerShape(9.dp)).clickable{onSelect(choice)},contentAlignment=Alignment.Center){
                    Text(choice,fontSize=25.sp,color=readableOn(if(active)p.gold.copy(alpha=.30f) else p.panel))
                }
            }
        }
        Spacer(Modifier.height(8.dp))
    }
}

@Composable private fun V600GroupAndProfileScreen(account:V600Account,memberships:List<GroupMembership>,groups:Map<String,GroupSummary>,members:List<GroupMembership>,requests:List<V600JoinRequest>,myRequests:List<V600JoinRequest>,p:Palette,repo:V600Repository,onBack:()->Unit,onSignOut:()->Unit){
    val activeMembership=memberships.firstOrNull{it.groupId==account.activeGroupId}
    val activeGroup=groups[account.activeGroupId]
    val canManage=activeMembership?.parsedRole in setOf(GroupRole.SUPER_BOSS,GroupRole.BOSS)
    var showCreate by remember{mutableStateOf(false)}
    var showJoin by remember{mutableStateOf(false)}
    var editProfile by remember{mutableStateOf(false)}
    var editGroup by remember{mutableStateOf(false)}
    var confirmSignOut by remember{mutableStateOf(false)}
    var leaveTarget by remember{mutableStateOf<GroupMembership?>(null)}
    var message by remember{mutableStateOf("")}
    val context=LocalContext.current
    Column(Modifier.fillMaxSize().padding(14.dp)){
        PageHeader(tr("MIN PROFIL & GRUPP","MY PROFILE & GROUP"),p,onBack)
        Spacer(Modifier.height(10.dp))
        LazyColumn(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(10.dp)){
            item{
                Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(13.dp)).background(p.paper).border(2.dp,p.outline,RoundedCornerShape(13.dp)).padding(13.dp),verticalAlignment=Alignment.CenterVertically){
                    val ownColor=activeMembership?.color?:0xFFFFC928L
                    Box(Modifier.size(48.dp).clip(CircleShape).background(Color(ownColor)).border(2.dp,p.gold,CircleShape),contentAlignment=Alignment.Center){Text(account.displayName.take(1).uppercase(),fontWeight=FontWeight.Black,fontSize=21.sp,color=readableOn(Color(ownColor)))}
                    Spacer(Modifier.width(11.dp));Column(Modifier.weight(1f)){Text(account.displayName,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=21.sp,color=p.text,maxLines=1,overflow=TextOverflow.Ellipsis);Text(tr("MIN PROFIL","MY PROFILE"),fontSize=10.sp,fontWeight=FontWeight.Bold,color=p.muted);if(account.globalTitle.isNotBlank())Text(account.globalTitle,fontSize=11.sp,color=if(account.titleColor!=0L)Color(account.titleColor) else p.gold)}
                    EditButton({editProfile=true},p)
                }
            }
            items(myRequests.filter{it.status=="color_pending"},key={"color_${it.groupId}"}){request->
                ApprovedJoinColorCard(account,request,groups[request.groupId],p,repo){ok->message=if(ok)tr("Du är nu medlem i gruppen!","You are now a group member!") else tr("Färgen hann bli upptagen. Välj en annan.","That color was just taken. Choose another.")}
            }
            if(activeGroup!=null&&activeMembership!=null){
                item{
                    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(13.dp)).background(p.panel).border(2.dp,p.outline,RoundedCornerShape(13.dp)).padding(13.dp)){
                        Row(verticalAlignment=Alignment.CenterVertically){
                            Box(Modifier.size(48.dp).clip(RoundedCornerShape(11.dp)).background(Color(activeGroup.color)).border(1.dp,p.outline,RoundedCornerShape(11.dp)),contentAlignment=Alignment.Center){Text(activeGroup.iconId,fontSize=25.sp,color=readableOn(Color(activeGroup.color)))}
                            Spacer(Modifier.width(11.dp));Column(Modifier.weight(1f)){Text(activeGroup.name,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=21.sp,color=readableOn(p.panel),maxLines=1,overflow=TextOverflow.Ellipsis);Text(when(activeMembership.parsedRole){GroupRole.SUPER_BOSS->tr("SUPERBOSS","SUPER BOSS");GroupRole.BOSS->"BOSS";GroupRole.MEMBER->tr("MEDLEM","MEMBER")},fontSize=10.sp,fontWeight=FontWeight.Black,color=readableOn(p.panel).copy(alpha=.72f))}
                            if(canManage)EditButton({editGroup=true},p)
                        }
                        if(activeMembership.parsedRole==GroupRole.SUPER_BOSS&&activeGroup.joinCode.isNotBlank()){
                            Spacer(Modifier.height(9.dp));Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(p.paper).clickable{val cm=context.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager;cm.setPrimaryClip(android.content.ClipData.newPlainText("Bubbsun group",activeGroup.joinCode));message=tr("Gruppkoden kopierades.","Group code copied.")}.padding(10.dp),verticalAlignment=Alignment.CenterVertically){Text(activeGroup.joinCode,fontFamily=FontFamily.Monospace,fontWeight=FontWeight.Black,color=p.text,modifier=Modifier.weight(1f));Text("⧉",color=p.text,fontSize=19.sp)}
                        }
                    }
                }
                if(requests.isNotEmpty()&&canManage){
                    item{Text("${tr("VÄNTAR PÅ GODKÄNNANDE","WAITING FOR APPROVAL")} (${requests.size})",color=p.pageText,fontWeight=FontWeight.Black)}
                    items(requests,key={it.uid}){request->
                        Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(p.paper).border(1.dp,p.outline,RoundedCornerShape(10.dp)).padding(10.dp),verticalAlignment=Alignment.CenterVertically){Box(Modifier.size(35.dp).clip(CircleShape).background(p.panel).border(1.dp,p.outline,CircleShape),contentAlignment=Alignment.Center){Text(request.displayName.take(1).uppercase(),fontWeight=FontWeight.Black,color=readableOn(p.panel))};Spacer(Modifier.width(9.dp));Column(Modifier.weight(1f)){Text(request.displayName,color=p.text,fontWeight=FontWeight.Black,maxLines=1,overflow=TextOverflow.Ellipsis);Text(tr("Väntar på ditt godkännande","Waiting for your approval"),color=p.muted,fontSize=10.sp)};Text("✓",color=p.green,fontSize=24.sp,modifier=Modifier.clickable{repo.approveJoin(activeGroup.id,request,activeMembership){ok->message=if(ok)tr("Godkänd – medlemmen ska nu välja färg.","Approved – the member can now choose a color.") else tr("Kunde inte godkänna.","Could not approve.")}}.padding(7.dp))}
                    }
                }
                item{Text(tr("GRUPPMEDLEMMAR","GROUP MEMBERS"),color=p.pageText,fontWeight=FontWeight.Black)}
                items(members,key={it.uid}){member->
                    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(p.paper).border(1.dp,p.outline,RoundedCornerShape(10.dp)).padding(11.dp),verticalAlignment=Alignment.CenterVertically){
                        Box(Modifier.size(39.dp).clip(CircleShape).background(Color(member.color)).border(1.dp,p.outline,CircleShape));Spacer(Modifier.width(10.dp));Column(Modifier.weight(1f)){Text(member.displayName,color=p.text,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=18.sp,maxLines=1,overflow=TextOverflow.Ellipsis);Text(when(member.parsedRole){GroupRole.SUPER_BOSS->tr("SUPERBOSS","SUPER BOSS");GroupRole.BOSS->"BOSS";GroupRole.MEMBER->tr("MEDLEM","MEMBER")},fontSize=10.sp,color=p.muted)}
                        if(canManage&&member.uid!=account.uid&&member.parsedRole!=GroupRole.SUPER_BOSS){
                            val isBoss=member.parsedRole==GroupRole.BOSS
                            Box(Modifier.width(if(isBoss)82.dp else 94.dp).height(34.dp).clip(RoundedCornerShape(8.dp)).background(p.gold.copy(alpha=.18f)).border(1.dp,p.gold,RoundedCornerShape(8.dp)).clickable{repo.setGroupRole(activeGroup.id,member,if(isBoss)GroupRole.MEMBER else GroupRole.BOSS){}},contentAlignment=Alignment.Center){
                                Text(if(isBoss)tr("TA BORT BOSS","REMOVE BOSS") else tr("★ GÖR TILL BOSS","★ MAKE BOSS"),color=p.text,fontWeight=FontWeight.Black,fontSize=if(isBoss)7.sp else 7.5.sp,maxLines=1)
                            }
                            Text("×",color=p.red,fontWeight=FontWeight.Black,fontSize=23.sp,modifier=Modifier.clickable{repo.removeMember(activeGroup.id,member){}}.padding(start=8.dp,end=3.dp,top=6.dp,bottom=6.dp))
                        }
                    }
                }
                if(activeMembership.parsedRole!=GroupRole.SUPER_BOSS)item{RetroButton(tr("LÄMNA GRUPPEN","LEAVE GROUP"),{leaveTarget=activeMembership},p,danger=true,modifier=Modifier.fillMaxWidth())}
            }else item{Text(tr("Du har ingen aktiv grupp ännu.","You do not have an active group yet."),color=p.pageText,fontWeight=FontWeight.Bold)}
            item{Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(8.dp)){RetroButton(tr("SKAPA GRUPP","CREATE GROUP"),{showCreate=true},p,modifier=Modifier.weight(1f));RetroButton(tr("GÅ MED","JOIN"),{showJoin=true},p,modifier=Modifier.weight(1f))}}
            if(message.isNotBlank())item{Text(message,color=p.green,fontWeight=FontWeight.Bold)}
            item{RetroButton(tr("LOGGA UT","SIGN OUT"),{confirmSignOut=true},p,danger=true,modifier=Modifier.fillMaxWidth())}
        }
    }
    if(editProfile){
        var name by remember{mutableStateOf(account.displayName)}
        var selectedColor by remember(activeMembership?.color){mutableLongStateOf(activeMembership?.color?:userColors.first())}
        var busy by remember{mutableStateOf(false)}
        var error by remember{mutableStateOf("")}
        val blockedColors=members.filter{it.uid!=account.uid}.map{it.color}.toSet()
        AlertDialog(
            onDismissRequest={if(!busy)editProfile=false},containerColor=popupColor(p.paper),
            title={Text(tr("MIN PROFIL","MY PROFILE"),color=p.text,fontWeight=FontWeight.Black)},
            text={Column{
                RetroField(name,{name=it.take(35)},tr("Namn","Name"),Modifier.fillMaxWidth(),p)
                if(activeMembership!=null){
                    Spacer(Modifier.height(12.dp));Text(tr("DIN FÄRG I GRUPPEN","YOUR COLOR IN THE GROUP"),color=p.text,fontWeight=FontWeight.Black,fontSize=11.sp)
                    Text(tr("Upptagna färger är överkryssade.","Colors already used in this group are crossed out."),color=p.muted,fontSize=10.sp,modifier=Modifier.padding(vertical=6.dp))
                    V600ColorGrid(userColors,selectedColor,p,blockedColors){selectedColor=it}
                }
                if(error.isNotBlank())Text(error,color=p.red,fontSize=11.sp)
            }},
            confirmButton={RetroButton(if(busy)tr("SPARAR…","SAVING…") else tr("SPARA","SAVE"),{
                if(name.isBlank()||busy)return@RetroButton
                busy=true;error=""
                repo.updateDisplayName(account.uid,name,memberships){nameOk->
                    if(!nameOk){busy=false;error=tr("Kunde inte spara namnet.","Could not save the name.")}
                    else if(activeMembership!=null&&selectedColor!=activeMembership.color){
                        repo.setMembershipColor(activeMembership.groupId,activeMembership,selectedColor){colorOk->busy=false;if(colorOk)editProfile=false else error=tr("Färgen hann bli upptagen. Välj en annan.","That color was just taken. Choose another.")}
                    }else{busy=false;editProfile=false}
                }
            },p)},
            dismissButton={RetroButton(tr("AVBRYT","CANCEL"),{if(!busy)editProfile=false},p,danger=true)}
        )
    }
    if(editGroup&&activeGroup!=null){var name by remember{mutableStateOf(activeGroup.name)};var icon by remember{mutableStateOf(activeGroup.iconId)};var color by remember{mutableStateOf(activeGroup.color)};AlertDialog(onDismissRequest={editGroup=false},containerColor=popupColor(p.paper),title={Text(tr("REDIGERA GRUPP","EDIT GROUP"),color=p.text,fontWeight=FontWeight.Black)},text={Column(Modifier.verticalScroll(rememberScrollState())){RetroField(name,{name=it.take(40)},tr("Gruppnamn","Group name"),Modifier.fillMaxWidth(),p);Spacer(Modifier.height(10.dp));Text(tr("GRUPPIKON","GROUP ICON"),color=p.text,fontWeight=FontWeight.Black);V600GroupIconGrid(icon,p){icon=it};Spacer(Modifier.height(3.dp));Text(tr("GRUPPFÄRG","GROUP COLOR"),color=p.text,fontWeight=FontWeight.Black);V600ColorGrid(v600GroupColors,color,p,onSelect={color=it})}},confirmButton={RetroButton(tr("SPARA","SAVE"),{if(name.isNotBlank())repo.updateGroupIdentity(activeGroup.id,name,icon,color){ok->if(ok){editGroup=false;message=tr("Gruppen uppdaterades.","Group updated.")}else message=tr("Kunde inte spara gruppen. Firebase-reglerna kan behöva uppdateras.","Could not save the group. Firebase rules may need updating.")}},p)},dismissButton={RetroButton(tr("AVBRYT","CANCEL"),{editGroup=false},p,danger=true)})}
    if(showCreate){var name by remember{mutableStateOf(tr("Familjen ${account.displayName.substringBefore(" ")}","The ${account.displayName.substringBefore(" ")} family"))};var icon by remember{mutableStateOf(v600GroupIcons.first())};var groupColor by remember{mutableStateOf(v600GroupColors.first())};var memberColor by remember{mutableStateOf(userColors.first())};var busy by remember{mutableStateOf(false)};AlertDialog(onDismissRequest={if(!busy)showCreate=false},containerColor=popupColor(p.paper),title={Text(tr("SKAPA GRUPP","CREATE GROUP"),color=p.text,fontWeight=FontWeight.Black)},text={Column(Modifier.verticalScroll(rememberScrollState())){RetroField(name,{name=it.take(40)},tr("Gruppnamn","Group name"),Modifier.fillMaxWidth(),p);Spacer(Modifier.height(9.dp));Text(tr("GRUPPIKON","GROUP ICON"),color=p.text,fontWeight=FontWeight.Black);V600GroupIconGrid(icon,p){icon=it};Spacer(Modifier.height(3.dp));Text(tr("GRUPPFÄRG","GROUP COLOR"),color=p.text,fontWeight=FontWeight.Black);V600ColorGrid(v600GroupColors,groupColor,p,onSelect={groupColor=it});Text(tr("DIN FÄRG I GRUPPEN","YOUR COLOR IN THE GROUP"),color=p.text,fontWeight=FontWeight.Black);V600ColorGrid(userColors,memberColor,p,onSelect={memberColor=it})}},confirmButton={RetroButton(if(busy)tr("SKAPAR…","CREATING…") else tr("SKAPA","CREATE"),{if(name.isNotBlank()&&!busy){busy=true;repo.createGroup(account,name,icon,groupColor,memberColor){result->busy=false;result.onSuccess{showCreate=false}.onFailure{message=tr("Kunde inte skapa gruppen.","Could not create group.")}}}},p)},dismissButton={RetroButton(tr("AVBRYT","CANCEL"),{showCreate=false},p,danger=true)})}
    if(showJoin){var code by remember{mutableStateOf("")};var busy by remember{mutableStateOf(false)};AlertDialog(onDismissRequest={if(!busy)showJoin=false},containerColor=popupColor(p.paper),title={Text(tr("GÅ MED I GRUPP","JOIN GROUP"),color=p.text,fontWeight=FontWeight.Black)},text={Column{RetroField(code,{code=it.uppercase().filter{c->c.isLetterOrDigit()||c=='-'}.take(9)},tr("GRUPPKOD","GROUP CODE"),Modifier.fillMaxWidth(),p);Spacer(Modifier.height(10.dp));Text(tr("Bossen godkänner först din ansökan. Därefter väljer du bland gruppens lediga färger.","A boss approves your request first. You then choose from the colors still available in the group."),color=p.muted,fontSize=12.sp,lineHeight=17.sp)}},confirmButton={RetroButton(if(busy)tr("SKICKAR…","SENDING…") else tr("SKICKA ANSÖKAN","SEND REQUEST"),{if(code.isNotBlank()&&!busy){busy=true;repo.requestJoin(account,code){result->busy=false;result.onSuccess{showJoin=false;message=tr("Ansökan är skickad. Färgen väljer du efter godkännandet.","Request sent. You choose a color after approval.")}.onFailure{message=tr("Gruppkoden kunde inte användas.","The group code could not be used.")}}}},p)},dismissButton={RetroButton(tr("AVBRYT","CANCEL"),{showJoin=false},p,danger=true)})}
    leaveTarget?.let{membership->ConfirmDialog(tr("Lämna gruppen?","Leave the group?"),tr("Du förlorar åtkomsten till gruppens listor.","You will lose access to the group's lists."),p,{leaveTarget=null},{repo.leaveGroup(account,membership){ok->if(ok)leaveTarget=null}},confirmLabel=tr("LÄMNA","LEAVE"))}
    if(confirmSignOut)ConfirmDialog(tr("LOGGA UT?","SIGN OUT?"),tr("Dina molnsparade listor finns kvar och visas igen nästa gång du loggar in.","Your cloud lists remain and will appear the next time you sign in."),p,{confirmSignOut=false},{confirmSignOut=false;onSignOut()},confirmLabel=tr("LOGGA UT","SIGN OUT"))
}

@Composable private fun ApprovedJoinColorCard(account:V600Account,request:V600JoinRequest,group:GroupSummary?,p:Palette,repo:V600Repository,onResult:(Boolean)->Unit){
    var groupMembers by remember(request.groupId){mutableStateOf<List<GroupMembership>>(emptyList())}
    var groupInfo by remember(request.groupId){mutableStateOf(group)}
    var selected by remember(request.groupId){mutableStateOf(0L)}
    var busy by remember{mutableStateOf(false)}
    DisposableEffect(request.groupId){val membersReg=repo.listenGroupMembers(request.groupId){groupMembers=it;if(selected in it.map{m->m.color})selected=0L};val groupReg=repo.listenGroup(request.groupId){groupInfo=it};onDispose{membersReg.remove();groupReg.remove()}}
    val blocked=groupMembers.map{it.color}.toSet()
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(13.dp)).background(p.paper).border(2.dp,p.gold,RoundedCornerShape(13.dp)).padding(13.dp)){
        Text(tr("ANSÖKAN GODKÄND!","REQUEST APPROVED!"),color=p.green,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=18.sp)
        Text(groupInfo?.name?:tr("Välj din färg för gruppen","Choose your group color"),color=p.text,fontWeight=FontWeight.Bold,modifier=Modifier.padding(top=3.dp))
        Text(tr("Upptagna färger är nedtonade och låsta. Medlemskapet aktiveras först när du valt en ledig färg.","Taken colors are dimmed and locked. Your membership activates only after choosing an available color."),color=p.muted,fontSize=11.sp,lineHeight=16.sp,modifier=Modifier.padding(vertical=8.dp))
        V600ColorGrid(userColors,selected,p,blocked){selected=it}
        RetroButton(if(busy)tr("SPARAR…","SAVING…") else tr("VÄLJ FÄRG & GÅ MED","CHOOSE COLOR & JOIN"),{if(selected!=0L&&!busy){busy=true;repo.chooseApprovedJoinColor(account,request,selected){ok->busy=false;onResult(ok)}}},p,modifier=Modifier.fillMaxWidth())
    }
}

@Composable private fun TogetherUsersScreen(profile:CloudProfile,members:List<CloudProfile>,requests:List<JoinRequest>,groupName:String,joinCode:String,p:Palette,repo:TogetherRepository,onBack:()->Unit,onSignOut:()->Unit){
    var joinInput by remember{mutableStateOf("")};var busy by remember{mutableStateOf(false)};var message by remember{mutableStateOf("")};var editProfile by remember{mutableStateOf(false)};var editGroup by remember{mutableStateOf(false)};var transferTarget by remember{mutableStateOf<CloudProfile?>(null)};var confirmLeave by remember{mutableStateOf(false)};var confirmSignOut by remember{mutableStateOf(false)};val context=LocalContext.current
    Column(Modifier.fillMaxSize().padding(14.dp)){PageHeader(tr("ANVÄNDARE & GRUPP","USERS & GROUP"),p,onBack);Spacer(Modifier.height(10.dp))
        LazyColumn(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(9.dp)){
            item{Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(p.paper).border(2.dp,p.gold,RoundedCornerShape(12.dp)).padding(14.dp)){
                Row(verticalAlignment=Alignment.CenterVertically){Box(Modifier.size(48.dp).clip(CircleShape).background(Color(profile.color)).border(2.dp,p.outline,CircleShape),contentAlignment=Alignment.Center){Text(profile.name.take(1).uppercase(),fontWeight=FontWeight.Black,fontSize=20.sp,color=readableOn(Color(profile.color)))};Spacer(Modifier.width(11.dp));Column(Modifier.weight(1f)){Text(profile.name,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=21.sp,color=p.text);Text(if(profile.role=="owner")tr("👑 STORBOSS","👑 OWNER") else if(profile.role=="admin")tr("★ BOSS","★ ADMIN") else tr("MEDLEM","MEMBER"),color=p.muted,fontWeight=FontWeight.Bold)};EditButton({editProfile=true},p)}
            }}
            if(profile.groupId.isBlank()){
                item{Text(tr("Du tillhör ingen grupp ännu.","You are not in a group yet."),color=p.pageText,fontWeight=FontWeight.Bold)}
                item{RetroButton(tr("SKAPA NY GRUPP","CREATE NEW GROUP"),{busy=true;repo.createGroup(profile){ok->busy=false;message=if(ok)tr("Gruppen skapades!","Group created!") else tr("Kunde inte skapa gruppen.","Could not create group.")}},p,modifier=Modifier.fillMaxWidth())}
                item{Text(tr("ELLER GÅ MED MED KOD","OR JOIN WITH A CODE"),color=p.pageText,fontWeight=FontWeight.Black)}
                item{RetroField(joinInput,{joinInput=it.uppercase().take(9)},tr("BUBB-XXXX","BUBB-XXXX"),Modifier.fillMaxWidth(),p)}
                item{RetroButton(tr("SKICKA ANSÖKAN","SEND REQUEST"),{busy=true;repo.requestJoin(joinInput,profile){ok->busy=false;message=if(ok)tr("Ansökan är skickad.","Request sent.") else tr("Koden hittades inte.","Code not found.")}},p,modifier=Modifier.fillMaxWidth())}
            }else{
                item{Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(p.panel).border(1.dp,p.outline,RoundedCornerShape(12.dp)).padding(14.dp)){
                    Row(verticalAlignment=Alignment.CenterVertically){Column(Modifier.weight(1f)){Text(groupName,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=21.sp,color=readableOn(p.panel));Text(tr("GRUPPNAMN","GROUP NAME"),fontSize=10.sp,color=readableOn(p.panel).copy(alpha=.7f))};if(profile.role in setOf("owner","admin"))EditButton({editGroup=true},p)}
                    Spacer(Modifier.height(9.dp));Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(p.paper).clickable{val cm=context.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager;cm.setPrimaryClip(android.content.ClipData.newPlainText("Bubbsun",joinCode));message=tr("Koden kopierades.","Code copied.")}.padding(11.dp)){Text(joinCode,fontFamily=FontFamily.Monospace,fontWeight=FontWeight.Black,color=p.text,modifier=Modifier.weight(1f));Text("⧉",color=p.text)}
                }}
                if(requests.isNotEmpty()&&profile.role in setOf("owner","admin"))item{Text("${tr("VÄNTAR PÅ GODKÄNNANDE","WAITING FOR APPROVAL")} (${requests.size})",color=p.pageText,fontWeight=FontWeight.Black)}
                if(profile.role in setOf("owner","admin"))items(requests,key={it.uid}){r->Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(p.paper).border(1.dp,p.outline,RoundedCornerShape(10.dp)).padding(11.dp),verticalAlignment=Alignment.CenterVertically){Box(Modifier.size(34.dp).clip(CircleShape).background(Color(r.color)));Spacer(Modifier.width(9.dp));Text(r.name,color=p.text,fontWeight=FontWeight.Black,modifier=Modifier.weight(1f));Text("✓",color=p.green,fontSize=24.sp,modifier=Modifier.clickable{repo.approve(profile.groupId,r,members){}}.padding(7.dp));Text("✕",color=p.red,fontSize=22.sp,modifier=Modifier.clickable{repo.deny(profile.groupId,r.uid)}.padding(7.dp))}}
                item{Text(tr("FAMILJEMEDLEMMAR","FAMILY MEMBERS"),color=p.pageText,fontWeight=FontWeight.Black)}
                items(members.sortedWith(compareBy<CloudProfile>{if(it.role=="owner")0 else if(it.role=="admin")1 else 2}.thenBy{it.name}),key={it.uid}){m->
                    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(p.paper).border(1.dp,p.outline,RoundedCornerShape(10.dp)).padding(12.dp),verticalAlignment=Alignment.CenterVertically){Box(Modifier.size(39.dp).clip(CircleShape).background(Color(m.color)).border(1.dp,p.outline,CircleShape));Spacer(Modifier.width(10.dp));Column(Modifier.weight(1f)){Text(m.name,color=p.text,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=18.sp);Text(if(m.role=="owner")tr("👑 STORBOSS","👑 OWNER") else if(m.role=="admin")tr("★ BOSS","★ ADMIN") else tr("MEDLEM","MEMBER"),fontSize=10.sp,color=p.muted)}
                        if(profile.role=="owner"&&m.uid!=profile.uid){Text(if(m.role=="admin")"−★" else "+★",color=p.gold,fontWeight=FontWeight.Black,fontSize=18.sp,modifier=Modifier.clickable{repo.setRole(profile.groupId,m.uid,if(m.role=="admin")"member" else "admin")}.padding(8.dp))}
                        if(profile.role=="owner"&&m.uid!=profile.uid)Text("👑",fontSize=17.sp,modifier=Modifier.clickable{transferTarget=m}.padding(7.dp))
                        if(profile.role in setOf("owner","admin")&&m.uid!=profile.uid&&m.role!="owner")Text("✕",color=p.red,fontWeight=FontWeight.Black,fontSize=20.sp,modifier=Modifier.clickable{repo.removeMember(profile.groupId,m.uid)}.padding(8.dp))
                    }
                }
                if(profile.role!="owner")item{RetroButton(tr("LÄMNA GRUPPEN","LEAVE GROUP"),{confirmLeave=true},p,danger=true,modifier=Modifier.fillMaxWidth())}
                else item{Text(tr("Som storboss måste du överföra kronan innan du kan lämna gruppen.","As owner, transfer the crown before leaving the group."),color=p.pageMuted,fontSize=12.sp)}
            }
            if(message.isNotBlank())item{Text(message,color=if(message.contains("inte")||message.contains("not"))p.red else p.green,fontWeight=FontWeight.Bold)}
            item{Spacer(Modifier.height(10.dp));RetroButton(tr("LOGGA UT","SIGN OUT"),{confirmSignOut=true},p,danger=true,modifier=Modifier.fillMaxWidth())}
        }
    }
    if(editProfile){var n by remember{mutableStateOf(profile.name)};var c by remember{mutableStateOf(profile.color)};AlertDialog(onDismissRequest={editProfile=false},containerColor=p.paper,title={Text(tr("MIN PROFIL","MY PROFILE"),color=p.text,fontWeight=FontWeight.Black)},text={Column{RetroField(n,{n=it.take(35)},tr("Namn","Name"),Modifier.fillMaxWidth(),p);Spacer(Modifier.height(10.dp));UserColorGrid(c,p,true){color->if(members.none{it.uid!=profile.uid&&it.color==color})c=color}}},confirmButton={RetroButton(tr("SPARA","SAVE"),{if(n.isNotBlank()&&members.none{it.uid!=profile.uid&&it.name.equals(n,true)}){repo.updateOwn(profile,n,c);editProfile=false}},p)},dismissButton={RetroButton(tr("AVBRYT","CANCEL"),{editProfile=false},p,danger=true)})}
    if(editGroup){var n by remember{mutableStateOf(groupName)};AlertDialog(onDismissRequest={editGroup=false},containerColor=p.paper,title={Text(tr("GRUPPNAMN","GROUP NAME"),color=p.text,fontWeight=FontWeight.Black)},text={RetroField(n,{n=it.take(40)},tr("Gruppnamn","Group name"),Modifier.fillMaxWidth(),p)},confirmButton={RetroButton(tr("SPARA","SAVE"),{if(n.isNotBlank()){repo.updateGroupName(profile.groupId,n);editGroup=false}},p)},dismissButton={RetroButton(tr("AVBRYT","CANCEL"),{editGroup=false},p,danger=true)})}
    transferTarget?.let{target->ConfirmDialog(tr("Göra ${target.name} till storboss?","Make ${target.name} the owner?"),tr("Du blir boss och kan inte ångra detta utan den nya storbossens hjälp.","You will become an admin and cannot undo this without the new owner's help."),p,{transferTarget=null},{repo.transferOwner(profile,target){ };transferTarget=null},confirmLabel=tr("ÖVERFÖR KRONAN","TRANSFER CROWN"))}
    if(confirmLeave)ConfirmDialog(tr("Lämna gruppen?","Leave the group?"),tr("Du förlorar åtkomsten till gruppens listor.","You will lose access to the group's lists."),p,{confirmLeave=false},{repo.leaveGroup(profile){};confirmLeave=false},confirmLabel=tr("LÄMNA","LEAVE"))
    if(confirmSignOut)ConfirmDialog(tr("Logga ut?","Sign out?"),tr("Dina molnlistor och din familjegrupp finns kvar.","Your cloud lists and family group will remain."),p,{confirmSignOut=false},{confirmSignOut=false;onSignOut()},confirmLabel=tr("BEKRÄFTA","CONFIRM"))
}

@Composable private fun UsersScreen(users:SnapshotStateList<UserProfile>,lists:List<ShoppingListData>,events:SnapshotStateList<StatEvent>,activeId:String,p:Palette,supporterEnabled:Boolean,onSupporterInfo:()->Unit,onBack:()->Unit,onActivate:(String)->Unit,onSave:()->Unit){
    var showAdd by remember{mutableStateOf(false)}
    var editTarget by remember{mutableStateOf<UserProfile?>(null)}
    var deleteTarget by remember{mutableStateOf<UserProfile?>(null)}
    Column(Modifier.fillMaxSize().padding(14.dp)){
        PageHeader(tr("ANVÄNDARE","USERS"),p,onBack);Spacer(Modifier.height(12.dp))
        LazyColumn(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(10.dp)){
            items(users,key={it.id}){u->
                Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(p.paper).border(if(u.id==activeId)3.dp else 2.dp,if(u.id==activeId)p.gold else p.outline,RoundedCornerShape(12.dp)).clickable{onActivate(u.id)}.padding(14.dp),verticalAlignment=Alignment.CenterVertically){
                    Box(Modifier.size(38.dp).clip(CircleShape).background(Color(u.colorHex)).border(1.dp,p.outline,CircleShape))
                    Spacer(Modifier.width(13.dp))
                    Column(Modifier.weight(1f)){Text(u.name,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=when{u.name.length<=18->23.sp;u.name.length<=28->19.sp;else->16.sp},maxLines=2,overflow=TextOverflow.Ellipsis,color=p.text);if(u.id==activeId)Text(tr("Aktiv användare","Active user"),color=p.muted,fontSize=14.sp)}
                    RetroButton("✎",{editTarget=u},p,compact=true)
                    if(users.size>1){Spacer(Modifier.width(7.dp));DeleteButton({deleteTarget=u},p)}
                }
            }
        }
        RetroButton(tr("＋  LÄGG TILL ANVÄNDARE","＋  ADD USER"),{showAdd=true},p,modifier=Modifier.fillMaxWidth())
    }
    if(showAdd)AddUserDialog(users,p,supporterEnabled,onSupporterInfo,{showAdd=false},{n,c->users.add(UserProfile(name=capitalized(n),colorHex=c));showAdd=false;onSave()})
    editTarget?.let{u->EditUserDialog(u,users,p,supporterEnabled,onSupporterInfo,{editTarget=null}){newName,newColor->val i=users.indexOf(u);if(i>=0)users[i]=u.copy(name=newName,colorHex=newColor);editTarget=null;onSave()}}
    deleteTarget?.let{u->ConfirmDialog(tr("Ta bort ${u.name}?","Delete ${u.name}?"),tr("Användaren tas bort. Varor och statistik flyttas till en kvarvarande användare.","The user will be deleted. Items and statistics are moved to a remaining user."),p,{deleteTarget=null},{
        val replacement=users.first{it.id!=u.id}
        lists.forEach{list->list.items.filter{it.ownerId==u.id}.forEach{it.ownerId=replacement.id}}
        events.indices.filter{events[it].userId==u.id}.forEach{i->events[i]=events[i].copy(userId=replacement.id)}
        users.remove(u);deleteTarget=null;onSave()
    })}
}

@Composable private fun EditUserDialog(user:UserProfile,users:List<UserProfile>,p:Palette,supporterEnabled:Boolean,onSupporterInfo:()->Unit,onDismiss:()->Unit,onSave:(String,Long)->Unit){
    var name by remember{mutableStateOf(user.name)}
    var color by remember{mutableStateOf(user.colorHex)}
    var error by remember{mutableStateOf("")}
    AlertDialog(
        onDismissRequest=onDismiss,
        containerColor=popupColor(p.paper),
        title={Text(tr("REDIGERA ANVÄNDARE","EDIT USER"),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,color=p.text)},
        text={Column{
            RetroField(name,{name=it},tr("Namn","Name"),Modifier.fillMaxWidth(),p)
            Spacer(Modifier.height(12.dp))
            Text(tr("FÄRG","COLOR"),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,color=p.text,fontSize=14.sp)
            Spacer(Modifier.height(8.dp))
            UserColorGrid(color,p,supporterEnabled,onSupporterInfo){color=it}
            if(error.isNotBlank())Text(error,color=p.red)
        }},
        confirmButton={RetroButton(tr("SPARA","SAVE"),{val n=capitalized(name);error=when{n.isBlank()->tr("Skriv ett namn","Enter a name");users.any{it.id!=user.id&&it.name.equals(n,true)}->tr("Namnet finns redan","That name already exists");else->""};if(error.isBlank())onSave(n,color)},p)},
        dismissButton={RetroButton(tr("AVBRYT","CANCEL"),onDismiss,p,danger=true)}
    )
}

@Composable private fun AddUserDialog(users:List<UserProfile>,p:Palette,supporterEnabled:Boolean,onSupporterInfo:()->Unit,onDismiss:()->Unit,onAdd:(String,Long)->Unit){var name by remember{mutableStateOf("")};var color by remember{mutableStateOf(userColors.first())};var error by remember{mutableStateOf("")};AlertDialog(onDismissRequest=onDismiss,containerColor=popupColor(p.paper),title={Text(tr("LÄGG TILL ANVÄNDARE","ADD USER"),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,color=p.text)},text={Column{RetroField(name,{name=it},tr("Namn","Name"),Modifier.fillMaxWidth(),p);Spacer(Modifier.height(12.dp));UserColorGrid(color,p,supporterEnabled,onSupporterInfo){color=it};if(error.isNotBlank())Text(error,color=p.red)}},confirmButton={RetroButton(tr("SPARA","SAVE"),{val n=capitalized(name);error=when{n.isBlank()->tr("Skriv ett namn","Enter a name");users.any{it.name.equals(n,true)}->tr("Namnet finns redan","That name already exists");else->""};if(error.isBlank())onAdd(n,color)},p)},dismissButton={RetroButton(tr("AVBRYT","CANCEL"),onDismiss,p,danger=true)})}

@Composable private fun SettingsScreen(p:Palette,language:String,updateChecks:Boolean,exitConfirmation:Boolean,supporterPreview:Boolean,supporterStyle:String,supporterGlow:Boolean,startAtSupporter:Boolean,updateStatus:String,onSupporterInfo:()->Unit,onBack:()->Unit,onCheckNow:()->Unit,onUpdateChecks:(Boolean)->Unit,onLanguage:(String)->Unit,onExitConfirmation:(Boolean)->Unit,onSupporterPreview:(Boolean)->Unit,onSupporterStyle:(String)->Unit,onSupporterGlow:(Boolean)->Unit,onResetStats:()->Unit){
    val context=LocalContext.current
    var notificationRefresh by remember{mutableIntStateOf(0)}
    var reset by remember{mutableStateOf(false)}
    var languagesExpanded by remember{mutableStateOf(false)}
    val scroll=rememberScrollState()
    LaunchedEffect(startAtSupporter,supporterPreview){if(startAtSupporter&&supporterPreview){delay(220);scroll.animateScrollTo((scroll.maxValue*.72f).toInt())}}
    Column(Modifier.fillMaxSize().verticalScroll(scroll).padding(14.dp)){
        PageHeader(tr("INSTÄLLNINGAR","SETTINGS"),p,onBack)
        Spacer(Modifier.height(14.dp))
        Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(p.panel).border(2.dp,p.gold,RoundedCornerShape(12.dp)).clickable{onSupporterInfo()}.padding(13.dp),verticalAlignment=Alignment.CenterVertically){Image(painterResource(R.drawable.theme_heart),null,Modifier.size(42.dp));Spacer(Modifier.width(11.dp));Column(Modifier.weight(1f)){Text("♥ SUPPORTER",color=readableOn(p.panel),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=19.sp);Text(tr("Teman, titlar, glow och supporterförmåner","Themes, titles, glow and supporter benefits"),color=readableOn(p.panel).copy(alpha=.72f),fontSize=11.sp)};Text("›",color=p.gold,fontSize=30.sp)}
        Spacer(Modifier.height(12.dp))
        SettingsCard(R.drawable.about_info,tr("UPPDATERINGAR","UPDATES"),p){
            RetroButton(tr("SÖK EFTER UPPDATERING NU","CHECK FOR UPDATE NOW"),onCheckNow,p,modifier=Modifier.fillMaxWidth())
            if(updateStatus.isNotBlank()){Spacer(Modifier.height(5.dp));Text(updateStatus,color=if(updateStatus.contains("senaste")||updateStatus.contains("latest"))p.green else p.muted,fontSize=12.sp,fontWeight=FontWeight.Bold)}
            Spacer(Modifier.height(6.dp))
            Row(Modifier.fillMaxWidth().clickable{onUpdateChecks(!updateChecks)},verticalAlignment=Alignment.CenterVertically){
                Checkbox(updateChecks,onUpdateChecks,colors=CheckboxDefaults.colors(checkedColor=p.green,uncheckedColor=p.green,checkmarkColor=Color.White))
                Column(Modifier.weight(1f)){
                    Text(tr("Sök efter nya versioner","Check for new versions"),color=p.text,fontWeight=FontWeight.Bold)
                    Text(tr("Kontrolleras i bakgrunden vid uppstart.","Checked in the background at startup."),color=p.muted,fontSize=12.sp)
                }
            }
        }
        Spacer(Modifier.height(12.dp))
        SettingsCard(R.drawable.list_checklist,tr("FÖLJNOTISER","FOLLOW NOTIFICATIONS"),p){
            val lastCheck=remember(notificationRefresh){FollowNotificationScheduler.lastCheck(context)}
            Text(if(lastCheck>0)"${tr("Senast kontrollerad","Last checked")}: ${SimpleDateFormat("yyyy-MM-dd HH:mm",Locale.getDefault()).format(java.util.Date(lastCheck))}" else tr("Ingen bakgrundskontroll har körts ännu.","No background check has run yet."),color=p.muted,fontSize=11.sp)
            Spacer(Modifier.height(7.dp));RetroButton(tr("SKICKA TESTNOTIS","SEND TEST NOTIFICATION"),{FollowNotificationScheduler.showTestNotification(context);notificationRefresh++},p,modifier=Modifier.fillMaxWidth())
            Spacer(Modifier.height(5.dp));Text(tr("Android kan fördröja femminuterskontrollen för att spara batteri.","Android may delay the five-minute check to save battery."),color=p.muted,fontSize=9.sp)
        }
        Spacer(Modifier.height(12.dp))
        SettingsCard(R.drawable.stats_checked,tr("BEKRÄFTELSER","CONFIRMATIONS"),p){
            Row(verticalAlignment=Alignment.CenterVertically){Checkbox(exitConfirmation,onExitConfirmation,colors=CheckboxDefaults.colors(checkedColor=p.green,uncheckedColor=p.green,checkmarkColor=Color.White));Text(tr("Visa 'Avsluta Bubbsun?'","Show 'Exit Bubbsun?'"),color=p.text,fontWeight=FontWeight.Bold)}
        }
        Spacer(Modifier.height(12.dp))
        SettingsCard(R.drawable.language_globe,"${tr("SPRÅK","LANGUAGE")}  •  ${if(languagesExpanded)tr("VISA FÄRRE ▲","SHOW LESS ▲") else tr("VISA ALLA ▼","SHOW ALL ▼")}",p,onHeader={languagesExpanded=!languagesExpanded}){
            Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(10.dp)){
                LanguageChoice("🇸🇪","Svenska",language=="sv",p,Modifier.weight(1f)){onLanguage("sv")}
                LanguageChoice("🇬🇧","English",language=="en",p,Modifier.weight(1f)){onLanguage("en")}
            }
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(10.dp)){
                LanguageChoice("🇫🇮","Suomi",language=="fi",p,Modifier.weight(1f)){onLanguage("fi")}
                LanguageChoice("🖖","Klingon",language=="tlh",p,Modifier.weight(1f),locked=!supporterPreview,onLocked=onSupporterInfo){onLanguage("tlh")}
            }
            if(languagesExpanded){
                Spacer(Modifier.height(8.dp));Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(10.dp)){LanguageChoice("🇮🇹","Italiano",language=="it",p,Modifier.weight(1f)){onLanguage("it")};LanguageChoice("🇪🇸","Español",language=="es",p,Modifier.weight(1f)){onLanguage("es")}}
                Spacer(Modifier.height(8.dp));Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(10.dp)){LanguageChoice("🇩🇪","Deutsch",language=="de",p,Modifier.weight(1f)){onLanguage("de")};LanguageChoice("🇫🇷","Français",language=="fr",p,Modifier.weight(1f)){onLanguage("fr")}}
                Spacer(Modifier.height(8.dp));Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(10.dp)){LanguageChoice("🇵🇱","Polski",language=="pl",p,Modifier.weight(1f)){onLanguage("pl")};LanguageChoice("🇳🇴","Norsk",language=="no",p,Modifier.weight(1f)){onLanguage("no")}}
            }
        }
        Spacer(Modifier.height(12.dp))
        SettingsCard(R.drawable.menu_stats,tr("STATISTIK","STATISTICS"),p){RetroButton(tr("NOLLSTÄLL STATISTIK","RESET STATISTICS"),{reset=true},p,danger=true,modifier=Modifier.fillMaxWidth())}
    }
    if(reset)ConfirmDialog(tr("Nollställ statistik?","Reset statistics?"),tr("Detta kan inte ångras. Listor och varor påverkas inte.","This cannot be undone. Lists and items are not affected."),p,{reset=false},{onResetStats();reset=false},confirmLabel=tr("NOLLSTÄLL","RESET"))
}

@Composable private fun SupporterSettingsScreen(p:Palette,enabled:Boolean,style:String,glow:Boolean,onBack:()->Unit,onPurchase:()->Unit,onStyle:(String)->Unit,onGlow:(Boolean)->Unit){
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(14.dp)){
        PageHeader("SUPPORTER",p,onBack)
        Spacer(Modifier.height(12.dp))
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(p.panel).border(2.dp,p.gold,RoundedCornerShape(12.dp)).padding(14.dp)){
            Text(if(enabled)"♥ FOUNDING SUPPORTER" else tr("♥ STÖD BUBBSUN","♥ SUPPORT BUBBSUN"),color=readableOn(p.panel),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=20.sp)
            Spacer(Modifier.height(5.dp));Text(if(enabled)tr("Tack för att du stöttar Bubbsun! Här samlas alla dina supporterinställningar.","Thank you for supporting Bubbsun! All supporter settings are collected here.") else tr("Se supporterfunktionerna och lås upp dem kostnadsfritt under förhandsperioden.","Preview supporter features and unlock them free during the preview period."),color=readableOn(p.panel).copy(alpha=.78f),fontSize=12.sp,lineHeight=17.sp)
            if(!enabled){Spacer(Modifier.height(10.dp));RetroButton(tr("AKTIVERA SUPPORTER GRATIS","ACTIVATE SUPPORTER FREE"),onPurchase,p,modifier=Modifier.fillMaxWidth())}
        }
        Spacer(Modifier.height(12.dp))
        Column(Modifier.fillMaxWidth().graphicsLayer{alpha=if(enabled)1f else .46f}.clip(RoundedCornerShape(12.dp)).background(p.paper).border(1.dp,p.outline,RoundedCornerShape(12.dp)).padding(13.dp)){
            Text(tr("TITEL VID LOGGAN","TITLE BY THE LOGO"),color=p.text,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=17.sp)
            Spacer(Modifier.height(5.dp));Text(tr("Välj supporter-dekoration vid Bubbsun-loggan.","Choose the supporter decoration by the Bubbsun logo."),color=p.muted,fontSize=12.sp);Spacer(Modifier.height(9.dp))
            SupporterStyleChoice("none",tr("Ingen","None"),"",style,p){if(enabled)onStyle(it)else onPurchase()}
            SupporterStyleChoice("classic","","♥  Lifetime Supporter",style,p){if(enabled)onStyle(it)else onPurchase()}
            SupporterStyleChoice("royal","","♛  LIFETIME SUPPORTER  ♛",style,p){if(enabled)onStyle(it)else onPurchase()}
            SupporterStyleChoice("ribbon","","✦  SUPPORTER  ✦",style,p){if(enabled)onStyle(it)else onPurchase()}
            SupporterStyleChoice("signature","","Lifetime Supporter  ♥",style,p){if(enabled)onStyle(it)else onPurchase()}
            SupporterStyleChoice("badge","","♥  FOUNDING SUPPORTER",style,p){if(enabled)onStyle(it)else onPurchase()}
            SupporterStyleChoice("cosmic","","✧  COSMIC SUPPORTER  ✧",style,p){if(enabled)onStyle(it)else onPurchase()}
            Spacer(Modifier.height(8.dp));Row(Modifier.fillMaxWidth().height(58.dp).clip(RoundedCornerShape(10.dp)).background(p.paper2).border(1.dp,p.outline,RoundedCornerShape(10.dp)).clickable{if(enabled)onGlow(!glow)else onPurchase()}.padding(horizontal=12.dp),verticalAlignment=Alignment.CenterVertically){Column(Modifier.weight(1f)){Text("Fancy Glow",color=p.text,fontWeight=FontWeight.Bold);Text(tr("Mjukt sken runt Bubbsun-loggan.","Soft glow around the Bubbsun logo."),color=p.muted,fontSize=12.sp)};Switch(glow,{if(enabled)onGlow(it)else onPurchase()},colors=SwitchDefaults.colors(checkedThumbColor=p.paper,checkedTrackColor=p.green,uncheckedThumbColor=p.muted,uncheckedTrackColor=p.paper2))}
        }
        Spacer(Modifier.height(12.dp));Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(p.panel).border(1.dp,p.outline,RoundedCornerShape(12.dp)).padding(13.dp)){Text(tr("DETTA INGÅR","WHAT'S INCLUDED"),color=readableOn(p.panel),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black);listOf(tr("Exklusiva teman: Kosmisk, Hjärtlig och Gothic Noir","Exclusive themes: Cosmic, Heartfelt and Gothic Noir"),tr("Supportertitlar och Fancy Glow","Supporter titles and Fancy Glow"),tr("Exklusiva ikoner och färger","Exclusive icons and colors"),tr("Klingon som appspråk","Klingon as an app language")).forEach{Text("♥  $it",color=readableOn(p.panel).copy(alpha=.82f),fontSize=12.sp,modifier=Modifier.padding(top=6.dp))}}
    }
}

@Composable private fun SupporterStyleChoice(id:String,label:String,preview:String,selected:String,p:Palette,onSelect:(String)->Unit){
    val isSelected=selected==id
    Box(Modifier.fillMaxWidth().height(44.dp).clip(RoundedCornerShape(10.dp)).background(if(isSelected)p.gold.copy(alpha=.17f) else p.paper2).border(if(isSelected)2.dp else 1.dp,if(isSelected)p.gold else p.outline,RoundedCornerShape(10.dp)).clickable{onSelect(id)}.padding(horizontal=12.dp),contentAlignment=Alignment.Center){
        Text(if(preview.isNotBlank())preview else label,color=if(id=="cosmic")Color(0xFF9F7AEA) else p.text,fontFamily=if(id=="signature")FontFamily.Cursive else FontFamily.Serif,fontSize=12.sp,fontWeight=FontWeight.Bold,maxLines=1)
        if(isSelected)SelectionBadge(p.gold,Modifier.align(Alignment.TopEnd).padding(top=7.dp,end=1.dp))
    }
    Spacer(Modifier.height(5.dp))
}

@Composable private fun CompactSupporterMark(style:String,p:Palette){
    when(style){
        "classic"->Text("♥  Lifetime Supporter  ♥",color=p.gold,fontFamily=FontFamily.Serif,fontSize=8.sp,fontWeight=FontWeight.Bold,maxLines=1)
        "royal"->Text("♛  LIFETIME SUPPORTER  ♛",color=p.gold,fontFamily=FontFamily.Serif,fontSize=7.sp,fontWeight=FontWeight.Black,letterSpacing=.7.sp,maxLines=1)
        "ribbon"->Text("✦  SUPPORTER  ✦",color=p.gold,fontFamily=FontFamily.Serif,fontSize=8.sp,fontWeight=FontWeight.Black,letterSpacing=.8.sp,maxLines=1)
        "signature"->Text("Lifetime Supporter  ♥",color=p.gold,fontFamily=FontFamily.Cursive,fontStyle=FontStyle.Italic,fontSize=10.sp,fontWeight=FontWeight.Bold,maxLines=1)
        "badge"->Text("♥  FOUNDING SUPPORTER",color=p.gold,fontFamily=FontFamily.Serif,fontSize=7.sp,fontWeight=FontWeight.Black,letterSpacing=.6.sp,maxLines=1)
        "cosmic"->Text("✧  COSMIC SUPPORTER  ✧",color=Color(0xFFC084FC),fontFamily=FontFamily.Serif,fontSize=7.sp,fontWeight=FontWeight.Black,letterSpacing=.7.sp,maxLines=1)
    }
}
@Composable private fun SettingsCard(icon:Int,title:String,p:Palette,onHeader:(()->Unit)?=null,content:@Composable ColumnScope.()->Unit){
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(p.paper).border(2.dp,p.outline,RoundedCornerShape(14.dp)).padding(horizontal=15.dp,vertical=12.dp)){
        Row(Modifier.fillMaxWidth().height(34.dp).then(if(onHeader!=null)Modifier.clickable{onHeader()} else Modifier),verticalAlignment=Alignment.CenterVertically){
            Image(painterResource(icon),null,Modifier.size(29.dp).graphicsLayer{translationX=if(icon==R.drawable.menu_stats)2.dp.toPx() else 0f})
            Spacer(Modifier.width(9.dp))
            Text(title,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=18.sp,color=p.text,modifier=Modifier.weight(1f))
            if(onHeader!=null)Text("↕",color=p.text,fontWeight=FontWeight.Black,fontSize=18.sp)
        }
        HorizontalDivider(color=p.outline.copy(alpha=.68f),thickness=1.dp)
        Spacer(Modifier.height(10.dp))
        content()
    }
}
@Composable private fun LanguageChoice(flag:String,label:String,selected:Boolean,p:Palette,modifier:Modifier=Modifier,locked:Boolean=false,onLocked:()->Unit={},onClick:()->Unit){
    Box(modifier.height(68.dp).clip(RoundedCornerShape(11.dp)).background(if(selected)p.gold.copy(alpha=.18f) else p.paper2).border(if(selected)3.dp else 1.dp,if(selected)p.gold else p.outline,RoundedCornerShape(11.dp)).clickable{if(locked)onLocked()else onClick()}.padding(horizontal=10.dp).graphicsLayer{alpha=if(locked).48f else 1f},contentAlignment=Alignment.Center){
        Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(8.dp)){Text(flag,fontSize=27.sp);Text(label,color=p.text,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Bold,fontSize=15.sp)}
        if(selected)SelectionBadge(p.gold,Modifier.align(Alignment.TopEnd).padding(top=7.dp,end=1.dp))
        if(locked)Text("🔒",fontSize=14.sp,modifier=Modifier.align(Alignment.TopEnd).padding(5.dp))
    }
}

enum class StatsPeriod(val days:Int?){WEEK(7),MONTH(30),YEAR(365),LIFETIME(null)}
private fun statsPeriodLabel(period:StatsPeriod)=when(period){StatsPeriod.WEEK->tr("1 VECKA","1 WEEK");StatsPeriod.MONTH->tr("1 MÅNAD","1 MONTH");StatsPeriod.YEAR->tr("1 ÅR","1 YEAR");StatsPeriod.LIFETIME->tr("LIVSTID","LIFETIME")}
@Composable private fun StatsScreen(lists:List<ShoppingListData>,events:List<StatEvent>,users:List<UserProfile>,scopeName:String,p:Palette,onBack:()->Unit){
    var period by remember{mutableStateOf(StatsPeriod.LIFETIME)}
    var menu by remember{mutableStateOf(false)}
    val dayMs=86_400_000L
    val now=System.currentTimeMillis()
    val cutoff=period.days?.let{System.currentTimeMillis()-it*86400000L}
    val filtered=events.filter{cutoff==null||it.timestamp>=cutoff}
    val purchases=filtered.filter{it.kind=="purchase"}
    val deleted=filtered.count{it.kind=="delete"}
    val topItems=purchases.groupingBy{it.itemName}.eachCount().entries.sortedByDescending{it.value}.take(5)
    val mostActive=users.maxByOrNull{u->purchases.count{it.userId==u.id}}
    val mostActiveCount=mostActive?.let{u->purchases.count{it.userId==u.id}}?:0
    val favoriteList=lists.maxByOrNull{it.items.size}
    val totalItems=lists.sumOf{it.items.size}
    val completedNow=lists.sumOf{l->l.items.count{it.completed}}
    val completionRate=if(totalItems==0)0 else completedNow*100/totalItems
    val activeItems=(totalItems-completedNow).coerceAtLeast(0)
    val average=if(lists.isEmpty())0f else totalItems.toFloat()/lists.size
    val completedLists=lists.count{it.items.isNotEmpty()&&it.items.all{item->item.completed}}
    val allItems=lists.flatMap{it.items}
    val fastest=allItems.filter{it.completedAt!=null&&it.completedAt!!>=it.createdAt}.minByOrNull{it.completedAt!!-it.createdAt}
    val fastestSeconds=fastest?.let{((it.completedAt!!-it.createdAt)/1000).coerceAtLeast(1)}
    val oldestOpen=allItems.filter{!it.completed}.minByOrNull{it.createdAt}
    val lastSeven=List(7){index->
        val daysAgo=6-index
        val from=now-(daysAgo+1)*dayMs
        val to=now-daysAgo*dayMs
        purchases.count{it.timestamp in from until to}.toFloat()
    }
    val lastThirty=List(10){index->
        val from=now-(30-index*3)*dayMs
        val to=from+3*dayMs
        purchases.count{it.timestamp in from until to}.toFloat()
    }
    val weekdayCounts=IntArray(7)
    purchases.forEach{event->val cal=java.util.Calendar.getInstance().apply{timeInMillis=event.timestamp};weekdayCounts[(cal.get(java.util.Calendar.DAY_OF_WEEK)+5)%7]++}
    val weekdayNames=listOf(tr("MÅN","MON"),tr("TIS","TUE"),tr("ONS","WED"),tr("TOR","THU"),tr("FRE","FRI"),tr("LÖR","SAT"),tr("SÖN","SUN"))
    val bestDayIndex=weekdayCounts.indices.maxByOrNull{weekdayCounts[it]}?:0
    val activityDays=purchases.map{it.timestamp/dayMs}.distinct().sortedDescending()
    var streak=0
    if(activityDays.isNotEmpty()){var expected=activityDays.first();for(day in activityDays){if(day==expected){streak++;expected--}else if(day<expected)break}}
    val userCounts=users.map{u->u to purchases.count{it.userId==u.id}}.sortedByDescending{it.second}
    val carts=(purchases.size/8f).toInt()
    Column(Modifier.fillMaxSize().padding(14.dp)){
        Row(verticalAlignment=Alignment.CenterVertically){
            PageBack(onBack,p);Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)){Text(tr("STATISTIK","STATISTICS"),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=25.sp,color=p.pageText);Text(scopeName,color=p.pageMuted,fontSize=10.sp,fontWeight=FontWeight.Bold,maxLines=1,overflow=TextOverflow.Ellipsis)}
            Box{RetroButton(statsPeriodLabel(period),{menu=true},p,compact=true);DropdownMenu(menu,{menu=false},modifier=Modifier.background(popupColor(p.panel))){StatsPeriod.entries.forEach{x->DropdownMenuItem(text={Text(statsPeriodLabel(x))},onClick={period=x;menu=false})}}}
        }
        Spacer(Modifier.height(12.dp))
        LazyColumn(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(9.dp)){
            item{Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(9.dp)){StatsCard(R.drawable.list_checklist,tr("SKAPADE LISTOR","CREATED LISTS"),lists.size.toString(),p,Modifier.weight(1f));StatsCard(R.drawable.list_basket,tr("POSTER I LISTOR","LIST ENTRIES"),totalItems.toString(),p,Modifier.weight(1f))}}
            item{Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(9.dp)){StatsCard(R.drawable.list_cart,tr("AVPRICKADE","CHECKED OFF"),completedNow.toString(),p,Modifier.weight(1f));StatsCard(R.drawable.list_food,tr("KLART","COMPLETE"),"$completionRate%",p,Modifier.weight(1f))}}
            item{ActivityDashboard(lastSeven,weekdayNames,p)}
            item{UserDonutCard(userCounts,p)}
            item{LineHistoryCard(lastThirty,p)}
            item{Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(7.dp)){
                RecordCard(R.drawable.list_supporter_emblem,tr("BÄSTA DAG","BEST DAY"),weekdayNames[bestDayIndex],weekdayCounts[bestDayIndex].toString(),p,Modifier.weight(1f))
                RecordCard(R.drawable.list_fitness,tr("STREAK","STREAK"),tr("$streak DAGAR","$streak DAYS"),tr("Fortsätt så!","Keep it up!"),p,Modifier.weight(1f))
                RecordCard(R.drawable.list_supporter_compass,tr("SNABBAST","FASTEST"),fastest?.name?:tr("Ingen ännu","None yet"),fastestSeconds?.let{"$it s"}?:"—",p,Modifier.weight(1f))
            }}
            item{FeatureStatCard(R.drawable.stats_user,tr("MEST AKTIV ANVÄNDARE","MOST ACTIVE USER"),if(mostActiveCount>0)"${mostActive?.name} – $mostActiveCount ${tr("avprickningar","check-offs")}" else tr("Ingen statistik ännu","No statistics yet"),p)}
            item{FeatureStatCard(R.drawable.stats_trophy,tr("STÖRSTA LISTAN","LARGEST LIST"),favoriteList?.let{"${it.name} – ${it.items.size} ${tr("poster","entries")}"}?:tr("Ingen lista ännu","No list yet"),p)}
            item{Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(9.dp)){
                MiniMetric(tr("AKTIVA","ACTIVE"),activeItems.toString(),p,Modifier.weight(1f))
                MiniMetric(tr("FÄRDIGA LISTOR","FINISHED LISTS"),completedLists.toString(),p,Modifier.weight(1f))
                MiniMetric(tr("SNITT/LISTA","AVG/LIST"),String.format(Locale.US,"%.1f",average),p,Modifier.weight(1f))
                MiniMetric(tr("BORTTAGNA","DELETED"),deleted.toString(),p,Modifier.weight(1f))
            }}
            item{Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(p.paper).border(2.dp,p.outline,RoundedCornerShape(10.dp)).padding(14.dp)){
                Text(tr("OFTAST AVPRICKADE","MOST OFTEN CHECKED"),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,color=p.text)
                Spacer(Modifier.height(6.dp))
                if(topItems.isEmpty())Text(tr("Ingen statistik ännu","No statistics yet"),color=p.muted)
                topItems.forEachIndexed{i,x->Text("${i+1}. ${x.key}  ·  ${x.value}",fontWeight=FontWeight.Bold,color=p.text,modifier=Modifier.padding(vertical=3.dp))}
            }}
            item{FunFactCard(R.drawable.list_cart,tr("NI HAR AVPRICKAT","YOU HAVE CHECKED OFF"),purchases.size.toString(),tr("POSTER!","ENTRIES!"),p)}
            if(oldestOpen!=null)item{FeatureStatCard(R.drawable.list_work,tr("ÄLDSTA OAVPRICKADE","OLDEST UNCHECKED"),"${oldestOpen.name} · ${(now-oldestOpen.createdAt)/dayMs} ${tr("dagar","days")}",p)}
            item{Spacer(Modifier.height(10.dp))}
        }
    }
}
@Composable private fun StatsCard(icon:Int,title:String,value:String,p:Palette,modifier:Modifier=Modifier){Column(modifier.clip(RoundedCornerShape(10.dp)).background(p.paper).border(2.dp,p.outline,RoundedCornerShape(10.dp)).padding(12.dp),horizontalAlignment=Alignment.CenterHorizontally){Image(painterResource(icon),null,Modifier.size(44.dp));Text(title,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=11.sp,color=p.text,textAlign=TextAlign.Center);Text(value,fontSize=30.sp,fontWeight=FontWeight.Black,color=p.green)}}
@Composable private fun FeatureStatCard(icon:Int,title:String,value:String,p:Palette){Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(p.paper).border(2.dp,p.outline,RoundedCornerShape(10.dp)).padding(14.dp),verticalAlignment=Alignment.CenterVertically){Image(painterResource(icon),null,Modifier.size(43.dp));Spacer(Modifier.width(12.dp));Column{Text(title,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=13.sp,color=p.text);Text(value,fontWeight=FontWeight.Bold,color=p.green)}}}
@Composable private fun ActivityDashboard(values:List<Float>,labels:List<String>,p:Palette){
    StatPanel(tr("AKTIVITET","ACTIVITY"),R.drawable.list_fitness,p){
        Canvas(Modifier.fillMaxWidth().height(145.dp)){
            val max=(values.maxOrNull()?:1f).coerceAtLeast(1f);val gap=size.width/(values.size*1.65f);val bar=gap*.66f;val base=size.height-24.dp.toPx()
            values.forEachIndexed{i,v->val x=gap*.45f+i*(gap*1.65f);val h=(base-8.dp.toPx())*(v/max);drawRoundRect(listOf(p.green,p.red,p.gold,Color(0xFF4E91B8))[i%4],Offset(x,base-h),androidx.compose.ui.geometry.Size(bar,h),CornerRadius(6f,6f))}
        }
        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceAround){labels.forEach{Text(it,fontSize=9.sp,fontWeight=FontWeight.Bold,color=p.text)}}
    }
}
@Composable private fun UserDonutCard(counts:List<Pair<UserProfile,Int>>,p:Palette){
    StatPanel(tr("VEM PRICKAR AV?","WHO CHECKS OFF?"),R.drawable.list_pets,p){
        val total=counts.sumOf{it.second}.coerceAtLeast(1)
        Row(verticalAlignment=Alignment.CenterVertically){
            Canvas(Modifier.size(112.dp)){var start=-90f;counts.take(4).forEach{(u,c)->val sweep=360f*c/total;drawArc(Color(u.colorHex),start,sweep,true);start+=sweep};drawCircle(p.paper,radius=size.minDimension*.22f)}
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)){counts.take(4).forEach{(u,c)->Row(Modifier.fillMaxWidth()){Box(Modifier.size(10.dp).clip(CircleShape).background(Color(u.colorHex)));Spacer(Modifier.width(6.dp));Text(u.name,color=p.text,fontWeight=FontWeight.Bold,fontSize=12.sp,modifier=Modifier.weight(1f));Text("${c*100/total}%",color=p.green,fontWeight=FontWeight.Black,fontSize=12.sp)}}}
        }
    }
}
@Composable private fun LineHistoryCard(values:List<Float>,p:Palette){
    StatPanel(tr("SENASTE 30 DAGAR","LAST 30 DAYS"),R.drawable.list_vacation,p){
        Canvas(Modifier.fillMaxWidth().height(130.dp)){val max=(values.maxOrNull()?:1f).coerceAtLeast(1f);val step=size.width/(values.size-1).coerceAtLeast(1);val path=Path();values.forEachIndexed{i,v->val point=Offset(i*step,size.height-8.dp.toPx()-(size.height-18.dp.toPx())*v/max);if(i==0)path.moveTo(point.x,point.y)else path.lineTo(point.x,point.y);drawCircle(p.gold,5f,point)};drawPath(path,p.green,style=Stroke(3.dp.toPx(),cap=StrokeCap.Round,join=StrokeJoin.Round))}
    }
}
@Composable private fun StatPanel(title:String,icon:Int,p:Palette,content:@Composable ColumnScope.()->Unit){
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(p.paper).border(2.dp,p.outline,RoundedCornerShape(10.dp)).padding(12.dp)){Row(verticalAlignment=Alignment.CenterVertically){Image(painterResource(icon),null,Modifier.size(31.dp));Spacer(Modifier.width(8.dp));Text(title,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,color=p.text,fontSize=16.sp)};Spacer(Modifier.height(6.dp));content()}
}
@Composable private fun RecordCard(icon:Int,title:String,value:String,detail:String,p:Palette,modifier:Modifier=Modifier){Column(modifier.heightIn(min=142.dp).clip(RoundedCornerShape(10.dp)).background(p.paper).border(2.dp,p.outline,RoundedCornerShape(10.dp)).padding(8.dp),horizontalAlignment=Alignment.CenterHorizontally){Image(painterResource(icon),null,Modifier.size(39.dp));Text(title,color=p.text,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=10.sp,textAlign=TextAlign.Center);Text(value,color=p.green,fontWeight=FontWeight.Black,fontSize=13.sp,textAlign=TextAlign.Center,maxLines=2);Text(detail,color=p.text,fontSize=10.sp,textAlign=TextAlign.Center,maxLines=2)}}
@Composable private fun MiniMetric(title:String,value:String,p:Palette,modifier:Modifier=Modifier){Column(modifier.clip(RoundedCornerShape(8.dp)).background(p.paper).border(1.dp,p.outline,RoundedCornerShape(8.dp)).padding(vertical=8.dp,horizontal=4.dp),horizontalAlignment=Alignment.CenterHorizontally){Text(value,color=p.green,fontWeight=FontWeight.Black,fontSize=18.sp);Text(title,color=p.text,fontWeight=FontWeight.Bold,fontSize=8.sp,textAlign=TextAlign.Center,maxLines=2)}}
@Composable private fun FunFactCard(icon:Int,top:String,value:String,bottom:String,p:Palette){val bg=lerp(p.paper,p.gold,.16f);val fg=readableOn(bg);Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(bg).border(2.dp,p.gold,RoundedCornerShape(10.dp)).padding(14.dp),verticalAlignment=Alignment.CenterVertically){Image(painterResource(icon),null,Modifier.size(76.dp));Spacer(Modifier.width(14.dp));Column(Modifier.weight(1f),horizontalAlignment=Alignment.CenterHorizontally){Text(top,color=fg,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=14.sp);Text(value,color=if(p.green.luminance()>.35f)p.green else p.gold,fontWeight=FontWeight.Black,fontSize=42.sp);Text(bottom,color=fg,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=17.sp)}}}

@Composable private fun UpdateAvailableScreen(release:ReleaseInfo,p:Palette,onBack:()->Unit){
    val context=LocalContext.current
    var showInstallGuide by remember{mutableStateOf(false)}
    fun openInBrowser(url:String){
        val target=Intent(Intent.ACTION_VIEW,Uri.parse(url)).apply{addCategory(Intent.CATEGORY_BROWSABLE)}
        val browserPackage=runCatching{
            context.packageManager.resolveActivity(
                Intent(Intent.ACTION_VIEW,Uri.parse("https://www.google.com")).apply{addCategory(Intent.CATEGORY_BROWSABLE)},
                android.content.pm.PackageManager.MATCH_DEFAULT_ONLY
            )?.activityInfo?.packageName
        }.getOrNull()
        if(!browserPackage.isNullOrBlank())target.setPackage(browserPackage)
        runCatching{context.startActivity(target)}.onFailure{
            context.startActivity(Intent.createChooser(Intent(Intent.ACTION_VIEW,Uri.parse(url)).apply{addCategory(Intent.CATEGORY_BROWSABLE)},tr("Välj webbläsare","Choose browser")))
        }
    }
    BackHandler(showInstallGuide){showInstallGuide=false}
    if(showInstallGuide){
        InstallUpdateGuideScreen(release,p,onBack={showInstallGuide=false},onDownload={openInBrowser(release.apkUrl)},onMoreInfo={openInBrowser(release.pageUrl)})
        return
    }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),horizontalAlignment=Alignment.CenterHorizontally){
        PageHeader(tr("NY VERSION","NEW VERSION"),p,onBack)
        Spacer(Modifier.height(24.dp))
        Text("♥",fontSize=62.sp,color=p.red)
        Text(tr("NY VERSION FINNS!","A NEW VERSION IS AVAILABLE!"),color=p.pageText,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=23.sp,textAlign=TextAlign.Center)
        Spacer(Modifier.height(7.dp))
        Text("Bubbsun v${release.version}",color=p.gold,fontWeight=FontWeight.Black,fontSize=20.sp)
        if(release.notes.isNotBlank()){Spacer(Modifier.height(16.dp));Text(release.notes.take(900),color=p.text,fontSize=13.sp,textAlign=TextAlign.Start,modifier=Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(p.paper).border(1.dp,p.outline,RoundedCornerShape(10.dp)).padding(14.dp))}
        Spacer(Modifier.height(22.dp))
        RetroButton(tr("LADDA NER NY VERSION","DOWNLOAD NEW VERSION"),{openInBrowser(release.apkUrl)},p,modifier=Modifier.fillMaxWidth().heightIn(min=62.dp))
        Spacer(Modifier.height(11.dp))
        Button(onClick={showInstallGuide=true},modifier=Modifier.fillMaxWidth().heightIn(min=58.dp),shape=RoundedCornerShape(9.dp),colors=ButtonDefaults.buttonColors(containerColor=p.paper,contentColor=p.text),border=androidx.compose.foundation.BorderStroke(2.dp,p.outline)){Text(tr("HUR INSTALLERAR JAG?","HOW DO I INSTALL IT?"),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=17.sp)}
        Spacer(Modifier.height(11.dp))
        Button(onClick=onBack,modifier=Modifier.fillMaxWidth().heightIn(min=58.dp),shape=RoundedCornerShape(9.dp),colors=ButtonDefaults.buttonColors(containerColor=p.paper,contentColor=p.text),border=androidx.compose.foundation.BorderStroke(2.dp,p.outline)){Text(tr("INTE NU","NOT NOW"),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=17.sp)}
        Spacer(Modifier.height(11.dp))
        TextButton({openInBrowser(release.pageUrl)},modifier=Modifier.fillMaxWidth().heightIn(min=50.dp)){Text(tr("VISA PÅ GITHUB","VIEW ON GITHUB"),color=p.pageText,fontWeight=FontWeight.Bold)}
    }
}

@Composable private fun InstallUpdateGuideScreen(release:ReleaseInfo,p:Palette,onBack:()->Unit,onDownload:()->Unit,onMoreInfo:()->Unit){
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),horizontalAlignment=Alignment.CenterHorizontally){
        PageHeader(tr("INSTALLERA UPPDATERING","INSTALL UPDATE"),p,onBack)
        Spacer(Modifier.height(16.dp))
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(p.paper).border(2.dp,p.outline,RoundedCornerShape(12.dp)).padding(16.dp)){
            Text(tr("SÅ HÄR GÖR DU","HOW TO INSTALL"),color=p.text,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=19.sp)
            Spacer(Modifier.height(10.dp))
            val steps=listOf(
                tr("1. Tryck på Ladda ner APK och välj din webbläsare om telefonen frågar.","1. Tap Download APK and choose your browser if your phone asks."),
                tr("2. När filen är klar öppnar du den från webbläsaren eller mappen Hämtade filer.","2. When it is ready, open it from the browser or your Downloads folder."),
                tr("3. Tillåt installation från den här källan om Android frågar. Tillåt bara webbläsaren eller filhanteraren du använder.","3. If Android asks, allow installation from this source. Only allow the browser or file manager you are using."),
                tr("4. Tryck på Uppdatera eller Installera. Dina listor och molndata finns kvar.","4. Tap Update or Install. Your lists and cloud data will remain.")
            )
            steps.forEach{Text(it,color=p.text,fontSize=14.sp,lineHeight=20.sp,modifier=Modifier.padding(bottom=10.dp))}
            Text(tr("Installera bara APK-filen från Bubbsuns officiella GitHub-release.","Only install the APK from Bubbsun's official GitHub release."),color=p.red,fontWeight=FontWeight.Bold,fontSize=12.sp,lineHeight=17.sp)
        }
        Spacer(Modifier.height(16.dp))
        RetroButton(tr("LADDA NER APK","DOWNLOAD APK"),onDownload,p,modifier=Modifier.fillMaxWidth().heightIn(min=62.dp))
        Spacer(Modifier.height(10.dp))
        Button(onClick=onMoreInfo,modifier=Modifier.fillMaxWidth().heightIn(min=56.dp),shape=RoundedCornerShape(9.dp),colors=ButtonDefaults.buttonColors(containerColor=p.paper,contentColor=p.text),border=androidx.compose.foundation.BorderStroke(2.dp,p.outline)){Text(tr("MER INFORMATION PÅ GITHUB","MORE INFORMATION ON GITHUB"),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,textAlign=TextAlign.Center)}
        Spacer(Modifier.height(10.dp))
        TextButton(onClick=onDownload,modifier=Modifier.fillMaxWidth().heightIn(min=48.dp)){Text(tr("LADDA NER ÄNDÅ","DOWNLOAD ANYWAY"),color=p.pageText,fontWeight=FontWeight.Bold)}
        Text("Bubbsun v${release.version}",color=p.pageText.copy(alpha=.7f),fontSize=12.sp)
    }
}

@Composable private fun SupportScreen(p:Palette,supporterEnabled:Boolean,onBack:()->Unit,onActivate:()->Unit,onExplore:()->Unit){
    var success by remember{mutableStateOf(false)}
    val context=LocalContext.current
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(14.dp),horizontalAlignment=Alignment.CenterHorizontally){
        PageHeader(tr("STÖD BUBBSUN","SUPPORT BUBBSUN"),p,onBack)
        Spacer(Modifier.height(16.dp))
        Image(painterResource(R.drawable.theme_heart),null,Modifier.size(if(success)190.dp else 125.dp))
        Text(if(success)tr("TACK FÖR DITT STÖD!","THANK YOU FOR YOUR SUPPORT!") else if(supporterEnabled)tr("DU ÄR SUPPORTER","YOU ARE A SUPPORTER") else "FOUNDING SUPPORTER",fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=24.sp,color=p.pageText,textAlign=TextAlign.Center)
        Spacer(Modifier.height(8.dp))
        Text(if(supporterEnabled||success)"♥  FOUNDING SUPPORTER" else tr("GRATIS UNDER FÖRHANDSVISNINGEN","FREE DURING PREVIEW"),color=p.gold,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=14.sp,textAlign=TextAlign.Center)
        Spacer(Modifier.height(14.dp))
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(p.paper).border(2.dp,p.outline,RoundedCornerShape(14.dp)).padding(16.dp)){
            Text(tr("DETTA LÅSES UPP","THIS UNLOCKS"),color=p.text,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=17.sp)
            listOf(
                tr("Kosmiskt och Hjärtligt tema","Cosmic and Heartfelt themes"),
                tr("Exklusiva ikoner och färger","Exclusive icons and colors"),
                tr("Supporterdekorationer och glow","Supporter decorations and glow"),
                tr("Klingon som appspråk","Klingon app language")
            ).forEach{Text("♥  $it",color=p.text,fontWeight=FontWeight.Bold,fontSize=12.sp,maxLines=1,overflow=TextOverflow.Ellipsis,modifier=Modifier.padding(top=8.dp))}
        }
        Spacer(Modifier.height(14.dp))
        if(!supporterEnabled&&!success){
            Text(tr("Ingen betalning genomförs. Knappen aktiverar bara Supporter Preview på den här enheten.","No payment is made. The button only enables Supporter Preview on this device."),color=p.pageText,textAlign=TextAlign.Center,fontSize=13.sp)
            Spacer(Modifier.height(10.dp))
            RetroButton(tr("AKTIVERA SUPPORTER GRATIS","ACTIVATE SUPPORTER FOR FREE"),{onActivate();success=true},p,modifier=Modifier.fillMaxWidth())
        }else{
            Text(tr("Tack för att du stödjer Bubbsun!","Thank you for supporting Bubbsun!"),color=p.pageText,fontWeight=FontWeight.Bold,textAlign=TextAlign.Center)
            Spacer(Modifier.height(10.dp))
            RetroButton(tr("UTFORSKA SUPPORTERINNEHÅLL","EXPLORE SUPPORTER CONTENT"),onExplore,p,modifier=Modifier.fillMaxWidth())
        }
        Spacer(Modifier.height(12.dp))
        Button(onClick={runCatching{context.startActivity(Intent(Intent.ACTION_VIEW,Uri.parse("https://www.facebook.com/profile.php?id=61592148376494")).apply{addCategory(Intent.CATEGORY_BROWSABLE)})}},modifier=Modifier.fillMaxWidth().heightIn(min=58.dp),shape=RoundedCornerShape(12.dp),colors=ButtonDefaults.buttonColors(containerColor=Color(0xFF4267B2),contentColor=Color.White)){
            Text("f",fontSize=24.sp,fontWeight=FontWeight.Black);Spacer(Modifier.width(10.dp));Text(tr("FÖLJ BUBBSUN PÅ FACEBOOK","FOLLOW BUBBSUN ON FACEBOOK"),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=15.sp)
        }
        Spacer(Modifier.height(10.dp))
        Button(onClick={},enabled=false,modifier=Modifier.fillMaxWidth(),shape=RoundedCornerShape(9.dp)){Text(tr("ÅTERSTÄLL KÖP  •  KOMMER SENARE","RESTORE PURCHASES  •  COMING LATER"))}
    }
}

private val patchNotes=listOf(
    "0.604" to listOf("Fixed list drag-and-drop cancelling when crossing the hidden Add list area","List order now changes only when the dragged card is released"),
    "0.603" to listOf("Fixed oversized text and layout on phones with manufacturer-specific display density","Unfollow now clears legacy follow data and cancels pending notifications","Stabilized list drag-and-drop over the Edit and Delete targets"),
    "0.602" to listOf("Locked both Android font and display scaling for consistent layouts","Added explicit Home navigation and My Lists / Groups tabs","Added split drag targets for editing or deleting lists","Moved Follow and delete actions into a collapsible list toolbar","Saved one global sort-tab position across all lists","Improved delete selection controls and light-theme contrast","Expanded MegaSuperBoss membership lookup and supporter controls","Added supporter status messages and notification diagnostics","Refined the compact fixed-footer menu design"),
    "0.601" to listOf("Clearer swipe hint on global pinned lists","Larger Follow button text and five-minute background notifications","Full MegaSuperBoss member profiles with groups, roles, blocking and removal","Dedicated Bugs & Suggestions admin page","Synced supporter status and corrected admin statistics","GitHub release download statistics","Restored Support Bubbsun page and Facebook link","Refined active group card in the menu"),
    "0.600" to listOf("Family Expansion with multiple groups and private lists","MegaSuperBoss administration and global pinned lists","Group roles, approvals and unique colors","Gothic supporter theme and expanded languages","Improved update installation flow"),
    "0.501" to listOf("Privacy consent before the first cloud sync","Mobile-safe Google sign-in screen","Stable drag-and-drop with one sync after release","Synced thumbs-up reactions on entries","Sign-out confirmation","Clickable logo shortcut to My Lists","Clearer menu, languages, dropdowns and statistics wording"),
    "0.500" to listOf("Together Edition Beta with Google sign-in","Real-time family groups with offline Firestore sync","Join codes, approval requests and unique member colors","Owner, admin and member roles protected by server rules","Safe migration of existing local lists","Creator color markers on lists and items","Expanded language selector and refreshed Help & Guides","Together privacy and account controls"),
    "0.480" to listOf("Search & Sort side panel with saved per-list choices","Grouped live search and persistent custom order","Per-user NEW badges and list status","Offline Help & Guides","Private in-app problem and suggestion forms","Responsive narrow-screen titles and fields","Daniel and Sanja portrait Easter egg","Improved update checking and manual check button"),
    "0.472" to listOf("Replaced control symbols with polished illustrated retro icons","New Heart supporter shopping-cart artwork","Tighter product-field icon and text spacing","Clearly grayer text on completed items"),
    "0.471" to listOf("Optional background update checks with direct APK and GitHub links","Fixed Exit Bubbsun and made the side menu scrollable","App typography is no longer affected by Android font scaling","New Daniel and Sanja portraits based on the creators","Unified retro back, edit and delete controls","Refined fire and supporter cart artwork","Clearer completed items, statistics text and About-page action colors","Compact product and quantity field icons"),
    "0.470" to listOf("Playful statistics dashboard with charts, records and fun facts","Correct hierarchical physical-back navigation","Refined supporter flow, headers and theme backgrounds","Compact list and product forms","Polished About page, splash screen and version history"),
    "0.461" to listOf("Fully translated supporter page","Mobile-friendly supporter benefits","Clearer completed-item shading","Centered statistics and portrait icons"),
    "0.460" to listOf("New supporter page with free preview activation","In-app version history","Cleaned and centered icons","Complete language and layout fixes"),
    "0.456" to listOf("Unified illustrated icon style","Compact supporter panel","Italian and supporter-exclusive Klingon","Header-connected My Lists tab"),
    "0.455" to listOf("Heartfelt supporter theme","New theme, statistics and About icons","Founding Supporter in side menu"),
    "0.454" to listOf("Compact Bubbsun image logo","Fancy Glow","New list icons and color palettes"),
    "0.453" to listOf("Locked Cosmic supporter theme remains visible","Tighter popups","New cosmic theme icon"),
    "0.452" to listOf("Fixes for edition, saved themes and long names"),
    "0.451" to listOf("Selectable supporter decorations"),
    "0.450" to listOf("Supporter Preview and Cosmic supporter"),
    "0.401" to listOf("Instant language switching without restart"),
    "0.400" to listOf("New settings page, statistics and list editing")
)

@Composable private fun VersionsScreen(p:Palette,onBack:()->Unit){
    var expanded by remember{mutableStateOf("0.602")}
    Column(Modifier.fillMaxSize().padding(14.dp)){
        PageHeader(tr("VERSIONER & NYHETER","VERSIONS & NEWS"),p,onBack)
        Spacer(Modifier.height(12.dp))
        LazyColumn(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(8.dp)){
            items(patchNotes){(version,notes)->
                val open=expanded==version
                Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(11.dp)).background(p.paper).border(if(version=="0.500")2.dp else 1.dp,if(version=="0.500")p.gold else p.outline,RoundedCornerShape(11.dp)).clickable{expanded=if(open)"" else version}.padding(13.dp)){
                    Row(verticalAlignment=Alignment.CenterVertically){Text("v$version",color=p.text,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=19.sp,modifier=Modifier.weight(1f));if(version=="0.500")Text(tr("NYTT","NEW"),color=readableOn(p.gold),fontSize=10.sp,fontWeight=FontWeight.Black,modifier=Modifier.clip(RoundedCornerShape(50)).background(p.gold).padding(horizontal=8.dp,vertical=3.dp));Spacer(Modifier.width(8.dp));Text(if(open)"▲" else "▼",color=p.text)}
                    if(open){Spacer(Modifier.height(7.dp));notes.forEach{Text("• $it",color=p.text,fontSize=14.sp,modifier=Modifier.padding(vertical=2.dp))}}
                }
            }
        }
    }
}

private val helpTopics=listOf(
    "Google-inloggning" to "Första gången väljer du ditt Google-konto. Därefter loggas du normalt in automatiskt. Första inloggningen kräver internet.",
    "Skapa en grupp" to "Öppna Användare & grupp och välj Skapa ny grupp. Du blir gruppens storboss och får en unik familjekod.",
    "Gå med i en grupp" to "Skriv familjekoden under Användare & grupp och skicka en ansökan. Du får åtkomst först när en boss godkänt den.",
    "Storboss och bossar" to "Storbossen kan göra andra till bossar. Bossar kan godkänna medlemmar och hantera gruppen men aldrig ta bort storbossen eller radera gruppen.",
    "Synkning och offline" to "Ändringar sparas i molnet och visas för familjen. Utan internet arbetar du vidare med sparad data och ändringarna skickas när anslutningen återkommer.",
    "Flytta gamla listor" to "Vid första gruppstarten väljer du om befintliga listor ska flyttas till gruppen, behållas lokalt eller om gruppen ska börja tom.",
    "Namn och färger" to "Du ändrar bara din egen profil. Namn och färger som redan används i gruppen kan inte väljas.",
    "Kom igång" to "Skapa en lista, välj färg och ikon och lägg sedan till dina första varor.",
    "Listor" to "Håll inne ett listkort och dra för att ändra ordning. Dra till papperskorgen för att ta bort.",
    "Produkter" to "Skriv namn och valfri mängd. Tryck på en vara för att redigera och bocka av när den är klar.",
    "Manuell sortering" to "Välj Anpassad i Sök & sortera. Håll sedan inne en vara och dra den till rätt plats.",
    "Sök & sortera" to "Swipa från högerkanten eller tryck på handtaget. Sökningen visar både klara och ej klara träffar.",
    "Användare & färger" to "Varje familjemedlem har en egen färg. Färgmarkeringen på listor och poster visar vem som skapade eller lade till dem. Upptagna färger är nedtonade och kan inte väljas.",
    "Teman" to "Tryck på temaikonen uppe till höger för att byta utseende.",
    "Supporter" to "Supporterläget är gratis under förhandsvisningen och låser upp extra teman, färger och ikoner.",
    "Statistik" to "Statistiksidan samlar roliga siffror om listor, varor och aktivitet.",
    "Uppdateringar & APK" to "Bubbsun kan kontrollera GitHub efter nya versioner. APK-filen kan laddas hem direkt i appen.",
    "Vanliga frågor" to "Dina listor lagras lokalt. Internet behövs bara för uppdateringar och för att skicka formulär."
)

@Composable private fun HelpScreen(p:Palette,onBack:()->Unit){
    var search by remember{mutableStateOf("")};var open by remember{mutableStateOf("")}
    Column(Modifier.fillMaxSize().padding(14.dp)){PageHeader(tr("HJÄLP & GUIDER","HELP & GUIDES"),p,onBack);Spacer(Modifier.height(10.dp));RetroField(search,{search=it},tr("Sök i guiderna…","Search guides…"),Modifier.fillMaxWidth(),p);Spacer(Modifier.height(10.dp))
        LazyColumn(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(8.dp)){items(helpTopics.filter{search.isBlank()||it.first.contains(search,true)||it.second.contains(search,true)}){(title,body)->
            Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(p.paper).border(1.dp,p.outline,RoundedCornerShape(10.dp)).clickable{open=if(open==title)"" else title}.padding(13.dp)){
                Row{Text(title,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,color=p.text,modifier=Modifier.weight(1f));Text(if(open==title)"▲" else "▼",color=p.text)}
                if(open==title){Spacer(Modifier.height(7.dp));Text(body,color=p.text,lineHeight=20.sp)}
            }
        }}
    }
}

@Composable private fun PrivacyScreen(p:Palette,onBack:()->Unit){
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(14.dp)){PageHeader(tr("INTEGRITET & MOLNDATA","PRIVACY & CLOUD DATA"),p,onBack);Spacer(Modifier.height(12.dp))
        val sections=listOf(
            tr("Vad som sparas","What is stored") to tr("Bubbsun sparar ditt Google-kontos unika ID, visningsnamn, valda färg, gruppmedlemskap samt gruppens listor, varor och aktivitet. Din Gmail-adress visas inte för andra medlemmar.","Bubbsun stores your Google account's unique ID, display name, selected color, group membership, and the group's lists, items and activity. Your Gmail address is not shown to other members."),
            tr("Varför informationen behövs","Why it is needed") to tr("Uppgifterna används endast för inloggning, familjesynkning, behörigheter och NYTT-markeringar.","The information is only used for sign-in, family sync, permissions and NEW markers."),
            tr("Offline och utloggning","Offline and sign-out") to tr("Firebase kan behålla en krypterad lokal cache så appen fungerar offline. Vid utloggning förlorar telefonen åtkomsten till gruppen, medan molndata ligger kvar.","Firebase may keep an encrypted local cache so the app works offline. When signing out, the phone loses access to the group while cloud data remains."),
            tr("Kontroll över data","Control of data") to tr("Du kan lämna gruppen och radera ditt Bubbsun-konto. Storbossen måste först överföra ägarskapet eller radera gruppen.","You can leave the group and delete your Bubbsun account. The owner must first transfer ownership or delete the group.")
        );sections.forEach{(title,body)->Column(Modifier.fillMaxWidth().padding(bottom=9.dp).clip(RoundedCornerShape(10.dp)).background(p.paper).border(1.dp,p.outline,RoundedCornerShape(10.dp)).padding(13.dp)){Text(title,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,color=p.text,fontSize=18.sp);Spacer(Modifier.height(5.dp));Text(body,color=p.text,lineHeight=20.sp)}}}
}

private suspend fun sendFeedback(problem:Boolean,category:String,title:String,message:String,email:String,includeInfo:Boolean):Boolean=withContext(Dispatchers.IO){
    runCatching{
        val c=(URL("https://formspree.io/f/mrenoalb").openConnection() as HttpURLConnection).apply{requestMethod="POST";doOutput=true;connectTimeout=6000;readTimeout=6000;setRequestProperty("Content-Type","application/json");setRequestProperty("Accept","application/json")}
        val json=JSONObject().apply{put("type",if(problem)"Problem" else "Suggestion");put("category",category);put("title",title);put("message",message);put("reply_email",email);put("_subject","Bubbsun: ${if(problem)"Problem" else "Suggestion"} – $title");put("_gotcha","");if(includeInfo)put("app_info","Bubbsun ${BuildConfig.VERSION_NAME}; Android ${android.os.Build.VERSION.RELEASE}; ${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}")}
        c.outputStream.use{it.write(json.toString().toByteArray())};val ok=c.responseCode in 200..299;c.disconnect();ok
    }.getOrDefault(false)
}

@Composable private fun FeedbackScreen(problem:Boolean,p:Palette,uid:String,language:String,themeId:String,repo:V600Repository,onBack:()->Unit){
    val categories=if(problem)listOf(tr("Krasch","Crash"),tr("Något fungerar inte","Not working"),tr("Utseende/layout","Appearance/layout"),tr("Språk","Language"),tr("Tema/supporter","Theme/supporter"),tr("Uppdatering/installation","Update/install"),tr("Annat","Other")) else listOf(tr("Ny funktion","New feature"),tr("Design","Design"),tr("Tema","Theme"),tr("Ikoner/färger","Icons/colors"),tr("Statistik","Statistics"),tr("Supporter","Supporter"),tr("Språk","Language"),tr("Annat","Other"))
    var category by remember{mutableStateOf(categories.first())};var menu by remember{mutableStateOf(false)};var title by remember{mutableStateOf("")};var message by remember{mutableStateOf("")};var info by remember{mutableStateOf(true)};var sending by remember{mutableStateOf(false)};var sent by remember{mutableStateOf(false)};var reportId by remember{mutableStateOf("")};var failed by remember{mutableStateOf(false)}
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(14.dp)){PageHeader(if(problem)tr("RAPPORTERA PROBLEM","REPORT A PROBLEM") else tr("SKICKA FÖRSLAG","SEND SUGGESTION"),p,onBack);Spacer(Modifier.height(12.dp))
        if(sent){Text("♥",fontSize=88.sp,color=Color(0xFFC58B91),modifier=Modifier.align(Alignment.CenterHorizontally));Text(tr("Tack! Rapporten är sparad i Bubbsun.","Thank you! The report is saved in Bubbsun."),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=22.sp,color=p.pageText,textAlign=TextAlign.Center,modifier=Modifier.fillMaxWidth());Spacer(Modifier.height(8.dp));Text("ID: $reportId",fontFamily=FontFamily.Monospace,color=p.pageMuted,modifier=Modifier.align(Alignment.CenterHorizontally));return@Column}
        Text(if(problem)tr("TYP AV PROBLEM","TYPE OF PROBLEM") else tr("TYP AV FÖRSLAG","TYPE OF SUGGESTION"),color=p.pageText,fontWeight=FontWeight.Black,fontSize=12.sp)
        Spacer(Modifier.height(5.dp));Box{Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(p.paper).border(1.dp,p.outline,RoundedCornerShape(8.dp)).clickable{menu=true}.padding(horizontal=14.dp,vertical=14.dp),verticalAlignment=Alignment.CenterVertically){Text(category,color=p.text,fontWeight=FontWeight.Bold,modifier=Modifier.weight(1f));Text("▼",color=p.text,fontSize=14.sp)};DropdownMenu(menu,{menu=false},containerColor=popupColor(p.paper),shadowElevation=12.dp,modifier=Modifier.background(popupColor(p.paper)).border(2.dp,p.outline,RoundedCornerShape(8.dp))){categories.forEach{DropdownMenuItem({Text(it,color=p.text)},{category=it;menu=false},modifier=Modifier.background(if(it==category)p.gold.copy(alpha=.18f) else Color.Transparent))}}}
        Spacer(Modifier.height(9.dp));RetroField(title,{title=it.take(80)},tr("Rubrik","Title"),Modifier.fillMaxWidth(),p);Spacer(Modifier.height(9.dp));RetroField(message,{message=it.take(2000)},tr("Beskriv så tydligt du kan…","Describe it as clearly as you can…"),Modifier.fillMaxWidth().height(150.dp),p,multiline=true)
        Row(verticalAlignment=Alignment.CenterVertically){Checkbox(info,{info=it},colors=CheckboxDefaults.colors(checkedColor=p.green));Text(tr("Bifoga appversion, Android och telefonmodell","Include app version, Android and device model"),color=p.pageText,fontSize=12.sp)}
        if(failed)Text(tr("Kunde inte skicka. Kontrollera internet och försök igen.","Could not send. Check your connection and try again."),color=p.red)
        RetroButton(if(sending)tr("SPARAR…","SAVING…") else tr("SKICKA","SEND"),{if(!sending&&title.isNotBlank()&&message.isNotBlank()){sending=true;failed=false;repo.createReport(uid,problem,category,title,message,language,themeId,info){result->sending=false;result.onSuccess{reportId=it;sent=true}.onFailure{failed=true}}}},p,modifier=Modifier.fillMaxWidth())
    }
}

@Composable private fun AdminScreen(p:Palette,repo:V600Repository,currentPin:GlobalPinDocument?,settings:AdminSettings,onBack:()->Unit){
    var reports by remember{mutableStateOf<List<BubbsunReport>>(emptyList())}
    var members by remember{mutableStateOf<List<AdminMemberRecord>>(emptyList())}
    var dashboard by remember{mutableStateOf<AdminDashboard?>(null)}
    var showMembers by remember{mutableStateOf(false)}
    var showReports by remember{mutableStateOf(false)}
    var showReleases by remember{mutableStateOf(false)}
    var pinTitle by remember(currentPin?.id){mutableStateOf(currentPin?.title.orEmpty())}
    var pinInfo by remember(currentPin?.id){mutableStateOf(currentPin?.infoText.orEmpty())}
    var pinItems by remember{mutableStateOf("")}
    var preview by remember{mutableStateOf(false)}
    var busy by remember{mutableStateOf(false)}
    var message by remember{mutableStateOf("")}
    DisposableEffect(Unit){val reportsReg=repo.listenAdminReports{reports=it};val membersReg=repo.listenAdminMembers{members=it};onDispose{reportsReg.remove();membersReg.remove()}}
    LaunchedEffect(Unit){repo.loadAdminDashboard{dashboard=it}}
    if(showMembers){AdminMembersScreen(p,repo,members,{showMembers=false});return}
    if(showReports){AdminReportsScreen(p,repo,reports,{showReports=false});return}
    if(showReleases){AdminReleasesScreen(p,{showReleases=false});return}
    Column(Modifier.fillMaxSize().padding(14.dp)){
        PageHeader("MEGASUPERBOSS",p,onBack)
        Spacer(Modifier.height(9.dp))
        LazyColumn(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(10.dp)){
            item{AdminDashboardCard(p,dashboard,reports.count{it.status=="new"},{repo.loadAdminDashboard{dashboard=it}},{showReleases=true})}
            item{
                Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(11.dp)).background(p.paper).border(2.dp,p.outline,RoundedCornerShape(11.dp)).clickable{showMembers=true}.padding(13.dp),verticalAlignment=Alignment.CenterVertically){
                    Box(Modifier.size(43.dp).clip(CircleShape).background(p.green),contentAlignment=Alignment.Center){Text("${members.size}",color=readableOn(p.green),fontWeight=FontWeight.Black)}
                    Spacer(Modifier.width(11.dp));Column(Modifier.weight(1f)){Text(tr("MEDLEMMAR","MEMBERS"),color=p.text,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=18.sp);Text(tr("Sök, sortera och hantera unika titlar","Search, sort and manage unique titles"),color=p.muted,fontSize=11.sp)};Text("›",color=p.text,fontSize=32.sp,fontWeight=FontWeight.Black)
                }
            }
            item{
                Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(11.dp)).background(p.paper).border(2.dp,p.outline,RoundedCornerShape(11.dp)).clickable{showReports=true}.padding(13.dp),verticalAlignment=Alignment.CenterVertically){
                    Box(Modifier.size(43.dp).clip(CircleShape).background(p.red),contentAlignment=Alignment.Center){Text("${reports.count{it.status=="new"}}",color=readableOn(p.red),fontWeight=FontWeight.Black)}
                    Spacer(Modifier.width(11.dp));Column(Modifier.weight(1f)){Text(tr("BUGGAR & FÖRSLAG","BUGS & SUGGESTIONS"),color=p.text,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=18.sp);Text(tr("Läs, markera och ta bort inskickat","Read, mark and delete submissions"),color=p.muted,fontSize=11.sp)};Text("›",color=p.text,fontSize=32.sp,fontWeight=FontWeight.Black)
                }
            }
            item{
                Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(p.panel).border(2.dp,p.gold,RoundedCornerShape(12.dp)).padding(12.dp)){
                    Text(tr("GLOBALT PINNAT MEDDELANDE","GLOBAL PINNED MESSAGE"),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,color=readableOn(p.panel),fontSize=18.sp)
                    Spacer(Modifier.height(8.dp));RetroField(pinTitle,{pinTitle=it.take(80)},tr("Rubrik","Title"),Modifier.fillMaxWidth(),p)
                    Spacer(Modifier.height(7.dp));RetroField(pinInfo,{pinInfo=it.take(240)},tr("Information, max 240 tecken","Information, max 240 characters"),Modifier.fillMaxWidth().height(105.dp),p,multiline=true)
                    Spacer(Modifier.height(7.dp));RetroField(pinItems,{pinItems=it.take(2000)},tr("Poster, en per rad","Entries, one per line"),Modifier.fillMaxWidth().height(115.dp),p,multiline=true)
                    Spacer(Modifier.height(8.dp));Row(horizontalArrangement=Arrangement.spacedBy(7.dp)){RetroButton(tr("FÖRHANDSGRANSKA","PREVIEW"),{preview=true},p,modifier=Modifier.weight(1f));RetroButton(if(busy)tr("PUBLICERAR…","PUBLISHING…") else tr("PUBLICERA","PUBLISH"),{if(pinTitle.isNotBlank()&&!busy){busy=true;repo.publishGlobalPin(pinTitle,pinInfo,pinItems.lines()){result->busy=false;message=if(result.isSuccess)tr("Publicerat för alla.","Published for everyone.") else tr("Publiceringen misslyckades.","Publishing failed.")}}},p,modifier=Modifier.weight(1f))}
                    if(currentPin!=null){Spacer(Modifier.height(7.dp));RetroButton(tr("AVPUBLICERA NUVARANDE","UNPUBLISH CURRENT"),{repo.unpublishGlobalPin(currentPin.id){ok->message=if(ok)tr("Avpublicerat.","Unpublished.") else tr("Kunde inte avpublicera.","Could not unpublish.")}},p,danger=true,modifier=Modifier.fillMaxWidth())}
                    if(message.isNotBlank()){Spacer(Modifier.height(6.dp));Text(message,color=readableOn(p.panel),fontSize=11.sp)}
                }
            }
            item{
                Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(11.dp)).background(p.paper).border(1.dp,p.outline,RoundedCornerShape(11.dp)).padding(12.dp),verticalAlignment=Alignment.CenterVertically){Column(Modifier.weight(1f)){Text(tr("GRATIS SUPPORTERPERIOD","FREE SUPPORTER PERIOD"),color=p.text,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black);Text(tr("Central inställning för alla konton","Central setting for all accounts"),color=p.muted,fontSize=11.sp)};Switch(settings.freeSupporterPeriod,{repo.setFreeSupporterPeriod(it){}},colors=SwitchDefaults.colors(checkedThumbColor=p.gold,checkedTrackColor=p.green))}
            }
        }
    }
    if(preview)AlertDialog(onDismissRequest={preview=false},containerColor=popupColor(p.paper),title={Text(pinTitle.ifBlank{tr("Förhandsvisning","Preview")},color=p.text,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black)},text={Column{if(pinInfo.isNotBlank())Text(pinInfo,color=p.text);pinItems.lines().filter{it.isNotBlank()}.take(8).forEach{Text("• $it",color=p.text,modifier=Modifier.padding(top=5.dp))}}},confirmButton={RetroButton("OK",{preview=false},p)})
}

@Composable private fun AdminReportsScreen(p:Palette,repo:V600Repository,reports:List<BubbsunReport>,onBack:()->Unit){
    var deleteTarget by remember{mutableStateOf<BubbsunReport?>(null)}
    Column(Modifier.fillMaxSize().padding(14.dp)){PageHeader(tr("BUGGAR & FÖRSLAG","BUGS & SUGGESTIONS"),p,onBack);Spacer(Modifier.height(9.dp));Text("${reports.size} ${tr("inskickade ärenden","submissions")}",color=p.pageMuted,fontSize=11.sp);Spacer(Modifier.height(7.dp));LazyColumn(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(8.dp)){items(reports,key={it.id}){report->Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(p.paper).border(1.dp,if(report.status=="new")p.red else p.outline,RoundedCornerShape(10.dp)).padding(11.dp)){Row{Text(if(report.category.contains("förslag",true))"💡" else "🐞",fontSize=18.sp);Spacer(Modifier.width(7.dp));Text(report.title,color=p.text,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,modifier=Modifier.weight(1f));Text(report.status.uppercase(),color=if(report.status=="new")p.red else p.green,fontSize=9.sp,fontWeight=FontWeight.Black)};Text("${report.category} • v${report.appVersion}",color=p.muted,fontSize=10.sp);Spacer(Modifier.height(5.dp));Text(report.description,color=p.text,fontSize=12.sp);if(report.deviceModel.isNotBlank())Text("${report.deviceModel} • Android ${report.androidVersion}",color=p.muted,fontSize=9.sp,modifier=Modifier.padding(top=5.dp));Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.End){if(report.status=="new")Text(tr("MARKERA LÄST","MARK READ"),color=p.green,fontWeight=FontWeight.Black,fontSize=10.sp,modifier=Modifier.clickable{repo.updateReportStatus(report.id,"read"){} }.padding(9.dp));Text(tr("TA BORT","DELETE"),color=p.red,fontWeight=FontWeight.Black,fontSize=10.sp,modifier=Modifier.clickable{deleteTarget=report}.padding(9.dp))}}}}}
    deleteTarget?.let{r->ConfirmDialog(tr("Ta bort ärendet?","Delete submission?"),r.title,p,{deleteTarget=null},{repo.deleteReport(r.id){};deleteTarget=null})}
}

@Composable private fun AdminReleasesScreen(p:Palette,onBack:()->Unit){
    val context=LocalContext.current;var releases by remember{mutableStateOf<List<GithubReleaseStat>?>(null)}
    LaunchedEffect(Unit){releases=fetchReleaseStats()}
    Column(Modifier.fillMaxSize().padding(14.dp)){PageHeader(tr("RELEASER & NEDLADDNINGAR","RELEASES & DOWNLOADS"),p,onBack);Spacer(Modifier.height(10.dp));val data=releases;if(data==null){CircularProgressIndicator(color=p.gold,modifier=Modifier.align(Alignment.CenterHorizontally));return@Column};if(data.isEmpty()){Text(tr("Kunde inte hämta GitHub-statistik.","Could not load GitHub statistics."),color=p.pageText);return@Column};Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(p.panel).border(2.dp,p.gold,RoundedCornerShape(12.dp)).padding(14.dp),horizontalAlignment=Alignment.CenterHorizontally){Text(data.sumOf{it.downloads}.toString(),color=p.gold,fontSize=38.sp,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black);Text(tr("TOTALA APK-NEDLADDNINGAR","TOTAL APK DOWNLOADS"),color=readableOn(p.panel),fontWeight=FontWeight.Black,fontSize=11.sp)};Spacer(Modifier.height(9.dp));LazyColumn(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(7.dp)){items(data,key={it.tag}){r->Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(p.paper).border(if(r.latest)2.dp else 1.dp,if(r.latest)p.gold else p.outline,RoundedCornerShape(10.dp)).clickable{runCatching{context.startActivity(Intent(Intent.ACTION_VIEW,Uri.parse(r.url)))}}.padding(12.dp),verticalAlignment=Alignment.CenterVertically){Column(Modifier.weight(1f)){Text(r.name,color=p.text,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,maxLines=2);Text("${r.date}${if(r.latest)" • ${tr("SENASTE","LATEST")}" else ""}",color=p.muted,fontSize=10.sp)};Column(horizontalAlignment=Alignment.CenterHorizontally){Text(r.downloads.toString(),color=p.green,fontSize=23.sp,fontWeight=FontWeight.Black);Text(tr("NEDLADDNINGAR","DOWNLOADS"),color=p.muted,fontSize=7.sp)}}}}}
}

@Composable private fun AdminDashboardCard(p:Palette,data:AdminDashboard?,liveReports:Int,onRefresh:()->Unit,onReleases:()->Unit){
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(p.panel).border(2.dp,p.outline,RoundedCornerShape(12.dp)).padding(12.dp)){
        Row(verticalAlignment=Alignment.CenterVertically){Text(tr("BUBBSUN-STATISTIK","BUBBSUN STATISTICS"),color=readableOn(p.panel),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=18.sp,modifier=Modifier.weight(1f));Text("↻",color=p.gold,fontSize=25.sp,fontWeight=FontWeight.Black,modifier=Modifier.clickable{onRefresh()}.padding(5.dp))}
        if(data==null){Spacer(Modifier.height(12.dp));CircularProgressIndicator(color=p.gold,modifier=Modifier.size(28.dp).align(Alignment.CenterHorizontally));return@Column}
        val values=listOf(tr("Medlemmar","Members") to data.members,tr("Grupper","Groups") to data.groups,tr("Gruppmedlemskap","Memberships") to data.memberships,tr("Delade listor","Shared lists") to data.lists,tr("Poster","Entries") to data.entries,tr("Avbockade","Completed") to data.completed,tr("Tummar","Thumbs") to data.thumbs,tr("Supporters","Supporters") to data.supporters,tr("Nya rapporter","New reports") to liveReports)
        values.chunked(3).forEach{row->Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(6.dp)){row.forEach{(label,value)->Column(Modifier.weight(1f).padding(vertical=7.dp),horizontalAlignment=Alignment.CenterHorizontally){Text(value.toString(),color=p.gold,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=23.sp);Text(label,color=readableOn(p.panel).copy(alpha=.8f),fontSize=9.sp,textAlign=TextAlign.Center,maxLines=2)}}}}
        Spacer(Modifier.height(4.dp));Text("${tr("Aktiva","Active")}: 24h ${data.active24h}  •  7d ${data.active7d}  •  30d ${data.active30d}",color=readableOn(p.panel),fontSize=11.sp,fontWeight=FontWeight.Bold)
        if(data.largestGroup.isNotBlank())Text("★ ${tr("Största grupp","Largest group")}: ${data.largestGroup}",color=readableOn(p.panel).copy(alpha=.8f),fontSize=10.sp,modifier=Modifier.padding(top=5.dp))
        if(data.busiestList.isNotBlank())Text("★ ${tr("Mest fyllda lista","Fullest list")}: ${data.busiestList}",color=readableOn(p.panel).copy(alpha=.8f),fontSize=10.sp)
        Row(Modifier.fillMaxWidth().padding(top=7.dp),verticalAlignment=Alignment.CenterVertically){Text(tr("Privata lokala listor räknas inte här.","Private local lists are not counted here."),color=readableOn(p.panel).copy(alpha=.55f),fontSize=9.sp,modifier=Modifier.weight(1f));Button(onClick=onReleases,shape=RoundedCornerShape(8.dp),colors=ButtonDefaults.buttonColors(containerColor=p.gold,contentColor=readableOn(p.gold)),contentPadding=PaddingValues(horizontal=13.dp,vertical=7.dp)){Text("⇩  ${tr("RELEASER","RELEASES")}",fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=12.sp)}}
    }
}

@Composable private fun AdminMembersScreen(p:Palette,repo:V600Repository,members:List<AdminMemberRecord>,onBack:()->Unit){
    var query by remember { mutableStateOf("") }
    var sort by remember { mutableStateOf("name") }
    var sortMenu by remember { mutableStateOf(false) }
    var page by remember { mutableIntStateOf(0) }
    var editing by remember { mutableStateOf<AdminMemberRecord?>(null) }
    var memberGroups by remember { mutableStateOf<List<AdminMembershipRecord>>(emptyList()) }
    var megaConfirm by remember { mutableStateOf<AdminMemberRecord?>(null) }
    var megaFinalConfirm by remember { mutableStateOf<AdminMemberRecord?>(null) }
    var kickTarget by remember { mutableStateOf<Pair<AdminMemberRecord,AdminMembershipRecord>?>(null) }
    var saveError by remember { mutableStateOf("") }
    LaunchedEffect(editing?.uid){editing?.let{repo.loadAdminMemberships(it.uid){groups->memberGroups=groups}}?:run{memberGroups=emptyList()}}
    val filtered=remember(members,query,sort){
        val found=members.filter{it.displayName.contains(query,true)||it.globalTitle.contains(query,true)}
        when(sort){
            "newest"->found.sortedByDescending{it.createdAt?.seconds?:0L}
            "oldest"->found.sortedBy{it.createdAt?.seconds?:Long.MAX_VALUE}
            else->found.sortedBy{it.displayName.lowercase()}
        }
    }
    val pageSize=if(query.isBlank())20 else 40
    val pages=maxOf(1,(filtered.size+pageSize-1)/pageSize)
    val safePage=page.coerceIn(0,pages-1)
    Column(Modifier.fillMaxSize().padding(14.dp)){
        PageHeader(tr("ALLA MEDLEMMAR","ALL MEMBERS"),p,onBack)
        Spacer(Modifier.height(10.dp))
        Row(horizontalArrangement=Arrangement.spacedBy(7.dp)){
            RetroField(query,{query=it.take(40);page=0},tr("Sök namn eller titel","Search name or title"),Modifier.weight(1f),p)
            Box{
                RetroButton(when(sort){"newest"->tr("NYAST","NEWEST");"oldest"->tr("ÄLDST","OLDEST");else->tr("NAMN","NAME")},{sortMenu=true},p)
                DropdownMenu(sortMenu,{sortMenu=false},containerColor=popupColor(p.paper)){
                    listOf("name" to tr("Namn","Name"),"newest" to tr("Nyaste konto","Newest account"),"oldest" to tr("Äldsta konto","Oldest account")).forEach{(id,label)->
                        DropdownMenuItem({Text(label,color=p.text)},{sort=id;sortMenu=false;page=0})
                    }
                }
            }
        }
        Spacer(Modifier.height(8.dp));Text("${filtered.size} ${tr("konton","accounts")}",color=p.pageMuted,fontSize=11.sp)
        Spacer(Modifier.height(6.dp))
        LazyColumn(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(7.dp)){
            items(filtered.drop(safePage*pageSize).take(pageSize),key={it.uid}){m->
                Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(p.paper).border(1.dp,p.outline,RoundedCornerShape(10.dp)).clickable{editing=m}.padding(10.dp),verticalAlignment=Alignment.CenterVertically){
                    Box(Modifier.size(40.dp).clip(CircleShape).background(if(m.titleColor!=0L)Color(m.titleColor) else p.green),contentAlignment=Alignment.Center){Text(m.displayName.take(1).uppercase(),color=Color.White,fontWeight=FontWeight.Black)}
                    Spacer(Modifier.width(10.dp))
                    Column(Modifier.weight(1f)){
                        Row(verticalAlignment=Alignment.CenterVertically){if(m.supporter){Text("♥",color=p.red,fontSize=13.sp,fontWeight=FontWeight.Black);Spacer(Modifier.width(4.dp))};Text(m.displayName,color=p.text,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,maxLines=1,overflow=TextOverflow.Ellipsis);if(m.megaSuperBoss)Text("  👑",fontSize=13.sp)}
                        if(m.globalTitle.isNotBlank())Text(m.globalTitle,color=if(m.titleColor!=0L)Color(m.titleColor) else p.muted,fontSize=11.sp,fontWeight=FontWeight.Bold)
                        Text(listOfNotNull(if(m.supporter)"♥ SUPPORTER" else null,m.createdAt?.let{SimpleDateFormat("yyyy-MM-dd",Locale.getDefault()).format(it.toDate())}).joinToString(" • "),color=p.muted,fontSize=9.sp)
                    }
                    Text("✎",color=p.text,fontSize=23.sp)
                }
            }
        }
        if(pages>1)Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically){
            RetroButton("‹",{if(page>0)page--},p);Text("${safePage+1} / $pages",color=p.pageText,fontWeight=FontWeight.Bold);RetroButton("›",{if(page<pages-1)page++},p)
        }
    }
    editing?.let{member->
        var title by remember(member.uid){mutableStateOf(member.globalTitle)}
        var color by remember(member.uid){mutableLongStateOf(if(member.titleColor!=0L)member.titleColor else userColors.first())}
        var supportEnabled by remember(member.uid){mutableStateOf(member.supporter)}
        AlertDialog(
            onDismissRequest={editing=null},containerColor=popupColor(p.paper),
            title={Text(member.displayName,color=p.text,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black)},
            text={Column(Modifier.heightIn(max=520.dp).verticalScroll(rememberScrollState())){
                Text(member.uid,color=p.muted,fontSize=8.sp,fontFamily=FontFamily.Monospace)
                Spacer(Modifier.height(8.dp))
                Text(tr("UNIK TITEL","UNIQUE TITLE"),color=p.text,fontWeight=FontWeight.Black,fontSize=11.sp);Spacer(Modifier.height(5.dp))
                RetroField(title,{title=it.take(40)},tr("Ingen titel","No title"),Modifier.fillMaxWidth(),p);Spacer(Modifier.height(10.dp))
                Text(tr("TITELFÄRG","TITLE COLOR"),color=p.text,fontWeight=FontWeight.Black,fontSize=11.sp)
                userColors.chunked(8).forEach{colorRow->Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){colorRow.forEach{c->Box(Modifier.size(29.dp).clip(CircleShape).background(Color(c)).border(if(color==c)4.dp else 1.dp,if(color==c)p.text else p.outline,CircleShape).clickable{color=c})}}}
                if(saveError.isNotBlank()){Spacer(Modifier.height(7.dp));Text(saveError,color=p.red,fontWeight=FontWeight.Bold,fontSize=11.sp)}
                Spacer(Modifier.height(12.dp));Text(tr("GRUPPER","GROUPS"),color=p.text,fontWeight=FontWeight.Black,fontSize=11.sp)
                if(memberGroups.isEmpty())Text(tr("Inga grupper","No groups"),color=p.muted,fontSize=11.sp)
                memberGroups.forEach{g->Row(Modifier.fillMaxWidth().padding(top=5.dp).clip(RoundedCornerShape(8.dp)).background(p.paper2).padding(8.dp),verticalAlignment=Alignment.CenterVertically){Box(Modifier.size(25.dp).clip(CircleShape).background(Color(g.color)));Spacer(Modifier.width(7.dp));Column(Modifier.weight(1f)){Text(g.groupName,color=p.text,fontWeight=FontWeight.Bold,fontSize=12.sp);Text(g.role.uppercase(),color=p.muted,fontSize=8.sp)};if(g.role!="superboss"){Text(if(g.role=="boss")"−★" else "+★",color=p.gold,fontSize=16.sp,fontWeight=FontWeight.Black,modifier=Modifier.clickable{repo.setAdminGroupRole(member.uid,g,if(g.role=="boss")"member" else "boss"){if(it)repo.loadAdminMemberships(member.uid){memberGroups=it}}}.padding(5.dp));Text("✕",color=p.red,fontSize=16.sp,fontWeight=FontWeight.Black,modifier=Modifier.clickable{kickTarget=member to g}.padding(5.dp))}}}
                Spacer(Modifier.height(10.dp));Row(verticalAlignment=Alignment.CenterVertically){Column(Modifier.weight(1f)){Text(tr("BLOCKERAD","BLOCKED"),color=p.text,fontWeight=FontWeight.Black);Text(tr("Stoppar kontots åtkomst","Stops account access"),color=p.muted,fontSize=9.sp)};Switch(member.suspended,{if(!member.founder)repo.setMemberSuspended(member.uid,it){}},enabled=!member.founder)}
                Row(verticalAlignment=Alignment.CenterVertically){Column(Modifier.weight(1f)){Text("♥ SUPPORTER",color=p.text,fontWeight=FontWeight.Black);Text(tr("Tilldela eller ta bort supporterstatus","Grant or remove supporter status"),color=p.muted,fontSize=9.sp)};Switch(supportEnabled,{next->repo.setAdminSupporter(member.uid,next){ok->if(ok)supportEnabled=next else saveError=tr("Kunde inte ändra supporterstatus.","Could not change supporter status.")}})}
                Row(verticalAlignment=Alignment.CenterVertically){Column(Modifier.weight(1f)){Text("MEGASUPERBOSS",color=p.text,fontWeight=FontWeight.Black);Text(if(member.founder)tr("Grundaren kan inte ändras","The founder cannot be changed") else tr("Global administratör","Global administrator"),color=p.muted,fontSize=9.sp)};Switch(member.megaSuperBoss,{if(!member.founder)megaConfirm=member},enabled=!member.founder)}
            }},
            confirmButton={RetroButton(tr("SPARA","SAVE"),{saveError="";repo.setAdminMemberTitle(member.uid,title,color){if(it)editing=null else saveError=tr("Titeln kunde inte sparas. Kontrollera anslutning och behörighet.","The title could not be saved. Check connection and permissions.")}},p)},
            dismissButton={RetroButton(tr("AVBRYT","CANCEL"),{editing=null},p,danger=true)}
        )
    }
    megaConfirm?.let{m->ConfirmDialog(tr("Är du säker?","Are you sure?"),if(m.megaSuperBoss)tr("Ta bort MegaSuperBoss från ${m.displayName}?","Remove MegaSuperBoss from ${m.displayName}?") else tr("Ge ${m.displayName} full global adminbehörighet?","Give ${m.displayName} full global admin access?"),p,{megaConfirm=null},{megaConfirm=null;megaFinalConfirm=m},confirmLabel=tr("FORTSÄTT","CONTINUE"))}
    megaFinalConfirm?.let{m->ConfirmDialog(tr("Är du VERKLIGEN säker?","Are you REALLY sure?"),tr("Detta ger mycket stor behörighet i hela Bubbsun.","This grants extensive access throughout Bubbsun."),p,{megaFinalConfirm=null},{repo.setMemberMegaSuperBoss(m.uid,!m.megaSuperBoss){};megaFinalConfirm=null;editing=null},confirmLabel=tr("JA, JAG ÄR SÄKER","YES, I AM SURE"))}
    kickTarget?.let{(m,g)->ConfirmDialog(tr("Kicka från gruppen?","Remove from group?"),"${m.displayName} • ${g.groupName}",p,{kickTarget=null},{repo.adminRemoveFromGroup(m.uid,g){};kickTarget=null;repo.loadAdminMemberships(m.uid){memberGroups=it}},confirmLabel=tr("KICKA","REMOVE"))}
}

@Composable
private fun AboutScreen(p: Palette, supporterEnabled:Boolean, onSupporterInfo:()->Unit,onVersions:()->Unit,onHelp:()->Unit,onPrivacy:()->Unit,onProblem:()->Unit,onSuggestion:()->Unit,onBack: () -> Unit) {
    val scroll = rememberScrollState()
    var ducksVisible by remember { mutableStateOf(false) }
    var tapCount by remember { mutableStateOf(0) }
    var lastTap by remember { mutableStateOf(0L) }
    var danielMode by remember{mutableIntStateOf(0)};var sanjaMode by remember{mutableIntStateOf(0)}
    var danielTaps by remember{mutableIntStateOf(0)};var sanjaTaps by remember{mutableIntStateOf(0)}
    var danielLast by remember{mutableLongStateOf(0L)};var sanjaLast by remember{mutableLongStateOf(0L)}
    var danielBounds by remember{mutableStateOf(androidx.compose.ui.geometry.Rect.Zero)}
    var sanjaBounds by remember{mutableStateOf(androidx.compose.ui.geometry.Rect.Zero)}
    var frasseOrigin by remember{mutableStateOf(Offset.Zero)}
    var frasseDragPosition by remember{mutableStateOf(Offset.Zero)}
    var draggingFrasse by remember{mutableStateOf(false)}
    var frasseParty by remember{mutableStateOf(false)}
    fun portraitTap(daniel:Boolean){
        val now=System.currentTimeMillis()
        if(daniel){danielTaps=if(now-danielLast<650)danielTaps+1 else 1;danielLast=now;if(danielTaps>=6)danielMode=2 else if(danielTaps>=3)danielMode=1}
        else{sanjaTaps=if(now-sanjaLast<650)sanjaTaps+1 else 1;sanjaLast=now;if(sanjaTaps>=6)sanjaMode=2 else if(sanjaTaps>=3)sanjaMode=1}
    }

    Box(Modifier.fillMaxSize()) {
    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(scroll)
            .padding(14.dp)
    ) {
        PageHeader(tr("OM BUBBSUN","ABOUT BUBBSUN"), p, onBack)
        Spacer(Modifier.height(12.dp))

        Row(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(p.panel)
                .border(1.dp, p.outline, RoundedCornerShape(12.dp))
                .padding(12.dp),
            verticalAlignment = Alignment.Top
        ) {
            Column(Modifier.weight(1.35f)) {
                CreditRow(R.drawable.about_man, "Daniel Grandin", tr("Utveckling & design","Development & design"), p,spinning=danielMode==1,hidden=danielMode==2,onIconTap={portraitTap(true)},onBounds={danielBounds=it})
                DottedDivider(p)
                CreditRow(R.drawable.about_woman, "Sanja Kropsu", tr("Idéer, testning & feedback","Ideas, testing & feedback"), p,spinning=sanjaMode==1,hidden=sanjaMode==2,onIconTap={portraitTap(false)},onBounds={sanjaBounds=it})
                DottedDivider(p)
                CreditRow(R.drawable.about_paws, "Frasse", tr("Support & kvalitetskontroll","Support & quality control"), p)
            }

            Spacer(Modifier.width(8.dp))
            Image(
                painter = painterResource(id = R.drawable.frasse),
                contentDescription = tr("Frasse","Frasse"),
                contentScale = ContentScale.Fit,
                modifier = Modifier
                    .weight(.75f)
                    .heightIn(min = 180.dp, max = 270.dp)
                    .onGloballyPositioned { frasseOrigin=it.positionInRoot() }
                    .pointerInput(Unit) {
                        awaitEachGesture {
                            val down=awaitFirstDown(requireUnconsumed=false)
                            var released=false
                            val armed=withTimeoutOrNull(3000L){
                                while(!released){
                                    val event=awaitPointerEvent()
                                    released=event.changes.none{it.pressed}
                                }
                                false
                            } ?: true
                            if(armed){
                                draggingFrasse=true
                                frasseDragPosition=frasseOrigin+down.position
                                var active=true
                                while(active){
                                    val event=awaitPointerEvent();val change=event.changes.first()
                                    frasseDragPosition=frasseOrigin+change.position
                                    if(!change.pressed){
                                        active=false;draggingFrasse=false
                                        if(danielBounds.contains(frasseDragPosition)||sanjaBounds.contains(frasseDragPosition))frasseParty=true
                                    }else change.consume()
                                }
                            }else{
                                val now=System.currentTimeMillis();tapCount=if(now-lastTap<700)tapCount+1 else 1;lastTap=now
                                if(tapCount>=3){ducksVisible=true;tapCount=0}
                            }
                        }
                    }
            )
        }

        Spacer(Modifier.height(12.dp))

        Column(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(11.dp))
                .background(p.panel)
                .border(1.dp, p.outline, RoundedCornerShape(11.dp))
                .padding(14.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(tr("★  OM BUBBSUN  ★","★  ABOUT BUBBSUN  ★"), color = p.gold, fontFamily = FontFamily.Serif, fontWeight = FontWeight.Black, fontSize = 18.sp)
            Spacer(Modifier.height(8.dp))
            Text(
                tr("Bubbsun skapades för att göra inköpslistor enkla, snabba och lite roligare – med en unik retrokänsla.","Bubbsun was created to make shopping lists simple, fast and a little more fun – with a unique retro feel."),
                color = readableOn(p.panel),
                fontSize = 16.sp,
                lineHeight = 22.sp,
                textAlign = TextAlign.Center
            )
        }

        Spacer(Modifier.height(12.dp))
        AboutActionButton(R.drawable.about_bug, tr("RAPPORTERA PROBLEM","REPORT A PROBLEM"), tr("Hjälp oss att göra Bubbsun ännu bättre","Help us make Bubbsun even better"), Color(0xFF6B281D), p,onProblem)
        Spacer(Modifier.height(9.dp))
        AboutActionButton(R.drawable.about_idea, tr("SKICKA FÖRSLAG","SEND SUGGESTION"), tr("Har du en idé? Vi vill gärna höra den!","Have an idea? We would love to hear it!"), p.green, p,onSuggestion)
        Spacer(Modifier.height(9.dp))
        AboutActionButton(R.drawable.list_checklist,tr("VERSIONER & NYHETER","VERSIONS & NEWS"),"Patch notes • v${BuildConfig.VERSION_NAME}",p.green,p,onVersions)
        Spacer(Modifier.height(9.dp))
        AboutActionButton(R.drawable.about_info,tr("HJÄLP & GUIDER","HELP & GUIDES"),tr("Lär dig alla funktioner","Learn every feature"),p.green,p,onHelp)
        Spacer(Modifier.height(9.dp))
        AboutActionButton(R.drawable.about_info,tr("INTEGRITET & MOLNDATA","PRIVACY & CLOUD DATA"),tr("Så skyddas och används dina uppgifter","How your data is protected and used"),p.panel,p,onPrivacy)
        Spacer(Modifier.height(9.dp))
        AboutActionButton(R.drawable.theme_heart,if(supporterEnabled)"SUPPORTERSTATUS" else tr("STÖD BUBBSUN","SUPPORT BUBBSUN"),if(supporterEnabled)"♥ FOUNDING SUPPORTER" else tr("GRATIS UNDER FÖRHANDSVISNINGEN","Free during preview"),p.panel,p,onSupporterInfo)

        Spacer(Modifier.height(14.dp))
        Column(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .background(p.panel)
                .border(1.dp, p.outline, RoundedCornerShape(10.dp))
                .padding(13.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("v${BuildConfig.VERSION_NAME} • $editionName", color = p.gold, fontFamily = FontFamily.Serif, fontSize = 15.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            if(supporterEnabled){
                Spacer(Modifier.height(7.dp))
                Text("♥  FOUNDING SUPPORTER",color=p.gold,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=12.sp,modifier=Modifier.clip(RoundedCornerShape(50)).background(p.gold.copy(alpha=.14f)).border(1.dp,p.gold,RoundedCornerShape(50)).clickable{onSupporterInfo()}.padding(horizontal=12.dp,vertical=5.dp))
            }
            Spacer(Modifier.height(5.dp))
            Text("© 2026 Bubbsun", color = p.gold, fontFamily = FontFamily.Serif, fontSize = 15.sp)
        }
        Spacer(Modifier.height(12.dp))
    }
    if(ducksVisible) DuckOverlay()
    if(frasseParty)FrasseFamilyBounceOverlay()
    else if(danielMode==2||sanjaMode==2)PortraitBounceOverlay(danielMode==2,sanjaMode==2)
    if(draggingFrasse)Image(painterResource(R.drawable.frasse),null,contentScale=ContentScale.Fit,modifier=Modifier.size(82.dp).graphicsLayer{translationX=frasseDragPosition.x-41.dp.toPx();translationY=frasseDragPosition.y-50.dp.toPx();shadowElevation=12.dp.toPx()})
    }
}

@Composable
private fun CreditRow(icon: Int, name: String, role: String, p: Palette, compact: Boolean = false,spinning:Boolean=false,hidden:Boolean=false,onIconTap:()->Unit={},onBounds:(androidx.compose.ui.geometry.Rect)->Unit={}) {
    val rotation=if(spinning){val t=rememberInfiniteTransition(label="portraitSpin");t.animateFloat(0f,360f,infiniteRepeatable(tween(650,easing=LinearEasing)),label="spin").value}else 0f
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 7.dp).onGloballyPositioned{onBounds(it.boundsInRoot())}) {
        Box(
            Modifier
                .size(if (compact) 40.dp else 46.dp)
                .clip(CircleShape)
                .border(1.dp, p.gold, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            if(!hidden)Image(painterResource(icon),null,contentScale=ContentScale.Crop,modifier=Modifier.fillMaxSize().graphicsLayer{scaleX=1.04f;scaleY=1.04f;rotationZ=rotation}.clickable{onIconTap()})
            Box(Modifier.matchParentSize().border(1.dp,p.gold,CircleShape))
        }
        Spacer(Modifier.width(9.dp))
        Column(Modifier.weight(1f)) {
            Text(name, color = readableOn(p.panel), fontFamily = FontFamily.Serif, fontWeight = FontWeight.Black, fontSize = if (compact) 14.sp else 16.sp, maxLines = 1)
            Text(role, color = p.gold, fontSize = if (compact) 11.sp else 12.sp, lineHeight = 15.sp)
        }
    }
}

@Composable
private fun DottedDivider(p: Palette) {
    Canvas(Modifier.fillMaxWidth().height(1.dp)) {
        val dot = 1.dp.toPx()
        var x = 0f
        while (x < size.width) {
            drawCircle(p.outline, radius = dot, center = androidx.compose.ui.geometry.Offset(x, size.height / 2))
            x += 6.dp.toPx()
        }
    }
}

@Composable
private fun AboutActionButton(icon: Int, title: String, subtitle: String, background: Color, p: Palette, onClick: () -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(background)
            .border(1.dp, p.gold, RoundedCornerShape(10.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Image(painterResource(icon),null,Modifier.size(34.dp))
        Spacer(Modifier.width(11.dp))
        Column(Modifier.weight(1f)) {
            Text(title, color = readableOn(background), fontFamily = FontFamily.Serif, fontWeight = FontWeight.Black, fontSize = 16.sp)
            Text(subtitle, color = readableOn(background).copy(alpha=.76f), fontSize = 12.sp)
        }
        Text("›", color = p.gold, fontSize = 34.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable private fun PageHeader(title:String,p:Palette,onBack:()->Unit,trailing: (@Composable () -> Unit)? = null,homeOnly:Boolean=false){
    val onHome=LocalHomeAction.current
    val showHomeInsteadOfBack=homeOnly||LocalBackIsHome.current
    Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically){
        if(showHomeInsteadOfBack) PageHome(onHome,p) else PageBack(onBack,p)
        Spacer(Modifier.width(7.dp))
        BoxWithConstraints(Modifier.weight(1f)){val size=when{maxWidth<145.dp->13.sp;maxWidth<205.dp->16.sp;title.length>20->18.sp;else->24.sp};Text(title.uppercase(),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=size,lineHeight=size*1.08f,maxLines=1,overflow=TextOverflow.Ellipsis,color=p.pageText)}
        trailing?.invoke()
        if(!showHomeInsteadOfBack){
            Spacer(Modifier.width(6.dp))
            Button(onClick=onHome,shape=RoundedCornerShape(9.dp),colors=ButtonDefaults.buttonColors(containerColor=p.panel,contentColor=readableOn(p.panel)),contentPadding=PaddingValues(0.dp),modifier=Modifier.size(43.dp).border(2.dp,p.outline,RoundedCornerShape(9.dp))){Image(painterResource(R.drawable.list_home),null,contentScale=ContentScale.Fit,modifier=Modifier.size(31.dp))}
        }
    }
}
@Composable private fun PageHome(onHome:()->Unit,p:Palette){
    Button(onClick=onHome,shape=RoundedCornerShape(9.dp),colors=ButtonDefaults.buttonColors(containerColor=p.panel),contentPadding=PaddingValues(0.dp),modifier=Modifier.size(58.dp).border(2.dp,p.outline,RoundedCornerShape(9.dp))){
        Image(painterResource(R.drawable.list_home),null,contentScale=ContentScale.Fit,modifier=Modifier.size(45.dp))
    }
}
@Composable private fun PageBack(onBack:()->Unit,p:Palette){
    Button(onClick=onBack,shape=RoundedCornerShape(9.dp),colors=ButtonDefaults.buttonColors(containerColor=p.panel),contentPadding=PaddingValues(0.dp),modifier=Modifier.size(58.dp).border(2.dp,p.outline,RoundedCornerShape(9.dp))){
        Image(painterResource(R.drawable.control_back),null,contentScale=ContentScale.Fit,modifier=Modifier.size(43.dp))
    }
}

@Composable
private fun InputPanel(
    product: String,
    onProductChange: (String) -> Unit,
    quantity: String,
    onQuantityChange: (String) -> Unit,
    onAdd: () -> Unit,
    expanded: Boolean,
    onExpandedChange: (Boolean) -> Unit,
    p: Palette
) {
    Column(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(p.panel)
            .border(1.dp,p.outline,RoundedCornerShape(10.dp)).padding(10.dp)
    ) {
        Row(verticalAlignment=Alignment.CenterVertically){
            Text(tr("LÄGG TILL PRODUKT","ADD PRODUCT"),color=readableOn(p.panel),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=13.sp,modifier=Modifier.weight(1f))
            Box(Modifier.size(32.dp).clip(RoundedCornerShape(7.dp)).background(p.gold.copy(alpha=.15f)).border(1.dp,p.outline,RoundedCornerShape(7.dp)).clickable{onExpandedChange(!expanded)},contentAlignment=Alignment.Center){Text(if(expanded)"−" else "+",color=readableOn(p.panel),fontSize=22.sp,fontWeight=FontWeight.Black)}
        }
        if(expanded){
            Spacer(Modifier.height(8.dp))
            BoxWithConstraints(Modifier.fillMaxWidth()){
                val narrow=maxWidth<350.dp;val gap=8.dp
                Row(verticalAlignment=Alignment.Bottom){
                    Column(Modifier.weight(1.38f)){RetroField(product,onProductChange,tr("Namn","Name"),Modifier.fillMaxWidth().height(54.dp),p,onDone=onAdd,leading="product")}
                    Spacer(Modifier.width(gap))
                    Column(Modifier.weight(1f)){RetroField(quantity,onQuantityChange,tr("Mängd (valfritt)","Quantity (optional)"),Modifier.fillMaxWidth().height(54.dp),p,onDone=onAdd,placeholderSize=if(narrow)9.sp else 10.sp,leading="balance")}
                    Spacer(Modifier.width(gap));RetroButton("✓",onAdd,p,modifier=Modifier.size(54.dp),compact=true)
                }
            }
        }
    }
}

@Composable
private fun InputLabel(icon: String, text: String, p: Palette) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        if (icon == "balance") {
            BalanceScaleIcon(color = p.gold, modifier = Modifier.size(16.dp))
        } else if (icon == "product") {
            ProductBoxIcon(color = p.gold, modifier = Modifier.size(16.dp))
        } else {
            Text(icon, color = p.gold, fontFamily = FontFamily.Serif, fontWeight = FontWeight.Black, fontSize = 15.sp)
        }
        Spacer(Modifier.width(5.dp))
        Text(
            text = text,
            color = p.gold,
            fontFamily = FontFamily.Serif,
            fontWeight = FontWeight.Black,
            fontSize = 13.sp,
            maxLines = 1
        )
        Spacer(Modifier.width(7.dp))
        HorizontalDivider(
            modifier = Modifier.weight(1f),
            thickness = 1.dp,
            color = p.gold
        )
    }
}


@Composable
private fun EditListDialog(list:ShoppingListData,p:Palette,supporterEnabled:Boolean,onSupporterInfo:()->Unit,onDismiss:()->Unit,onSave:(String,String,Long)->Unit){
    var name by remember{mutableStateOf(list.name.take(40))}
    var icon by remember{mutableStateOf(list.icon)}
    var color by remember{mutableStateOf(list.iconColorHex)}
    AlertDialog(onDismissRequest=onDismiss,containerColor=popupColor(p.paper),
        title={Text(tr("REDIGERA LISTA","EDIT LIST"),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,color=p.text)},
        text={Column(Modifier.heightIn(max=520.dp).verticalScroll(rememberScrollState())){
            RetroField(name,{name=it.take(40)},tr("Listnamn","List name"),Modifier.fillMaxWidth(),p)
            Spacer(Modifier.height(12.dp));Text(tr("VÄLJ FÄRG","CHOOSE COLOR"),fontWeight=FontWeight.Black,color=p.text)
            Spacer(Modifier.height(7.dp));Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){iconColors.forEach{c->Box(Modifier.size(38.dp).clip(CircleShape).background(Color(c)).border(if(c==color)4.dp else 1.dp,if(c==color)p.gold else p.outline,CircleShape).clickable{color=c})}}
            Spacer(Modifier.height(12.dp));Text(tr("VÄLJ IKON","CHOOSE ICON"),fontWeight=FontWeight.Black,color=p.text)
            Spacer(Modifier.height(7.dp));listIcons.chunked(4).forEach{row->Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(7.dp)){row.forEach{i->val selected=i.id==icon;val locked=i.supporter&&!supporterEnabled;Box(Modifier.weight(1f).aspectRatio(1f).clip(RoundedCornerShape(8.dp)).background(if(selected)Color(color) else p.paper2).border(if(selected)3.dp else 1.dp,if(selected)p.gold else p.outline,RoundedCornerShape(8.dp)).clickable{if(locked)onSupporterInfo()else icon=i.id},contentAlignment=Alignment.Center){ListIconVisual(i.id,Modifier.fillMaxSize().padding(5.dp),locked)}}};Spacer(Modifier.height(7.dp))}
        }},
        confirmButton={RetroButton(tr("SPARA","SAVE"),{if(name.isNotBlank())onSave(name,icon,color)},p)},
        dismissButton={RetroButton(tr("AVBRYT","CANCEL"),onDismiss,p,danger=true)})
}

@Composable
private fun ProductBoxIcon(color:Color,modifier:Modifier=Modifier){
    Canvas(modifier){
        val sw=1.5.dp.toPx()
        val left=size.width*.18f;val right=size.width*.82f;val top=size.height*.25f;val bottom=size.height*.82f
        drawRect(color,topLeft=androidx.compose.ui.geometry.Offset(left,top),size=androidx.compose.ui.geometry.Size(right-left,bottom-top),style=Stroke(sw))
        drawLine(color,androidx.compose.ui.geometry.Offset(left,top),androidx.compose.ui.geometry.Offset(size.width*.5f,size.height*.08f),sw,StrokeCap.Round)
        drawLine(color,androidx.compose.ui.geometry.Offset(right,top),androidx.compose.ui.geometry.Offset(size.width*.5f,size.height*.08f),sw,StrokeCap.Round)
        drawLine(color,androidx.compose.ui.geometry.Offset(size.width*.5f,size.height*.08f),androidx.compose.ui.geometry.Offset(size.width*.5f,bottom),sw,StrokeCap.Round)
    }
}

@Composable private fun PortraitBounceOverlay(showDaniel:Boolean,showSanja:Boolean){
    BoxWithConstraints(Modifier.fillMaxSize()){
        val density=LocalDensity.current;val width=with(density){maxWidth.toPx()};val height=with(density){maxHeight.toPx()};val portrait=with(density){62.dp.toPx()}
        var dx by remember{mutableFloatStateOf(width*.18f)};var dy by remember{mutableFloatStateOf(height*.22f)};var sx by remember{mutableFloatStateOf(width*.70f)};var sy by remember{mutableFloatStateOf(height*.35f)}
        var dvx by remember{mutableFloatStateOf(5.2f)};var dvy by remember{mutableFloatStateOf(4.1f)};var svx by remember{mutableFloatStateOf(-4.7f)};var svy by remember{mutableFloatStateOf(5.0f)}
        var poff by remember{mutableStateOf(false)};var gone by remember{mutableStateOf(false)};var heartX by remember{mutableFloatStateOf(0f)};var heartY by remember{mutableFloatStateOf(0f)}
        LaunchedEffect(showDaniel,showSanja,width,height){
            while(!gone){
                if(showDaniel){dx+=dvx;dy+=dvy;if(dx<0||dx>width-portrait){dvx=-dvx;dx=dx.coerceIn(0f,width-portrait)};if(dy<0||dy>height-portrait){dvy=-dvy;dy=dy.coerceIn(0f,height-portrait)}}
                if(showSanja){sx+=svx;sy+=svy;if(sx<0||sx>width-portrait){svx=-svx;sx=sx.coerceIn(0f,width-portrait)};if(sy<0||sy>height-portrait){svy=-svy;sy=sy.coerceIn(0f,height-portrait)}}
                if(showDaniel&&showSanja&&!poff&&kotlin.math.hypot((dx-sx).toDouble(),(dy-sy).toDouble())<portrait*.72){heartX=(dx+sx)/2;heartY=(dy+sy)/2;poff=true;delay(650);gone=true}
                delay(16)
            }
        }
        if(!gone&&!poff&&showDaniel)Image(painterResource(R.drawable.about_man),null,contentScale=ContentScale.Crop,modifier=Modifier.size(62.dp).graphicsLayer{translationX=dx;translationY=dy}.clip(CircleShape).border(2.dp,Color(0xFFFFC1DD),CircleShape))
        if(!gone&&!poff&&showSanja)Image(painterResource(R.drawable.about_woman),null,contentScale=ContentScale.Crop,modifier=Modifier.size(62.dp).graphicsLayer{translationX=sx;translationY=sy}.clip(CircleShape).border(2.dp,Color(0xFFFFC1DD),CircleShape))
        if(poff&&!gone)Column(Modifier.graphicsLayer{translationX=heartX-55.dp.toPx();translationY=heartY-38.dp.toPx()},horizontalAlignment=Alignment.CenterHorizontally){Text("💗💖💕",fontSize=34.sp);Text("POFF!",fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,color=Color(0xFFFFD5E6),fontSize=20.sp)}
    }
}

private data class HeartBurst(val id:Long,val x:Float,val y:Float,val born:Long)

@Composable private fun FrasseFamilyBounceOverlay(){
    BoxWithConstraints(Modifier.fillMaxSize()){
        val density=LocalDensity.current
        val width=constraints.maxWidth.toFloat();val height=constraints.maxHeight.toFloat();val size=with(density){68.dp.toPx()}
        var dx by remember{mutableFloatStateOf(width*.12f)};var dy by remember{mutableFloatStateOf(height*.18f)}
        var sx by remember{mutableFloatStateOf(width*.68f)};var sy by remember{mutableFloatStateOf(height*.30f)}
        var fx by remember{mutableFloatStateOf(width*.42f)};var fy by remember{mutableFloatStateOf(height*.58f)}
        var dvx by remember{mutableFloatStateOf(185f)};var dvy by remember{mutableFloatStateOf(145f)}
        var svx by remember{mutableFloatStateOf(-170f)};var svy by remember{mutableFloatStateOf(190f)}
        var fvx by remember{mutableFloatStateOf(205f)};var fvy by remember{mutableFloatStateOf(-165f)}
        var lastDS by remember{mutableLongStateOf(0L)};var lastDF by remember{mutableLongStateOf(0L)};var lastSF by remember{mutableLongStateOf(0L)}
        val bursts=remember{mutableStateListOf<HeartBurst>()}
        LaunchedEffect(width,height){
            var last=withFrameNanos{it}
            while(true){
                val frame=withFrameNanos{it};val dt=((frame-last)/1_000_000_000f).coerceAtMost(.035f);last=frame
                dx+=dvx*dt;dy+=dvy*dt;sx+=svx*dt;sy+=svy*dt;fx+=fvx*dt;fy+=fvy*dt
                val maxX=(width-size).coerceAtLeast(0f);val maxY=(height-size).coerceAtLeast(0f)
                if(dx<=0){dx=0f;dvx=abs(dvx)}else if(dx>=maxX){dx=maxX;dvx=-abs(dvx)};if(dy<=0){dy=0f;dvy=abs(dvy)}else if(dy>=maxY){dy=maxY;dvy=-abs(dvy)}
                if(sx<=0){sx=0f;svx=abs(svx)}else if(sx>=maxX){sx=maxX;svx=-abs(svx)};if(sy<=0){sy=0f;svy=abs(svy)}else if(sy>=maxY){sy=maxY;svy=-abs(svy)}
                if(fx<=0){fx=0f;fvx=abs(fvx)}else if(fx>=maxX){fx=maxX;fvx=-abs(fvx)};if(fy<=0){fy=0f;fvy=abs(fvy)}else if(fy>=maxY){fy=maxY;fvy=-abs(fvy)}
                val now=System.currentTimeMillis();val hit=size*.78f
                if(now-lastDS>420&&kotlin.math.hypot((dx-sx).toDouble(),(dy-sy).toDouble())<hit){val tx=dvx;val ty=dvy;dvx=svx;dvy=svy;svx=tx;svy=ty;lastDS=now;bursts+=HeartBurst(now,((dx+sx)/2)+size/2,((dy+sy)/2)+size/2,now)}
                if(now-lastDF>420&&kotlin.math.hypot((dx-fx).toDouble(),(dy-fy).toDouble())<hit){val tx=dvx;val ty=dvy;dvx=fvx;dvy=fvy;fvx=tx;fvy=ty;lastDF=now;bursts+=HeartBurst(now+1,((dx+fx)/2)+size/2,((dy+fy)/2)+size/2,now)}
                if(now-lastSF>420&&kotlin.math.hypot((sx-fx).toDouble(),(sy-fy).toDouble())<hit){val tx=svx;val ty=svy;svx=fvx;svy=fvy;fvx=tx;fvy=ty;lastSF=now;bursts+=HeartBurst(now+2,((sx+fx)/2)+size/2,((sy+fy)/2)+size/2,now)}
                bursts.removeAll{now-it.born>700}
            }
        }
        Image(painterResource(R.drawable.about_man),null,contentScale=ContentScale.Crop,modifier=Modifier.size(68.dp).graphicsLayer{translationX=dx;translationY=dy}.clip(CircleShape).border(2.dp,Color(0xFFFFC1DD),CircleShape))
        Image(painterResource(R.drawable.about_woman),null,contentScale=ContentScale.Crop,modifier=Modifier.size(68.dp).graphicsLayer{translationX=sx;translationY=sy}.clip(CircleShape).border(2.dp,Color(0xFFFFC1DD),CircleShape))
        Image(painterResource(R.drawable.frasse),null,contentScale=ContentScale.Fit,modifier=Modifier.size(68.dp).graphicsLayer{translationX=fx;translationY=fy})
        bursts.forEach{b->val age=((System.currentTimeMillis()-b.born)/700f).coerceIn(0f,1f);Text("💕💗",fontSize=(25-age*8).sp,modifier=Modifier.graphicsLayer{translationX=b.x-35.dp.toPx();translationY=b.y-28.dp.toPx();alpha=1f-age;scaleX=1f+age*.5f;scaleY=1f+age*.5f})}
    }
}

@Composable
private fun DuckOverlay(){
    BoxWithConstraints(Modifier.fillMaxSize()){
        val width=constraints.maxWidth.toFloat()
        val height=constraints.maxHeight.toFloat()
        val seeds=remember{List(12){i->
            val r=Random(i*7919+330)
            DuckSeed(
                startX=r.nextFloat()*(width.coerceAtLeast(1f)-70f).coerceAtLeast(1f),
                startY=r.nextFloat()*(height.coerceAtLeast(1f)-70f).coerceAtLeast(1f),
                vx=(90f+r.nextFloat()*130f)*(if(r.nextBoolean())1 else -1),
                vy=(80f+r.nextFloat()*140f)*(if(r.nextBoolean())1 else -1),
                size=22+r.nextInt(8),
                spin=(35f+r.nextFloat()*90f)*(if(r.nextBoolean())1 else -1)
            )
        }}
        seeds.forEachIndexed{i,d->BouncingDuck(i,d,width,height)}
    }
}

private data class DuckSeed(val startX:Float,val startY:Float,val vx:Float,val vy:Float,val size:Int,val spin:Float)

@Composable
private fun BouncingDuck(index:Int,seed:DuckSeed,width:Float,height:Float){
    var x by remember(index,width){mutableStateOf(seed.startX.coerceIn(0f,(width-55f).coerceAtLeast(0f)))}
    var y by remember(index,height){mutableStateOf(seed.startY.coerceIn(0f,(height-55f).coerceAtLeast(0f)))}
    var vx by remember(index){mutableStateOf(seed.vx)}
    var vy by remember(index){mutableStateOf(seed.vy)}
    var rotation by remember(index){mutableStateOf(0f)}
    LaunchedEffect(index,width,height){
        var last=withFrameNanos{it}
        while(true){
            val now=withFrameNanos{it}
            val dt=((now-last)/1_000_000_000f).coerceAtMost(.035f);last=now
            x+=vx*dt;y+=vy*dt;rotation=(rotation+seed.spin*dt)%360f
            val maxX=(width-58f).coerceAtLeast(0f);val maxY=(height-58f).coerceAtLeast(0f)
            if(x<=0f){x=0f;vx=abs(vx)} else if(x>=maxX){x=maxX;vx=-abs(vx)}
            if(y<=0f){y=0f;vy=abs(vy)} else if(y>=maxY){y=maxY;vy=-abs(vy)}
        }
    }
    Text("🦆",fontSize=seed.size.sp,modifier=Modifier.graphicsLayer{translationX=x;translationY=y;rotationZ=rotation})
}

@Composable
private fun BalanceScaleIcon(color: Color, modifier: Modifier = Modifier) {
    Canvas(modifier) {
        val sw = 1.5.dp.toPx()
        val cx = size.width * .5f
        drawLine(color, androidx.compose.ui.geometry.Offset(cx, size.height * .14f), androidx.compose.ui.geometry.Offset(cx, size.height * .78f), sw, StrokeCap.Round)
        drawLine(color, androidx.compose.ui.geometry.Offset(size.width * .18f, size.height * .32f), androidx.compose.ui.geometry.Offset(size.width * .82f, size.height * .32f), sw, StrokeCap.Round)
        drawLine(color, androidx.compose.ui.geometry.Offset(size.width * .34f, size.height * .32f), androidx.compose.ui.geometry.Offset(size.width * .22f, size.height * .60f), sw, StrokeCap.Round)
        drawLine(color, androidx.compose.ui.geometry.Offset(size.width * .66f, size.height * .32f), androidx.compose.ui.geometry.Offset(size.width * .78f, size.height * .60f), sw, StrokeCap.Round)
        drawArc(color, 0f, 180f, false, androidx.compose.ui.geometry.Offset(size.width * .08f, size.height * .50f), androidx.compose.ui.geometry.Size(size.width * .28f, size.height * .25f), style = Stroke(sw))
        drawArc(color, 0f, 180f, false, androidx.compose.ui.geometry.Offset(size.width * .64f, size.height * .50f), androidx.compose.ui.geometry.Size(size.width * .28f, size.height * .25f), style = Stroke(sw))
        drawLine(color, androidx.compose.ui.geometry.Offset(size.width * .30f, size.height * .84f), androidx.compose.ui.geometry.Offset(size.width * .70f, size.height * .84f), sw, StrokeCap.Round)
    }
}

@Composable private fun RetroTitle(text:String,p:Palette,themeId:String){
    val decorated=when(themeId){"heart"->"♡  $text  ♡";"cosmic"->"☾  $text  ☽";else->text}
    Box(Modifier.fillMaxWidth().height(39.dp),contentAlignment=Alignment.TopCenter){
        Box(Modifier.widthIn(min=220.dp).height(39.dp).clip(RoundedCornerShape(bottomStart=13.dp,bottomEnd=13.dp)).background(p.green).border(1.dp,p.outline,RoundedCornerShape(bottomStart=13.dp,bottomEnd=13.dp)).padding(horizontal=24.dp),contentAlignment=Alignment.Center){
            Text(decorated,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=16.sp,color=readableOn(p.green),maxLines=1)
        }
    }
}

@Composable private fun EditButton(onClick:()->Unit,p:Palette){
    Button(
        onClick=onClick,
        shape=RoundedCornerShape(8.dp),
        colors=ButtonDefaults.buttonColors(containerColor=p.panel,contentColor=readableOn(p.panel)),
        contentPadding=PaddingValues(0.dp),
        modifier=Modifier.size(50.dp).border(2.dp,p.outline,RoundedCornerShape(8.dp))
    ){
        Image(painterResource(R.drawable.control_edit),null,contentScale=ContentScale.Fit,modifier=Modifier.size(39.dp))
    }
}

@Composable private fun DeleteButton(onClick:()->Unit,p:Palette){
    Button(onClick,shape=RoundedCornerShape(8.dp),colors=ButtonDefaults.buttonColors(containerColor=p.panel,contentColor=readableOn(p.panel)),contentPadding=PaddingValues(0.dp),modifier=Modifier.size(50.dp).border(2.dp,p.outline,RoundedCornerShape(8.dp))){
        Image(painterResource(R.drawable.control_delete),null,contentScale=ContentScale.Fit,modifier=Modifier.size(39.dp))
    }
}
@Composable private fun SquareIcon(text:String,onClick:()->Unit,p:Palette,large:Boolean=false){Button(onClick,shape=RoundedCornerShape(8.dp),colors=ButtonDefaults.buttonColors(containerColor=p.panel,contentColor=readableOn(p.panel)),contentPadding=PaddingValues(0.dp),modifier=Modifier.size(if(large)56.dp else 44.dp).border(2.dp,p.outline,RoundedCornerShape(8.dp))){Text(text,fontSize=if(large)31.sp else 22.sp,fontWeight=FontWeight.Black)}}
@Composable private fun EditDialog(item:ShoppingItem,p:Palette,onDismiss:()->Unit,onSave:(String,String)->Unit){var n by remember{mutableStateOf(item.name)};var q by remember{mutableStateOf(item.quantity)};AlertDialog(onDismissRequest=onDismiss,containerColor=popupColor(p.paper),title={Text(tr("REDIGERA VARA","EDIT ITEM"),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,color=p.text)},text={Column{RetroField(n,{n=it},tr("Namn","Name"),Modifier.fillMaxWidth(),p,leading="product");Spacer(Modifier.height(9.dp));RetroField(q,{q=it},tr("Mängd (valfritt)","Quantity (optional)"),Modifier.fillMaxWidth(),p,leading="balance")}},confirmButton={RetroButton(tr("SPARA","SAVE"),{if(n.isNotBlank())onSave(n,q)},p)},dismissButton={RetroButton(tr("AVBRYT","CANCEL"),onDismiss,p,danger=true)})}
@Composable private fun ConfirmDialog(title:String,text:String,p:Palette,onDismiss:()->Unit,onConfirm:()->Unit,confirmLabel:String=tr("BEKRÄFTA","CONFIRM")){AlertDialog(onDismissRequest=onDismiss,containerColor=popupColor(p.paper),title={Text(title,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,color=p.text)},text={Text(text,color=p.text)},confirmButton={RetroButton(confirmLabel,onConfirm,p,danger=true)},dismissButton={RetroButton(tr("AVBRYT","CANCEL"),onDismiss,p)})}
@Composable private fun RetroField(value:String,onValueChange:(String)->Unit,placeholder:String,modifier:Modifier,p:Palette,onDone:()->Unit={},placeholderSize:androidx.compose.ui.unit.TextUnit=16.sp,leading:String?=null,multiline:Boolean=false){OutlinedTextField(value,onValueChange,modifier=modifier,singleLine=!multiline,minLines=if(multiline)5 else 1,prefix=leading?.let{{Row(Modifier.padding(end=4.dp),verticalAlignment=Alignment.CenterVertically){if(it=="balance")BalanceScaleIcon(p.muted,Modifier.size(17.dp))else ProductBoxIcon(p.muted,Modifier.size(17.dp))}}},placeholder={Text(placeholder,color=p.muted,fontSize=placeholderSize,maxLines=if(multiline)3 else 1)},keyboardOptions=KeyboardOptions(capitalization=KeyboardCapitalization.Sentences,imeAction=if(multiline)ImeAction.Default else ImeAction.Done),keyboardActions=KeyboardActions(onDone={onDone()}),shape=RoundedCornerShape(8.dp),colors=OutlinedTextFieldDefaults.colors(focusedTextColor=p.text,unfocusedTextColor=p.text,focusedBorderColor=p.gold,unfocusedBorderColor=p.outline,cursorColor=p.gold,focusedContainerColor=p.paper,unfocusedContainerColor=p.paper))}
@Composable private fun RetroButton(text:String,onClick:()->Unit,p:Palette,modifier:Modifier=Modifier,compact:Boolean=false,danger:Boolean=false){Button(onClick,modifier=modifier,shape=RoundedCornerShape(8.dp),colors=ButtonDefaults.buttonColors(containerColor=if(danger)p.red else p.green,contentColor=Color(0xFFF4E4BA)),contentPadding=PaddingValues(horizontal=if(compact)10.dp else 14.dp,vertical=if(compact)9.dp else 13.dp)){Text(text,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=if(compact)13.sp else 17.sp)}}
private fun capitalized(s:String)=s.trim().replaceFirstChar{if(it.isLowerCase())it.titlecase()else it.toString()}
