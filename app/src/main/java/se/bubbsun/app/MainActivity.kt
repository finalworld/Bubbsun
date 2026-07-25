package se.bubbsun.app

import android.content.Context
import android.content.Intent
import android.app.Activity
import java.util.Locale
import android.net.Uri
import android.os.Bundle
import java.net.HttpURLConnection
import java.net.URL
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGesturesAfterLongPress
import androidx.compose.foundation.gestures.detectTapGestures
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
import java.util.UUID
import kotlin.math.abs
import kotlin.math.sign
import kotlin.random.Random
import kotlinx.coroutines.launch
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

private data class ListIconOption(val id:String,val drawable:Int,val supporter:Boolean=false)
private val listIcons = listOf(
    ListIconOption("list_cart",R.drawable.list_cart),
    ListIconOption("list_basket",R.drawable.list_basket),
    ListIconOption("list_food",R.drawable.list_food),
    ListIconOption("list_dining",R.drawable.list_dining),
    ListIconOption("list_home",R.drawable.list_home),
    ListIconOption("list_sofa",R.drawable.list_sofa),
    ListIconOption("list_work",R.drawable.list_work),
    ListIconOption("list_checklist",R.drawable.list_checklist),
    ListIconOption("list_fitness",R.drawable.list_fitness),
    ListIconOption("list_hiking",R.drawable.list_hiking),
    ListIconOption("list_pets",R.drawable.list_pets),
    ListIconOption("list_vacation",R.drawable.list_vacation),
    ListIconOption("list_supporter_heart_cart",R.drawable.list_supporter_heart_cart,true),
    ListIconOption("list_supporter_moon",R.drawable.list_supporter_moon,true),
    ListIconOption("list_supporter_emblem",R.drawable.list_supporter_emblem,true),
    ListIconOption("list_supporter_compass",R.drawable.list_supporter_compass,true)
)

@Composable private fun ListIconVisual(id:String,modifier:Modifier=Modifier,locked:Boolean=false){
    val option=listIcons.firstOrNull{it.id==id}?:if(id=="list_supporter_crystal")ListIconOption(id,R.drawable.list_supporter_heart_cart,true)else null
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
private const val editionName = "Supporter Preview Edition"
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
private fun tr(sv:String,en:String)=when(appLanguageState.value){"sv"->sv;"it"->italian[sv]?:en;"tlh"->klingon[sv]?:en;else->en}
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
    else->id
}

data class UserProfile(val id:String=UUID.randomUUID().toString(), var name:String, var colorHex:Long)
class ShoppingItem(
    val id:String=UUID.randomUUID().toString(), name:String, quantity:String="", ownerId:String,
    completed:Boolean=false, val createdAt:Long=System.currentTimeMillis(), completedAt:Long?=null
){ var name by mutableStateOf(name); var quantity by mutableStateOf(quantity); var ownerId by mutableStateOf(ownerId); var completed by mutableStateOf(completed); var completedAt by mutableStateOf(completedAt) }
class ShoppingListData(
    val id:String=UUID.randomUUID().toString(), name:String, icon:String="🛒", iconColorHex:Long=0xFF2B6F73,
    items:List<ShoppingItem> = emptyList()
){ var name by mutableStateOf(name); var icon by mutableStateOf(icon); var iconColorHex by mutableStateOf(iconColorHex); val items=mutableStateListOf<ShoppingItem>().apply{addAll(items)} }
data class StatEvent(val id:String=UUID.randomUUID().toString(),val kind:String,val itemName:String,val userId:String,val timestamp:Long=System.currentTimeMillis())
private data class ReleaseInfo(val version:String,val pageUrl:String,val apkUrl:String,val notes:String)

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

private fun isNewerVersion(remote:String,local:String):Boolean{
    val a=remote.split(".").map{it.toIntOrNull()?:0};val b=local.split(".").map{it.toIntOrNull()?:0}
    return (0 until maxOf(a.size,b.size)).firstNotNullOfOrNull{i->((a.getOrElse(i){0}).compareTo(b.getOrElse(i){0})).takeIf{it!=0}}?.let{it>0}?:false
}

class MainActivity:ComponentActivity(){ override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState);setContent{BubbsunApp(this)}} }

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
        return runCatching{val a=JSONArray(raw);MutableList(a.length()){i->val o=a.getJSONObject(i);val loaded=mutableListOf<ShoppingItem>();val ia=o.optJSONArray("items")?:JSONArray();repeat(ia.length()){j->val it=ia.getJSONObject(j);val legacy=it.optString("owner","DANNE");loaded+=ShoppingItem(it.optString("id",UUID.randomUUID().toString()),it.optString("name",""),it.optString("quantity",""),it.optString("ownerId",if(legacy=="SANJA")sanja else danne),it.optBoolean("completed",false),it.optLong("createdAt",System.currentTimeMillis()),if(it.isNull("completedAt"))null else it.optLong("completedAt"))};ShoppingListData(o.optString("id",UUID.randomUUID().toString()),o.optString("name",if(loadLanguage()=="sv") "Lista" else "List"),o.optString("icon",listIcons[i%listIcons.size].id),o.optLong("iconColor",iconColors[i%iconColors.size]),loaded)}}.getOrElse{mutableListOf(ShoppingListData(name=if(loadLanguage()=="sv") "Matinköp" else "Shopping",icon=listIcons.first().id))}
    }
    fun saveLists(lists:List<ShoppingListData>){val a=JSONArray();lists.forEach{l->val ia=JSONArray();l.items.forEach{it->ia.put(JSONObject().apply{put("id",it.id);put("name",it.name);put("quantity",it.quantity);put("ownerId",it.ownerId);put("completed",it.completed);put("createdAt",it.createdAt);put("completedAt",it.completedAt?:JSONObject.NULL)})};a.put(JSONObject().apply{put("id",l.id);put("name",l.name);put("icon",l.icon);put("iconColor",l.iconColorHex);put("items",ia)})};prefs.edit().putString("lists",a.toString()).apply()}
    fun loadEvents():MutableList<StatEvent>{val raw=prefs.getString("events_v010",null)?:return mutableListOf();return runCatching{val a=JSONArray(raw);MutableList(a.length()){i->val o=a.getJSONObject(i);StatEvent(o.getString("id"),o.getString("kind"),o.getString("itemName"),o.optString("userId",""),o.getLong("timestamp"))}}.getOrElse{mutableListOf()}}
    fun saveEvents(events:List<StatEvent>){val a=JSONArray();events.forEach{e->a.put(JSONObject().apply{put("id",e.id);put("kind",e.kind);put("itemName",e.itemName);put("userId",e.userId);put("timestamp",e.timestamp)})};prefs.edit().putString("events_v010",a.toString()).apply()}
    fun loadThemeId():String=prefs.getString("theme_v0340",null) ?: if(prefs.getBoolean("dark",true)) "retro_dark" else "retro_light"
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
    AppTheme("steel","Stål","⚙",Palette(
        Color(0xFF15191D),Color(0xFF252C33),Color(0xFF343D45),Color(0xFFDCE1E5),Color(0xFFBBC4CB),
        Color(0xFF252C31),Color(0xFFF0F4F6),Color(0xFF6C767E),Color(0xFFC6CFD5),
        Color(0xFF9FC0D3),Color(0xFF4B6878),Color(0xFFA84444),Color(0xFF657681),Color(0xFFC8E8F8))),
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
        Color(0xFFC58B91),Color(0xFF7D8B68),Color(0xFFA75B62),Color(0xFFA98B75),Color(0xFFE8B6BB)))
)

