# Appunti per il report finale — Fotovoltaico, edificio F UNISA

Esperimento didattico sul modello semplificato dell'edificio F, campus di Fisciano. Sagoma da OpenStreetMap; tetto piano a quota relativa 17,5 m, altezza ipotetica. DTM regionale 5 m per il contesto. GeoLibre mostra i GLB derivati dal modello IFC; i calcoli sono esterni. Punto di ancoraggio: latitudine 40.77453369, longitudine 14.78894112.

## 1. Dove collocare i pannelli: ombre locali

- Due volumi tecnici ipotetici: 13 × 8 × 4,5 m e 10 × 6 × 3 m. Griglia di 1.448 celle intere da 2 × 2 m, con margini dimostrativi di 1,5 m dal bordo e 1 m dagli ostacoli.
- 20 marzo, 21 giugno, 23 settembre e 21 dicembre 2026; passi di 10 min; 288 campioni complessivi con Sole sopra l'orizzonte. Direzione solare calcolata con pvlib. Raggio dal centro di ogni cella al Sole: ombra se intercetta uno dei due volumi. Percentuale = campioni diurni non bloccati / campioni diurni totali × 100.
- Verde ≥97%: 1.245 celle. Ocra ≥85% e <97%: 167 celle. Bordeaux <85%: 36 celle. Grigio: non classificato. Soglie scelte per la mappa, non standard.
- A e B: stessi 12 moduli orientati a sud, inclinazione 15°, cambia solo la posizione. A, lontana dagli ostacoli: 100% di campioni diurni al sole e 9,00 h medie per modulo il 21 dicembre. B, vicina all'ostacolo: 75,2% e 2,78 h. Differenza invernale 6,22 h. Indicatori geometrici riferiti alle giornate simulate; non sono perdite di produzione o previsioni annuali.
- GeoJSON: sole_pct per il riepilogo, ore_06_21 e ore_12_21 per estate e inverno. Per isolare l'effetto dell'ombra, confrontare celle vicine all'ostacolo e celle libere nella stessa data, perché la durata del giorno varia.
- Figure: mappa complessiva, A in verde lontano dai blocchi, B in ocra/bordeaux vicino al blocco; confrontare viste con la stessa inquadratura.

## 2. Come orientare i pannelli nella zona A

- Due nuovi modelli GLB: 12 moduli a sud oppure 6 a est e 6 a ovest. Inclinazione 15° per tutti; 450 Wp ipotetici per modulo, 5,4 kWp totali in ciascuna disposizione.
- PVGIS 5.3: impianto connesso alla rete, SARAH3, silicio cristallino (original), free-standing, perdite impostate al 14%, orizzonte calcolato, ottimizzazione disattivata. Nessun GLB importato in PVGIS.
- Sud: azimut 0°, 5,4 kWp → 7.245,66 kWh/anno. Est: −90°, 2,7 kWp → 3.254,20 kWh/anno. Ovest: +90°, 2,7 kWp → 3.201,90 kWh/anno.
- Est + Ovest = 6.456,10 kWh/anno a 5,4 kWp. Vantaggio Sud: 789,56 kWh/anno, ossia 12,23% rispetto a Est + Ovest. Sud è la scelta migliore tra le due per massimizzare l'energia annua stimata con queste ipotesi. I kWp sono potenza nominale; i kWh/anno sono energia elettrica annua media stimata dell'intero impianto, non autoconsumo né irradiazione in kWh/m². Le perdite PVGIS sono già considerate.
- Grafici PVGIS: le barre sono la produzione elettrica mensile; il diagramma circolare mostra il profilo del terreno e il percorso solare indicativo di giugno e dicembre dal punto selezionato. L'orizzonte è uguale nei tre test perché le coordinate non cambiano. PVGIS non riproduce le ombre dei volumi sul tetto o tra i pannelli.
- Simulazione separata a cielo sereno: circa 12.085 kWh DC ideali a sud e 10.407 kWh a est–ovest (+16,1% a sud); ombre dirette reciproche inferiori allo 0,1% nel modello e con la spaziatura scelta. Non confrontare questi valori assoluti come se fossero stime PVGIS: la simulazione ideale non usa meteo reale né perdite di temperatura e inverter. Profilo del 21 dicembre nel pacchetto dei due orientamenti.

## Materiali da riprendere

- Fotovoltaico_Edificio_F_GeoLibre.zip: mappa e modelli ombre/A/B.
- Edificio_F_Confronto_Sud_Est_Ovest.zip: due GLB, risultati e profilo invernale.
- Schermate GeoLibre: image(20261107-095336).png, image(20261107-095253).png, image(20261107-095321).png.
- Schermate PVGIS: image(20261107-104314).png (Sud), image(20261107-104731).png (Est), image(20261107-104708).png (Ovest).

## 3. Verifica annuale delle posizioni A e B

### PVGIS: un modulo rappresentativo per zona

- PVGIS 5.3, stesse coordinate (40,775° N, 14,789° E), SARAH3, silicio cristallino (original), 14% di perdite, 0,45 kWp, sud (0°), inclinazione 15°. In entrambe le prove, "Horizon: User defined"; cambia solo il profilo di orizzonte.
- Il profilo personalizzato combina l'orizzonte del terreno e l'ostruzione dei due volumi tecnici, vista dal centro di un modulo rappresentativo per zona. A: gli ostacoli non emergono sopra l'orizzonte del terreno nel profilo campionato. B: l'ostruzione sul lato sud riduce soprattutto la produzione nei mesi invernali.
- A: 603,78 kWh/anno di produzione e 1.724,95 kWh/m²/anno di irradiazione sul piano del modulo. B: 535,98 kWh/anno e 1.551,54 kWh/m²/anno. B produce 67,80 kWh/anno in meno, pari a circa l'11,2% rispetto ad A.
- Risultato relativo ai due punti rappresentativi del modello ipotetico; non moltiplicarlo per 12. Il profilo non rappresenta l'ombreggiamento parziale del modulo né le ombre reciproche tra moduli.
- Materiale: Orizzonti_PVGIS_Edificio_F_AB.zip, con Orizzonte_A.txt, Orizzonte_B.txt e metodo; le due schermate si riconoscono dai valori 603,78 (A) e 535,98 (B).

### Simulazione separata: tutti i 12 moduli per zona

- Modello Python con dati meteorologici orari dell'anno tipico PVGIS (TMY, 8.760 ore). In ciascuna configurazione, 12 moduli identici da 450 Wp a sud, inclinati di 15°. Le ombre dirette sono stimate su 81 punti per modulo, includendo volumi tecnici e ombre reciproche; componente diffusa e riflessa lasciate invariate.
- A: 7.699,11 kWh/anno. B: 6.467,81 kWh/anno. Divario: 1.231,30 kWh/anno, circa il 16,0% in meno in B rispetto ad A. Esempio: dicembre 419,58 kWh in A e 190,84 kWh in B.
- Questa stima didattica usa i dati meteo PVGIS, ma il calcolo elettrico è del modello Python. Il 16,0% è riferito a tutti i moduli e non è direttamente confrontabile con l'11,2% del singolo modulo in PVGIS.
- Materiale: Edificio_F_Confronto_Ombre_AB_Annuale.zip, con script, dati, risultati e grafico mensile.
