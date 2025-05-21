#https://gcf5ia.lupopasinigames.com/


# Il Ciarnuro: Galactic stock market simulator

## Accesso al programma

Per eseguire correttamente il sito noi abbiamo utilizzato **XAMPP versione 3.3.0**, che è il software scelto per gestire il server locale. Il progetto deve essere posizionato all'interno della directory `htdocs` di XAMPP. Successivamente, è fondamentale avviare i servizi **Apache** e **MySQL** dal pannello di controllo di XAMPP per garantire il corretto funzionamento dell'applicazione e del database (`GSMSdb.sql`).

Una volta avviati i servizi, è possibile aprire il progetto in **localhost**, accedendo alla directory `Il-Ciarnuro-Galactic-stock-market-simulator` tramite il browser.

> **Disclaimer**: Il sito ci impiega un po' di tempo per avviarsi.

---

## Navigazione all’interno del sito

### landingPage
Premendo la parte centrale della pagina si viene reindirizzati alla pagina `login_register`.

### login_register
In questa pagina è possibile accedere al sito:
- Inserendo lo **username** e la **password** negli appositi campi di input.
- Premendo il pulsante **Accedi**, che permette di visualizzare la pagina `saves`.
- Premendo il pulsante **Registrati**, che reindirizza alla pagina `registerPage` per effettuare la registrazione.

### registerPage
Qui è possibile registrarsi:
- Inserendo le informazioni richieste nei campi di input.
- Premendo il pulsante **Crea account**, che permette di visualizzare la pagina `saves`.
- Tornando alla schermata di login premendo il pulsante **Indietro**.

### saves
In questa schermata:
- Selezionando un salvataggio e dopo un breve caricamento, si viene reindirizzati alla pagina `marketHomePage`, la home del sito.

### marketHomePage
È il corpo principale del sito:
- Premendo su un titolo si accede alla pagina `stockPage`.
- Premendo il pulsante **my_stocks**, contenuto all’interno della sezione **accessibility**, si arriva alla pagina `profilePage`.

### stockPage
Accedendo a questa pagina:
- Premendo il pulsante **backHome** si torna alla `marketHomePage`.
- Premendo il pulsante **my_stocks** si accede alla pagina `profilePage`.

### profilePage
Da questa pagina:
- È possibile tornare alla `marketHomePage` utilizzando il pulsante **backHome**.
- Selezionando un titolo azionario, si accede alla `stockPage`.