private fun themeDrawable(id:String)=when(id){
    "retro_dark"->R.drawable.theme_retro;"retro_light"->R.drawable.theme_light;"ocean"->R.drawable.theme_ocean
    "forest"->R.drawable.theme_forest;"sunset"->R.drawable.theme_sunset;"winter"->R.drawable.theme_winter
    "blossom"->R.drawable.theme_flower;"fire"->R.drawable.theme_fire;"steel"->R.drawable.theme_steel
    "neon"->R.drawable.theme_neon;"heart"->R.drawable.theme_heart;else->R.drawable.cosmic_theme
}
private fun readableOn(color:Color)=if(color.luminance()>.45f)Color(0xFF241B14) else Color(0xFFF4E4BA)
private fun popupColor(color:Color)=color.copy(alpha=1f)
@Composable private fun SelectionBadge(color:Color,modifier:Modifier=Modifier){
    Canvas(modifier.size(20.dp).clip(CircleShape).background(color).border(1.dp,readableOn(color),CircleShape)){
        val ink=readableOn(color)
        drawLine(ink,Offset(size.width*.25f,size.height*.52f),Offset(size.width*.44f,size.height*.70f),strokeWidth=2.1.dp.toPx(),cap=StrokeCap.Round)
        drawLine(ink,Offset(size.width*.44f,size.height*.70f),Offset(size.width*.76f,size.height*.31f),strokeWidth=2.1.dp.toPx(),cap=StrokeCap.Round)
    }
}
private val userColors=listOf(0xFFFFC928,0xFFFF5E8A,0xFFFF8A2B,0xFFE84B3C,0xFF9E3F45,0xFF7846A8,0xFF3487C7,0xFF35AFC2,0xFF3BA78F,0xFF7BAD43,0xFFB4D936,0xFF8A5B35,0xFFD8B98A,0xFF244F73,0xFF9DD8B7,0xFF777777)
private val supporterUserColors=listOf(0xFFC6A75E,0xFF9B72CF,0xFF72B7A5,0xFF6F91B8)

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
    val store=remember{BubbsunStore(context)}
    val users=remember{mutableStateListOf<UserProfile>().apply{addAll(store.loadUsers())}}
    val lists=remember{mutableStateListOf<ShoppingListData>().apply{addAll(store.loadLists(users))}}
    val events=remember{mutableStateListOf<StatEvent>().apply{addAll(store.loadEvents())}}
    var activeUserId by remember{mutableStateOf(store.loadUserId(users.first().id))}
    var themeId by remember{mutableStateOf(store.loadThemeId())}
    var screen by remember{mutableStateOf("lists")}
    val navigationHistory=remember{mutableStateListOf<String>()}
    var openSupportSettings by remember{mutableStateOf(false)}
    var selectedListId by remember{mutableStateOf<String?>(null)}
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
    var showExitDialog by remember{mutableStateOf(false)}
    LaunchedEffect(Unit){
        if(!supporterPreview&&themeId in setOf("cosmic","heart")){themeId="retro_dark";store.saveThemeId(themeId)}
        if(store.loadSupporterStyle()!=supporterStyle)store.saveSupporterStyle(supporterStyle)
        val now=System.currentTimeMillis()
        if(updateChecks&&now-store.loadLastUpdateCheck()>=24*60*60*1000L){
            store.saveLastUpdateCheck(now)
            fetchLatestRelease()?.takeIf{isNewerVersion(it.version,BuildConfig.VERSION_NAME)}?.let{availableRelease=it;navigationHistory.add(screen);screen="update"}
        }
    }
    val theme=appThemes.firstOrNull{it.id==themeId}?:appThemes.first()
    val p=theme.palette
    fun navigate(target:String){
        if(target!=screen){navigationHistory.add(screen);screen=target}
    }
    fun navigateBack(){
        screen=if(navigationHistory.isNotEmpty())navigationHistory.removeAt(navigationHistory.lastIndex) else "lists"
        if(screen!="list")selectedListId=null
    }
    BackHandler {
        when {
            menuOpen -> menuOpen=false
            screen!="lists" -> navigateBack()
            exitConfirmation -> showExitDialog=true
            else -> (context as? Activity)?.finish()
        }
    }
    val systemDensity = LocalDensity.current
    CompositionLocalProvider(LocalDensity provides Density(systemDensity.density,1f)) {
        MaterialTheme(colorScheme=if(p.bg.luminance()<.45f)darkColorScheme() else lightColorScheme()){
            Box(Modifier.fillMaxSize().background(p.bg).safeDrawingPadding()){
                if(theme.id=="cosmic") CosmicBackground()
                if(theme.id=="heart") HeartBackground()
                Column(Modifier.fillMaxSize()){
                    AppHeader(theme,p,supporterPreview,supporterStyle,supporterGlow,onMenu={menuOpen=true},onThemeSelected={themeId=it;store.saveThemeId(it)},onSupporterInfo={navigate("support")})
                    when(screen){
                        "lists"->ListsScreen(lists,p,theme.id,onOpen={selectedListId=it;navigate("list")},onAdd={navigate("addList")},onSave={store.saveLists(lists)})
                        "addList"->AddListScreen(p,supporterPreview,onSupporterInfo={navigate("support")},onBack={navigateBack()},onCreate={name,icon,color->lists.add(0,ShoppingListData(name=capitalized(name),icon=icon,iconColorHex=color));store.saveLists(lists);navigateBack()})
                        "stats"->StatsScreen(lists,events,users,p,onBack={navigateBack()})
                        "settings"->SettingsScreen(p,language,updateChecks,exitConfirmation,supporterPreview,supporterStyle,supporterGlow,openSupportSettings,onSupporterInfo={navigate("support")},onBack={navigateBack()},onUpdateChecks={updateChecks=it;store.saveUpdateChecks(it)},onLanguage={newLanguage->appLanguageState.value=newLanguage;language=newLanguage;store.saveLanguage(newLanguage)},onExitConfirmation={exitConfirmation=it;store.saveExitConfirmation(it)},onSupporterPreview={enabled->supporterPreview=enabled;store.saveSupporterPreview(enabled);if(!enabled&&themeId in setOf("cosmic","heart")){themeId="retro_dark";store.saveThemeId(themeId)};if(!enabled&&language=="tlh"){language="sv";appLanguageState.value="sv";store.saveLanguage("sv")}},onSupporterStyle={style->supporterStyle=style;store.saveSupporterStyle(style)},onSupporterGlow={supporterGlow=it;store.saveSupporterGlow(it)},onResetStats={events.clear();store.saveEvents(events)})
                        "users"->UsersScreen(users,lists,events,activeUserId,p,supporterPreview,onSupporterInfo={navigate("support")},onBack={navigateBack()},onActivate={activeUserId=it;store.saveUserId(it)},onSave={if(users.none{it.id==activeUserId})activeUserId=users.first().id;store.saveUsers(users);store.saveLists(lists);store.saveEvents(events);store.saveUserId(activeUserId)})
                        "about"->AboutScreen(p,supporterPreview,onSupporterInfo={navigate("support")},onVersions={navigate("versions")},onBack={navigateBack()})
                        "support"->SupportScreen(p,supporterPreview,onBack={navigateBack()},onActivate={supporterPreview=true;store.saveSupporterPreview(true)},onExplore={openSupportSettings=true;navigate("settings")})
                        "versions"->VersionsScreen(p,onBack={navigateBack()})
                        "update"->availableRelease?.let{UpdateAvailableScreen(it,p,onBack={navigateBack()})}?:ListsScreen(lists,p,theme.id,onOpen={selectedListId=it;navigate("list")},onAdd={navigate("addList")},onSave={store.saveLists(lists)})
                        else->{val l=lists.firstOrNull{it.id==selectedListId};if(l==null)screen="lists" else ShoppingListScreen(l,users,activeUserId,p,supporterPreview,inputExpanded,onSupporterInfo={navigate("support")},onInputExpanded={inputExpanded=it;store.saveInputExpanded(it)},onBack={navigateBack()},onSave={store.saveLists(lists)},onEvent={events.add(it);store.saveEvents(events)})}
                    }
                }
                if(menuOpen)SideMenu(users,activeUserId,p,supporterPreview,onSupporterInfo={menuOpen=false;navigate("support")},onClose={menuOpen=false},onActivate={activeUserId=it;store.saveUserId(it)},onNavigate={menuOpen=false;navigate(it)})
                if(showExitDialog) ConfirmDialog(tr("Avsluta Bubbsun?","Exit Bubbsun?"),tr("Vill du stänga appen?","Do you want to close the app?"),p,{showExitDialog=false},{showExitDialog=false;(context as? Activity)?.finish()},confirmLabel=tr("AVSLUTA","EXIT"))
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

@Composable private fun AppHeader(theme:AppTheme,p:Palette,supporterPreview:Boolean,supporterStyle:String,supporterGlow:Boolean,onMenu:()->Unit,onThemeSelected:(String)->Unit,onSupporterInfo:()->Unit){
    var themeMenu by remember{mutableStateOf(false)}
    Row(Modifier.fillMaxWidth().background(p.top).padding(horizontal=12.dp,vertical=5.dp),verticalAlignment=Alignment.CenterVertically){
        SquareIcon("☰",onMenu,p,large=true)
        Spacer(Modifier.width(7.dp))
        val hasSupporterMark=supporterPreview&&supporterStyle!="none"
        Box(Modifier.weight(1f).height(69.dp),contentAlignment=Alignment.Center){
            val logoOffset=if(hasSupporterMark)(-8).dp else 0.dp
            if(supporterPreview&&supporterGlow) Image(painterResource(R.drawable.bubbsun_header_logo),null,contentScale=ContentScale.Fit,colorFilter=ColorFilter.tint(p.gold),modifier=Modifier.fillMaxWidth().height(49.dp).offset(y=logoOffset).blur(5.dp).graphicsLayer{alpha=.65f})
            Image(painterResource(R.drawable.bubbsun_header_logo),contentDescription="Bubbsun",contentScale=ContentScale.Fit,modifier=Modifier.fillMaxWidth().height(49.dp).offset(y=logoOffset))
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
                    val selected=option.id==theme.id
                    val locked=option.id in setOf("cosmic","heart")&&!supporterPreview
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

@Composable private fun SideMenu(users:List<UserProfile>,activeId:String,p:Palette,supporterEnabled:Boolean,onSupporterInfo:()->Unit,onClose:()->Unit,onActivate:(String)->Unit,onNavigate:(String)->Unit){
    var chooser by remember{mutableStateOf(false)}
    val active=users.firstOrNull{it.id==activeId}?:users.first()
    Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha=.62f)).clickable{onClose()}){
        Column(
            Modifier.fillMaxHeight().fillMaxWidth(.84f).background(p.top).padding(18.dp).clickable(enabled=false){},
            verticalArrangement=Arrangement.Top
        ){
            Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.End){SquareIcon("×",onClose,p,large=false)}
            Column(Modifier.fillMaxWidth().weight(1f).verticalScroll(rememberScrollState())){
            Spacer(Modifier.height(8.dp))
            Text(tr("AKTIV ANVÄNDARE","ACTIVE USER"),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=12.sp,color=readableOn(p.top),letterSpacing=1.2.sp)
            Spacer(Modifier.height(8.dp))
            Box{
                Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(p.panel).border(2.dp,p.gold,RoundedCornerShape(16.dp)).clickable{chooser=true}.padding(15.dp),verticalAlignment=Alignment.CenterVertically){
                    Box(Modifier.size(52.dp).clip(CircleShape).background(Color(active.colorHex)).border(3.dp,p.gold,CircleShape),contentAlignment=Alignment.Center){Text(active.name.take(1).uppercase(),color=readableOn(Color(active.colorHex)),fontWeight=FontWeight.Black,fontSize=22.sp)}
                    Spacer(Modifier.width(13.dp));Column(Modifier.weight(1f)){Text(active.name,color=readableOn(p.panel),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=22.sp);Text(tr("Tryck för att byta","Tap to switch"),color=readableOn(p.panel).copy(alpha=.72f),fontSize=12.sp)};Text("⌄",color=readableOn(p.panel),fontSize=28.sp)
                }
                DropdownMenu(chooser,{chooser=false},modifier=Modifier.width(280.dp).background(popupColor(p.panel))){
                    users.forEach{u->DropdownMenuItem(
                        text={Text(u.name,color=readableOn(p.panel),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=20.sp)},
                        onClick={onActivate(u.id);chooser=false},
                        leadingIcon={Box(Modifier.size(26.dp).clip(CircleShape).background(Color(u.colorHex)).border(1.dp,p.gold,CircleShape))},
                        modifier=Modifier.heightIn(min=58.dp)
                    )}
                }
            }
            Spacer(Modifier.height(18.dp))
            MenuCard(R.drawable.menu_user,tr("ANVÄNDARE","USERS"),tr("Hantera användare","Manage users"),p){onNavigate("users")}
            Spacer(Modifier.height(10.dp))
            MenuCard(R.drawable.menu_stats,tr("STATISTIK","STATISTICS"),tr("Se listor, köp och aktivitet","View lists, purchases and activity"),p){onNavigate("stats")}
            Spacer(Modifier.height(10.dp))
            MenuCard(R.drawable.theme_steel,tr("INSTÄLLNINGAR","SETTINGS"),tr("Språk, bekräftelser & statistik","Language, confirmations & statistics"),p){onNavigate("settings")}
            Spacer(Modifier.height(10.dp))
            MenuCard(R.drawable.about_info,tr("OM BUBBSUN","ABOUT BUBBSUN"),tr("Version, skapare & kontakt","Version, creators & contact"),p){onNavigate("about")}
            Spacer(Modifier.height(18.dp))
            Text(if(supporterEnabled)"♥  FOUNDING SUPPORTER" else "♥  ${tr("STÖD BUBBSUN","SUPPORT BUBBSUN")}",color=readableOn(p.top),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=10.sp,modifier=Modifier.align(Alignment.CenterHorizontally).clip(RoundedCornerShape(50)).background(p.gold.copy(alpha=.14f)).border(1.dp,p.outline,RoundedCornerShape(50)).clickable{onSupporterInfo()}.padding(horizontal=10.dp,vertical=5.dp));Spacer(Modifier.height(6.dp))
            Text("v${BuildConfig.VERSION_NAME}  •  $editionName",color=p.gold.copy(alpha=.85f),fontFamily=FontFamily.Serif,fontSize=13.sp,maxLines=1,overflow=TextOverflow.Ellipsis,modifier=Modifier.align(Alignment.CenterHorizontally).padding(bottom=6.dp))
            }
        }
    }
}

@Composable private fun MenuCard(icon:Int,title:String,subtitle:String,p:Palette,onClick:()->Unit){
    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(15.dp)).background(p.panel).border(1.dp,p.outline,RoundedCornerShape(15.dp)).clickable{onClick()}.padding(horizontal=15.dp,vertical=14.dp),verticalAlignment=Alignment.CenterVertically){
        Box(Modifier.size(48.dp).clip(RoundedCornerShape(12.dp)).background(p.gold.copy(alpha=.12f)).border(1.dp,p.outline,RoundedCornerShape(12.dp)),contentAlignment=Alignment.Center){Image(painterResource(icon),null,Modifier.fillMaxSize().padding(7.dp).graphicsLayer{translationX=if(icon==R.drawable.menu_stats)2.dp.toPx() else 0f})}
        Spacer(Modifier.width(13.dp));Column(Modifier.weight(1f)){Text(title,color=readableOn(p.panel),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=18.sp);Text(subtitle,color=readableOn(p.panel).copy(alpha=.70f),fontSize=11.sp,maxLines=1,overflow=TextOverflow.Ellipsis)};Text("›",color=readableOn(p.panel),fontSize=30.sp)
    }
}

