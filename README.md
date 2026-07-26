# Bubbsun

Bubbsun är en Android-app för delade inköpslistor med retrodesign och ett valbart Cosmic Supporter-utseende.

## Aktuell version

**v0.601 • Family Expansion**

## Funktioner

- Skapa, redigera, sortera och ta bort inköpslistor.
- Lägg till, redigera, sortera och bocka av varor.
- Flera användarprofiler med egna färger.
- Statistik över aktivitet och inköp.
- Svenska och engelska med direkt språkbyte.
- Flera teman, inklusive ett förhandsvisat Cosmic Supporter-tema.
- Sex sparade supporter-dekorationer samt alternativet Ingen.
- Kompakt Bubbsun-bildlogga med valbar supporter-glow.
- Tolv fria och fyra låsbara supporterikoner för listor.
- Fyra exklusiva supporterfärger för användare.
- Hjärtlig supporter-tema med mjuk rosa, kräm och salviagrön palett.
- Enhetliga illustrerade ikoner för teman, statistik och Om-sidan.
- Italienska samt supporterexklusiv Klingon.
- Kompakt supporterpanel och en headeransluten Mina listor-flik.
- Inbyggd supporter- och köpförhandsvisning utan riktig betalning.
- Versionshistorik och patch notes direkt i appen.
- Valfri automatisk kontroll av nya GitHub-releaser med direkt APK-länk.
- Sökning och flexibel sortering i varje lista utan att förlora manuell ordning.
- NYTT-markeringar per användare som grund för framtida synk.
- Sökbara offlineguider samt privata problem- och förslagsformulär.
- Google-inloggning och familjegrupper med realtidssynk och offline-stöd.
- Familjekoder, medlemsansökningar och roller för storboss, boss och medlem.

## Bygga projektet

Projektet kräver Java 17 och Android SDK 35.

```text
gradlew.bat :app:assembleDebug
gradlew.bat :app:assembleRelease
```

Byggda APK-filer hamnar under `app/build/outputs/apk/`.

GitHub Actions-konfigurationen i `.github/workflows/build-apk.yml` bygger en signerad release-APK.

## Projektregler

- Bevara befintlig design och funktionalitet.
- Gör små, avgränsade ändringar.
- Ändra endast sådant som uttryckligen har godkänts.
- Editionsnamnet är fast text och översätts inte.
- En ny uppladdad projektversion är alltid aktuell utgångspunkt.
