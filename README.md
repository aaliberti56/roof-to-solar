# Roof to Solar

**Dove conviene installare i pannelli fotovoltaici, quanti ne entrano sul tetto e quanta energia potrebbero produrre?**

Roof to Solar nasce da uno [studio in GeoLibre sull’Edificio F](geolibre/) del campus di Fisciano dell’Università degli Studi di Salerno. Partendo da un modello IFC semplificato, abbiamo confrontato due zone dello stesso tetto per capire quanto la posizione dei pannelli e le ombre degli ostacoli incidano sull’esposizione solare. Abbiamo poi usato PVGIS per confrontare la produzione attesa di diverse configurazioni.

Da questo studio è nata una [web app](sito/) che permette anche a chi non usa software GIS di esplorare il proprio tetto, visualizzare una disposizione dei pannelli e confrontare più soluzioni.

[Il caso studio](#il-caso-studio-edificio-f) · [I risultati](#risultati) · [La web app](#progetta-sul-tuo-tetto) · [Come avviare il progetto](#avvio) · [I materiali](#contenuto-della-repository)

![Mappa dell’esposizione solare sul tetto dell’Edificio F](geolibre/Fotovoltaico_Edificio_F_GeoLibre/04_Mappa_esposizione.png)

## Il caso studio: Edificio F

L’obiettivo era rispondere a due domande distinte: **su quale zona del tetto conviene installare i pannelli? Una volta scelta la zona, come conviene orientarli?** Per distinguere l’effetto della posizione da quello dell’orientamento, abbiamo modificato una sola condizione alla volta.

1. **Ricostruzione del tetto.** Il modello IFC dimostrativo, il modello digitale della superficie (DSM) e la sagoma della copertura descrivono l’edificio. Sul tetto sono stati rappresentati due volumi tecnici ipotetici per studiare l’effetto delle loro ombre.
2. **Confronto tra le zone A e B.** Abbiamo collocato in ciascuna zona 12 moduli identici da 450 Wp, orientati a sud e inclinati di 15°. Cambiava soltanto la posizione: la zona A era più lontana dagli ostacoli, la zona B più vicina.
3. **Analisi dell’esposizione.** Le mappe delle ombre, i risultati di *Time in Daylight* e le statistiche zonali di GeoLibre hanno permesso di leggere le differenze sul tetto. Una prima simulazione ha campionato quattro giornate dell’anno a intervalli di dieci minuti; un’analisi separata ha confrontato le due posizioni su un anno meteorologico tipico.
4. **Confronto tra orientamenti.** Scelta la zona A, abbiamo mantenuto la stessa potenza installata e confrontato in PVGIS due configurazioni: 12 moduli rivolti a sud oppure 6 a est e 6 a ovest.

## Risultati

| Domanda | Confronto | Risultato |
|---|---|---|
| Quanto conta la posizione in inverno? | Ore medie di sole diretto per modulo il 21 dicembre | **9,00 ore in A** e **2,78 ore in B**. A parità di pannelli e orientamento, la differenza è di oltre 6 ore. |
| Quanto cambia la produzione di un singolo modulo? | Stima PVGIS per un modulo rappresentativo da 450 Wp in ciascuna zona, con il relativo profilo di orizzonte | **603,78 kWh/anno in A** e **535,98 in B**. La stima per B è inferiore dell’**11,2% rispetto ad A**. |
| Il vantaggio si mantiene considerando tutti i pannelli? | Simulazione separata dei 12 moduli, con dati meteo orari PVGIS e ombre modellate | **7.699,11 kWh/anno in A** e **6.467,81 in B**. Nelle condizioni simulate, B produce circa il **16% in meno rispetto ad A**. |
| Nella zona A conviene orientare i pannelli a sud o a est–ovest? | Due impianti da 5,4 kWp, entrambi inclinati di 15° | **7.245,66 kWh/anno a sud** e **6.456,10 a est–ovest**. Il sud offre circa **790 kWh/anno in più**, pari al **12,2% rispetto a est–ovest**. |

**Per l’Edificio F, la zona A è risultata preferibile alla B. Tra i due orientamenti provati in A, il sud ha fornito la maggiore produzione annua stimata.** I valori del singolo modulo e dell’intero impianto derivano da metodi diversi: il risultato dei 12 moduli non è stato ottenuto moltiplicando per 12 la stima del modulo rappresentativo.

[Consulta i metodi e le ipotesi](documentazione/Appunti_report_fotovoltaico_Edificio_F.md) · [Visualizza il confronto mensile A/B](geolibre/Edificio_F_Confronto_Ombre_AB_Annuale/Confronto_mensile_AB.png)

## Progetta sul tuo tetto

La prima sezione dell’applicazione permette di esplorare lo studio sull’Edificio F. La seconda, **«Progetta sul tuo tetto»**, permette di scegliere un altro edificio. Per iniziare non serve un file IFC: si può selezionare una sagoma disponibile sulla mappa, tracciare il perimetro del tetto oppure importare un poligono GeoJSON.

| Funzione | Cosa permette di fare |
|---|---|
| **Disegna zona** | Usare l’intera copertura oppure delimitare soltanto la parte del tetto che si vuole destinare ai pannelli. |
| **Esposizione** | Indicare gli ostacoli conosciuti, come un camino, e osservare quali parti del tetto ricevono più sole nel periodo analizzato. |
| **Consigliami un impianto** | Lasciare che l’app confronti 16 disposizioni e proponga i moduli che raggiungono almeno il **95% di tempo medio al sole**. In alternativa, scegliere il numero desiderato e vedere dove collocarlo. |
| **Previsione** | Consultare il numero di pannelli, la potenza installata in **kWp** e, quando sono disponibili i dati PVGIS, la produzione elettrica annua stimata in **kWh**. |
| **Confronto A/B** | Confrontare due soluzioni, osservare l’andamento mensile quando disponibile e stampare il riepilogo o salvarlo in PDF. |

**Un esempio pratico:** l’utente vuole installare **7 pannelli** e sa che sul tetto c’è un camino. Conferma la copertura, posiziona l’ostacolo e calcola l’esposizione. Selezionando **«Scelgo io il numero»**, può vedere sulla planimetria dove l’app collocherebbe i sette moduli. Se nelle disposizioni provate ne entrano soltanto cinque, il sito mostra i cinque posti trovati.

### Vantaggi per l’utente finale

- **Capire una proposta guardando il tetto.** La mappa mostra la posizione dei singoli moduli: diventa più facile capire perché due zone con la stessa superficie possano offrire risultati diversi.
- **Confrontare alternative prima di scegliere.** L’utente può provare un numero diverso di pannelli, restringere la zona di posa o confrontare due orientamenti sullo stesso edificio.
- **Partire dalle informazioni già disponibili.** Per una prima esplorazione bastano il perimetro del tetto e gli ostacoli conosciuti. Il riepilogo aiuta poi a discutere con un tecnico ipotesi concrete, come la posizione di un camino o lo spazio effettivamente utilizzabile.

> **Come leggere il 95%:** indica la quota di tempo diurno in cui la superficie del modulo riceve sole diretto nel periodo rappresentato dalla mappa. Non equivale al 95% di rendimento del pannello. Per un nuovo tetto, la stima annua di riferimento di PVGIS non corregge automaticamente la produzione per le ombre locali disegnate nell’app. I risultati servono a confrontare scenari preliminari; non sono misure di un impianto in esercizio né un progetto esecutivo.

## Avvio

Per utilizzare tutte le funzioni è necessario **Python 3**. Scaricare o clonare la repository, quindi avviare l’applicazione in uno dei seguenti modi:

- **Windows:** aprire [`sito/Avvia_Laboratorio.cmd`](sito/Avvia_Laboratorio.cmd) e lasciare aperta la finestra del prompt durante l’utilizzo.
- **Da terminale:** dalla cartella principale della repository, eseguire `python3 sito/server_atlante.py`.

Il server apre l’app nel browser e mostra l’indirizzo locale. Le mappe online e le richieste a PVGIS richiedono una connessione Internet. GitHub Pages può ospitare le pagine statiche; per usare il laboratorio completo deve essere in esecuzione anche il server Python.

**Prima prova consigliata:** aprire **Progetta sul tuo tetto → Prova un esempio offline → Conferma questa copertura**. Dal menu scegliere **Esposizione → Calcola esposizione**, quindi **Consigliami un impianto → Mostra proposta**.

## Contenuto della repository

| Percorso | Contenuto |
|---|---|
| [`sito/`](sito/) | Codice della web app, interfaccia cartografica, dati del caso studio, logica di disposizione dei pannelli e server locale. |
| [`geolibre/`](geolibre/) | Modello IFC dimostrativo, modello 3D dell’edificio, dati del terreno, raster di esposizione di dicembre e poligoni delle zone A e B. |
| [Kit del potenziale solare](geolibre/Edificio_F_Kit_Potenziale_Solare/) | DSM con risoluzione di 1 m, maschera della copertura e aree candidate alla posa. |
| [Esposizione e disposizione dei pannelli](geolibre/Fotovoltaico_Edificio_F_GeoLibre/) | Ostacoli, griglia di esposizione, mappa del tetto e modelli 3D delle due configurazioni. |
| [Confronto annuale delle ombre](geolibre/Edificio_F_Confronto_Ombre_AB_Annuale/) | Dati meteorologici orari, script di calcolo, risultati numerici e grafico mensile delle zone A e B. |
| [Confronto Sud / Est–Ovest](geolibre/Edificio_F_Confronto_Sud_Est_Ovest/) e [orizzonti PVGIS](geolibre/Orizzonti_PVGIS_Edificio_F_AB/) | Configurazioni dei pannelli, profilo invernale e orizzonti personalizzati usati per confrontare i moduli rappresentativi. |
| [Campus UNISA in 3D](geolibre/Campus_UNISA_3D_kit/) | Terreno, modelli dei singoli piani e vista esplosa dell’Edificio F. |
| [Drenaggio](geolibre/Edificio_F_Analisi_Drenaggio_GeoLibre/), [effetto barriera dell’edificio](geolibre/Edificio_F_Drenaggio_Confronto_Barriera_IFC/) e [tetto verde](geolibre/Edificio_F_Tetto_Verde_GeoLibre/) | Studi complementari sui percorsi di deflusso, sull’effetto della sagoma dell’edificio e sulla ritenzione delle precipitazioni. |
| [`documentazione/`](documentazione/) | Presentazione, relazioni e appunti che descrivono procedimento, ipotesi e risultati. |