@Composable private fun ListsScreen(lists:SnapshotStateList<ShoppingListData>,p:Palette,themeId:String,onOpen:(String)->Unit,onAdd:()->Unit,onSave:()->Unit){
    var deleteTarget by remember{mutableStateOf<ShoppingListData?>(null)}
    var draggingId by remember{mutableStateOf<String?>(null)}
    var deleteZoneTop by remember{mutableStateOf(Float.MAX_VALUE)}
    var overDeleteZone by remember{mutableStateOf(false)}

    Column(Modifier.fillMaxSize()){
        RetroTitle(tr("MINA LISTOR","MY LISTS"),p,themeId)
        Spacer(Modifier.height(10.dp))
        LazyColumn(Modifier.weight(1f).padding(horizontal=12.dp),verticalArrangement=Arrangement.spacedBy(7.dp)){
            items(lists,key={it.id}){l->
                ListRow(
                    list=l,
                    p=p,
                    dragging=draggingId==l.id,
                    onOpen={onOpen(l.id)},
                    onDragStart={draggingId=l.id;overDeleteZone=false},
                    onDragPosition={centerY->overDeleteZone=centerY>=deleteZoneTop},
                    onDragEnd={centerY->
                        val dropped=centerY>=deleteZoneTop
                        draggingId=null
                        overDeleteZone=false
                        if(dropped) deleteTarget=l
                    },
                    onMove={dir->
                        val from=lists.indexOf(l)
                        val to=(from+dir).coerceIn(0,lists.lastIndex)
                        if(from!=to){lists.removeAt(from);lists.add(to,l);onSave();true}else false
                    }
                )
            }
        }
        if(draggingId==null){
            RetroButton(tr("＋  LÄGG TILL NY LISTA","＋  ADD NEW LIST"),onAdd,p,modifier=Modifier.fillMaxWidth().padding(horizontal=12.dp))
        }else{
            Box(
                Modifier.fillMaxWidth().height(62.dp)
                    .onGloballyPositioned{deleteZoneTop=it.positionInRoot().y}
                    .clip(RoundedCornerShape(10.dp))
                    .background(if(overDeleteZone) Color(0xFFD74632) else p.red)
                    .border(if(overDeleteZone)4.dp else 2.dp,Color(0xFFF6E8C3),RoundedCornerShape(10.dp)),
                contentAlignment=Alignment.Center
            ){
                Text(tr("🗑  TA BORT","🗑  DELETE"),color=Color(0xFFF6E8C3),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=19.sp)
            }
        }
    }
    deleteTarget?.let{l->ConfirmDialog(tr("Ta bort listan \"${l.name}\"?","Delete list \"${l.name}\"?"),tr("Alla saker i listan försvinner.","All items in the list will be deleted."),p,{deleteTarget=null},{lists.remove(l);deleteTarget=null;onSave()})}
}

