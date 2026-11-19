# Atlante Solare · GeoLibre
Studio del potenziale fotovoltaico del tetto dell’Edificio F del campus UNISA di Fisciano e applicazione per esplorare altri tetti.

| Cartella | Contenuto |
|---|---|
| sito | Applicazione, dati del caso studio e server locale |
| geolibre | Modello IFC dimostrativo, modelli 3D, terreno, raster e strati vettoriali; analisi solari e approfondimenti sul drenaggio e sul tetto verde |
| documentazione | Presentazione, relazioni e appunti disponibili |

## Avvia il sito
Con Python 3 installato, su Windows apri sito/Avvia_Laboratorio.cmd. In alternativa esegui `python sito/server_atlante.py`: il server apre la pagina iniziale nel browser. Lo studio dell’Edificio F è il punto di partenza; «Progetta sul tuo tetto» apre il laboratorio. Mappe online e PVGIS richiedono Internet. Il laboratorio completo usa il backend locale: GitHub Pages da solo non lo esegue.

## Esplora lo studio in GeoLibre
Parti da geolibre/Edificio_F_Kit_Potenziale_Solare per DSM, copertura e superfici candidate. In Fotovoltaico_Edificio_F_GeoLibre trovi esposizione e ostacoli. I confronti A/B, gli orizzonti PVGIS e il confronto Sud/Est–Ovest sono in cartelle separate con i rispettivi materiali. I file sono dati di un caso studio didattico: il tempo al sole, l’irradiazione e la produzione elettrica sono grandezze distinte.
