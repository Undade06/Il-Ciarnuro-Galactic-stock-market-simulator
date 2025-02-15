Program Access
To correctly run the website, we used XAMPP version 3.3.0, the software we chose to manage the local server. The project must be placed inside the "htdocs" directory of XAMPP. Then, it is essential to start the Apache and MySQL services from the XAMPP control panel to ensure the proper functioning of both the application and the database ("GSMSdb.sql").

Once the services are running, the project can be opened in localhost by accessing the "Il-Ciarnuro-Galactic-stock-market-simulator" directory through a web browser.

Disclaimer: The website may take some time to start.

Website Navigation
landingPage: Clicking the central part of the page redirects the user to the "login_register" page.

login_register: On this page, users can log in by entering their username and password in the input fields and then clicking the "Accedi" button to access the "saves" page. Alternatively, they can click the "Registrati" button, which redirects them to the "registerPage" where they can create a new account.

registerPage: Here, users can register by entering their information in the dedicated input fields and then clicking the "Crea account" button, which redirects them to the "saves" page. They can also return to the login screen by pressing the "indietro" button.

saves: In this screen, selecting a save file triggers a loading process, after which the user is redirected to the "marketHomePage", the main hub of the website.

marketHomePage: This is the core of the website. By clicking on a stock, users are directed to the "stockPage". Alternatively, pressing the "my_stocks" button within the "accessibility" section leads to the "profilePage".

stockPage: On this page, users can press the "backHome" button to return to the "marketHomePage". Alternatively, pressing the "my_stocks" button will navigate them to the "profilePage".

profilePage: From this page, users can return to "marketHomePage" using the "backHome" button. Additionally, by clicking on a stock title, they can access the "stockPage".