@Composable private fun ListRow(list:ShoppingListData,p:Palette,dragging:Boolean,onOpen:()->Unit,onDragStart:()->Unit,onDragPosition:(Float)->Unit,onDragEnd:(Float)->Unit,onMove:(Int)->Boolean){
    val haptic=LocalHapticFeedback.current
    var dragY by remember{mutableStateOf(0f)}
    var rowCenterY by remember{mutableStateOf(0f)}
    var reorderDrag by remember{mutableStateOf(0f)}
    val rowStepPx=with(LocalDensity.current){85.dp.toPx()}
    val bg by animateColorAsState(if(dragging)p.glow else p.paper,label="drag")
    Row(
        Modifier.fillMaxWidth()
            .onGloballyPositioned{rowCenterY=it.positionInRoot().y+it.size.height/2f}
            .graphicsLayer{translationY=if(dragging)dragY else 0f;shadowElevation=if(dragging)18f else 0f}
            .shadow(if(dragging)9.dp else if(p.paper.alpha<1f)0.dp else 2.dp,RoundedCornerShape(10.dp))
            .clip(RoundedCornerShape(10.dp)).background(bg)
            .border(if(dragging)3.dp else 2.dp,if(dragging)p.gold else p.outline,RoundedCornerShape(10.dp))
            .pointerInput(list.id){
                detectDragGesturesAfterLongPress(
                    onDragStart={
                        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                        dragY=0f;reorderDrag=0f;onDragStart();onDragPosition(rowCenterY)
                    },
                    onDragEnd={val center=rowCenterY+dragY;onDragEnd(center);dragY=0f;reorderDrag=0f},
                    onDragCancel={onDragEnd(Float.NEGATIVE_INFINITY);dragY=0f;reorderDrag=0f},
                    onDrag={change,amount->
                        change.consume();dragY+=amount.y;reorderDrag+=amount.y
                        if(abs(reorderDrag)>rowStepPx*.62f){
                            val dir=if(reorderDrag>0)1 else -1
                            if(onMove(dir)){
                                // Layouten flyttar raden ett steg. Motkompensera så kortet stannar under fingret.
                                dragY-=dir*rowStepPx
                            }
                            reorderDrag=0f
                        }
                        onDragPosition(rowCenterY+dragY)
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
        Column(Modifier.weight(1f).height(78.dp).padding(horizontal=12.dp,vertical=8.dp),verticalArrangement=Arrangement.Center){
            Text(list.name,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=when{list.name.length<=14->21.sp;list.name.length<=24->18.sp;else->15.sp},color=p.text,maxLines=2,overflow=TextOverflow.Ellipsis,lineHeight=when{list.name.length<=14->23.sp;list.name.length<=24->20.sp;else->17.sp})
            Text("${list.items.size} ${tr("objekt","items")}",fontWeight=FontWeight.Bold,color=p.text,fontSize=13.sp)
        }
        Text("›",fontSize=35.sp,fontWeight=FontWeight.Bold,color=p.text,modifier=Modifier.padding(horizontal=14.dp))
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
    p: Palette,
    supporterEnabled: Boolean,
    inputExpanded: Boolean,
    onSupporterInfo:()->Unit,
    onInputExpanded: (Boolean) -> Unit,
    onBack: () -> Unit,
    onSave: () -> Unit,
    onEvent: (StatEvent) -> Unit
) {
    var input by remember { mutableStateOf("") }
    var quantityInput by remember { mutableStateOf("") }
    var showDone by remember { mutableStateOf(true) }
    var editing by remember { mutableStateOf<ShoppingItem?>(null) }
    var renameList by remember { mutableStateOf(false) }
    var deleteMode by remember { mutableStateOf(false) }
    val selected = remember { mutableStateListOf<String>() }
    var confirmDelete by remember { mutableStateOf(false) }
    var draggingId by remember { mutableStateOf<String?>(null) }
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()

    val active = list.items.filter { !it.completed }
    val done = list.items.filter { it.completed }.sortedByDescending { it.completedAt ?: 0L }
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

    Column(Modifier.fillMaxSize().imePadding().padding(12.dp)) {
        PageHeader(title = list.name, p = p, onBack = onBack, trailing = {
            Row {
                EditButton({ renameList = true }, p)
                Spacer(Modifier.width(6.dp))
                DeleteButton(onClick = {
                    if (deleteMode) { if (selected.isEmpty()) deleteMode = false else confirmDelete = true }
                    else deleteMode = true
                }, p = p)
            }
        })
        Spacer(Modifier.height(10.dp))
        InputPanel(product=input,onProductChange={input=it},quantity=quantityInput,onQuantityChange={quantityInput=it},onAdd={addItem(input)},expanded=inputExpanded,onExpandedChange=onInputExpanded,p=p)
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
                Spacer(Modifier.weight(1f));Text(tr("AVBRYT","CANCEL"),fontWeight=FontWeight.Black,color=Color(0xFFF6E8C3),modifier=Modifier.clickable{selected.clear();deleteMode=false}.padding(8.dp))
            };Spacer(Modifier.height(8.dp))
        }
        LazyColumn(state=listState,modifier=Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(6.dp)) {
            items(active,key={it.id}) { item ->
                ItemRow(item,users,p,deleteMode,selected.contains(item.id),draggingId==item.id,
                    onSelect={if(item.id in selected)selected.remove(item.id) else selected.add(item.id)},
                    onToggle={item.completed=true;item.completedAt=System.currentTimeMillis();onEvent(StatEvent(kind="purchase",itemName=item.name,userId=item.ownerId));save()},
                    onEdit={editing=item},onDragStart={draggingId=item.id},onDragEnd={draggingId=null},
                    onMove={direction->val current=list.items.filter{!it.completed};val from=current.indexOf(item);val to=(from+direction).coerceIn(0,current.lastIndex);if(from!=to){val other=current[to];val a=list.items.indexOf(item);val b=list.items.indexOf(other);list.items[a]=other;list.items[b]=item;save();true}else false})
            }
            item { Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(p.green).clickable{showDone=!showDone}.padding(10.dp)) { Text(if(showDone)"${tr("KLART","DONE")} (${done.size})  ▲" else "${tr("KLART","DONE")} (${done.size})  ▼",fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,color=Color.White) } }
            if(showDone) items(done,key={"d${it.id}"}) { item ->
                ItemRow(item,users,p,deleteMode,selected.contains(item.id),false,
                    onSelect={if(item.id in selected)selected.remove(item.id) else selected.add(item.id)},
                    onToggle={item.completed=false;item.completedAt=null;list.items.remove(item);list.items.add(0,item);save()},
                    onEdit={editing=item},onDragStart={},onDragEnd={},onMove={false})
            }
        }
    }
    if(renameList) EditListDialog(list,p,supporterEnabled,onSupporterInfo,{renameList=false}) { name,icon,color -> list.name=capitalized(name).take(40);list.icon=icon;list.iconColorHex=color;renameList=false;save() }
    editing?.let { item -> EditDialog(item,p,{editing=null}) { n,q -> item.name=capitalized(n);item.quantity=q.trim();editing=null;save() } }
    if(confirmDelete) ConfirmDialog(tr("Ta bort ${selected.size} markerade saker?","Delete ${selected.size} selected items?"),tr("Det går inte att ångra.","This cannot be undone."),p,{confirmDelete=false},{val doomed=list.items.filter{it.id in selected};doomed.forEach{onEvent(StatEvent(kind="delete",itemName=it.name,userId=it.ownerId))};list.items.removeAll(doomed);selected.clear();deleteMode=false;confirmDelete=false;save()})
}

@Composable private fun ItemRow(item:ShoppingItem,users:List<UserProfile>,p:Palette,deleteMode:Boolean,isSelected:Boolean,dragging:Boolean,onSelect:()->Unit,onToggle:()->Unit,onEdit:()->Unit,onDragStart:()->Unit,onDragEnd:()->Unit,onMove:(Int)->Boolean){
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
                .padding(vertical=9.dp),
            verticalAlignment=Alignment.CenterVertically
        ){
            Column(Modifier.weight(1f)){
                Text(item.name,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Bold,fontSize=when{item.name.length<=28->18.sp;item.name.length<=45->16.sp;else->14.sp},lineHeight=when{item.name.length<=28->20.sp;item.name.length<=45->18.sp;else->16.sp},maxLines=2,overflow=TextOverflow.Ellipsis,color=p.text,textDecoration=if(item.completed)TextDecoration.LineThrough else null)
                if(item.quantity.isNotBlank()) Text(item.quantity,fontSize=13.sp,fontWeight=FontWeight.Bold,color=p.muted,maxLines=1,overflow=TextOverflow.Ellipsis)
            }
        }
        if(deleteMode) Checkbox(isSelected,{onSelect()},colors=CheckboxDefaults.colors(checkedColor=p.red,uncheckedColor=p.red,checkmarkColor=Color.White))
    }
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

@Composable private fun SettingsScreen(p:Palette,language:String,updateChecks:Boolean,exitConfirmation:Boolean,supporterPreview:Boolean,supporterStyle:String,supporterGlow:Boolean,startAtSupporter:Boolean,onSupporterInfo:()->Unit,onBack:()->Unit,onUpdateChecks:(Boolean)->Unit,onLanguage:(String)->Unit,onExitConfirmation:(Boolean)->Unit,onSupporterPreview:(Boolean)->Unit,onSupporterStyle:(String)->Unit,onSupporterGlow:(Boolean)->Unit,onResetStats:()->Unit){
    var reset by remember{mutableStateOf(false)}
    val scroll=rememberScrollState()
    LaunchedEffect(startAtSupporter,supporterPreview){if(startAtSupporter&&supporterPreview){delay(220);scroll.animateScrollTo((scroll.maxValue*.72f).toInt())}}
    Column(Modifier.fillMaxSize().verticalScroll(scroll).padding(14.dp)){
        PageHeader(tr("INSTÄLLNINGAR","SETTINGS"),p,onBack)
        Spacer(Modifier.height(14.dp))
        SettingsCard(R.drawable.about_info,tr("UPPDATERINGAR","UPDATES"),p){
            Row(Modifier.fillMaxWidth().clickable{onUpdateChecks(!updateChecks)},verticalAlignment=Alignment.CenterVertically){
                Checkbox(updateChecks,onUpdateChecks,colors=CheckboxDefaults.colors(checkedColor=p.green,uncheckedColor=p.green,checkmarkColor=Color.White))
                Column(Modifier.weight(1f)){
                    Text(tr("Sök efter nya versioner","Check for new versions"),color=p.text,fontWeight=FontWeight.Bold)
                    Text(tr("Kontrolleras i bakgrunden vid uppstart.","Checked in the background at startup."),color=p.muted,fontSize=12.sp)
                }
            }
        }
        Spacer(Modifier.height(12.dp))
        SettingsCard(R.drawable.stats_checked,tr("BEKRÄFTELSER","CONFIRMATIONS"),p){
            Row(verticalAlignment=Alignment.CenterVertically){Checkbox(exitConfirmation,onExitConfirmation,colors=CheckboxDefaults.colors(checkedColor=p.green,uncheckedColor=p.green,checkmarkColor=Color.White));Text(tr("Visa 'Avsluta Bubbsun?'","Show 'Exit Bubbsun?'"),color=p.text,fontWeight=FontWeight.Bold)}
        }
        Spacer(Modifier.height(12.dp))
        SettingsCard(R.drawable.language_globe,tr("SPRÅK","LANGUAGE"),p){
            Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(10.dp)){
                LanguageChoice("🇸🇪","Svenska",language=="sv",p,Modifier.weight(1f)){onLanguage("sv")}
                LanguageChoice("🇬🇧","English",language=="en",p,Modifier.weight(1f)){onLanguage("en")}
            }
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(10.dp)){
                LanguageChoice("🇮🇹","Italiano",language=="it",p,Modifier.weight(1f)){onLanguage("it")}
                LanguageChoice("🖖","Klingon",language=="tlh",p,Modifier.weight(1f),locked=!supporterPreview,onLocked=onSupporterInfo){onLanguage("tlh")}
            }
        }
        Spacer(Modifier.height(12.dp))
        SettingsCard(R.drawable.theme_heart,"SUPPORTER PREVIEW",p){
            Row(verticalAlignment=Alignment.CenterVertically){
                Checkbox(supporterPreview,onSupporterPreview,colors=CheckboxDefaults.colors(checkedColor=p.green,uncheckedColor=p.green,checkmarkColor=Color.White))
                Column(Modifier.weight(1f)){
                    Text(tr("Aktivera supporterläge","Enable supporter mode"),color=p.text,fontWeight=FontWeight.Bold)
                    Text(tr("Simulerar framtida köp och låser upp supporterteman.","Simulates the future purchase and unlocks supporter themes."),color=p.muted,fontSize=12.sp)
                }
            }
        }
        if(supporterPreview){
            Spacer(Modifier.height(12.dp))
            SettingsCard(R.drawable.theme_heart,"SUPPORTER",p){
                Text(tr("Välj supporter-dekoration vid Bubbsun-loggan.","Choose the supporter decoration by the Bubbsun logo."),color=p.muted,fontSize=12.sp)
                Spacer(Modifier.height(10.dp))
                SupporterStyleChoice("none",tr("Ingen","None"),"",supporterStyle,p,onSupporterStyle)
                SupporterStyleChoice("classic","","♥  Lifetime Supporter",supporterStyle,p,onSupporterStyle)
                SupporterStyleChoice("royal","","♛  LIFETIME SUPPORTER  ♛",supporterStyle,p,onSupporterStyle)
                SupporterStyleChoice("ribbon","","✦  SUPPORTER  ✦",supporterStyle,p,onSupporterStyle)
                SupporterStyleChoice("signature","","Lifetime Supporter  ♥",supporterStyle,p,onSupporterStyle)
                SupporterStyleChoice("badge","","♥  FOUNDING SUPPORTER",supporterStyle,p,onSupporterStyle)
                SupporterStyleChoice("cosmic","","✧  COSMIC SUPPORTER  ✧",supporterStyle,p,onSupporterStyle)
                Spacer(Modifier.height(9.dp))
                Row(Modifier.fillMaxWidth().height(58.dp).clip(RoundedCornerShape(10.dp)).background(p.paper2).border(1.dp,p.outline,RoundedCornerShape(10.dp)).clickable{onSupporterGlow(!supporterGlow)}.padding(horizontal=12.dp),verticalAlignment=Alignment.CenterVertically){
                    Column(Modifier.weight(1f)){Text("Fancy Glow",color=p.text,fontWeight=FontWeight.Bold);Text(tr("Mjukt sken runt Bubbsun-loggan.","Soft glow around the Bubbsun logo."),color=p.muted,fontSize=12.sp)}
                    Switch(supporterGlow,onSupporterGlow,colors=SwitchDefaults.colors(checkedThumbColor=p.paper,checkedTrackColor=p.green,uncheckedThumbColor=p.muted,uncheckedTrackColor=p.paper2))
                }
            }
        }
        Spacer(Modifier.height(12.dp))
        RetroButton(if(supporterPreview)"♥  SUPPORTERSTATUS" else "♥  ${tr("STÖD BUBBSUN","SUPPORT BUBBSUN")}",onSupporterInfo,p,modifier=Modifier.fillMaxWidth())
        Spacer(Modifier.height(12.dp))
        SettingsCard(R.drawable.menu_stats,tr("STATISTIK","STATISTICS"),p){RetroButton(if(language=="sv")"NOLLSTÄLL STATISTIK" else "RESET STATISTICS",{reset=true},p,danger=true,modifier=Modifier.fillMaxWidth())}
    }
    if(reset)ConfirmDialog(if(language=="sv")"Nollställ statistik?" else "Reset statistics?",if(language=="sv")"Detta kan inte ångras. Listor och varor påverkas inte." else "This cannot be undone. Lists and items are not affected.",p,{reset=false},{onResetStats();reset=false},confirmLabel=if(language=="sv")"NOLLSTÄLL" else "RESET")
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
@Composable private fun SettingsCard(icon:Int,title:String,p:Palette,content:@Composable ColumnScope.()->Unit){
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(p.paper).border(2.dp,p.outline,RoundedCornerShape(14.dp)).padding(horizontal=15.dp,vertical=12.dp)){
        Row(Modifier.fillMaxWidth().height(34.dp),verticalAlignment=Alignment.CenterVertically){
            Image(painterResource(icon),null,Modifier.size(29.dp).graphicsLayer{translationX=if(icon==R.drawable.menu_stats)2.dp.toPx() else 0f})
            Spacer(Modifier.width(9.dp))
            Text(title,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=18.sp,color=p.text,modifier=Modifier.weight(1f))
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
@Composable private fun StatsScreen(lists:List<ShoppingListData>,events:List<StatEvent>,users:List<UserProfile>,p:Palette,onBack:()->Unit){
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
            Text(tr("STATISTIK","STATISTICS"),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=25.sp,color=p.pageText,modifier=Modifier.weight(1f))
            Box{RetroButton(statsPeriodLabel(period),{menu=true},p,compact=true);DropdownMenu(menu,{menu=false},modifier=Modifier.background(popupColor(p.panel))){StatsPeriod.entries.forEach{x->DropdownMenuItem(text={Text(statsPeriodLabel(x))},onClick={period=x;menu=false})}}}
        }
        Spacer(Modifier.height(12.dp))
        LazyColumn(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(9.dp)){
            item{Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(9.dp)){StatsCard(R.drawable.list_checklist,tr("SKAPADE LISTOR","CREATED LISTS"),lists.size.toString(),p,Modifier.weight(1f));StatsCard(R.drawable.list_basket,tr("TILLAGDA VAROR","ADDED ITEMS"),totalItems.toString(),p,Modifier.weight(1f))}}
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
            item{FeatureStatCard(R.drawable.stats_trophy,tr("MEST ANVÄNDA LISTA","MOST USED LIST"),favoriteList?.let{"${it.name} – ${it.items.size} ${tr("varor","items")}"}?:tr("Ingen lista ännu","No list yet"),p)}
            item{Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(9.dp)){
                MiniMetric(tr("AKTIVA","ACTIVE"),activeItems.toString(),p,Modifier.weight(1f))
                MiniMetric(tr("FÄRDIGA LISTOR","FINISHED LISTS"),completedLists.toString(),p,Modifier.weight(1f))
                MiniMetric(tr("SNITT/LISTA","AVG/LIST"),String.format(Locale.US,"%.1f",average),p,Modifier.weight(1f))
                MiniMetric(tr("BORTTAGNA","DELETED"),deleted.toString(),p,Modifier.weight(1f))
            }}
            item{Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(p.paper).border(2.dp,p.outline,RoundedCornerShape(10.dp)).padding(14.dp)){
                Text(tr("MEST HANDLADE","MOST PURCHASED"),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,color=p.text)
                Spacer(Modifier.height(6.dp))
                if(topItems.isEmpty())Text(tr("Ingen statistik ännu","No statistics yet"),color=p.muted)
                topItems.forEachIndexed{i,x->Text("${i+1}. ${x.key}  ·  ${x.value}",fontWeight=FontWeight.Bold,color=p.text,modifier=Modifier.padding(vertical=3.dp))}
            }}
            item{FunFactCard(R.drawable.list_cart,tr("NI HAR FYLLT","YOU HAVE FILLED"),carts.coerceAtLeast(0).toString(),tr("KUNDVAGNAR!","SHOPPING CARTS!"),p)}
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
    fun open(url:String){runCatching{context.startActivity(Intent(Intent.ACTION_VIEW,Uri.parse(url)))}}
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),horizontalAlignment=Alignment.CenterHorizontally){
        PageHeader(tr("NY VERSION","NEW VERSION"),p,onBack)
        Spacer(Modifier.height(24.dp))
        Text("♥",fontSize=62.sp,color=p.red)
        Text(tr("NY VERSION FINNS!","A NEW VERSION IS AVAILABLE!"),color=p.pageText,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=23.sp,textAlign=TextAlign.Center)
        Spacer(Modifier.height(7.dp))
        Text("Bubbsun v${release.version}",color=p.gold,fontWeight=FontWeight.Black,fontSize=20.sp)
        if(release.notes.isNotBlank()){Spacer(Modifier.height(16.dp));Text(release.notes.take(900),color=p.pageText,fontSize=13.sp,textAlign=TextAlign.Start,modifier=Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(p.paper).border(1.dp,p.outline,RoundedCornerShape(10.dp)).padding(14.dp))}
        Spacer(Modifier.height(22.dp))
        RetroButton(tr("LADDA NER NY VERSION","DOWNLOAD NEW VERSION"),{open(release.apkUrl)},p,modifier=Modifier.fillMaxWidth().heightIn(min=62.dp))
        Spacer(Modifier.height(11.dp))
        Button(onClick=onBack,modifier=Modifier.fillMaxWidth().heightIn(min=58.dp),shape=RoundedCornerShape(9.dp),colors=ButtonDefaults.buttonColors(containerColor=p.paper,contentColor=p.text),border=androidx.compose.foundation.BorderStroke(2.dp,p.outline)){Text(tr("INTE NU","NOT NOW"),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=17.sp)}
        Spacer(Modifier.height(11.dp))
        TextButton({open(release.pageUrl)},modifier=Modifier.fillMaxWidth().heightIn(min=50.dp)){Text(tr("VISA PÅ GITHUB","VIEW ON GITHUB"),color=p.pageText,fontWeight=FontWeight.Bold)}
    }
}

@Composable private fun SupportScreen(p:Palette,supporterEnabled:Boolean,onBack:()->Unit,onActivate:()->Unit,onExplore:()->Unit){
    var success by remember{mutableStateOf(false)}
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
        Spacer(Modifier.height(10.dp))
        Button(onClick={},enabled=false,modifier=Modifier.fillMaxWidth(),shape=RoundedCornerShape(9.dp)){Text(tr("ÅTERSTÄLL KÖP  •  KOMMER SENARE","RESTORE PURCHASES  •  COMING LATER"))}
    }
}

private val patchNotes=listOf(
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
    var expanded by remember{mutableStateOf("0.470")}
    Column(Modifier.fillMaxSize().padding(14.dp)){
        PageHeader(tr("VERSIONER & NYHETER","VERSIONS & NEWS"),p,onBack)
        Spacer(Modifier.height(12.dp))
        LazyColumn(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(8.dp)){
            items(patchNotes){(version,notes)->
                val open=expanded==version
                Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(11.dp)).background(p.paper).border(if(version=="0.471")2.dp else 1.dp,if(version=="0.471")p.gold else p.outline,RoundedCornerShape(11.dp)).clickable{expanded=if(open)"" else version}.padding(13.dp)){
                    Row(verticalAlignment=Alignment.CenterVertically){Text("v$version",color=p.text,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=19.sp,modifier=Modifier.weight(1f));if(version=="0.471")Text(tr("NYTT","NEW"),color=readableOn(p.gold),fontSize=10.sp,fontWeight=FontWeight.Black,modifier=Modifier.clip(RoundedCornerShape(50)).background(p.gold).padding(horizontal=8.dp,vertical=3.dp));Spacer(Modifier.width(8.dp));Text(if(open)"▲" else "▼",color=p.text)}
                    if(open){Spacer(Modifier.height(7.dp));notes.forEach{Text("• $it",color=p.text,fontSize=14.sp,modifier=Modifier.padding(vertical=2.dp))}}
                }
            }
        }
    }
}

@Composable
private fun AboutScreen(p: Palette, supporterEnabled:Boolean, onSupporterInfo:()->Unit,onVersions:()->Unit,onBack: () -> Unit) {
    val context = LocalContext.current
    val scroll = rememberScrollState()
    var ducksVisible by remember { mutableStateOf(false) }
    var tapCount by remember { mutableStateOf(0) }
    var lastTap by remember { mutableStateOf(0L) }

    fun email(subject: String) {
        val intent = Intent(Intent.ACTION_SENDTO).apply {
            data = Uri.parse("mailto:finalworld@gmail.com")
            putExtra(Intent.EXTRA_SUBJECT, subject)
        }
        runCatching { context.startActivity(intent) }
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
                CreditRow(R.drawable.about_man, "Daniel Grandin", tr("Utveckling & design","Development & design"), p)
                DottedDivider(p)
                CreditRow(R.drawable.about_woman, "Sanja Kropsu", tr("Idéer, testning & feedback","Ideas, testing & feedback"), p)
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
                    .pointerInput(Unit) {
                        detectTapGestures(onTap = {
                            val now=System.currentTimeMillis()
                            tapCount=if(now-lastTap<700)tapCount+1 else 1
                            lastTap=now
                            if(tapCount>=3){ducksVisible=true;tapCount=0}
                        })
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
        AboutActionButton(R.drawable.about_bug, tr("RAPPORTERA PROBLEM","REPORT A PROBLEM"), tr("Hjälp oss att göra Bubbsun ännu bättre","Help us make Bubbsun even better"), Color(0xFF6B281D), p) { email(tr("Bubbsun – rapportera problem","Bubbsun – report a problem")) }
        Spacer(Modifier.height(9.dp))
        AboutActionButton(R.drawable.about_idea, tr("SKICKA FÖRSLAG","SEND SUGGESTION"), tr("Har du en idé? Vi vill gärna höra den!","Have an idea? We would love to hear it!"), p.green, p) { email(tr("Bubbsun – förslag","Bubbsun – suggestion")) }
        Spacer(Modifier.height(9.dp))
        AboutActionButton(R.drawable.list_checklist,tr("VERSIONER & NYHETER","VERSIONS & NEWS"),"Patch notes • v${BuildConfig.VERSION_NAME}",p.green,p,onVersions)
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
    }
}

@Composable
private fun CreditRow(icon: Int, name: String, role: String, p: Palette, compact: Boolean = false) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 7.dp)) {
        Box(
            Modifier
                .size(if (compact) 40.dp else 46.dp)
                .clip(CircleShape)
                .border(1.dp, p.gold, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Image(painterResource(icon),null,contentScale=ContentScale.Crop,modifier=Modifier.fillMaxSize().graphicsLayer{scaleX=1.04f;scaleY=1.04f})
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

@Composable private fun PageHeader(title:String,p:Palette,onBack:()->Unit,trailing: (@Composable () -> Unit)? = null){Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically){PageBack(onBack,p);Spacer(Modifier.width(10.dp));Text(title.uppercase(),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=when{title.length<=16->24.sp;title.length<=28->20.sp;else->17.sp},lineHeight=when{title.length<=16->26.sp;title.length<=28->22.sp;else->19.sp},maxLines=2,overflow=TextOverflow.Ellipsis,color=p.pageText,modifier=Modifier.weight(1f));trailing?.invoke()}}
@Composable private fun PageBack(onBack:()->Unit,p:Palette){
    Button(onClick=onBack,shape=RoundedCornerShape(9.dp),colors=ButtonDefaults.buttonColors(containerColor=p.panel),contentPadding=PaddingValues(0.dp),modifier=Modifier.size(58.dp).border(2.dp,p.outline,RoundedCornerShape(9.dp))){
        Canvas(Modifier.size(38.dp)){
            val outline=Color(0xFF201B16);val sw=2.5.dp.toPx()
            val arrow=Path().apply{moveTo(size.width*.10f,size.height*.50f);lineTo(size.width*.43f,size.height*.18f);lineTo(size.width*.43f,size.height*.36f);lineTo(size.width*.88f,size.height*.36f);lineTo(size.width*.88f,size.height*.64f);lineTo(size.width*.43f,size.height*.64f);lineTo(size.width*.43f,size.height*.82f);close()}
            drawPath(arrow,p.green);drawPath(arrow,outline,style=Stroke(sw,join=StrokeJoin.Round))
            drawCircle(p.gold,size.minDimension*.045f,Offset(size.width*.68f,size.height*.50f))
            drawCircle(p.red,size.minDimension*.045f,Offset(size.width*.79f,size.height*.50f))
        }
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
                    Column(Modifier.weight(if(narrow)1.35f else 1.45f)){RetroField(product,onProductChange,tr("Namn","Name"),Modifier.fillMaxWidth().height(54.dp),p,onDone=onAdd,leading="product")}
                    Spacer(Modifier.width(gap))
                    Column(Modifier.weight(if(narrow).95f else 1f)){RetroField(quantity,onQuantityChange,tr("Mängd (valfritt)","Quantity (optional)"),Modifier.fillMaxWidth().height(54.dp),p,onDone=onAdd,placeholderSize=if(narrow)11.sp else 12.sp,leading="balance")}
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
        Canvas(Modifier.size(31.dp)){
            val outline=Color(0xFF201B16);val sw=4.dp.toPx()
            drawLine(outline,Offset(size.width*.24f,size.height*.80f),Offset(size.width*.73f,size.height*.31f),sw*1.75f,StrokeCap.Round)
            drawLine(p.green,Offset(size.width*.27f,size.height*.77f),Offset(size.width*.70f,size.height*.34f),sw,StrokeCap.Round)
            drawLine(p.red,Offset(size.width*.69f,size.height*.35f),Offset(size.width*.80f,size.height*.24f),sw*1.05f,StrokeCap.Round)
            val tip=Path().apply{moveTo(size.width*.18f,size.height*.87f);lineTo(size.width*.28f,size.height*.67f);lineTo(size.width*.38f,size.height*.77f);close()}
            drawPath(tip,p.gold);drawPath(tip,outline,style=Stroke(1.5.dp.toPx(),join=StrokeJoin.Round))
        }
    }
}

@Composable private fun DeleteButton(onClick:()->Unit,p:Palette){
    Button(onClick,shape=RoundedCornerShape(8.dp),colors=ButtonDefaults.buttonColors(containerColor=p.panel,contentColor=readableOn(p.panel)),contentPadding=PaddingValues(0.dp),modifier=Modifier.size(50.dp).border(2.dp,p.outline,RoundedCornerShape(8.dp))){
        Canvas(Modifier.size(31.dp)){
            val outline=Color(0xFF201B16);val sw=2.2.dp.toPx()
            val body=Path().apply{moveTo(size.width*.25f,size.height*.35f);lineTo(size.width*.30f,size.height*.88f);lineTo(size.width*.70f,size.height*.88f);lineTo(size.width*.75f,size.height*.35f);close()}
            drawPath(body,p.green);drawPath(body,outline,style=Stroke(sw,join=StrokeJoin.Round))
            drawRoundRect(p.red,Offset(size.width*.18f,size.height*.25f),androidx.compose.ui.geometry.Size(size.width*.64f,size.height*.18f),CornerRadius(5.dp.toPx()),style=Stroke(sw))
            drawRoundRect(p.red,Offset(size.width*.39f,size.height*.11f),androidx.compose.ui.geometry.Size(size.width*.22f,size.height*.18f),CornerRadius(4.dp.toPx()),style=Stroke(sw))
            listOf(.39f,.50f,.61f).forEach{x->drawLine(outline,Offset(size.width*x,size.height*.50f),Offset(size.width*x,size.height*.76f),1.8.dp.toPx(),StrokeCap.Round)}
        }
    }
}
@Composable private fun SquareIcon(text:String,onClick:()->Unit,p:Palette,large:Boolean=false){Button(onClick,shape=RoundedCornerShape(8.dp),colors=ButtonDefaults.buttonColors(containerColor=p.panel,contentColor=readableOn(p.panel)),contentPadding=PaddingValues(0.dp),modifier=Modifier.size(if(large)56.dp else 44.dp).border(2.dp,p.outline,RoundedCornerShape(8.dp))){Text(text,fontSize=if(large)31.sp else 22.sp,fontWeight=FontWeight.Black)}}
@Composable private fun EditDialog(item:ShoppingItem,p:Palette,onDismiss:()->Unit,onSave:(String,String)->Unit){var n by remember{mutableStateOf(item.name)};var q by remember{mutableStateOf(item.quantity)};AlertDialog(onDismissRequest=onDismiss,containerColor=popupColor(p.paper),title={Text(tr("REDIGERA VARA","EDIT ITEM"),fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,color=p.text)},text={Column{RetroField(n,{n=it},tr("Namn","Name"),Modifier.fillMaxWidth(),p,leading="product");Spacer(Modifier.height(9.dp));RetroField(q,{q=it},tr("Mängd (valfritt)","Quantity (optional)"),Modifier.fillMaxWidth(),p,leading="balance")}},confirmButton={RetroButton(tr("SPARA","SAVE"),{if(n.isNotBlank())onSave(n,q)},p)},dismissButton={RetroButton(tr("AVBRYT","CANCEL"),onDismiss,p,danger=true)})}
@Composable private fun ConfirmDialog(title:String,text:String,p:Palette,onDismiss:()->Unit,onConfirm:()->Unit,confirmLabel:String=tr("BEKRÄFTA","CONFIRM")){AlertDialog(onDismissRequest=onDismiss,containerColor=popupColor(p.paper),title={Text(title,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,color=p.text)},text={Text(text,color=p.text)},confirmButton={RetroButton(confirmLabel,onConfirm,p,danger=true)},dismissButton={RetroButton(tr("AVBRYT","CANCEL"),onDismiss,p)})}
@Composable private fun RetroField(value:String,onValueChange:(String)->Unit,placeholder:String,modifier:Modifier,p:Palette,onDone:()->Unit={},placeholderSize:androidx.compose.ui.unit.TextUnit=16.sp,leading:String?=null){OutlinedTextField(value,onValueChange,modifier=modifier,singleLine=true,leadingIcon=leading?.let{{if(it=="balance")BalanceScaleIcon(p.muted,Modifier.size(18.dp))else ProductBoxIcon(p.muted,Modifier.size(18.dp))}},placeholder={Text(placeholder,color=p.muted,fontSize=placeholderSize,maxLines=1)},keyboardOptions=KeyboardOptions(capitalization=KeyboardCapitalization.Sentences,imeAction=ImeAction.Done),keyboardActions=KeyboardActions(onDone={onDone()}),shape=RoundedCornerShape(8.dp),colors=OutlinedTextFieldDefaults.colors(focusedTextColor=p.text,unfocusedTextColor=p.text,focusedBorderColor=p.gold,unfocusedBorderColor=p.outline,cursorColor=p.gold,focusedContainerColor=p.paper,unfocusedContainerColor=p.paper))}
@Composable private fun RetroButton(text:String,onClick:()->Unit,p:Palette,modifier:Modifier=Modifier,compact:Boolean=false,danger:Boolean=false){Button(onClick,modifier=modifier,shape=RoundedCornerShape(8.dp),colors=ButtonDefaults.buttonColors(containerColor=if(danger)p.red else p.green,contentColor=Color(0xFFF4E4BA)),contentPadding=PaddingValues(horizontal=if(compact)10.dp else 14.dp,vertical=if(compact)9.dp else 13.dp)){Text(text,fontFamily=FontFamily.Serif,fontWeight=FontWeight.Black,fontSize=if(compact)13.sp else 17.sp)}}
private fun capitalized(s:String)=s.trim().replaceFirstChar{if(it.isLowerCase())it.titlecase()else it.toString()}
